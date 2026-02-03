import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Item from '@/models/Item';
import { INITIAL_USER } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { email, password, telegramId, name, referredBy } = body;

        // Strict validation
        if (!email || email.trim() === '') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ telegramId }, { email }] });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Handle Referral System
        let validReferredBy = undefined;
        if (referredBy && referredBy !== 'undefined' && referredBy !== 'null') {
            const recruiterL1 = await User.findOne({ telegramId: referredBy });
            if (recruiterL1) {
                validReferredBy = referredBy;
                recruiterL1.referrals += 1;
                await recruiterL1.save();
            }
        }

        // Fetch Starter Weapon from DB
        const starterWeapon = await Item.findOne({ id: 'starter' });

        // Define starter weapons array with full stats from DB
        const initialWeapons = starterWeapon ? [{
            weaponId: starterWeapon.id,
            name: starterWeapon.name,
            caliberLevel: 1,
            magazineLevel: 1,
            accessoryLevel: 1,
            skin: 'default',
            firepower: starterWeapon.firepower || 0.35,
            miningPower: starterWeapon.miningPower || 1.0,
            statusBonus: starterWeapon.statusBonus || 5,
            image: starterWeapon.image
        }] : [{ weaponId: 'starter', caliberLevel: 1, magazineLevel: 1, accessoryLevel: 1, skin: 'default' }];

        const newUser = new User({
            ...INITIAL_USER,
            telegramId: telegramId || Math.floor(100000000 + Math.random() * 900000000).toString(),
            email: email.toLowerCase().trim(),
            password,
            name: name || `Sicario_${telegramId}`,
            referredBy: validReferredBy,
            ownedWeapons: initialWeapons
        });

        await newUser.save();
        return NextResponse.json({ user: newUser });

    } catch (error: any) {
        console.error('Register API Error:', error);
        return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
    }
}
