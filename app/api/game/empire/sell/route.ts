import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, amount } = await req.json();

    const user = await User.findOne({ telegramId: userId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Validate stock
    // Map usage in Mongoose can be tricky.
    // 'inventory' is a Map<string, number> in Schema.
    if (!user.inventory) user.inventory = new Map();
    const currentPolvo = user.inventory.get('polvo') || 0;

    if (amount <= 0 || amount > currentPolvo) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // 1. Calculate Market Price (Dynamic)
    // Simple Algo: Price fluctuates every hour based on server time.
    // Base 8, max 15.
    const hour = new Date().getHours();
    // Pseudo-random deterministic price for the hour
    const seed = (hour * 37) % 100; // 0-99
    // Map 0-99 to 8-15
    const marketPrice = 8 + Math.floor((seed / 100) * 8); // 8 to 15

    const grossEarnings = amount * marketPrice;

    // 2. Risk Check (Redada)
    // If selling massive amounts (> 500g), there is risk?
    // Design doc: "Redada al acumular > 500g". Trigger on SELL?
    // Let's implement a flat 5% risk on any sale > 100g to make it spicy.
    let raidTriggered = false;
    let finalEarnings = grossEarnings;
    let message = `Sold ${amount}g at ${marketPrice} CWARS/g.`;

    if (amount > 100) {
        const riskRoll = Math.random();
        if (riskRoll < 0.05) { // 5% chance
            raidTriggered = true;
            finalEarnings = Math.floor(grossEarnings * 0.5); // 50% seized
            message = `POLICE RAID! They seized 50% of your earnings!`;
        }
    }

    // Apply
    user.cwarsBalance += finalEarnings;
    user.inventory.set('polvo', currentPolvo - amount);

    await user.save();

    return NextResponse.json({
        success: true,
        soldAmount: amount,
        pricePerGram: marketPrice,
        totalEarnings: finalEarnings,
        raid: raidTriggered,
        message: message,
        newBalance: user.cwarsBalance,
        newStock: user.inventory.get('polvo')
    });
}
