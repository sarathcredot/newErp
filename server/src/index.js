require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initWhatsAppClient, getClient } = require('./whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Boot ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WhatsApp integration starting...\n`);
    await initWhatsAppClient();
});

module.exports = app;
