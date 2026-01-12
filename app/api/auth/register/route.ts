import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { INITIAL_USER } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        // Explicitly log the received body for debugging (server-side logs)
        console.log('Register API received:', body);

        const { email, password, telegramId, name, referredBy } = body;

        // Strict validation
        if (!email || email.trim() === '') {
            return NextResponse.json({ error: 'Email is required and cannot be empty' }, { status: 400 });
        }
        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ telegramId }, { email }] });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Handle referral
        if (referredBy) {
            const recruiter = await User.findOne({ telegramId: referredBy });
            if (recruiter) {
                recruiter.referrals += 1;
                await recruiter.save();
            }
        }

        const newUser = new User({
            ...INITIAL_USER,
            telegramId: telegramId || Math.floor(100000000 + Math.random() * 900000000).toString(),
            email: email.toLowerCase().trim(),
            password,
            name: name || `Sicario_${telegramId}`,
            referredBy,
            power: 35,
            ownedWeapons: INITIAL_USER.ownedWeapons
        });

        await newUser.save();
        return NextResponse.json({ user: newUser });

    } catch (error: any) {
        console.error('Register API Error:', error);
        // Return the specific mongoose validation error if possible
        return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
    }
}
