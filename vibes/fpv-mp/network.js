// PeerJS networking for multiplayer
let peer = null, conns = new Map(), isHost = false;
let onConnected = null, onData = null, onRoundStart = null, onPlayerLeft = null;
let ping = 0;
let myId = null;

// Word list for human-readable IDs (4 words = ~28 bits of entropy)
const words = ['red','blue','green','gold','fire','ice','sun','moon','star','rock','tree','wave','wind','storm','cloud','rain','snow','leaf','bird','fish','wolf','bear','lion','hawk','frog','deer','fox','owl','cat','dog','ant','bee'];

function toWords(uuid) {
  const hex = uuid.replace(/-/g, '').slice(0, 8);
  const num = parseInt(hex, 16);
  return [
    words[(num >> 20) & 31],
    words[(num >> 15) & 31],
    words[(num >> 10) & 31],
    words[(num >> 5) & 31]
  ].join('-');
}

export function initPeer() {
  return new Promise(resolve => {
    const wordId = toWords(crypto.randomUUID());
    peer = new Peer(wordId);
    
    peer.on('open', id => {
      myId = id;
      console.log('[NET] Ready with ID:', id);
      resolve(id);
    });
    
    peer.on('error', err => {
      console.log('[NET] Error:', err.type);
      if (err.type === 'unavailable-id') {
        const newId = toWords(crypto.randomUUID());
        peer = new Peer(newId);
        peer.on('open', id => { myId = id; resolve(id); });
      }
    });
    
    peer.on('connection', c => {
      console.log('[NET] Incoming connection from:', c.peer);
      setupConnection(c);
    });
  });
}

function setupConnection(conn) {
  conn.on('open', () => {
    conns.set(conn.peer, conn);
    console.log('[NET] Connected to:', conn.peer, '| Total players:', conns.size + 1);
    logConnectionInfo(conn);
    if (onConnected) onConnected(conn.peer, conns.size);
    
    // Start ping for this connection
    conn._pingInterval = setInterval(() => {
      if (conn.open) conn.send({ type: 'ping', t: Date.now() });
    }, 2000);
  });
  
  conn.on('data', data => {
    if (data.type === 'ping') {
      conn.send({ type: 'pong', t: data.t });
    } else if (data.type === 'pong') {
      ping = Date.now() - data.t;
    } else if (data.type === 'start') {
      if (onRoundStart) onRoundStart(data);
    } else {
      // Add sender ID to data
      data._from = conn.peer;
      if (onData) onData(data);
      // Host relays to other clients
      if (isHost && data.type === 'pos') {
        broadcast(data, conn.peer);
      }
    }
  });
  
  conn.on('close', () => {
    console.log('[NET] Disconnected:', conn.peer);
    clearInterval(conn._pingInterval);
    conns.delete(conn.peer);
    if (onPlayerLeft) onPlayerLeft(conn.peer);
  });
  
  conn.on('error', err => console.log('[NET] Error:', err));
}

function logConnectionInfo(conn) {
  const pc = conn.peerConnection;
  if (!pc) return;
  pc.getStats().then(stats => {
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        const local = stats.get(report.localCandidateId);
        const remote = stats.get(report.remoteCandidateId);
        if (local && remote) {
          console.log(`[NET] ${conn.peer} - Local: ${local.address}:${local.port} Remote: ${remote.address}:${remote.port}`);
        }
      }
    });
  });
}

export function hostGame(callbacks) {
  isHost = true;
  onConnected = callbacks.onConnected;
  onData = callbacks.onData;
  onRoundStart = callbacks.onRoundStart;
  onPlayerLeft = callbacks.onPlayerLeft;
}

export function joinGame(hostId, callbacks) {
  isHost = false;
  onConnected = callbacks.onConnected;
  onData = callbacks.onData;
  onRoundStart = callbacks.onRoundStart;
  onPlayerLeft = callbacks.onPlayerLeft;
  const conn = peer.connect(hostId);
  setupConnection(conn);
}

export function send(data) {
  conns.forEach(conn => {
    if (conn.open) conn.send(data);
  });
}

export function sendTo(peerId, data) {
  const conn = conns.get(peerId);
  if (conn?.open) conn.send(data);
}

export function sendToEach(dataFn) {
  let idx = 0;
  conns.forEach((conn, peerId) => {
    if (conn.open) conn.send(dataFn(peerId, idx++));
  });
}

export function broadcast(data, excludePeer = null) {
  conns.forEach((conn, peerId) => {
    if (conn.open && peerId !== excludePeer) conn.send(data);
  });
}

export function getPing() { return ping; }
export function getIsHost() { return isHost; }
export function isConnected() { return conns.size > 0; }
export function getPlayerCount() { return conns.size + 1; }
export function getMyId() { return myId; }
