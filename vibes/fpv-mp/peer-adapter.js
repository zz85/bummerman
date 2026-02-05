// PeerJS (WebRTC P2P) adapter
import { uuid, toWords } from './id-utils.js';

let peer = null, conns = new Map(), spectatorConns = new Map(), isHost = false, amSpectator = false;
let onConnected = null, onData = null, onRoundStart = null, onPlayerLeft = null, onSpectatorJoined = null;
let ping = 0, myId = null;

function setupConnection(conn, asSpectator = false) {
  conn.on('open', () => {
    if (asSpectator) {
      spectatorConns.set(conn.peer, conn);
      if (onSpectatorJoined) onSpectatorJoined(conn.peer, spectatorConns.size);
    } else {
      conns.set(conn.peer, conn);
      if (onConnected) onConnected(conn.peer, conns.size);
    }
    conn._pingInterval = setInterval(() => { if (conn.open) conn.send({ type: 'ping', t: Date.now() }); }, 2000);
  });
  conn.on('data', data => {
    if (data.type === 'ping') { conn.send({ type: 'pong', t: data.t }); }
    else if (data.type === 'pong') { ping = Date.now() - data.t; }
    else if (data.type === 'start') { if (onRoundStart) onRoundStart(data); }
    else if (data.type === 'spectator_request') {
      // Move this connection to spectator list
      conns.delete(conn.peer);
      spectatorConns.set(conn.peer, conn);
      conn.send({ type: 'spectator_accepted' });
      if (onSpectatorJoined) onSpectatorJoined(conn.peer, spectatorConns.size);
    }
    else {
      data._from = conn.peer;
      if (onData) onData(data);
      // Broadcast player positions to everyone (players + spectators)
      if (isHost && data.type === 'pos') {
        broadcast(data, conn.peer);
      }
    }
  });
  conn.on('close', () => { 
    clearInterval(conn._pingInterval); 
    if (spectatorConns.has(conn.peer)) {
      spectatorConns.delete(conn.peer);
    } else {
      conns.delete(conn.peer); 
      if (onPlayerLeft) onPlayerLeft(conn.peer); 
    }
  });
}

export function init() {
  return new Promise(resolve => {
    const wordId = toWords(uuid());
    peer = new Peer(wordId);
    peer.on('open', id => { myId = id; resolve(id); });
    peer.on('error', err => {
      if (err.type === 'unavailable-id') {
        peer = new Peer(toWords(uuid()));
        peer.on('open', id => { myId = id; resolve(id); });
      }
    });
    peer.on('connection', c => setupConnection(c));
  });
}

export function host(callbacks) {
  isHost = true;
  amSpectator = false;
  ({ onConnected, onData, onRoundStart, onPlayerLeft, onSpectatorJoined } = callbacks);
}

export function join(hostId, callbacks) {
  isHost = false;
  amSpectator = false;
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
  setupConnection(peer.connect(hostId));
}

export function joinAsSpectator(hostId, callbacks) {
  isHost = false;
  amSpectator = true;
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
  const conn = peer.connect(hostId);
  conn.on('open', () => {
    conn.send({ type: 'spectator_request' });
  });
  conn.on('data', data => {
    if (data.type === 'ping') { conn.send({ type: 'pong', t: data.t }); }
    else if (data.type === 'pong') { ping = Date.now() - data.t; }
    else if (data.type === 'spectator_accepted') {
      conns.set(conn.peer, conn);
      if (onConnected) onConnected(conn.peer, 0);
    }
    else if (data.type === 'start') { if (onRoundStart) onRoundStart(data); }
    else {
      data._from = conn.peer;
      if (onData) onData(data);
    }
  });
  conn._pingInterval = setInterval(() => { if (conn.open) conn.send({ type: 'ping', t: Date.now() }); }, 2000);
}

// Session management (PeerJS doesn't persist sessions like WS does)
export function getSession() { return null; }
export function clearSession() { }
export async function rejoin(session, callbacks) { 
  // PeerJS can't easily rejoin - just return
  return;
}

export function send(data) { 
  conns.forEach(c => { if (c.open) c.send(data); }); 
  // Also send to spectators if host
  if (isHost) {
    spectatorConns.forEach(c => { if (c.open) c.send(data); });
  }
}
export function sendTo(peerId, data) { 
  const c = conns.get(peerId) || spectatorConns.get(peerId); 
  if (c?.open) c.send(data); 
}
export function sendToEach(dataFn) { 
  let i = 0; 
  // Send to players with their index
  conns.forEach((c, id) => { if (c.open) c.send(dataFn(id, i++)); }); 
  // Also notify spectators (they get the start event but no playerIndex)
  const spectatorData = dataFn('spectator', -1);
  delete spectatorData.playerIndex; // Spectators don't have a player index
  spectatorConns.forEach((c) => { if (c.open) c.send(spectatorData); });
}
export function broadcast(data, exclude = null) { 
  conns.forEach((c, id) => { if (c.open && id !== exclude) c.send(data); }); 
  spectatorConns.forEach((c, id) => { if (c.open && id !== exclude) c.send(data); });
}
export function getPing() { return ping; }
export function getIsHost() { return isHost; }
export function isConnected() { return conns.size > 0; }
export function getPlayerCount() { return amSpectator ? 0 : conns.size + 1; }
export function getSpectatorCount() { return spectatorConns.size + (amSpectator ? 1 : 0); }
export function isSpectator() { return amSpectator; }
export function getMyId() { return myId; }
