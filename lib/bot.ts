import { Telegraf, Markup } from 'telegraf';

if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not defined');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const WEB_APP_URL = 'https://cartel-wars.onrender.com';

bot.start((ctx) => {
    ctx.replyWithMarkdownV2(
        `🚬 *CARTEL WARS: PLATA O PLOMO* 💀\n\n` +
        `El *$CWARS* es la única moneda que importa aquí\\. Para sobrevivir, vas a necesitar más que suerte: ¡vas a necesitar *fuego*\\! 🔥🔫\n\n` +
        `🔹 *Duelos PvP:* ⚔️ 0\\.2 TON en juego\\. ¡El más rápido gana\\! 💰\n` +
        `🔹 *Contrabando:* 📦 Pon tus armas a producir $CWARS mientras duermes\\. 💵\n` +
        `🔹 *Ruleta:* 🎰 Gira el tambor\\.\\.\\. ¿Premio o plomo? ☠️\n\n` +
        `*"Bienvenido al infierno\\.\\.\\. ¿Plata o Plomo?"* ⚡️`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🔫 ENTRAR AL BARRIO', WEB_APP_URL)]
        ])
    );
});

export default bot;
