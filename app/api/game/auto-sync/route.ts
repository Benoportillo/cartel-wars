
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

        // Minimum threshold to prevent spamming DB with 0.0001
        if (diffHours < 0.00028) { // Approx 1 second
            // Silent return if too frequent
            return NextResponse.json({ success: true, newBalance: user.cwarsBalance || 0, farmedAmount: 0 });
        }

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
            return NextResponse.json({ success: true, newBalance: user.cwarsBalance || 0, farmedAmount: 0 });
        }

        // Update User Balance & Stats
        user.cwarsBalance = (user.cwarsBalance || 0) + farmedAmount;
        user.totalFarmed = (user.totalFarmed || 0) + farmedAmount;
        user.lastClaimDate = now;
        user.unclaimedFarming = 0;

        // SKIP HEAVY REFERRAL LOGIC FOR AUTO-SYNC to reduce load
        // Only update user's own balance for PVP readiness.
        // Referrals will get their share when the user does a MANUAL claim or maybe we can batch it?
        // User asked for: "que se guarde en la base de datos y ese es valor que se descuente de los ataques de pvp"
        // So prioritizing the User's balance is key.
        // We will skip referral updates here for performance on tight loops, OR allow it if server can handle.
        // Given MongoDB Atlas free tier, let's keep it simple. Update ONLY user.

        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.cwarsBalance,
            farmedAmount,
            lastClaimDate: user.lastClaimDate
        });

    } catch (error) {
        console.error('Auto-Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
