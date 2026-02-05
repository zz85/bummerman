// WebSocket (centralized server) adapter
import { uuid, toWords } from './id-utils.js';

let ws = null, myId = null, roomId = null, playerCount = 1, spectatorCount = 0, isRoomCreator = false, amSpectator = false;
let onConnected = null, onData = null, onRoundStart = null, onPlayerLeft = null, onSpectatorJoined = null;
let ping = 0, pingInterval = null;

const WS_URL = new URLSearchParams(location.search).get('server') || window.WS_SERVER_URL || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`;
const SESSION_KEY = 'bummerman_session';

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ room: roomId, id: myId, creator: isRoomCreator, spectator: amSpectator }));
}

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

function connect(room, asCreator, asSpectator = false) {
  return new Promise((resolve, reject) => {
    isRoomCreator = asCreator;
    amSpectator = asSpectator;
    roomId = room;
    ws = new WebSocket(`${WS_URL}?room=${room}&id=${myId}&creator=${asCreator}&spectator=${asSpectator}`);
    
    ws.onopen = () => {
      saveSession();
      pingInterval = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping', t: Date.now() })); }, 2000);
      resolve();
    };
    ws.onerror = reject;
    
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'ping') { ws.send(JSON.stringify({ type: 'pong', t: data.t })); }
      else if (data.type === 'pong') { ping = Date.now() - data.t; }
      else if (data.type === 'player_count') { playerCount = data.count; spectatorCount = data.spectators || 0; }
      else if (data.type === 'player_joined') { playerCount = data.count; if (onConnected) onConnected(data.playerId, playerCount - 1); }
      else if (data.type === 'spectator_joined') { spectatorCount = data.count; if (onSpectatorJoined) onSpectatorJoined(data.spectatorId, spectatorCount); }
      else if (data.type === 'player_left') { playerCount = data.count; if (onPlayerLeft) onPlayerLeft(data.playerId); }
      else if (data.type === 'start') { if (onRoundStart) onRoundStart(data); }
      else { if (onData) onData(data); }
    };
    
    ws.onclose = () => { clearInterval(pingInterval); };
  });
}

// init() creates room ID for host, returns it to display
export async function init() {
  myId = toWords(uuid());
  roomId = toWords(uuid());
  return roomId; // This is what gets displayed for others to join
}

export async function host(callbacks) {
  ({ onConnected, onData, onRoundStart, onPlayerLeft, onSpectatorJoined } = callbacks);
  await connect(roomId, true, false);
}

export async function join(hostRoomId, callbacks) {
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
  myId = toWords(uuid());
  await connect(hostRoomId, false, false);
}

export async function joinAsSpectator(hostRoomId, callbacks) {
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
  myId = toWords(uuid());
  await connect(hostRoomId, false, true);
}

export async function rejoin(session, callbacks) {
  ({ onConnected, onData, onRoundStart, onPlayerLeft } = callbacks);
  myId = session.id;
  await connect(session.room, session.creator, session.spectator || false);
}

// Server handles broadcast - just send to server
export function send(data) { if (ws?.readyState === 1) ws.send(JSON.stringify({ ...data, _from: myId })); }
export function sendTo(peerId, data) { if (ws?.readyState === 1) ws.send(JSON.stringify({ ...data, _to: peerId, _from: myId })); }
export function sendToEach(dataFn, extraData = {}) {
  // Server will handle distribution - send with flag for server to assign indices
  // Extract gridSize from the dataFn by calling it with dummy values
  const sampleData = dataFn('dummy', 0);
  if (ws?.readyState === 1) ws.send(JSON.stringify({ type: 'start_game', _from: myId, gridSize: sampleData.gridSize }));
}
export function broadcast(data, exclude = null) { send({ ...data, _exclude: exclude }); }
export function getPing() { return ping; }
export function getIsHost() { return isRoomCreator; }
export function isConnected() { return ws?.readyState === 1 && (playerCount > 1 || amSpectator); }
export function getPlayerCount() { return amSpectator ? playerCount : playerCount; }
export function getSpectatorCount() { return spectatorCount; }
export function isSpectator() { return amSpectator; }
export function getMyId() { return myId; }
