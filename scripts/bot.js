const { Telegraf, Markup } = require('telegraf');

// 1. Token de BotFather
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 2. URL de tu proyecto en Render
const WEB_APP_URL = 'https://cartel-wars.onrender.com/';

bot.start((ctx) => {
    const payload = ctx.startPayload || (ctx.message && ctx.message.text && ctx.message.text.split(' ')[1]) || '';
    console.log("Payload recibido:", payload);

    // Si hay payload (ref code), lo agregamos a la URL como start y startapp
    // Aseguramos que la URL base no tenga slash final duplicado
    const baseUrl = WEB_APP_URL.endsWith('/') ? WEB_APP_URL.slice(0, -1) : WEB_APP_URL;

    // Construimos la URL con ambos métodos para asegurar compatibilidad
    // 1. Query Params (para lectura directa en navegador)
    // 2. startapp (para Telegram Mini App standard)
    const appUrl = payload
        ? `${baseUrl}?start=${payload}&startapp=${payload}&tgWebAppStartParam=${payload}`
        : baseUrl;

    let welcomeMessage = `🚬 *CARTEL WARS: PLATA O PLOMO* 💀\n\n` +
        `El *$CWARS* es la única moneda que importa aquí\\. Para sobrevivir, vas a necesitar más que suerte: ¡vas a necesitar *fuego*\\! 🔥🔫\n\n` +
        `🔹 *Duelos PvP:* ⚔️ 0\\.2 TON en juego\\. ¡El más rápido gana\\! 💰\n` +
        `🔹 *Contrabando:* 📦 Pon tus armas a producir $CWARS mientras duermes\\. 💵\n` +
        `🔹 *Ruleta:* 🎰 Gira el tambor\\.\\.\\. ¿Premio o plomo? ☠️\n\n` +
        `*"Bienvenido al infierno\\.\\.\\. ¿Plata o Plomo?"* ⚡️`;

    // Si hay referido, agregamos mensaje de confirmación
    if (payload) {
        welcomeMessage = `🕵️ *INTELIGENCIA DEL CARTEL*\n\n` +
            `⚠️ *ATENCIÓN:* Has sido reclutado por el Sicario *#${payload}*\\.\n` +
            `Tu lealtad ha sido registrada\\. ¡No le falles\\!\n\n` +
            `➖➖➖➖➖➖➖➖➖➖➖➖\n\n` +
            welcomeMessage;
    }

    ctx.replyWithMarkdownV2(
        welcomeMessage,
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
