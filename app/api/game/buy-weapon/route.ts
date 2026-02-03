import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { WEAPONS } from '@/constants';
import { WeaponInstance } from '@/types';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId, weaponId } = await req.json();

        if (!telegramId || !weaponId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const weapon = WEAPONS.find(w => w.id === weaponId);
        if (!weapon) {
            return NextResponse.json({ error: 'Invalid weapon ID' }, { status: 400 });
        }

        // Check Balance
        if (user.balance < weapon.price) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
        }

        // Deduct Balance
        user.balance -= weapon.price;

        // Create Weapon Instance
        const newInstance: WeaponInstance = {
            weaponId: weapon.id,
            caliberLevel: 1,
            magazineLevel: 1,
            accessoryLevel: 1,
            skin: '#333333'
        };

        // Add to Inventory
        user.ownedWeapons.push(newInstance);

        // Save to DB
        await user.save();
        console.log(`✅ User ${telegramId} bought ${weapon.name} for ${weapon.price} TON`);

        return NextResponse.json({
            success: true,
            newBalance: user.balance,
            ownedWeapons: user.ownedWeapons, // Return updated inventory so client can sync
            message: `¡${weapon.name} adquirida!`
        });

    } catch (error) {
        console.error('Buy Weapon Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
