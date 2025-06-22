/**
 * Vanilla WebSocket server with:
 *  – text fucking chat
 *  – binary file transfer (header + payload) (currently breaking, no fucking clue why)
 *  – connection keep-alive (Ping / Pong - yeah like the fucking game!)
 *
 * Run this motherfucker using node server.js
 * Test with the fucking index.html template.
 */

const http   = require('http');
const crypto = require('crypto');

const PORT = 8080;
const KEEP_ALIVE_INTERVAL = 30_000; // 30 fucking seconds
const clients = [];

/* HTTP → WebSocket fucking upgrade */
const server = http.createServer((_, res) => {
  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('Uh uh, WebSockets only motherfucker!\n');
});

server.on('upgrade', (req, socket) => {
  const key      = req.headers['sec-websocket-key'];
  const accept   = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  socket.isAlive = true;
  clients.push(socket);

  socket.on('data', (buf) => handleFrameFuckingly(buf, socket));
  socket.on('close', ()   => drop(socket));
  socket.on('error', ()   => drop(socket));
});

/* Handle frames fuckingly */
function handleFrameFuckingly(buffer, socket) {
  const msg = decodeFuckedFrame(buffer);
  if (!msg) return;

  socket.isAlive = true;

  switch (msg.type) {
    case 'pong': // answer to our Ping
      return;
    case 'ping': // client ping → reply
      socket.write(encodePong(msg.data));
      return;
    case 'text':
      console.log('Text:', msg.content);
      break;
    case 'binary':
      console.log('File:', msg.meta.filename);
      break;
  }
  broadcastYourShit(msg, socket);
}

/* Encoding helpers */
function encodeFrame(opcode, payload = Buffer.alloc(0)) {
  if (payload.length > 125)
    throw new Error('Control frame too large. Fuck!');

  return Buffer.concat([ Buffer.from([0x80 | opcode, payload.length]), payload ]);
}

const encodePing  = (data = Buffer.alloc(0)) => encodeFrame(0x09, data);
const encodePong  = (data = Buffer.alloc(0)) => encodeFrame(0x0A, data);

function encodeText(str) {
  const payload = Buffer.from(str);
  const header  = makePayloadHeaderFucker(0x1, payload.length);
  return Buffer.concat([header, payload]);
}

function encodeBinary(meta, content) {
  const metaBuf   = Buffer.from(JSON.stringify(meta));
  const metaLen   = Buffer.alloc(4);
  metaLen.writeUInt32BE(metaBuf.length);
  const payload   = Buffer.concat([metaLen, metaBuf, content]);
  const header    = makePayloadHeaderFucker(0x2, payload.length);
  return Buffer.concat([header, payload]);
}

function makePayloadHeaderFucker(opcode, length) {
  const head = [0x80 | opcode];
  if (length <= 125) {
    head.push(length);
  } else if (length <= 65_535) {
    head.push(126, length >> 8, length & 0xff);
  } else {
    head.push(127);
    const lenBuf = Buffer.alloc(8);
    lenBuf.writeBigUInt64BE(BigInt(length));
    return Buffer.concat([Buffer.from(head), lenBuf]);
  }
  return Buffer.from(head);
}

/* Decoding helpers */
function decodeFuckedFrame(buf) {
  const opcode     =  buf[0] & 0x0f;
  const isMasked   = (buf[1] & 0x80) === 0x80;
  let length       =  buf[1] & 0x7f;
  let offset       = 2;

  if (length === 126) { length = buf.readUInt16BE(offset); offset += 2; }
  else if (length === 127) { length = Number(buf.readBigUInt64BE(offset)); offset += 8; }

  let mask;
  if (isMasked) { mask = buf.slice(offset, offset + 4); offset += 4; }

  const data = buf.slice(offset, offset + length);
  if (isMasked) for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];

  switch (opcode) {
    case 0x1: return { type: 'text',   content: data.toString() };
    case 0x2: { // binary with fucking header
      const metaLen = data.readUInt32BE(0);
      const meta    = JSON.parse(data.slice(4, 4 + metaLen).toString());
      const file    = data.slice(4 + metaLen);
      return { type: 'binary', meta, content: file };
    }
    case 0x9:  return { type: 'ping',  data };
    case 0xA:  return { type: 'pong' };
    default:   return null;
  }
}

/* Broadcast diz nutzzz! */
function broadcastYourShit(msg, sender) {
  for (const c of clients) {
    if (c === sender) continue;
    try {
      if      (msg.type === 'text')   c.write(encodeText(msg.content));
      else if (msg.type === 'binary') c.write(encodeBinary(msg.meta, msg.content));
    } catch {
      drop(c);
    }
  }
}

/* Keep-alive (Ping) */
setInterval(() => {
  for (const c of [...clients]) {
    if (!c.isAlive) {
      drop(c);
      continue;
    }
    c.isAlive = false;
    try { c.write(encodePing()); }
    catch { drop(c); }
  }
}, KEEP_ALIVE_INTERVAL);

/* Helpers */
function drop(socket) {
  const idx = clients.indexOf(socket);
  if (idx !== -1) clients.splice(idx, 1);
  try { socket.destroy(); } catch {/* just ignore you dipshit! */}
}

/* Start shit */
server.listen(PORT, () =>
  console.log(`📡  WebSocket server running at ws://localhost:${PORT}`)
);
