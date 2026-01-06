// PeerJS networking for multiplayer
let peer = null, conn = null, isHost = false;
let onConnected = null, onData = null;

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

function fromWords(wordId) {
  // If it looks like a UUID, return as-is
  if (wordId.includes('--') || wordId.length > 20) return wordId;
  return wordId; // PeerJS will use this as the ID directly
}

export function initPeer() {
  return new Promise(resolve => {
    // Generate a word-based ID
    const wordId = toWords(crypto.randomUUID());
    peer = new Peer(wordId);
    
    peer.on('open', id => {
      console.log('[NET] Ready with ID:', id);
      resolve(id);
    });
    
    peer.on('error', err => {
      console.log('[NET] Error:', err.type);
      if (err.type === 'unavailable-id') {
        // Try with a new ID
        const newId = toWords(crypto.randomUUID());
        peer = new Peer(newId);
        peer.on('open', resolve);
      }
    });
    
    peer.on('connection', c => {
      console.log('[NET] Incoming connection from:', c.peer);
      conn = c;
      setupConnection();
    });
  });
}

function setupConnection() {
  conn.on('open', () => {
    console.log('[NET] Connected!');
    logConnectionInfo();
    if (onConnected) onConnected();
  });
  conn.on('data', data => { if (onData) onData(data); });
  conn.on('close', () => console.log('[NET] Disconnected'));
  conn.on('error', err => console.log('[NET] Error:', err));
}

function logConnectionInfo() {
  const pc = conn.peerConnection;
  if (!pc) return;
  pc.getStats().then(stats => {
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        const local = stats.get(report.localCandidateId);
        const remote = stats.get(report.remoteCandidateId);
        if (local && remote) {
          console.log(`[NET] Local: ${local.address}:${local.port} (${local.candidateType})`);
          console.log(`[NET] Remote: ${remote.address}:${remote.port} (${remote.candidateType})`);
        }
      }
    });
  });
}

export function hostGame(callbacks) {
  isHost = true;
  onConnected = callbacks.onConnected;
  onData = callbacks.onData;
}

export function joinGame(hostId, callbacks) {
  isHost = false;
  onConnected = callbacks.onConnected;
  onData = callbacks.onData;
  conn = peer.connect(fromWords(hostId));
  setupConnection();
}

export function send(data) {
  if (conn?.open) conn.send(data);
}

export function getIsHost() { return isHost; }
export function isConnected() { return conn?.open; }
