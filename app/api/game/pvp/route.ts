import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { TERRAINS, WEAPONS } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { userId, rivalId, usedBuffs, type } = await req.json();

        if (!userId || (!rivalId && type !== 'heist')) {
            return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
        }

        let user = await User.findOne({ telegramId: userId });

        if (!user) {
            // Fallback: Try finding by Object ID if the ID string looks like one
            if (userId.match(/^[0-9a-fA-F]{24}$/)) {
                user = await User.findOne({ _id: userId });
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // --- Daily Heist Reset ---
        const today = new Date().toDateString();
        const lastReset = user.lastHeistDate ? new Date(user.lastHeistDate).toDateString() : "";

        if (today !== lastReset) {
            user.dailyHeistsLeft = 5;
            user.lastHeistDate = new Date();
        }

        // --- HEIST LOGIC ---
        if (type === 'heist') {
            if (user.dailyHeistsLeft <= 0) {
                return NextResponse.json({ error: 'No heists left today' }, { status: 400 });
            }

            const heistDef = (await import('@/constants')).HEIST_MISSIONS.find(h => h.id === rivalId);
            if (!heistDef) return NextResponse.json({ error: 'Heist not found' }, { status: 404 });

            // Apply Buffs (Server-Side Validation)
            let successBonus = 0;
            let lootBonus = 0;
            const validBuffs = [];
            const inventory = user.inventory as any; // Cast to any to access Map methods if Schema defines it as Map

            if (usedBuffs && Array.isArray(usedBuffs)) {
                if (usedBuffs.includes('oil') && (inventory?.get ? inventory.get('oil') : inventory['oil']) > 0) {
                    successBonus += 0.15; // +15% Success Chance
                    if (inventory?.set) inventory.set('oil', inventory.get('oil') - 1);
                    else inventory['oil'] -= 1;

                    validBuffs.push('oil');
                }
                if (usedBuffs.includes('charm') && (inventory?.get ? inventory.get('charm') : inventory['charm']) > 0) {
                    lootBonus += 0.25; // +25% Loot Chance
                    if (inventory?.set) inventory.set('charm', inventory.get('charm') - 1);
                    else inventory['charm'] -= 1;

                    validBuffs.push('charm');
                }
                // Kevlar not used in Heists yet, but could protect against critical failure
            }

            user.dailyHeistsLeft -= 1;
            user.markModified('inventory');

            // Battle Logic (Simple power check with variance)
            const calculateBattlePower = (u: any) => {
                const weaponPower = (u.ownedWeapons || []).reduce((sum: number, w: any) => {
                    const def = WEAPONS.find(d => d.id === w.weaponId);
                    const power = w.firepower !== undefined ? w.firepower : (def ? def.firepower : 0);
                    return sum + power;
                }, 0);
                return (weaponPower * 100) + (u.baseStatus || 0);
            };

            const userTotalPower = calculateBattlePower(user);
            const userRoll = userTotalPower * (0.8 + Math.random() * 0.4); // 80% - 120% variance
            const heistRoll = heistDef.firepower * (0.9 + Math.random() * 0.2); // 90% - 110% variance

            // Apply specific Buff Effects
            const finalUserRoll = userRoll * (1.0 + successBonus);

            const won = finalUserRoll > heistRoll;
            const eventLog: string[] = [];

            if (validBuffs.includes('oil')) eventLog.push("🛢️ Aceite aplicado: Mecanismo suavizado (+15% Éxito).");
            if (validBuffs.includes('charm')) eventLog.push("💀 Amuleto activo: La suerte sonríe (+25% Loot).");

            // Luck element: even if won, there's a chance of no reward (bad luck/empty loot)
            // Base chance 60% + LootBonus
            const luckyOutcome = Math.random() < (0.6 + lootBonus);
            const actualReward = won && luckyOutcome ? heistDef.reward : 0;

            if (won) {
                if (luckyOutcome) {
                    user.cwarsBalance = (user.cwarsBalance || 0) + actualReward;
                    eventLog.push(`💰 ¡ÉXITO! El golpe fue perfecto. Ganaste ${actualReward} CWARS.`);
                } else {
                    eventLog.push(`🍀 ¡MALA SUERTE! Lograste entrar, pero la caja estaba vacía o el botín era inservible.`);
                }
                eventLog.push(heistDef.flavor);
            } else {
                eventLog.push(`🚑 ¡EMBOSCADA! La operación falló. Tuviste que huir con las manos vacías.`);
            }

            await user.save();
            return NextResponse.json({
                success: true,
                won,
                eventLog,
                reward: actualReward,
                newCwars: user.cwarsBalance,
                heistsLeft: user.dailyHeistsLeft,
                newInventory: user.inventory
            });
        }

        // --- PVP LOGIC (MODIFIED) ---
        let rival: any; // Allow any to handle both Document and Bot Object
        let isBot = false;

        // Check for Bot ID
        if (rivalId.startsWith('bot-')) {
            const { PVP_BOTS } = await import('@/constants');
            const botDef = PVP_BOTS.find(b => b.id === rivalId);
            if (botDef) {
                isBot = true;
                rival = {
                    _id: botDef.id,
                    name: `[BOT] ${botDef.name}`,
                    cwarsBalance: botDef.cwarsBalance,
                    ownedWeapons: [], // Bots rely on firepower stat directly
                    baseStatus: 0,
                    firepower: botDef.firepower, // Bots have direct firepower
                    pvpHistory: []
                };
            }
        }

        if (!rival) {
            rival = await User.findOne({ _id: rivalId });
        }

        if (!rival) return NextResponse.json({ error: 'Rival not found' }, { status: 404 });

        // --- ECONOMY SYNC ---
        const { Economy } = await import('@/lib/economy');
        Economy.crystallizeEarnings(user, new Date());
        // Only crystallize for real users
        if (!isBot && typeof rival.save === 'function') {
            Economy.crystallizeEarnings(rival, new Date());
        }

        if ((user.ammo || 0) < 1) {
            return NextResponse.json({ error: 'No ammo' }, { status: 400 });
        }
        user.ammo = (user.ammo || 0) - 1;

        const calculateBattlePower = (u: any) => {
            if (u.firepower) return u.firepower; // Direct override for Bots
            const weaponPower = (u.ownedWeapons || []).reduce((sum: number, w: any) => {
                const def = WEAPONS.find(d => d.id === w.weaponId);
                const power = w.firepower !== undefined ? w.firepower : (def ? def.firepower : 0);
                return sum + power;
            }, 0);
            return (weaponPower * 100) + (u.baseStatus || 0);
        };

        const userTotalPower = calculateBattlePower(user);
        const rivalTotalPower = calculateBattlePower(rival);

        const won = (userTotalPower * (0.9 + Math.random() * 0.2)) > (rivalTotalPower * (0.9 + Math.random() * 0.2));
        const eventLog: string[] = [];

        let rewardAmount = 0;

        if (won) {
            const lootPercentage = 0.10;
            const baseLoot = Math.floor((rival.cwarsBalance || 0) * lootPercentage);
            const winnerShare = Math.floor(baseLoot * 0.80);

            if (!isBot && typeof rival.save === 'function') {
                rival.cwarsBalance = Math.max(0, (rival.cwarsBalance || 0) - baseLoot);
            }

            user.cwarsBalance = (user.cwarsBalance || 0) + winnerShare;
            rewardAmount = winnerShare;
            eventLog.push(`🏆 ¡VICTORIA! Robaste ${winnerShare} CWARS.`);
        } else {
            let lootPercentage = 0.10;
            // Check for Kevlar in PvP
            const inventory = user.inventory as any;
            if (usedBuffs && usedBuffs.includes('kevlar') && (inventory?.get ? inventory.get('kevlar') : inventory['kevlar']) > 0) {
                lootPercentage = 0.01;
                if (inventory?.set) inventory.set('kevlar', inventory.get('kevlar') - 1);
                else inventory['kevlar'] -= 1;

                user.markModified('inventory');
                eventLog.push("🛡️ ¡Kevlar activado! Pérdidas reducidas a 1%.");
            }

            const baseLoot = Math.floor((user.cwarsBalance || 0) * lootPercentage);
            user.cwarsBalance = Math.max(0, (user.cwarsBalance || 0) - baseLoot);
            eventLog.push(`☠️ DERROTA. Perdiste ${baseLoot} CWARS.`);
        }

        // Save History
        user.pvpHistory = [{ won, rival: rival.name, rivalId: isBot ? rival._id : rival._id.toString(), timestamp: Date.now() }, ...(user.pvpHistory || [])].slice(0, 20);

        if (!isBot && typeof rival.save === 'function') {
            rival.pvpHistory = [{ won: !won, rival: user.name, rivalId: user._id.toString(), timestamp: Date.now() }, ...(rival.pvpHistory || [])].slice(0, 20);
            await rival.save();
        }

        await user.save();

        return NextResponse.json({
            success: true,
            won,
            eventLog,
            reward: rewardAmount,
            newCwars: user.cwarsBalance,
            newAmmo: user.ammo,
            newInventory: user.inventory
        });

    } catch (error) {
        console.error('PvP Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
