const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.argv[2] || 8080;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  if (req.url === '/rooms') {
    const list = [...rooms.entries()].map(([id, players]) => ({ id, players: players.size }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }
  
  let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(__dirname, file);
  const ext = path.extname(filePath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });
const rooms = new Map(); // roomId -> Map(playerId -> ws)
const playerStates = new Map(); // roomId -> Map(playerId -> {x, z, yaw, ...})

wss.on('connection', (ws, req) => {
  console.log('--- WS Connection ---');
  console.log('Socket:', req.socket.remoteAddress, req.socket.remotePort);
  console.log('Headers:', req.headers);
  
  const params = new URLSearchParams(req.url.slice(2));
  const room = params.get('room'), id = params.get('id'), creator = params.get('creator') === 'true';
  
  if (!rooms.has(room)) rooms.set(room, new Map());
  if (!playerStates.has(room)) playerStates.set(room, new Map());
  const players = rooms.get(room);
  const states = playerStates.get(room);
  const isRejoin = states.has(id);
  players.set(id, ws);
  ws.room = room; ws.id = id; ws.creator = creator;
  ws.ip = req.socket.remoteAddress; ws.connectedAt = Date.now();
  
  // Send saved state on rejoin
  if (isRejoin) {
    ws.send(JSON.stringify({ type: 'restore_state', state: states.get(id) }));
  }
  
  // Notify others
  broadcast(room, { type: 'player_joined', playerId: id, count: players.size, isRejoin }, id);
  console.log(`[${room}] ${id} joined (${players.size} players)`);
  
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'ping') { ws.send(JSON.stringify({ type: 'pong', t: data.t })); return; }
    if (data.type === 'pong') return;
    
    // Save player position state
    if (data.type === 'pos') {
      states.set(id, { x: data.x, z: data.z, yaw: data.yaw, color: data.color, playerIndex: data.playerIndex });
    }
    
    if (data.type === 'start_game') {
      // Server assigns player indices and sends start to each
      const seed = Date.now();
      let idx = 0;
      players.forEach((client, pid) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'start', seed, playerIndex: idx++ }));
        }
      });
      return;
    }
    
    // Relay to others (or specific target)
    if (data._to) {
      const target = players.get(data._to);
      if (target?.readyState === 1) target.send(JSON.stringify(data));
    } else {
      broadcast(room, data, data._exclude || id);
    }
  });
  
  ws.on('close', () => {
    const duration = ((Date.now() - ws.connectedAt) / 1000).toFixed(1);
    console.log(`--- WS Disconnect ---`);
    console.log(`[${room}] ${id} left | IP: ${ws.ip} | Duration: ${duration}s`);
    players.delete(id);
    broadcast(room, { type: 'player_left', playerId: id, count: players.size });
    if (players.size === 0) rooms.delete(room);
  });
});

function broadcast(room, data, exclude = null) {
  const players = rooms.get(room);
  if (!players) return;
  const msg = JSON.stringify(data);
  players.forEach((client, pid) => {
    if (client.readyState === 1 && pid !== exclude) client.send(msg);
  });
}

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} (WebSocket + static files)`));
