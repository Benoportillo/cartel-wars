import { Telegraf, Markup } from 'telegraf';

if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not defined');
}


const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const WEB_APP_URL = 'https://cartel-wars.onrender.com';

bot.start((ctx) => {
    ctx.replyWithMarkdownV2(
        `🚬 *CARTEL WARS: SILVER OR LEAD* 💀\n\n` +
        `*$CWARS* is the only currency that matters here\\. To survive, you'll need more than luck: you'll need *firepower*\\! 🔥🔫\n\n` +
        `🔹 *PvP Duels:* ⚔️ 0\\.2 TON at stake\\. The fastest wins\\! 💰\n` +
        `🔹 *Smuggling:* 📦 Set your weapons to farm $CWARS while you sleep\\. 💵\n` +
        `🔹 *Roulette:* 🎰 Spin the cylinder\\.\\.\\. Jackpot or lead? ☠️\n\n` +
        `*"Welcome to hell\\.\\.\\. Silver or Lead?"* ⚡️`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🔫 ENTRAR AL BARRIO', WEB_APP_URL)]
        ])
    );
});

export default bot;
