import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { WEAPONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        const users = await User.find({});
        let updatedCount = 0;
        let errors = 0;

        const updates = users.map(async (user) => {
            try {
                // Calculate Power (Economy)
                const weaponPower = user.ownedWeapons.reduce((sum: number, w: any) => {
                    const def = WEAPONS.find(def => def.id === w.weaponId);
                    return sum + (def?.miningPower || 0); // Use NEW miningPower
                }, 0);

                // Calculate Status
                const weaponStatus = user.ownedWeapons.reduce((sum: number, w: any) => {
                    const def = WEAPONS.find(def => def.id === w.weaponId);
                    // Base Status + Upgrades
                    const upgradeBonus = ((w.caliberLevel || 1) + (w.magazineLevel || 1) + (w.accessoryLevel || 1) - 3) * 5;
                    return sum + (def?.statusBonus || 0) + upgradeBonus;
                }, 0);

                const newPower = (user.basePower || 0) + weaponPower;
                const newStatus = (user.baseStatus || 0) + weaponStatus;

                // Only update if changed
                if (user.power !== newPower || user.status !== newStatus) {
                    user.power = newPower;
                    user.status = newStatus;

                    // Also fix negative balances if any (safeguard)
                    if (user.cwarsBalance < 0) user.cwarsBalance = 0;
                    if (user.balance < 0) user.balance = 0;

                    await user.save();
                    updatedCount++;
                }
            } catch (err) {
                console.error(`Error updating user ${user.id}:`, err);
                errors++;
            }
        });

        await Promise.all(updates);

        return NextResponse.json({
            success: true,
            totalUsers: users.length,
            updatedUsers: updatedCount,
            errors: errors,
            message: "Migration completed successfully. Refresh your game Dashboard."
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
