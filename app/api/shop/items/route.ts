import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Fetch all items, sorted by order and price
        const items = await Item.find({}).sort({ order: 1, price: 1 }).lean();

        // Categorize for easier frontend consumption structure if needed, 
        // or just return flat list and let frontend filter.
        // Returning flat list is more flexible.

        return NextResponse.json({
            success: true,
            items
        });

    } catch (error: any) {
        console.error("List Items Error:", error);
        return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }
}
