import { WEAPONS } from '@/constants';
import { UserProfile } from '@/types';

export class Economy {
    /**
     * Calculates the mining rate (CWARS per hour) for a given user profile.
     * Formula: BaseWeaponMining + (CaliberLevel - 1) * (10% of BaseWeaponMining)
     */
    static calculateMiningRate(user: Partial<UserProfile>): number {
        if (!user.ownedWeapons || user.ownedWeapons.length === 0) return 0;

        return user.ownedWeapons.reduce((total, instance) => {
            const baseWeapon = WEAPONS.find(w => w.id === instance.weaponId);
            if (!baseWeapon) return total;

            const caliberBonus = (instance.caliberLevel - 1) * (baseWeapon.miningPower * 0.10);
            return total + baseWeapon.miningPower + caliberBonus;
        }, 0);
    }

    /**
     * Calculates the total balance at a specific point in time.
     * Formula: StoredBalance + (TargetTime - LastClaimTime) * RatePerSecond
     */
    static getProjectedBalance(user: Partial<UserProfile>, targetDate: Date = new Date()): number {
        if (!user.lastClaimDate) return user.cwarsBalance || 0;

        const ratePerHour = this.calculateMiningRate(user);
        const ratePerSecond = ratePerHour / 3600;

        const lastClaim = new Date(user.lastClaimDate).getTime();
        const target = targetDate.getTime();

        const deltaSeconds = (target - lastClaim) / 1000;

        if (deltaSeconds <= 0) return user.cwarsBalance || 0;

        const generated = deltaSeconds * ratePerSecond;
        // Debug Log (Remove in Prod if spammy)
        // console.log(`[Economy] Rate: ${ratePerHour}/hr, Delta: ${deltaSeconds.toFixed(1)}s, Gen: ${generated.toFixed(4)}`);

        return (user.cwarsBalance || 0) + generated;
    }

    /**
     * Updates the user's persisted balance to the current time.
     * Use this when saving to DB to "crystallize" the earnings.
     */
    static crystallizeEarnings(user: any, now: Date = new Date()): any {
        const oldBalance = user.cwarsBalance || 0;
        const currentBalance = this.getProjectedBalance(user, now);

        const earned = currentBalance - oldBalance;

        // Update user object
        user.cwarsBalance = currentBalance;
        user.lastClaimDate = now;
        user.totalFarmed = (user.totalFarmed || 0) + earned;

        return user;
    }
}
