import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId } = await req.json();

        if (!telegramId) {
            return NextResponse.json({ error: 'Missing telegramId' }, { status: 400 });
        }

        const referrals = await User.find({ referredBy: telegramId }).select('name rank telegramId pvpBattlesPlayed referrerBonusPaid');

        return NextResponse.json({
            success: true,
            referrals
        });

    } catch (error) {
        console.error('Referral List Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
