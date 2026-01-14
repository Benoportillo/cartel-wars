import { Telegraf, Markup } from 'telegraf';

// 1. Token de BotFather
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 2. URL de tu proyecto en Render
const WEB_APP_URL = 'https://cartel-wars.onrender.com/';

bot.start((ctx) => {
    console.log("--- NUEVO COMANDO START ---");
    if (ctx.from) {
        console.log("De:", ctx.from.id, ctx.from.first_name);
    }
    console.log("Texto completo:", ctx.message ? ctx.message.text : "Sin texto");

    // 1. Intentar obtener payload de Telegraf (Deep Linking)
    let payload = ctx.startPayload;

    // 2. Si falla, intentar parseo manual del texto "/start <payload>"
    if (!payload && ctx.message && ctx.message.text) {
        const parts = ctx.message.text.split(' ');
        if (parts.length > 1 && parts[1]) {
            payload = parts[1];
        }
    }

    // 3. Limpieza de basura (frontend a veces envía 'undefined' como string)
    if (payload === 'undefined' || payload === 'null') {
        payload = '';
    }

    console.log("Payload Final Detectado:", payload);

    // Aseguramos que la URL base no tenga slash final duplicado
    const baseUrl = WEB_APP_URL.endsWith('/') ? WEB_APP_URL.slice(0, -1) : WEB_APP_URL;

    // Construimos la URL con TODOS los parámetros posibles para asegurar que el Frontend lo lea
    const appUrl = payload
        ? `${baseUrl}?start=${payload}&startapp=${payload}&tgWebAppStartParam=${payload}`
        : baseUrl;

    console.log("URL Generada:", appUrl);

    let welcomeMessage = `🚬 *CARTEL WARS: PLATA O PLOMO* 💀\n\n` +
        `El *$CWARS* es la única moneda que importa aquí\\. Para sobrevivir, vas a necesitar más que suerte: ¡vas a necesitar *fuego*\\! 🔥🔫\n\n` +
        `🔹 *Duelos PvP:* ⚔️ 0\\.2 TON en juego\\. ¡El más rápido gana\\! 💰\n` +
        `🔹 *Contrabando:* 📦 Pon tus armas a producir $CWARS mientras duermes\\. 💵\n` +
        `🔹 *Ruleta:* 🎰 Gira el tambor\\.\\.\\. ¿Premio o plomo? ☠️\n\n` +
        `*"Bienvenido al infierno\\.\\.\\. ¿Plata o Plomo?"* ⚡️`;

    // Si hay referido, agregamos mensaje de confirmación VISUAL
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
    ).catch(err => console.error("Error enviando mensaje:", err));
});

bot.launch().then(() => {
    console.log("El Capo está vigilando las calles...");
}).catch(err => {
    console.error("Error iniciando el bot:", err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
