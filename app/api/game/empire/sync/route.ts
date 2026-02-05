import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { EMPIRE_CONSTANTS, STAFF_CATALOG } from '@/constants';

export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await User.findOne({ telegramId: userId });
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    let isDirty = false;

    // 1. CHECK SHOCK STATUS
    let inShock = false;
    if (user.shockUntil && new Date(user.shockUntil) > now) {
        inShock = true;
    } else if (user.shockUntil && new Date(user.shockUntil) <= now) {
        user.shockUntil = undefined; // Shock expired
        isDirty = true;
    }

    // 2. ENERGY REGENERATION
    if (!inShock) { // Energy doesn't refill in shock? Design decision. Let's say it does but you can't use it.
        const lastUpdate = new Date(user.lastEnergyUpdate || now);
        const msPassed = now.getTime() - lastUpdate.getTime();
        const energyToadd = Math.floor(msPassed / EMPIRE_CONSTANTS.ENERGY_REFILL_MS);

        if (energyToadd > 0 && user.energy < EMPIRE_CONSTANTS.MAX_ENERGY) {
            user.energy = Math.min(EMPIRE_CONSTANTS.MAX_ENERGY, user.energy + energyToadd);
            user.lastEnergyUpdate = now; // Reset timer to now (simple bucket algo)
            isDirty = true;
        }
    }

    // 3. PASSIVE INCOME CALCULATION (If NOT in Shock)
    let addedCwars = 0;
    let addedPolvo = 0;

    if (!inShock && user.staff && user.staff.length > 0) {
        const newStaffArray = [];

        for (const contract of user.staff) {
            // Check expiry
            if (new Date(contract.expiresAt) <= now) {
                // Contract expired - Remove from active array
                // Optionally: Notify user? For now just silent removal.
                isDirty = true;
                continue;
            }

            // Calculate production since last collection/login
            // For simplicity, we calculate strictly based on time passed since last `lastEarningsUpdate`
            // But here we need a specific 'lastEmpireSync' or use `lastEarningsUpdate`

            // NOTE: We'll calculate production on the fly in the Frontend/Dashboard?
            // BETTER: Calculate chunk here and add to balance.

            // ... Limiting scope: Real-time passive income usually needs a 'claim' mechanics or 'login' sync.
            // Let's assume this sync api is called on Dashboard load.

            const staffTemplate = STAFF_CATALOG.find(s => s.id === contract.staffId);
            if (staffTemplate) {
                const lastSync = new Date(user.lastEarningsUpdate || now); // Re-using this field for general sync
                const hoursPassed = (now.getTime() - lastSync.getTime()) / 3600000;

                if (hoursPassed > 0.1) { // Min 6 mins to claim
                    const produced = Math.floor(staffTemplate.productionRate * hoursPassed);
                    if (produced > 0) {
                        if (staffTemplate.productionType === 'CWARS') {
                            addedCwars += produced;
                        } else if (staffTemplate.productionType === 'POLVO') {
                            addedPolvo += produced;
                        }
                    }
                }
            }
            newStaffArray.push(contract);
        }

        if (addedCwars > 0 || addedPolvo > 0) {
            user.cwarsBalance = (user.cwarsBalance || 0) + addedCwars;

            // Handle Inventory Map for Polvo
            const currentPolvo = user.inventory.get('polvo') || 0;
            user.inventory.set('polvo', currentPolvo + addedPolvo);

            user.lastEarningsUpdate = now; // Sync time updated
            isDirty = true;
        }

        user.staff = newStaffArray; // Update list (removed expired)
    }

    if (isDirty) {
        await user.save();
    }

    // Calulate Market Price (Duplicate logic from Sell route for display)
    const hour = new Date().getHours();
    const seed = (hour * 37) % 100;
    const marketPrice = 8 + Math.floor((seed / 100) * 8);

    return NextResponse.json({
        energy: user.energy,
        reputation: user.reputation,
        shockUntil: user.shockUntil,
        buildings: user.buildings,
        staff: user.staff,
        inventory: user.inventory,
        cwars: user.cwarsBalance,
        collected: { cwars: addedCwars, polvo: addedPolvo },
        marketPrice: marketPrice
    });
}
