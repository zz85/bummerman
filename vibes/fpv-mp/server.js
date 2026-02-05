const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.argv[2] || 8080;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  if (req.url === '/rooms') {
    const list = [...rooms.entries()].map(([id, room]) => ({ 
      id, 
      players: room.players.size,
      spectators: room.spectators.size 
    }));
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
const rooms = new Map(); // roomId -> { players: Map, spectators: Map, states: Map }

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: new Map(),    // playerId -> ws
      spectators: new Map(), // spectatorId -> ws
      states: new Map()      // playerId -> {x, z, yaw, ...}
    });
  }
  return rooms.get(roomId);
}

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.slice(2));
  const roomId = params.get('room');
  const id = params.get('id');
  const creator = params.get('creator') === 'true';
  const isSpectator = params.get('spectator') === 'true';
  
  const room = getOrCreateRoom(roomId);
  const isRejoin = room.states.has(id);
  
  // Store connection info
  ws.room = roomId;
  ws.id = id;
  ws.creator = creator;
  ws.isSpectator = isSpectator;
  ws.ip = req.socket.remoteAddress;
  ws.connectedAt = Date.now();
  
  if (isSpectator) {
    // Add to spectators, not players
    room.spectators.set(id, ws);
    console.log(`[${roomId}] Spectator ${id} joined (${room.players.size} players, ${room.spectators.size} spectators)`);
    
    // Send current counts to spectator
    ws.send(JSON.stringify({ 
      type: 'player_count', 
      count: room.players.size,
      spectators: room.spectators.size
    }));
    
    // Notify players (especially host) that a spectator joined
    broadcastToPlayers(roomId, { 
      type: 'spectator_joined', 
      spectatorId: id, 
      count: room.spectators.size 
    });
  } else {
    // Add to players
    room.players.set(id, ws);
    console.log(`[${roomId}] Player ${id} joined (${room.players.size} players, ${room.spectators.size} spectators)`);
    
    // Send saved state on rejoin
    if (isRejoin) {
      ws.send(JSON.stringify({ type: 'restore_state', state: room.states.get(id) }));
    }
    
    // Send current player count
    ws.send(JSON.stringify({ 
      type: 'player_count', 
      count: room.players.size,
      spectators: room.spectators.size
    }));
    
    // Notify other players
    broadcastToPlayers(roomId, { 
      type: 'player_joined', 
      playerId: id, 
      count: room.players.size, 
      isRejoin 
    }, id);
  }
  
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'ping') { ws.send(JSON.stringify({ type: 'pong', t: data.t })); return; }
    if (data.type === 'pong') return;
    
    // Spectators can only receive, not affect game state
    if (ws.isSpectator) {
      // Spectators don't send game data, but we still relay any messages they might send
      return;
    }
    
    // Save player position state
    if (data.type === 'pos') {
      room.states.set(id, { x: data.x, z: data.z, yaw: data.yaw, color: data.color, playerIndex: data.playerIndex });
    }
    
    if (data.type === 'start_game') {
      // Server assigns player indices and sends start to each PLAYER (not spectators)
      const seed = Date.now();
      const gridSize = data.gridSize || 15;
      let idx = 0;
      room.players.forEach((client, pid) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'start', seed, playerIndex: idx++, gridSize }));
        }
      });
      // Also notify spectators that game started (so they can start watching)
      room.spectators.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'start', seed, gridSize }));
        }
      });
      return;
    }
    
    // Relay to specific target or broadcast
    if (data._to) {
      // Check both players and spectators for target
      const target = room.players.get(data._to) || room.spectators.get(data._to);
      if (target?.readyState === 1) target.send(JSON.stringify(data));
    } else {
      // Broadcast to all (players + spectators)
      broadcastToAll(roomId, data, data._exclude || id);
    }
  });
  
  ws.on('close', () => {
    const duration = ((Date.now() - ws.connectedAt) / 1000).toFixed(1);
    
    if (ws.isSpectator) {
      room.spectators.delete(id);
      console.log(`[${roomId}] Spectator ${id} left | Duration: ${duration}s (${room.spectators.size} spectators remaining)`);
      // Don't notify about spectator leaving - they don't affect gameplay
    } else {
      room.players.delete(id);
      console.log(`[${roomId}] Player ${id} left | Duration: ${duration}s (${room.players.size} players remaining)`);
      broadcastToAll(roomId, { type: 'player_left', playerId: id, count: room.players.size });
    }
    
    // Clean up empty rooms
    if (room.players.size === 0 && room.spectators.size === 0) {
      rooms.delete(roomId);
    }
  });
});

function broadcastToPlayers(roomId, data, exclude = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  room.players.forEach((client, pid) => {
    if (client.readyState === 1 && pid !== exclude) client.send(msg);
  });
}

function broadcastToAll(roomId, data, exclude = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  // Send to players
  room.players.forEach((client, pid) => {
    if (client.readyState === 1 && pid !== exclude) client.send(msg);
  });
  // Send to spectators
  room.spectators.forEach((client, sid) => {
    if (client.readyState === 1 && sid !== exclude) client.send(msg);
  });
}

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} (WebSocket + static files)`));
