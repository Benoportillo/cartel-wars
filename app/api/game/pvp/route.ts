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

            user.dailyHeistsLeft -= 1;

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

            const won = userRoll > heistRoll;
            const eventLog: string[] = [];

            // Luck element: even if won, there's a chance of no reward (bad luck/empty loot)
            const luckyOutcome = Math.random() > 0.4; // 60% chance of getting a reward
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
                heistsLeft: user.dailyHeistsLeft
            });
        }

        // --- PVP LOGIC (MODIFIED) ---
        const rival = await User.findOne({ _id: rivalId });
        if (!rival) return NextResponse.json({ error: 'Rival not found' }, { status: 404 });

        // --- ECONOMY SYNC ---
        const { Economy } = await import('@/lib/economy');
        Economy.crystallizeEarnings(user, new Date());
        Economy.crystallizeEarnings(rival, new Date());

        if ((user.ammo || 0) < 1) {
            return NextResponse.json({ error: 'No ammo' }, { status: 400 });
        }
        user.ammo = (user.ammo || 0) - 1;

        const calculateBattlePower = (u: any) => {
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

            rival.cwarsBalance = Math.max(0, (rival.cwarsBalance || 0) - baseLoot);
            user.cwarsBalance = (user.cwarsBalance || 0) + winnerShare;
            rewardAmount = winnerShare;
            eventLog.push(`🏆 ¡VICTORIA! Robaste ${winnerShare} CWARS.`);
        } else {
            let lootPercentage = 0.10;
            if (user.inventory?.kevlar > 0) {
                lootPercentage = 0.01;
                user.inventory.kevlar -= 1;
                user.markModified('inventory');
                eventLog.push("🛡️ ¡Kevlar activado! Pérdidas reducidas a 1%.");
            }
            const baseLoot = Math.floor((user.cwarsBalance || 0) * lootPercentage);
            user.cwarsBalance = Math.max(0, (user.cwarsBalance || 0) - baseLoot);
            eventLog.push(`☠️ DERROTA. Perdiste ${baseLoot} CWARS.`);
        }

        // Save History
        user.pvpHistory = [{ won, rival: rival.name, rivalId: rival._id.toString(), timestamp: Date.now() }, ...(user.pvpHistory || [])].slice(0, 20);
        rival.pvpHistory = [{ won: !won, rival: user.name, rivalId: user._id.toString(), timestamp: Date.now() }, ...(rival.pvpHistory || [])].slice(0, 20);

        await user.save();
        await rival.save();

        return NextResponse.json({
            success: true,
            won,
            eventLog,
            reward: rewardAmount,
            newCwars: user.cwarsBalance,
            newAmmo: user.ammo
        });

    } catch (error) {
        console.error('PvP Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
