import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { Economy } from '@/lib/economy';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId } = await req.json();

        if (!telegramId) return NextResponse.json({ error: 'Missing ID' });

        const user = await User.findOne({ telegramId });
        if (!user) return NextResponse.json({ error: 'User not found' });

        const rate = Economy.calculateMiningRate(user);
        const projected = Economy.getProjectedBalance(user, new Date());

        return NextResponse.json({
            telegramId: user.telegramId,
            dbBalance: user.cwarsBalance,
            lastClaimDate: user.lastClaimDate,
            calculatedRateHr: rate,
            calculatedRateSec: rate / 3600,
            projectedBalance: projected,
            weaponsCount: user.ownedWeapons?.length || 0,
            serverTime: new Date()
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
