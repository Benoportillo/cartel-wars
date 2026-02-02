
import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { WEAPONS } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId } = await req.json();

        if (!telegramId) {
            return NextResponse.json({ error: 'Missing telegramId' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Use Universal Economy Logic to calculate farming
        const { Economy } = await import('@/lib/economy');
        Economy.crystallizeEarnings(user, new Date());

        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.cwarsBalance,
            farmedAmount: 0,
            lastClaimDate: user.lastClaimDate
        });



    } catch (error) {
        console.error('Auto-Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
