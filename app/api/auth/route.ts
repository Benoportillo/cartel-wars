import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { INITIAL_USER } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { email, password, telegramId, name, referredBy } = body;

        // 1. Check if user exists by Telegram ID or Email
        // If checkOnly is true, we only look up by telegramId to see if user exists for auto-login
        const query = body.checkOnly ? { telegramId } : { $or: [{ telegramId }, { email }] };
        let user = await User.findOne(query);

        if (user) {
            // Login logic
            // If checkOnly is true, we return the user immediately without password check (trusted Telegram context)
            if (!body.checkOnly && user.password !== password) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            // --- PASSIVE INCOME SYNC ---
            // Only sync if logging in successfully
            const { Economy } = await import('@/lib/economy');
            Economy.crystallizeEarnings(user, new Date());
            await user.save();
            // ---------------------------

            return NextResponse.json({ user });
        } else {
            if (body.checkOnly) {
                return NextResponse.json({ user: null });
            }

            // User not found and not checkOnly -> Login failed
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
    } catch (error: any) {
        console.error('Auth API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
