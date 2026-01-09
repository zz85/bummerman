// WebSocket (centralized server) adapter
let ws = null, myId = null, roomId = null, playerCount = 1, isRoomCreator = false;
let onConnected = null, onData = null, onRoundStart = null, onPlayerLeft = null;
let ping = 0, pingInterval = null;

const WS_URL = window.WS_SERVER_URL || 'ws://localhost:8080';
const words = ['red','blue','green','gold','fire','ice','sun','moon','star','rock','tree','wave','wind','storm','cloud','rain','snow','leaf','bird','fish','wolf','bear','lion','hawk','frog','deer','fox','owl','cat','dog','ant','bee'];

function toWords(uuid) {
  const hex = uuid.replace(/-/g, '').slice(0, 8);
  const num = parseInt(hex, 16);
  return [words[(num >> 20) & 31], words[(num >> 15) & 31], words[(num >> 10) & 31], words[(num >> 5) & 31]].join('-');
}

function connect(room, asCreator) {
  return new Promise((resolve, reject) => {
    isRoomCreator = asCreator;
    roomId = room;
    ws = new WebSocket(`${WS_URL}?room=${room}&id=${myId}&creator=${asCreator}`);
    
    ws.onopen = () => {
      pingInterval = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping', t: Date.now() })); }, 2000);
      resolve();
    };
    ws.onerror = reject;
    
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'ping') { ws.send(JSON.stringify({ type: 'pong', t: data.t })); }
      else if (data.type === 'pong') { ping = Date.now() - data.t; }
      else if (data.type === 'player_joined') { playerCount = data.count; if (onConnected) onConnected(data.playerId, playerCount - 1); }
      else if (data.type === 'player_left') { playerCount = data.count; if (onPlayerLeft) onPlayerLeft(data.playerId); }
      else if (data.type === 'start') { if (onRoundStart) onRoundStart(data); }
      else { if (onData) onData(data); }
    };
    
    ws.onclose = () => { clearInterval(pingInterval); };
  });
}

// init() creates room ID for host, returns it to display
export async function init() {
  myId = toWords(crypto.randomUUID());
  roomId = toWords(crypto.randomUUID());
  return roomId; // This is what gets displayed for others to join
}

export async function host(callbacks) {
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
  await connect(roomId, true);
}

export async function join(hostRoomId, callbacks) {
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
  myId = toWords(crypto.randomUUID());
  await connect(hostRoomId, false);
}

// Server handles broadcast - just send to server
export function send(data) { if (ws?.readyState === 1) ws.send(JSON.stringify({ ...data, _from: myId })); }
export function sendTo(peerId, data) { if (ws?.readyState === 1) ws.send(JSON.stringify({ ...data, _to: peerId, _from: myId })); }
export function sendToEach(dataFn) {
  // Server will handle distribution - send with flag for server to assign indices
  if (ws?.readyState === 1) ws.send(JSON.stringify({ type: 'start_game', _from: myId }));
}
export function broadcast(data, exclude = null) { send({ ...data, _exclude: exclude }); }
export function getPing() { return ping; }
export function getIsHost() { return isRoomCreator; }
export function isConnected() { return ws?.readyState === 1 && playerCount > 1; }
export function getPlayerCount() { return playerCount; }
export function getMyId() { return myId; }
