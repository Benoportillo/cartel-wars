import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import { WEAPONS } from '../../../../constants';

export async function POST(req: Request) {
    await dbConnect();

    try {
        const { telegramId, weaponIndex, upgradeType, cost } = await req.json();

        if (!telegramId || typeof weaponIndex !== 'number' || !upgradeType || !cost) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId });
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        if (user.balance < cost) {
            return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
        }

        const weaponInstance = user.ownedWeapons[weaponIndex];
        if (!weaponInstance) {
            return NextResponse.json({ success: false, error: 'Weapon not found' }, { status: 404 });
        }

        // Validate max level
        let currentLevel = 1;
        if (upgradeType === 'caliber') currentLevel = weaponInstance.caliberLevel;
        if (upgradeType === 'magazine') currentLevel = weaponInstance.magazineLevel;
        if (upgradeType === 'accessory') currentLevel = weaponInstance.accessoryLevel;

        if (currentLevel >= 10) {
            return NextResponse.json({ success: false, error: 'Max level reached' }, { status: 400 });
        }

        // Apply Upgrade
        if (upgradeType === 'caliber') user.ownedWeapons[weaponIndex].caliberLevel++;
        if (upgradeType === 'magazine') user.ownedWeapons[weaponIndex].magazineLevel++;
        if (upgradeType === 'accessory') user.ownedWeapons[weaponIndex].accessoryLevel++;

        // Deduct Balance
        user.balance -= cost;

        // Recalculate Power Stats (Backend Mirror of Context Logic for consistency)
        // This is optional if the frontend trusts the context recalculation, 
        // but updating the DB model's aggregate stats is good practice.
        // For now, we'll let the GameContext handle the specific numbers on client load,
        // but we save the raw weapon data.

        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.balance,
            ownedWeapons: user.ownedWeapons
        });

    } catch (error) {
        console.error('Upgrade error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
