import { NextResponse } from 'next/server';
import User from '@/models/User';
import Settings from '@/models/Settings'; // Assuming this exists or I'll create it
import dbConnect from '@/lib/dbConnect';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { userId, amount, txHash } = await req.json();

        if (!userId || !amount || !txHash) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Gangster Hour Logic
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ swapEnabled: true, withdrawalEnabled: true, maintenanceMode: false, premiumMissions: [], referralCommissionPercent: 0.15 });
        }

        const now = new Date();
        const today = now.setHours(0, 0, 0, 0);

        // Randomize if new day
        if (!settings.lastGangsterUpdate || settings.lastGangsterUpdate < today) {
            const hours = [];
            // Pick 3 random start hours (e.g., 14, 18, 22)
            for (let i = 0; i < 3; i++) {
                const start = Math.floor(Math.random() * 24);
                // Bonus: 5% to 100% (Weighted towards lower)
                // 50% chance: 5-10%
                // 30% chance: 10-25%
                // 15% chance: 25-50%
                // 5% chance: 50-100%
                const roll = Math.random();
                let bonus = 0.05;
                if (roll > 0.95) bonus = 0.5 + Math.random() * 0.5; // 50-100%
                else if (roll > 0.80) bonus = 0.25 + Math.random() * 0.25; // 25-50%
                else if (roll > 0.50) bonus = 0.10 + Math.random() * 0.15; // 10-25%
                else bonus = 0.05 + Math.random() * 0.05; // 5-10%

                hours.push({ start, end: start + 1, bonus });
            }
            settings.gangsterHours = hours;
            settings.lastGangsterUpdate = Date.now();
            await settings.save();
        }

        // Check if active
        const currentHour = now.getHours();
        const activeHour = settings.gangsterHours?.find((h: any) => currentHour >= h.start && currentHour < h.end);

        let finalAmount = Number(amount);
        let bonusApplied = 0;

        if (activeHour) {
            bonusApplied = finalAmount * activeHour.bonus;
            finalAmount += bonusApplied;
        }

        // 2. Verify Transaction (Mock for now)
        // In production: await verifyTonTransaction(txHash, amount, MASTER_WALLET);
        // For now, assume valid if hash is provided.

        // Check for duplicate hash
        // const existingTx = await Transaction.findOne({ txid: txHash });
        // if (existingTx) return NextResponse.json({ error: 'Duplicate TX' }, { status: 400 });

        // 3. Credit User
        user.balance = (user.balance || 0) + finalAmount;
        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.balance,
            bonusApplied,
            gangsterHour: !!activeHour
        });

    } catch (error) {
        console.error('Deposit Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
