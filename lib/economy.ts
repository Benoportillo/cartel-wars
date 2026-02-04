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
            // ALWAYS use the Definition from constants to ensure live balancing updates apply to everyone immediately.
            // We ignore the snapshot 'miningPower' on the instance unless the weapon ID is custom/unknown.

            // Try to find definition in current constants
            const def = WEAPONS.find(w => w.id === instance.weaponId);
            let power = 0;

            if (def && def.miningPower !== undefined) {
                power = def.miningPower;
            } else {
                // Fallback for custom items or if not in constants (legacy behavior)
                power = instance.miningPower || getBaseMiningPower(instance.weaponId);
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
        case 'starter': return 1.0;
        case 'glock': return 4.0;
        case 'revolver': return 6.0;
        case 'mp5': return 20.0;
        case 'ak47': return 60.0;
        case 'barrett': return 160.0;
        case 'm249': return 250.0;
        case 'bazooka': return 500.0;
        default: return 0;
    }
}
