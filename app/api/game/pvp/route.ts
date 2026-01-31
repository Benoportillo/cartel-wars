import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { TERRAINS, WEAPONS } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { userId, rivalId, usedBuffs } = await req.json();

        if (!userId || !rivalId) {
            return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId: userId });
        const rival = await User.findOne({ _id: rivalId }); // Rival ID is usually MongoID

        if (!user || !rival) {
            return NextResponse.json({ error: 'User or Rival not found' }, { status: 404 });
        }

        // --- CRITICAL: UPDATE ECONOMY BEFORE BATTLE ---
        // Ensure both Attacker (User) and Defender (Rival) have up-to-date balances
        // based on their time passed, even if offline.
        const { updatePendingResources } = await import('@/lib/gameLogic');
        updatePendingResources(user);
        updatePendingResources(rival);
        // ----------------------------------------------

        // 1. Ammo Check
        if ((user.ammo || 0) < 1) {
            return NextResponse.json({ error: 'No ammo' }, { status: 400 });
        }
        user.ammo = (user.ammo || 0) - 1;

        // 2. Battle Logic
        // Calculate Total Power (Base + Weapons)
        // 2. Battle Logic
        // Calculate Battle Power Dynamically (Firepower * 100)
        // Decoupled from Economy Power (Mining Rates)
        const calculateBattlePower = (u: any) => {
            const weaponPower = u.ownedWeapons.reduce((sum: number, w: any) => {
                const def = WEAPONS.find(d => d.id === w.weaponId);
                return sum + (def ? def.firepower : 0);
            }, 0);
            return (weaponPower * 100) + (u.baseStatus || 0);
        };

        const userTotalPower = calculateBattlePower(user);
        const rivalTotalPower = calculateBattlePower(rival);

        // Terrain Bonus
        const terrain = TERRAINS[Math.floor(Math.random() * TERRAINS.length)];
        let userTerrainBonus = 0;

        // Check if user has favored weapon
        const hasFavored = user.ownedWeapons.some((w: any) => {
            const weaponId = w.weaponId;
            if (Array.isArray(terrain.favoredWeapon)) {
                return terrain.favoredWeapon.includes(weaponId);
            }
            return terrain.favoredWeapon === weaponId;
        });

        if (hasFavored) {
            userTerrainBonus = userTotalPower * 0.10; // +10%
        }

        const finalUserPower = userTotalPower + userTerrainBonus;

        // Random Variance (+/- 10%)
        const userRoll = finalUserPower * (0.9 + Math.random() * 0.2);
        const rivalRoll = rivalTotalPower * (0.9 + Math.random() * 0.2);

        const won = userRoll > rivalRoll;
        const eventLog: string[] = [];

        eventLog.push(`📍 Campo de Batalla: ${terrain.name}`);
        if (hasFavored) eventLog.push(`🔥 ¡Ventaja Táctica! Tu arma es perfecta aquí (+10% Daño).`);

        // 3. XP & Leveling
        const xpGain = won ? 50 : 10;
        user.xp = (user.xp || 0) + xpGain;
        const xpThreshold = (user.level || 1) * 500;
        let leveledUp = false;

        if (user.xp >= xpThreshold) {
            if ((user.level || 1) < 50) {
                user.level = (user.level || 1) + 1;
                user.baseStatus = (user.baseStatus || 0) + 2;
                leveledUp = true;
                eventLog.push(`🆙 ¡SUBISTE DE NIVEL! Ahora eres Nivel ${user.level}.`);
            }
        }

        // 4. Economy (80/10/10 Split - CWARS ONLY)
        let rewardAmount = 0;
        let powerReward = 0;
        let respectReward = 0;

        // Kevlar Mitigation
        let lootPercentage = 0.10; // 10% Base Loot
        if (!won && usedBuffs?.includes('kevlar')) {
            // Check if user has kevlar in inventory and consume it? 
            // Or is it a passive "equipped"? 
            // Let's assume it's a consumable used for this battle.
            // But usually buffs are pre-selected.
            // If rival has kevlar? We don't know rival's buffs easily.
            // Let's assume for now we are looting the RIVAL.
            // Does the RIVAL have kevlar? 
            // Complexity: Rival is passive. 
            // Let's assume Rival has no active buffs unless we store "defense setup".
            // For now, standard loot.
        }

        // If USER loses, does he lose CWARS? 
        // "Robo Híbrido... se roba... del perdedor".
        // If User Loses -> Rival robs User.
        // If User Wins -> User robs Rival.

        if (won) {
            // User Wins, Robs Rival
            // Rival's Kevlar check? (Future feature)

            const baseLoot = Math.floor((rival.cwarsBalance || 0) * lootPercentage);

            // 80/10/10 Split
            const winnerShare = Math.floor(baseLoot * 0.80);
            const burnShare = Math.floor(baseLoot * 0.10);
            const feeShare = Math.floor(baseLoot * 0.10); // Also burned effectively from player perspective

            // Apply
            rival.cwarsBalance = Math.max(0, (rival.cwarsBalance || 0) - baseLoot);
            user.cwarsBalance = (user.cwarsBalance || 0) + winnerShare;

            rewardAmount = winnerShare;
            eventLog.push(`🏆 ¡VICTORIA! Robaste ${winnerShare} CWARS.`);
            eventLog.push(`🔥 ${burnShare + feeShare} CWARS fueron quemados en el ataque.`);

        } else {
            // User Loses, Rival Robs User
            // Check User's Kevlar
            if (user.inventory?.kevlar > 0) {
                lootPercentage = 0.01; // Reduced to 1%
                user.inventory.kevlar -= 1; // Consume Kevlar
                user.markModified('inventory');
                eventLog.push("🛡️ ¡Tu Chaleco Kevlar te salvó! Daño económico reducido.");
            }

            const baseLoot = Math.floor((user.cwarsBalance || 0) * lootPercentage);

            // Rival gets 80% (Passive income for rival)
            const rivalShare = Math.floor(baseLoot * 0.80);

            user.cwarsBalance = Math.max(0, (user.cwarsBalance || 0) - baseLoot);
            rival.cwarsBalance = (rival.cwarsBalance || 0) + rivalShare;

            eventLog.push(`☠️ DERROTA. Te robaron ${baseLoot} CWARS.`);
        }

        // Save History
        const battleRecord = {
            won,
            rival: rival.name,
            rivalId: rival._id.toString(), // Save Rival ID for Revenge
            powerDiff: finalUserPower - (rival.power || 100),
            timestamp: Date.now()
        };

        user.pvpHistory = [battleRecord, ...(user.pvpHistory || [])].slice(0, 20);

        // Rival history (passive defense log)
        const rivalRecord = {
            won: !won,
            rival: user.name,
            rivalId: user._id.toString(), // Save Attacker ID for Revenge
            powerDiff: (rival.power || 100) - finalUserPower,
            timestamp: Date.now()
        };
        rival.pvpHistory = [rivalRecord, ...(rival.pvpHistory || [])].slice(0, 20);

        // Save
        await user.save();
        await rival.save();

        return NextResponse.json({
            success: true,
            won,
            eventLog,
            reward: rewardAmount, // CWARS
            xpGain,
            leveledUp,
            newLevel: user.level,
            newBalance: user.balance, // TON (Unchanged)
            newCwars: user.cwarsBalance, // CWARS (Updated)
            newAmmo: user.ammo,
            rivalName: rival.name,
            rivalLevel: rival.level || 1,
            terrainId: terrain.id
        });

    } catch (error) {
        console.error('PvP Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
