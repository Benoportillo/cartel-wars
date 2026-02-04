import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { WEAPONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        const results = [];

        for (const weapon of WEAPONS) {
            // Upsert or Update
            // We use 'id' as the key (e.g. 'glock', 'ak47')

            // Note: DB items might have different structure or extra fields.
            // We only want to update miningPower and ensure price/stats match current balance.

            const update = {
                firepower: weapon.firepower,
                miningPower: weapon.miningPower,
                statusBonus: weapon.statusBonus,
                price: weapon.price, // Ensure price sync
            };

            const updated = await Item.findOneAndUpdate(
                { id: weapon.id },
                { $set: update },
                { new: true }
            );

            if (updated) {
                results.push(`Updated ${weapon.name}: Mining Power ${weapon.miningPower}/h`);
            } else {
                results.push(`Skipped ${weapon.name} (Not found in DB)`);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
