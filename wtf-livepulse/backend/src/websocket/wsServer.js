const WebSocket = require('ws');
let wss = null;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });
  wss.on('connection', (ws, req) => {
    ws.subscribedGyms = new Set();
    ws.isAlive = true;
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.action === 'ping') { ws.send(JSON.stringify({ type: 'pong' })); return; }
        if (msg.action === 'subscribe'   && msg.gym_id) { ws.subscribedGyms.add(msg.gym_id);    ws.send(JSON.stringify({ type: 'subscribed', gym_id: msg.gym_id })); return; }
        if (msg.action === 'unsubscribe' && msg.gym_id) { ws.subscribedGyms.delete(msg.gym_id); return; }
      } catch { /* ignore */ }
    });
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('error', (err) => console.error('[WS] Error:', err.message));
    ws.send(JSON.stringify({ type: 'connected', message: 'FitCore live feed' }));
  });

  const heartbeat = setInterval(() => {
    if (!wss) return clearInterval(heartbeat);
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false; ws.ping();
    });
  }, Number(process.env.WS_HEARTBEAT_INTERVAL_MS) || 30000);

  wss.on('close', () => clearInterval(heartbeat));
  console.log('[WS] WebSocket server initialised on /ws');
  return wss;
}

function broadcast(msg) {
  if (!wss) return;
  const raw = JSON.stringify(msg);
  const gymId = msg.payload?.gym_id;
  wss.clients.forEach((ws) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (!gymId || ws.subscribedGyms.size === 0 || ws.subscribedGyms.has(gymId)) ws.send(raw);
  });
}

module.exports = { initWebSocket, broadcast };
