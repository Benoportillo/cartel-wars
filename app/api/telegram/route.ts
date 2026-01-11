import { NextResponse } from 'next/server';
import bot from '@/lib/bot';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        await bot.handleUpdate(body);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error handling Telegram update:', error);
        return NextResponse.json({ ok: false, error: 'Failed to process update' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'Telegram Webhook Endpoint Ready' });
}
