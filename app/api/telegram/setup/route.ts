import { NextResponse } from 'next/server';
import bot from '@/lib/bot';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const host = searchParams.get('host') || 'cartel-wars.onrender.com';
        const webhookUrl = `https://${host}/api/telegram`;

        await bot.telegram.setWebhook(webhookUrl);

        return NextResponse.json({
            ok: true,
            message: `Webhook set successfully to: ${webhookUrl}`,
            info: 'Ahora tu bot responderá usando la API de Next.js'
        });
    } catch (error: any) {
        console.error('Error setting webhook:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
