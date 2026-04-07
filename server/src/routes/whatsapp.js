const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { getClient, getClientStatus, getQRCode } = require('../whatsapp');

/**
 * GET /api/whatsapp/status
 * Returns the current WhatsApp client connection status.
 */
router.get('/status', (req, res) => {
    const { isReady } = getClientStatus();
    res.json({
        connected: isReady,
        message: isReady ? 'WhatsApp client is ready' : 'WhatsApp client not ready — scan QR to connect',
    });
});

/**
 * GET /api/whatsapp/qr
 * Renders a browser page showing the WhatsApp QR code.
 * Auto-refreshes every 10 seconds until connected.
 */
router.get('/qr', async (req, res) => {
    const { isReady } = getClientStatus();

    if (isReady) {
        return res.send(`
            <!DOCTYPE html><html><head><meta charset="utf-8">
            <title>WhatsApp Status</title>
            <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#111;color:#fff;flex-direction:column;gap:16px}
            .badge{background:#25D366;color:#fff;padding:12px 28px;border-radius:999px;font-size:1.2rem;font-weight:700}
            </style></head><body>
            <div class="badge">✅ WhatsApp Connected!</div>
            <p style="color:#aaa">Your WhatsApp is authenticated and ready.</p>
            </body></html>
        `);
    }

    const qrString = getQRCode();

    if (!qrString) {
        return res.send(`
            <!DOCTYPE html><html><head><meta charset="utf-8">
            <meta http-equiv="refresh" content="5">
            <title>WhatsApp QR</title>
            <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#111;color:#fff;flex-direction:column;gap:16px}
            .spinner{width:48px;height:48px;border:5px solid #333;border-top-color:#25D366;border-radius:50%;animation:spin 1s linear infinite}
            @keyframes spin{to{transform:rotate(360deg)}}
            </style></head><body>
            <div class="spinner"></div>
            <p>Waiting for QR code... (auto-refreshing)</p>
            </body></html>
        `);
    }

    try {
        const qrDataURL = await QRCode.toDataURL(qrString, { width: 300, margin: 2 });
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta http-equiv="refresh" content="10">
                <title>WhatsApp QR Code</title>
                <style>
                    *{box-sizing:border-box;margin:0;padding:0}
                    body{font-family:'Segoe UI',sans-serif;background:#111;color:#fff;
                        display:flex;align-items:center;justify-content:center;min-height:100vh}
                    .card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;
                        padding:40px;text-align:center;max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.5)}
                    .logo{font-size:2.5rem;margin-bottom:8px}
                    h1{font-size:1.4rem;font-weight:700;margin-bottom:6px}
                    p{color:#888;font-size:.9rem;margin-bottom:24px;line-height:1.5}
                    .qr-wrap{background:#fff;border-radius:12px;padding:16px;display:inline-block;margin-bottom:20px}
                    .qr-wrap img{display:block;width:240px;height:240px}
                    .badge{background:#25D366;color:#fff;padding:8px 20px;border-radius:999px;
                        font-size:.8rem;font-weight:600;display:inline-block;margin-bottom:16px}
                    .hint{color:#555;font-size:.78rem}
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">📱</div>
                    <h1>Connect WhatsApp</h1>
                    <p>Open WhatsApp on your phone →<br>Tap <strong>Linked Devices</strong> → <strong>Link a Device</strong></p>
                    <div class="qr-wrap">
                        <img src="${qrDataURL}" alt="WhatsApp QR Code" />
                    </div><br>
                    <span class="badge">⏳ Waiting for scan…</span>
                    <p class="hint">Page auto-refreshes every 10 seconds</p>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate QR image', details: err.message });
    }
});

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message to a given number.
 *
 * Body:
 *   { "to": "919876543210", "message": "Hello there!" }
 *
 * The `to` field must be the full international number WITHOUT the + sign.
 * whatsapp-web.js appends @c.us internally.
 */
router.post('/send', async (req, res) => {
    const { isReady } = getClientStatus();

    if (!isReady) {
        return res.status(503).json({ error: 'WhatsApp client not ready. Please scan the QR code first.' });
    }

    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Both `to` (phone number) and `message` fields are required.' });
    }

    try {
        const client = getClient();
        const chatId = `${to}@c.us`;
        await client.sendMessage(chatId, message);
        res.json({ success: true, to, message });
    } catch (err) {
        console.error('[Send Error]', err.message);
        res.status(500).json({ error: 'Failed to send message', details: err.message });
    }
});

/**
 * GET /api/whatsapp/chats
 * Returns a list of recent chats.
 */
router.get('/chats', async (req, res) => {
    const { isReady } = getClientStatus();

    if (!isReady) {
        return res.status(503).json({ error: 'WhatsApp client not ready.' });
    }

    try {
        const client = getClient();
        const chats = await client.getChats();
        const simplified = chats.slice(0, 20).map((chat) => ({
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chat.isGroup,
            unreadCount: chat.unreadCount,
            timestamp: chat.timestamp,
        }));
        res.json({ count: simplified.length, chats: simplified });
    } catch (err) {
        console.error('[Chats Error]', err.message);
        res.status(500).json({ error: 'Failed to fetch chats', details: err.message });
    }
});

module.exports = router;
