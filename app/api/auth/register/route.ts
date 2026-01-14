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

        if (referredBy) {
            console.log(`🔍 Processing referral: New User ${telegramId} referred by ${referredBy}`);
        }

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

        // Handle Multi-Level Referral System
        if (referredBy) {
            // Level 1: Direct Recruiter
            const recruiterL1 = await User.findOne({ telegramId: referredBy });
            if (recruiterL1) {
                recruiterL1.referrals += 1;
                if (!recruiterL1.referralStats) recruiterL1.referralStats = { level1Count: 0, level2Count: 0, level3Count: 0, level1Earnings: 0, level2Earnings: 0, level3Earnings: 0 };
                recruiterL1.referralStats.level1Count += 1;
                await recruiterL1.save();

                // Level 2: Recruiter of Recruiter
                if (recruiterL1.referredBy) {
                    const recruiterL2 = await User.findOne({ telegramId: recruiterL1.referredBy });
                    if (recruiterL2) {
                        if (!recruiterL2.referralStats) recruiterL2.referralStats = { level1Count: 0, level2Count: 0, level3Count: 0, level1Earnings: 0, level2Earnings: 0, level3Earnings: 0 };
                        recruiterL2.referralStats.level2Count += 1;
                        await recruiterL2.save();

                        // Level 3: Recruiter of Recruiter of Recruiter
                        if (recruiterL2.referredBy) {
                            const recruiterL3 = await User.findOne({ telegramId: recruiterL2.referredBy });
                            if (recruiterL3) {
                                if (!recruiterL3.referralStats) recruiterL3.referralStats = { level1Count: 0, level2Count: 0, level3Count: 0, level1Earnings: 0, level2Earnings: 0, level3Earnings: 0 };
                                recruiterL3.referralStats.level3Count += 1;
                                await recruiterL3.save();
                            }
                        }
                    }
                }
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
