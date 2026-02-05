import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { MISSIONS_POOL, EMPIRE_CONSTANTS } from '@/constants';

export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, missionId } = await req.json();

    const user = await User.findOne({ telegramId: userId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 1. Validation: Shock
    const now = new Date();
    if (user.shockUntil && new Date(user.shockUntil) > now) {
        return NextResponse.json({ error: 'SHOCK_STATE', message: 'You are in shock. Cannot operate.' }, { status: 403 });
    }

    // 2. Validation: Mission Stats
    const mission = MISSIONS_POOL.find((m: any) => m.id === missionId);
    if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

    if (user.energy < mission.costEnergy) {
        return NextResponse.json({ error: 'NO_ENERGY', message: 'Not enough energy.' }, { status: 400 });
    }

    if (user.cwarsBalance < mission.costCwars) {
        return NextResponse.json({ error: 'NO_FUNDS', message: 'Not enough CWARS for prep.' }, { status: 400 });
    }

    // 3. Execution
    // Deduct fixed costs first
    user.energy -= mission.costEnergy;
    // Note: Prep cost is usually lost on fail? Or Pay-to-Play?
    // Design Doc says: "Fail: Pierdes Prep". So we deduct it upfront.
    user.cwarsBalance -= mission.costCwars;

    // RNG
    const roll = Math.random(); // 0.0 to 1.0
    const success = roll <= mission.successRate;

    let resultData = {};

    if (success) {
        // WIN
        user.cwarsBalance += mission.rewards.cwars;
        user.reputation = (user.reputation || 0) + mission.rewards.reputation;

        resultData = {
            outcome: 'WIN',
            reward: mission.rewards,
            message: 'Mission Accomplished!'
        };
    } else {
        // FAIL
        // Apply penalties
        let penaltyMsg = mission.penalty.text;

        // Extra Energy Penalty
        if (mission.penalty.energy !== 0) {
            user.energy = Math.max(0, user.energy + mission.penalty.energy); // penalty is negative
        }

        // CWARS Penalty (Beyond Prep cost)
        // Design Doc says: "Pierdes Prep + X". 
        // If penalty.cwars matches costCwars, we just don't refund.
        // If penalty.cwars > costCwars, we deduct extra.
        // Logic: We already deducted costCwars. If there's EXTRA penalty:
        const extraPenalty = Math.max(0, mission.penalty.cwars - mission.costCwars);
        if (extraPenalty > 0) {
            user.cwarsBalance = Math.max(0, user.cwarsBalance - extraPenalty);
        }

        // SHOCK
        if (mission.penalty.shock) {
            const shockEnd = new Date(now.getTime() + EMPIRE_CONSTANTS.SHOCK_DURATION_MS);
            user.shockUntil = shockEnd;
            penaltyMsg += " YOU ARE IN SHOCK!";
        }

        resultData = {
            outcome: 'FAIL',
            penalty: mission.penalty,
            message: penaltyMsg
        };
    }

    await user.save();

    return NextResponse.json({
        ...resultData,
        userState: {
            energy: user.energy,
            cwars: user.cwarsBalance,
            reputation: user.reputation,
            shockUntil: user.shockUntil
        }
    });
}
