const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let isReady = false;
let latestQR = null;

async function initWhatsAppClient() {

    const { execSync } = require('child_process');
    try {
        console.log('🔍 Chrome path:', execSync('find /opt/render/.cache/puppeteer -name "chrome" -type f').toString());
    } catch (e) {
        console.log('❌ Chrome not found in cache');
    }


    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: '/opt/render/project/src/.wwebjs_auth'  // ← changed
        }),
        puppeteer: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,  // ← added
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

    client.on('qr', (qr) => {
        latestQR = qr;
        console.log('📲 Scan this QR code with your WhatsApp mobile app:\n');
        console.log(`🌐 Or open: ${process.env.SERVER_URL}/api/whatsapp/qr`);
        qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', () => {
        latestQR = null;
        console.log('✅ WhatsApp authenticated successfully');
    });

    client.on('ready', () => {
        isReady = true;
        latestQR = null;
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

    client.on('message', async (message) => {
        console.log(`📨 Message from ${message.from}: ${message.body}`);
        await handleIncomingMessage(message);
    });

    client.on('message_create', async (message) => {
        if (message.fromMe) {
            console.log(`📤 You sent: ${message.body}`);
        }
    });

    await client.initialize();
}

async function handleIncomingMessage(message) {
    const body = message.body.trim().toLowerCase();
    if (body === 'ping') {
        await message.reply('pong 🏓');
        return;
    }
}

function getClient() { return client; }
function getClientStatus() { return { isReady }; }
function getQRCode() { return latestQR; }

module.exports = { initWhatsAppClient, getClient, getClientStatus, getQRCode };