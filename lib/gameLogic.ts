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

    return user;
};
