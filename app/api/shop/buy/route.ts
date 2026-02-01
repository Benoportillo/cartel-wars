import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { WEAPONS } from '@/constants';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { telegramId, itemId, cost, type, currency, amount } = await req.json();

        if (!telegramId || !itemId || cost === undefined || !type) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Validate Balance & Deduct
        if (currency === 'CWARS') {
            if ((user.cwarsBalance || 0) < cost) {
                return NextResponse.json({ error: 'Insufficient CWARS balance' }, { status: 402 });
            }
            user.cwarsBalance -= cost;
            // CWARS spent here are effectively BURNED (removed from circulation)
        } else {
            // TON
            if (user.balance < cost) {
                return NextResponse.json({ error: 'Insufficient TON balance' }, { status: 402 });
            }
            user.balance -= cost;
        }

        // 2. Deliver Item
        if (type === 'WEAPON') {
            // Check if already owned
            const alreadyOwned = user.ownedWeapons.some((w: any) => w.weaponId === itemId);
            if (alreadyOwned) {
                return NextResponse.json({ error: 'Weapon already owned' }, { status: 400 });
            }

            // Find weapon details to get default stats
            const weaponDef = WEAPONS.find(w => w.id === itemId);
            if (!weaponDef) {
                return NextResponse.json({ error: 'Invalid weapon ID' }, { status: 400 });
            }

            user.ownedWeapons.push({
                weaponId: itemId,
                caliberLevel: 1,
                magazineLevel: 1,
                accessoryLevel: 1,
                skin: 'default',
                miningPower: weaponDef.miningPower,
                firepower: weaponDef.firepower,
                statusBonus: weaponDef.statusBonus
            });

            // Recalculate Power (Mining Rate) is now redundant for persistence but good for User model 'power' field
            // But we should rely on gameContext/logic to sum these. 
            // Updating user.power (Economy) just in case
            const weaponPower = user.ownedWeapons.reduce((sum: number, w: any) => sum + (w.miningPower || 0), 0);
            user.power = (user.basePower || 0) + weaponPower;

        } else if (type === 'AMMO') {
            const ammoAmount = amount || 5; // Default to 5 if not specified
            user.ammo = (user.ammo || 0) + ammoAmount;

        } else if (type === 'ITEM' || type === 'BUFF') {
            if (!user.inventory) user.inventory = {};
            user.inventory[itemId] = (user.inventory[itemId] || 0) + 1;
            user.markModified('inventory');

        } else if (type === 'TICKET') {
            const ticketAmount = itemId === 'ticket_1' ? 1 : itemId === 'ticket_5' ? 5 : 10;
            user.tickets += ticketAmount;

        } else if (type === 'CWARS_PACK') {
            const cwarsAmount = itemId === 'pack_small' ? 10000 : itemId === 'pack_medium' ? 50000 : 250000;
            user.cwarsBalance = (user.cwarsBalance || 0) + cwarsAmount;
        }

        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.balance,
            newCwars: user.cwarsBalance,
            newTickets: user.tickets,
            newWeapons: user.ownedWeapons,
            newInventory: user.inventory,
            newAmmo: user.ammo
        });

    } catch (error) {
        console.error('Shop Buy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
