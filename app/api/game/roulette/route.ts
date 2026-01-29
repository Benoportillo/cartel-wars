import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { ROULETTE_ITEMS } from '@/constants';

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

        if (user.tickets <= 0) {
            return NextResponse.json({ error: 'No tickets available' }, { status: 403 });
        }

        // 1. Logic of Chance (Server Side)
        const rand = Math.random();
        let cumulative = 0;
        let selectedItem = ROULETTE_ITEMS[0];

        for (const item of ROULETTE_ITEMS) {
            cumulative += item.probability;
            if (rand < cumulative) {
                selectedItem = item;
                break;
            }
        }

        // 2. Apply Result
        user.tickets -= 1;
        user.totalRouletteSpent = (user.totalRouletteSpent || 0) + 0.1; // Tracking approximate TON value
        user.lastTicketDate = new Date(); // Reset timer logic if needed

        if (selectedItem.type === 'TON') {
            user.balance += Number(selectedItem.value);
        } else if (selectedItem.type === 'BUFF') {
            if (!user.inventory) user.inventory = {};
            const buffId = selectedItem.value === 'oil' ? 'oil' : 'charm'; // Map 'ammo' to 'charm' or similar if needed
            // For now, let's say 'ammo' gives you a 'charm' or we add 'ammo' to inventory if supported.
            // Let's map 'ammo' to 'charm' for simplicity or add 'ammo' logic later.
            // Actually, let's just use the value as the key.
            const key = String(selectedItem.value);
            user.inventory[key] = (user.inventory[key] || 0) + 1;
            user.markModified('inventory');
        } else if (selectedItem.type === 'WEAPON') {
            // Add weapon instance
            user.ownedWeapons.push({
                weaponId: selectedItem.value,
                caliberLevel: 1,
                magazineLevel: 1,
                accessoryLevel: 1,
                skin: '#333333'
            });
        }

        await user.save();

        return NextResponse.json({
            success: true,
            result: selectedItem,
            newBalance: user.balance,
            newTickets: user.tickets,
            newWeapons: user.ownedWeapons
        });

    } catch (error) {
        console.error('Roulette Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
