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



        // Calculate Bonus Tier
        // Count how many referrals have already been paid for this user
        const paidReferralsCount = await User.countDocuments({
            referredBy: telegramId,
            referrerBonusPaid: true
        });

        const currentReferralIndex = paidReferralsCount + 1;
        let bonusAmount = 0;

        if (currentReferralIndex <= 3) {
            bonusAmount = 50;
        } else if (currentReferralIndex <= 10) {
            bonusAmount = 80;
        } else if (currentReferralIndex <= 15) {
            bonusAmount = 150;
        } else {
            return NextResponse.json({ error: 'Maximum referral limit reached (15)' }, { status: 400 });
        }

        // Process Claim
        user.cwarsBalance = (user.cwarsBalance || 0) + bonusAmount;
        user.totalReferralBonus = (user.totalReferralBonus || 0) + bonusAmount;



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
