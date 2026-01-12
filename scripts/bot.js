const { Telegraf, Markup } = require('telegraf');

// 1. Token de BotFather
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 2. URL de tu proyecto en Render
const WEB_APP_URL = 'https://cartel-wars.onrender.com/';

bot.start((ctx) => {
    const payload = ctx.startPayload || (ctx.message && ctx.message.text && ctx.message.text.split(' ')[1]);
    // Si hay payload (ref code), lo agregamos a la URL
    const appUrl = payload ? `${WEB_APP_URL}?start=${payload}` : WEB_APP_URL;

    ctx.replyWithMarkdownV2(
        `🚬 *CARTEL WARS: PLATA O PLOMO* 💀\n\n` +
        `El *$CWARS* es la única moneda que importa aquí\\. Para sobrevivir, vas a necesitar más que suerte: ¡vas a necesitar *fuego*\\! 🔥🔫\n\n` +
        `🔹 *Duelos PvP:* ⚔️ 0\\.2 TON en juego\\. ¡El más rápido gana\\! 💰\n` +
        `🔹 *Contrabando:* 📦 Pon tus armas a producir $CWARS mientras duermes\\. 💵\n` +
        `🔹 *Ruleta:* 🎰 Gira el tambor\\.\\.\\. ¿Premio o plomo? ☠️\n\n` +
        `*"Bienvenido al infierno\\.\\.\\. ¿Plata o Plomo?"* ⚡️`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🔫 ENTRAR AL BARRIO', appUrl)]
        ])
    );
});

bot.launch();
console.log("El Capo está vigilando las calles...");

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
