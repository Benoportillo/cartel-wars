import { IUser } from "@/models/User";
import { WEAPONS } from "@/constants";

export const Economy = {
    /**
     * Calculates pending earnings based on time elapsed since last update.
     * Updates user balance and timestamp in memory (does not save).
     */
    crystallizeEarnings: (user: IUser, now: Date = new Date()) => {
        if (!user.lastEarningsUpdate) {
            user.lastEarningsUpdate = now;
            return;
        }

        const lastUpdate = new Date(user.lastEarningsUpdate).getTime();
        const currentTime = now.getTime();
        const diffSeconds = (currentTime - lastUpdate) / 1000;

        if (diffSeconds <= 0) return;

        // Calculate Total Mining Power (CWARS/Hour)
        const totalMiningPower = user.ownedWeapons.reduce((total, instance) => {
            // Priority: Snapshot > Constant > 0
            let power = 0;

            if (instance.miningPower !== undefined) {
                power = instance.miningPower;
            } else {
                // Fallback for old data using Constants
                const def = WEAPONS.find(w => w.id === instance.weaponId);
                // Map the requested table manually if constant doesn't have it explicitly yet, 
                // or assume constant has it (we updated seed but maybe not constants.ts file itself).
                // For safety, let's map the IDs to the user's requested table here if missing.
                if (def) {
                    // Check if we put miningPower in CONSTANTS? We didn't edit constants.ts to add miningPower valus.
                    // So we must fallback to a lookup table here to be safe.
                    power = getBaseMiningPower(instance.weaponId);
                }
            }
            return total + power;
        }, 0);

        if (totalMiningPower > 0) {
            // Rate per second = Power / 3600
            const earned = (totalMiningPower / 3600) * diffSeconds;
            user.cwarsBalance = (user.cwarsBalance || 0) + earned;
        }

        user.lastEarningsUpdate = now;
    }
};

// Fallback table matches user's request
function getBaseMiningPower(weaponId: string): number {
    switch (weaponId) {
        case 'starter': return 1.0;     // Navaja (Updated req: 1 cwar/h)
        case 'glock': return 2.5;
        case 'revolver': return 3.33;
        case 'mp5': return 10.83;
        case 'ak47': return 25.0;
        case 'barrett': return 58.33;
        case 'm249': return 83.33;
        case 'bazooka': return 133.33;
        default: return 0;
    }
}
