import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { WEAPONS, SHOP_ITEMS } from '@/constants';

// Define hardcoded ammo packs locally
const AMMO_PACKS = [
    { id: 'ammo_5', name: 'Pack Ligero (5)', price: 500, currency: 'CWARS', amount: 5, image: '/assets/items/ammo_light.png', type: 'AMMO' },
    { id: 'ammo_20', name: 'Pack Pesado (20)', price: 1800, currency: 'CWARS', amount: 20, image: '/assets/items/ammo_heavy.png', type: 'AMMO' },
    { id: 'ammo_50', name: 'Caja Munición (50)', price: 0.5, currency: 'TON', amount: 50, image: '/assets/items/ammo_crate.png', type: 'AMMO' },
];

export async function GET() {
    try {
        await dbConnect();

        let count = 0;

        // NEW ECONOMY TABLE
        // Navaja: 1/hr
        // Glock: 2.5/hr
        // Revolver: 3.33/hr
        // MP5: 10.83/hr
        // AK47: 25.0/hr
        // Barrett: 58.33/hr
        // M249: 83.33/hr
        // Bazooka: 133.33/hr

        const MINING_POWER_OVERRIDES: Record<string, number> = {
            'starter': 1.0,
            'glock': 2.5,
            'revolver': 3.33,
            'mp5': 10.83,
            'ak47': 25.0,
            'barrett': 58.33,
            'm249': 83.33,
            'bazooka': 133.33
        };

        const IMAGE_OVERRIDES: Record<string, string> = {
            'starter': '/assets/weapons/navaja.png',
            'glock': '/assets/weapons/glock.png',
            'revolver': '/assets/weapons/revolver.png',
            'mp5': '/assets/weapons/mp5.png',
            'ak47': '/assets/weapons/ak47.png',
            'barrett': '/assets/weapons/barrett.png',
            'm249': '/assets/weapons/m249.png',
            'bazooka': '/assets/weapons/bazooka.png'
        };

        // 1. Seed Weapons
        for (const w of WEAPONS) {

            const itemData = {
                id: w.id,
                name: w.name,
                type: 'WEAPON',
                category: w.category,
                level: w.level,
                price: w.price,
                currency: 'TON',
                firepower: w.firepower,
                miningPower: MINING_POWER_OVERRIDES[w.id] || 0, // NEW miningPower
                statusBonus: w.statusBonus,
                image: IMAGE_OVERRIDES[w.id] || w.image, // Updated Local Image Path
                description: w.description,
                isLimited: w.isLimited || false,
                order: w.level
            };

            await Item.findOneAndUpdate({ id: w.id }, itemData, { upsert: true, new: true });
            count++;
        }

        // 3. Seed Buffs
        const BUFF_PRICES: Record<string, number> = { 'oil': 500, 'charm': 1000, 'kevlar': 2000 };

        for (const b of SHOP_ITEMS) {
            const price = BUFF_PRICES[b.id] || b.price;
            const currency = 'CWARS';

            const itemData = {
                id: b.id,
                name: b.name,
                type: 'BUFF',
                price: price,
                currency: currency,
                image: b.image, // Assuming these were already local '/assets/items/...' in constants
                description: b.description,
                order: 200
            };
            await Item.findOneAndUpdate({ id: b.id }, itemData, { upsert: true, new: true });
            count++;
        }

        return NextResponse.json({ success: true, seeded: count, message: "Database seeded with NEW Economy Values & Local Image Paths." });

    } catch (error: any) {
        console.error("Seed Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
