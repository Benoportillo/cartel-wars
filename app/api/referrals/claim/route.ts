import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { Transaction } from '@/types';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId, referralTelegramId } = await req.json();

        if (!telegramId || !referralTelegramId) {
            return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId });
        const referral = await User.findOne({ telegramId: referralTelegramId });

        if (!user || !referral) {
            return NextResponse.json({ error: 'Users not found' }, { status: 404 });
        }

        // Verify Eligibility
        if (referral.referredBy !== telegramId) {
            return NextResponse.json({ error: 'This user was not referred by you' }, { status: 403 });
        }

        if (referral.referrerBonusPaid) {
            return NextResponse.json({ error: 'Bonus already paid' }, { status: 400 });
        }

        if ((referral.pvpBattlesPlayed || 0) < 10) {
            return NextResponse.json({ error: 'Referral has not completed 10 PvP battles' }, { status: 400 });
        }

        // Process Claim
        user.cwarsBalance = (user.cwarsBalance || 0) + 5000;
        user.totalReferralBonus = (user.totalReferralBonus || 0) + 5000;

        // Add to Historical Total (Cwars Lavados)
        user.totalFarmed = (user.totalFarmed || 0) + 5000;

        referral.referrerBonusPaid = true;

        await user.save();
        await referral.save();

        return NextResponse.json({
            success: true,
            newCwars: user.cwarsBalance,
            message: 'Bonus Claimed Successfully'
        });

    } catch (error) {
        console.error('Referral Claim Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
