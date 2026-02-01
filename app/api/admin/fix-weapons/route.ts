
import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { WEAPONS } from '@/constants';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const users = await User.find({});
        let updatedCount = 0;

        for (const user of users) {
            let changed = false;
            const newWeapons = user.ownedWeapons.map((instance: any) => {
                const def = WEAPONS.find(w => w.id === instance.weaponId);
                if (def) {
                    // Check if stats are missing
                    if (instance.miningPower === undefined || instance.firepower === undefined) {
                        changed = true;
                        return {
                            ...instance,
                            miningPower: def.miningPower,
                            firepower: def.firepower,
                            statusBonus: def.statusBonus
                        };
                    }
                }
                return instance;
            });

            if (changed) {
                user.ownedWeapons = newWeapons;
                // Recalculate total Power (Economy)
                const weaponPower = newWeapons.reduce((sum: number, w: any) => sum + (w.miningPower || 0), 0);
                user.power = (user.basePower || 0) + weaponPower;

                // Recalculate Firepower (Base)
                const weaponFirepower = newWeapons.reduce((sum: number, w: any) => sum + (w.firepower || 0), 0);
                user.firepower = (user.basePower || 0) + weaponFirepower;

                user.markModified('ownedWeapons');
                await user.save();
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, updated: updatedCount, total: users.length });
    } catch (error) {
        console.error('Migration Error:', error);
        return NextResponse.json({ error: 'Migration Failed' }, { status: 500 });
    }
}
