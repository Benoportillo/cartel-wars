import { WEAPONS } from '@/constants';

export const updatePendingResources = (user: any) => {
    // Basic validation
    if (!user) return user;

    const now = new Date();

    // --- DAILY AMMO REFILL LOGIC (GMT 0) ---
    const lastAmmoReset = new Date(user.lastDailyAmmo || 0);

    // Check using UTC (GMT 0) components to ensure global sync
    const isNewDay = now.getUTCDate() !== lastAmmoReset.getUTCDate() ||
        now.getUTCMonth() !== lastAmmoReset.getUTCMonth() ||
        now.getUTCFullYear() !== lastAmmoReset.getUTCFullYear();

    if (isNewDay) {
        // Calculate Max Ammo dynamically
        // Base: 5
        // +1 per Magazine Level (where Lvl 1 is base, so each level counts as 1 if we treat Lvl 1 as +1 capacity?
        // Proposal says: "Base 5. Por Nivel: +1". 
        // Lvl 1 Glock = 5 + 1 = 6? Or 5 + (1-1)?
        // User confirmed: "Lvl 1 to 10 goes from 5 to 14".
        // This implies Base (5) + (Level - 1).
        // Wait, 5 + (10 - 1) = 14. Correct.

        let maxAmmo = 5;
        if (user.ownedWeapons && user.ownedWeapons.length > 0) {
            maxAmmo += user.ownedWeapons.reduce((acc: number, w: any) => {
                // Each weapon contributes (Level - 1) extra slots
                return acc + (w.magazineLevel - 1);
            }, 0);
        }

        user.ammo = maxAmmo;
        user.lastDailyAmmo = now;
        // console.log(`[Ammo] Reset daily ammo for ${user.name} to ${maxAmmo}`);
    }

    return user;
};
