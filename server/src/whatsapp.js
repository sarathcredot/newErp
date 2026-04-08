

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const { execSync } = require('child_process');

// ── Find or install Chrome ─────────────────────────────────────────────────
function ensureChrome() {
    const cacheDir = path.join(__dirname, '..', '.cache', 'puppeteer');

    try {
        const chromePath = execSync(
            `find ${cacheDir} -name "chrome" -type f 2>/dev/null`
        ).toString().trim();

        if (chromePath) {
            console.log('✅ Chrome found at:', chromePath);
            return chromePath;
        }
    } catch (e) {}

    console.log('⚙️ Chrome not found, installing now...');
    try {
        execSync('npx puppeteer browsers install chrome', {
            stdio: 'inherit',
            timeout: 120000,
        });

        const chromePath = execSync(
            `find ${cacheDir} -name "chrome" -type f 2>/dev/null`
        ).toString().trim();

        console.log('✅ Chrome installed at:', chromePath);
        return chromePath;
    } catch (err) {
        console.error('❌ Chrome install failed:', err.message);
        return null;
    }
}

// ── State ──────────────────────────────────────────────────────────────────
let client = null;
let isReady = false;
let latestQR = null;

// ── Init ───────────────────────────────────────────────────────────────────
async function initWhatsAppClient() {
    const chromePath = ensureChrome();

    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: './.wwebjs_auth',
        }),
        puppeteer: {
            headless: true,
            executablePath: chromePath || undefined,
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

    // ── Events ───────────────────────────────────────────────────────────────

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

    // ── Incoming message handler ──────────────────────────────────────────────

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

// ── Message handler ────────────────────────────────────────────────────────
async function handleIncomingMessage(message) {
    const body = message.body.trim().toLowerCase();

    if (body === 'ping') {
        await message.reply('pong 🏓');
        return;
    }
}

// ── Exports ────────────────────────────────────────────────────────────────
function getClient() { return client; }
function getClientStatus() { return { isReady }; }
function getQRCode() { return latestQR; }

module.exports = { initWhatsAppClient, getClient, getClientStatus, getQRCode };