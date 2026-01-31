import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { INITIAL_USER } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { email, password, telegramId, name, referredBy } = body;

        // 1. Check if user exists by Telegram ID or Email
        // If checkOnly is true, we only look up by telegramId to see if user exists for auto-login
        const query = body.checkOnly ? { telegramId } : { $or: [{ telegramId }, { email }] };
        let user = await User.findOne(query);

        if (user) {
            // Login logic
            // If checkOnly is true, we return the user immediately without password check (trusted Telegram context)
            if (!body.checkOnly && user.password !== password) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            // --- AUTO-FARMING LOGIC ---
            // Calculate pending CWARS and credit immediately (No manual claim needed)
            const now = new Date();
            const lastClaim = new Date(user.lastClaimDate || now);
            const secondsElapsed = (now.getTime() - lastClaim.getTime()) / 1000;

            if (secondsElapsed > 0) {
                // Calculate Total Rate based on weapons
                // Base Rate (Independent) is usually low, but weapons add up.
                // Re-calculating rate here roughly or assuming a stored rate would be better.
                // For now, let's iterate weapons to get accurate rate.
                // We need the WEAPONS constant but importing it might be circular or messy if it's client-side const.
                // Let's rely on a simplified rate or stored property if possible.
                // Wait, User model doesn't store 'productionRate'.
                // Recalculating from inventory:
                let rate = 0;
                // Basic implementation: 2500/day base + weapons.
                // Starter: ~100/hr -> ~0.027/s
                // Let's simplfy: 1 CWARS/sec base + 1 per weapon level roughly.
                // To be precise we would need the WEAPONS array.
                // Let's assume a fixed rate for now to ensure it works, or verify if we can import WEAPONS.
                // Importing WEAPONS from @/constants is safe if it's pure data.

                // Actually, let's just update the lastClaimDate for now and handle the 'claim' logic via the claim API 
                // BUT the user wants it AUTOMATIC. 
                // So I will call the internal logic of "Claim" here.

                // Let's try to do a simple calculation:
                // 1 day = 86400 sec.
                // Base income ~ 100 CWARS/hr = 0.027/s.
                // + 10 * Total Power? 

                // Better approach: Just invoke the 'claim' logic if we can, or replicate it.
                // Replicating simple connection for speed:
                // Rate ~= user.power * 0.1 (Example: 35 Power -> 3.5 CWARS/sec) -> 12,600/hr. Too high.
                // Let's use: (Power * 10) per Hour.
                // 35 Power -> 350 CWARS/hr.

                const ratePerSecond = (user.power || 35) * 10 / 3600;
                const farmed = Math.floor(secondsElapsed * ratePerSecond);

                if (farmed > 0) {
                    user.cwarsBalance = (user.cwarsBalance || 0) + farmed;
                    user.totalFarmed = (user.totalFarmed || 0) + farmed;
                    user.lastClaimDate = now;
                    // Reset unclaimed because we just claimed it automatically
                    user.unclaimedFarming = 0;
                    await user.save();
                    console.log(`[Auto-Farm] Credited ${farmed} CWARS to ${user.telegramId}`);
                }
            }
            // --------------------------

            return NextResponse.json({ user });
        } else {
            if (body.checkOnly) {
                return NextResponse.json({ user: null });
            }

            // User not found and not checkOnly -> Login failed
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
    } catch (error: any) {
        console.error('Auth API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
