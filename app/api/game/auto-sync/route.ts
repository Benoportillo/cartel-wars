
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

        // Use Universal Economy Logic to calculate farming
        const { Economy } = await import('@/lib/economy');

        // SELF-HEALING: Ensure user has at least the starter weapon (Navaja)
        // This solves the issue where users existed but had 0 production because they lacked the item in DB.
        if (!user.ownedWeapons || user.ownedWeapons.length === 0) {
            console.log(`🚑 Self-Healing: User ${user.telegramId} has no weapons. Granting Navaja.`);
            user.ownedWeapons = [{
                weaponId: 'starter',
                caliberLevel: 1,
                magazineLevel: 1,
                accessoryLevel: 1,
                skin: '#333333'
            }];
            // We save immediately so the Economy calc below picks it up (via the user object)
            // Note: Economy.crystallizeEarnings uses the passed user object, so it will see the new weapon.
        }

        const oldBalance = user.cwarsBalance;
        Economy.crystallizeEarnings(user, new Date());

        await user.save();
        console.log(`[Auto-Sync] Saved ${user.telegramId}: ${oldBalance} -> ${user.cwarsBalance}`);

        return NextResponse.json({
            success: true,
            newBalance: user.cwarsBalance,
            totalFarmed: user.totalFarmed,
            lastClaimDate: user.lastClaimDate
        });



    } catch (error) {
        console.error('Auto-Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
