// PeerJS (WebRTC P2P) adapter
import { uuid, toWords } from './id-utils.js';

let peer = null, conns = new Map(), isHost = false;
let onConnected = null, onData = null, onRoundStart = null, onPlayerLeft = null;
let ping = 0, myId = null;

function setupConnection(conn) {
  conn.on('open', () => {
    conns.set(conn.peer, conn);
    if (onConnected) onConnected(conn.peer, conns.size);
    conn._pingInterval = setInterval(() => { if (conn.open) conn.send({ type: 'ping', t: Date.now() }); }, 2000);
  });
  conn.on('data', data => {
    if (data.type === 'ping') { conn.send({ type: 'pong', t: data.t }); }
    else if (data.type === 'pong') { ping = Date.now() - data.t; }
    else if (data.type === 'start') { if (onRoundStart) onRoundStart(data); }
    else {
      data._from = conn.peer;
      if (onData) onData(data);
      if (isHost && data.type === 'pos') broadcast(data, conn.peer);
    }
  });
  conn.on('close', () => { clearInterval(conn._pingInterval); conns.delete(conn.peer); if (onPlayerLeft) onPlayerLeft(conn.peer); });
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
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
}

export function join(hostId, callbacks) {
  isHost = false;
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
  setupConnection(peer.connect(hostId));
}

export function send(data) { conns.forEach(c => { if (c.open) c.send(data); }); }
export function sendTo(peerId, data) { const c = conns.get(peerId); if (c?.open) c.send(data); }
export function sendToEach(dataFn) { let i = 0; conns.forEach((c, id) => { if (c.open) c.send(dataFn(id, i++)); }); }
export function broadcast(data, exclude = null) { conns.forEach((c, id) => { if (c.open && id !== exclude) c.send(data); }); }
export function getPing() { return ping; }
export function getIsHost() { return isHost; }
export function isConnected() { return conns.size > 0; }
export function getPlayerCount() { return conns.size + 1; }
export function getMyId() { return myId; }
