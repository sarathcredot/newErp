# WhatsApp Express Server

A Node.js + Express server with **whatsapp-web.js** integration. Scan a QR code once and the session persists via `LocalAuth`.

## Project Structure

```
server/
├── src/
│   ├── index.js          # Express app entry point
│   ├── whatsapp.js       # WhatsApp client + message handler
│   └── routes/
│       └── whatsapp.js   # REST API routes
├── .env                  # Environment variables
├── .env.example
├── .gitignore
└── package.json
```

## Setup

```bash
cd server
npm install
npm run dev
```

When the server starts, a **QR code** is printed in the terminal. Scan it with the WhatsApp mobile app. The session is saved locally so you only need to scan once.

## API Endpoints

| Method | Endpoint                  | Description                 |
|--------|---------------------------|-----------------------------|
| GET    | `/health`                 | Server health check         |
| GET    | `/api/whatsapp/status`    | WhatsApp connection status  |
| POST   | `/api/whatsapp/send`      | Send a message              |
| GET    | `/api/whatsapp/chats`     | List recent chats (top 20)  |

### Send a Message

```http
POST /api/whatsapp/send
Content-Type: application/json

{
  "to": "919876543210",
  "message": "Hello from the server!"
}
```

> ⚠️ Use the full international number **without the `+`** (e.g., `919876543210` for India).

## Built-in Bot Commands

Send these messages to the WhatsApp number to test:

| Command | Response                   |
|---------|----------------------------|
| `ping`  | `pong 🏓`                  |
| `hello` | Greeting message           |
| `help`  | List of available commands |

## Environment Variables

| Variable    | Default         | Description       |
|-------------|-----------------|-------------------|
| `PORT`      | `3000`          | HTTP server port  |
| `NODE_ENV`  | `development`   | Runtime env       |
