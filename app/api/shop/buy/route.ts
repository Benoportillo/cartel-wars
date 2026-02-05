import { NextResponse } from 'next/server';
import User from '@/models/User';
import Item from '@/models/Item'; // New DB Model
import dbConnect from '@/lib/dbConnect';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId, itemId } = await req.json();

        if (!telegramId || !itemId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // --- ECONOMY SYNC ---
        const { Economy } = await import('@/lib/economy');
        Economy.crystallizeEarnings(user, new Date());
        // --------------------

        // 1. Fetch Item from DB
        const item = await Item.findOne({ id: itemId });
        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const cost = item.price;
        const currency = item.currency || 'CWARS';

        // 2. Validate Balance & Deduct
        if (currency === 'CWARS') {
            if ((user.cwarsBalance || 0) < cost) {
                return NextResponse.json({ error: 'Insufficient CWARS balance' }, { status: 402 });
            }
            user.cwarsBalance -= cost;
        } else {
            // TON
            if (user.balance < cost) {
                return NextResponse.json({ error: 'Insufficient TON balance' }, { status: 402 });
            }
            user.balance -= cost;
        }

        // 3. Deliver Item based on Type
        if (item.type === 'WEAPON') {
            // Check if already owned
            const alreadyOwned = user.ownedWeapons.some((w: any) => w.weaponId === itemId);
            if (alreadyOwned) {
                return NextResponse.json({ error: 'Weapon already owned' }, { status: 400 });
            }

            user.ownedWeapons.push({
                weaponId: itemId,
                name: item.name, // Snapshot
                caliberLevel: 1,
                magazineLevel: 1,
                accessoryLevel: 1,
                skin: 'default',
                firepower: item.firepower || 0,
                miningPower: item.miningPower || 0,
                statusBonus: item.statusBonus || 0,
                image: item.image
            });

            // Production Power / user.power updates REMOVED

        } else if (item.type === 'BUFF' || item.type === 'ITEM') {
            if (!user.inventory) user.inventory = {};
            user.inventory[itemId] = (user.inventory[itemId] || 0) + 1;
            user.markModified('inventory');
        }

        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.balance,
            newCwars: user.cwarsBalance,
            newWeapons: user.ownedWeapons,
            newInventory: user.inventory,

            message: `¡Compraste ${item.name}!`
        });

    } catch (error) {
        console.error('Shop Buy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
