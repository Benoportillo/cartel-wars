import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId } = await req.json();

        if (!telegramId) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // --- PASSIVE INCOME SYNC ---
        const { Economy } = await import('@/lib/economy');
        Economy.crystallizeEarnings(user, new Date());
        await user.save();
        // ---------------------------

        // Return only what's needed to update UI if necessary (lightweight)
        return NextResponse.json({
            success: true,
            cwarsBalance: user.cwarsBalance,
            lastEarningsUpdate: user.lastEarningsUpdate
        });

    } catch (error) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
