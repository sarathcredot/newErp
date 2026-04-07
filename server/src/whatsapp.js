const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let isReady = false;
let latestQR = null; // cached QR string for browser display

/**
 * Initialize and boot the WhatsApp Web client.
 * Persists session data in ./.wwebjs_auth so you only scan the QR once.
 */
async function initWhatsAppClient() {
    client = new Client({
        authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
            ],
        },
    });

    // ── Events ────────────────────────────────────────────────────────────────

    client.on('qr', (qr) => {
        latestQR = qr; // cache for browser endpoint
        console.log('📲 Scan this QR code with your WhatsApp mobile app:\n');
        console.log(`🌐 Or open: ${process.env.SERVER_URL}/api/whatsapp/qr`);
        qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', () => {
        latestQR = null; // clear after auth
        console.log('✅ WhatsApp authenticated successfully');
    });

    client.on('ready', () => {
        isReady = true;
        latestQR = null; // clear after ready
        console.log('✅ WhatsApp client is ready!');
    });

    client.on('auth_failure', (msg) => {
        isReady = false;
        console.error('❌ WhatsApp authentication failed:', msg);
    });

    client.on('disconnected', (reason) => {
        isReady = false;
        console.warn('⚠️  WhatsApp client disconnected:', reason);
    });

    // ── Incoming message handler ───────────────────────────────────────────────
    client.on('message', async (message) => {
        console.log(`📨 Message from ${message.from}: ${message.body}`);
        await handleIncomingMessage(message);
    });

    client.on('message_create', async (message) => {
        if (message.fromMe) {
            console.log(`📤 You sent: ${message.body}`);
            // handle self-sent message here
        }
    });

    await client.initialize();
}

/**
 * Basic chatbot logic — extend this function with your own rules.
 */
async function handleIncomingMessage(message) {
    const body = message.body.trim().toLowerCase();

    if (body === 'ping') {
        await message.reply('pong 🏓');
        return;
    }

    // Default: echo the message back (remove in production)
    // await message.reply(`You said: ${message.body}`);
}

/**
 * Expose client + status for use in routes.
 */
function getClient() {
    return client;
}

function getClientStatus() {
    return { isReady };
}

function getQRCode() {
    return latestQR;
}

module.exports = { initWhatsAppClient, getClient, getClientStatus, getQRCode };
