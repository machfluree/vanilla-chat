# 📡 Vanilla Chat

A lightweight WebSocket server using **pure Node.js** — no external bullshits — that supports:

- ✅ Real-time text chat
- ✅ Binary file transfer (images, audio, videos, documents)
- ✅ Keep-alive via Ping/Pong (auto-disconnect inactive clients)
- ✅ Simple front-end using HTML + JavaScript

---

## 🚀 Setup Instructions

### 🧩 Requirements

- Node.js v12+ installed (use `node -v` to check)

---

### 🛠️ 1. Clone or Download the Project

```bash
git clone https://github.com/machfluree/vanilla-chat.git
cd vanilla-chat
```

### Project structure
```bash
/project-folder
│
├── server.js       # WebSocket server (Node.js)
├── client.html     # Frontend UI (Vanilla HTML + JS)
└── README.md       # This setup guide
```

### Run the project
```bash
node server.js
```
The server will start on:
```
ws://localhost:8080
```
Open client.html in multiple browser tabs or devices:
- You can send text messages in real-time.
- Use the file picker to send images, documents, videos, or audio.
- Images are previewed; other files are downloadable.

### Notes and recommendations
This is a basic prototype. For production use:
- Use wss:// with HTTPS.
- Add authentication and access control.
- Add file size/type validation.
- Consider chunked file transfers for very large files.
- _And many more_
