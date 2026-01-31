import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { WEAPONS } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId } = await req.json();

        if (!telegramId) {
            return NextResponse.json({ error: 'Missing telegramId' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate Farming
        const now = new Date();
        const lastClaim = new Date(user.lastClaimDate || now);
        const diffMs = now.getTime() - lastClaim.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const effectiveHours = Math.min(diffHours, 24); // Cap at 24h

        // Calculate Rate
        let totalRate = 0;
        user.ownedWeapons.forEach((w: any) => {
            const weaponDef = WEAPONS.find(def => def.id === w.weaponId);
            if (weaponDef) {
                totalRate += weaponDef.miningPower;
            }
        });

        // ENDGAME MULTIPLIER: +2% per Level, Max x2 at Level 50
        const userLevel = user.level || 1;
        const levelMultiplier = Math.min(2, 1 + (userLevel * 0.02));

        // Base Farmed Amount
        let farmedAmount = Math.floor(totalRate * effectiveHours);

        // Apply Multiplier
        farmedAmount = Math.floor(farmedAmount * levelMultiplier);

        if (farmedAmount <= 0) {
            return NextResponse.json({ error: 'Nothing to claim' }, { status: 400 });
        }

        // Update User Balance & Stats
        user.cwarsBalance = (user.cwarsBalance || 0) + farmedAmount;
        user.totalFarmed = (user.totalFarmed || 0) + farmedAmount;
        user.lastClaimDate = now;
        user.unclaimedFarming = 0;

        // ANTI-FRAUD CHECK: Unlock Pending Bonus
        user.claimsCount = (user.claimsCount || 0) + 1;

        // Unlock Referrer's Bonus if Referee (current user) is active (3 claims)
        if (user.claimsCount === 3 && user.referredBy) {
            const referrer = await User.findOne({ telegramId: user.referredBy });
            if (referrer && (referrer.pendingReferralBonus || 0) >= 5000) {
                // Unlock 5000 CWARS for the referrer
                referrer.pendingReferralBonus -= 5000;
                referrer.cwarsBalance = (referrer.cwarsBalance || 0) + 5000;
                await referrer.save();
                console.log(`🔓 Bonus Unlocked for ${referrer.name} thanks to ${user.name}`);
            }
        }

        // REFERRAL COMMISSION (7% / 2% / 1%)
        const commissionRates = [0.07, 0.02, 0.01];
        let currentReferrerId = user.referredBy;

        for (let i = 0; i < 3; i++) {
            if (!currentReferrerId) break;

            const referrer = await User.findOne({ telegramId: currentReferrerId });
            if (!referrer) break;

            const commission = Math.floor(farmedAmount * commissionRates[i]);
            if (commission > 0) {
                referrer.cwarsBalance = (referrer.cwarsBalance || 0) + commission;

                // Update Stats
                if (!referrer.referralStats) referrer.referralStats = { level1Count: 0, level2Count: 0, level3Count: 0, level1Earnings: 0, level2Earnings: 0, level3Earnings: 0 };

                if (i === 0) referrer.referralStats.level1Earnings += commission;
                if (i === 1) referrer.referralStats.level2Earnings += commission;
                if (i === 2) referrer.referralStats.level3Earnings += commission;

                await referrer.save();
            }

            currentReferrerId = referrer.referredBy; // Move up the chain
        }

        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.cwarsBalance,
            farmedAmount,
            lastClaimDate: user.lastClaimDate
        });

    } catch (error) {
        console.error('Claim Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
