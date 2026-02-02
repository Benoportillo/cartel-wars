export const updatePendingResources = (user: any) => {
    // Basic validation
    if (!user) return user;

    // --- AUTO-FARMING LOGIC ---
    // Calculate pending CWARS and credit immediately
    // Rate: (Power * 10) CWARS per Hour.
    // Example: 35 Power -> 350 CWARS/hr = ~0.1 CWARS/sec
    const now = new Date();
    const lastClaim = new Date(user.lastClaimDate || now);
    const secondsElapsed = (now.getTime() - lastClaim.getTime()) / 1000;

    if (secondsElapsed > 0) {
        // Must belong to Gang/Cartel constraint? 
        // User said: "MUST BELONG TO A CARTEL TO COLLECT..." in UI previously.
        // But for "Automatic", maybe we relax this or enforce it here.
        // If we strictly enforce "Must belong", then "Lone Wolves" generate nothing?
        // User said: "connected or not... should continue summing".
        // Let's assume production happens ANYWAY, but maybe 'storage' is capped?
        // For now, let's keep it simple: Production is always active.

        const ratePerSecond = (user.power || 0) * 10 / 3600;
        const farmed = Math.floor(secondsElapsed * ratePerSecond);

        if (farmed > 0) {
            user.cwarsBalance = (user.cwarsBalance || 0) + farmed;
            user.totalFarmed = (user.totalFarmed || 0) + farmed;
            user.lastClaimDate = now;

            // Console log for debugging (optional, can be noisy)
            // console.log(`[Economy] User ${user.name} farmed ${farmed} CWARS over ${secondsElapsed.toFixed(0)}s`);
        } else {
            // Update timestamp anyway to prevent drift/redundant small checks
            // Actually, if we farm 0, we shouldn't reset time unless we want to lose 'fractional' progress.
            // Better to only update if farmed > 0 OR if significant time passed.
            // But strict 'now' update is safer to prevent exploits.
            if (secondsElapsed > 60) {
                user.lastClaimDate = now;
            }
        }
    }

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
