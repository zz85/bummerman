import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import * as Net from './network.js';
import * as PeerAdapter from './peer-adapter.js';
import * as WsAdapter from './ws-adapter.js';

// Select adapter: ?ws in URL uses WebSocket, otherwise PeerJS
const useWs = new URLSearchParams(location.search).has('ws');
Net.setAdapter(useWs ? WsAdapter : PeerAdapter);
console.log('[NET] Using', useWs ? 'WebSocket' : 'PeerJS', 'adapter');

// Check for existing session to rejoin
(async function checkRejoin() {
  const session = Net.getSession();
  if (!session) return;
  
  if (!confirm(`Rejoin room "${session.room}"?`)) {
    Net.clearSession();
    return;
  }
  
  try {
    await Net.rejoinGame(session, {
      onConnected: () => {},
      onData: handleNetworkData,
      onRoundStart: data => {
        levelSeed = data.seed;
        myPlayerIndex = data.playerIndex || 0;
        if (!gameInitialized) startMultiplayerGame(session.creator);
        else resetRound();
      },
      onPlayerLeft: peerId => {
        if (remotePlayerMeshes[peerId]) {
          scene.remove(remotePlayerMeshes[peerId]);
          delete remotePlayerMeshes[peerId];
          delete remotePlayers[peerId];
        }
      }
    });
    document.getElementById('lobby').style.display = 'none';
    startMultiplayerGame(session.creator);
  } catch (e) {
    Net.clearSession();
  }
})();

let GRID = 15;
const CELL = 2;
let scene, camera, renderer, composer, player;
let walls = [], breakables = [], bombs = [], explosions = [], enemies = [], powerups = [], lights = [];
let keys = {}, bombCount = 3, blastRange = 3, speed = 5, locked = false;
let minimap, minimapCtx, shakeIntensity = 0, slowMo = 1;
let roundTime = 180, isDying = false;
let aiBombers = [];
let blastIndicators = [];
let playerTile = null;
let cameraMode = 0; // 0=FPV, 1=third-person, 2=over-shoulder, 3=top-down, 4=cinematic
let playerMesh = null;
let camPos = { x: 0, y: 0, z: 0 }; // For smooth camera
let raycaster = new THREE.Raycaster();

// Multiplayer state
let isMultiplayer = false, remotePlayers = {}, remotePlayerMeshes = {};
let levelSeed = 0;
let kills = 0, wins = 0, score = 0;
let isConnecting = false;

// Lobby functions (exposed to window)
let gameInitialized = false;
let myPlayerIndex = 0;
let myPlayerName = '';
const PLAYER_COLORS = [0x2a3a6e, 0xc62828, 0x2e7d32, 0xf9a825]; // navy blue, red, green, yellow (classic Bomberman)

// Funny name generator
const NAME_ADJECTIVES = [
  'Sneaky', 'Explosive', 'Bouncy', 'Chaotic', 'Dizzy', 'Funky', 'Grumpy', 'Happy',
  'Jumpy', 'Loopy', 'Mighty', 'Nutty', 'Peppy', 'Quirky', 'Rowdy', 'Silly',
  'Turbo', 'Wacky', 'Zany', 'Cosmic', 'Disco', 'Fluffy', 'Goofy', 'Hyper',
  'Jazzy', 'Krazy', 'Lucky', 'Mega', 'Ninja', 'Pixel', 'Radical', 'Super',
  'Toxic', 'Ultra', 'Vicious', 'Wild', 'Xtreme', 'Yolo', 'Zippy', 'Atomic'
];
const NAME_NOUNS = [
  'Bomber', 'Blaster', 'Boomer', 'Burner', 'Crusher', 'Destroyer', 'Dynamo', 'Exploder',
  'Fireball', 'Fuse', 'Gremlin', 'Havoc', 'Inferno', 'Joker', 'Kaboom', 'Lemon',
  'Muffin', 'Noodle', 'Onion', 'Pickle', 'Potato', 'Panda', 'Rocket', 'Smasher',
  'Taco', 'Tornado', 'Unicorn', 'Volcano', 'Waffle', 'Wizard', 'Yeti', 'Zombie',
  'Banana', 'Burrito', 'Cactus', 'Donut', 'Hamster', 'Nugget', 'Penguin', 'Toast'
];

function generateFunnyName() {
  const adj = NAME_ADJECTIVES[Math.floor(Math.random() * NAME_ADJECTIVES.length)];
  const noun = NAME_NOUNS[Math.floor(Math.random() * NAME_NOUNS.length)];
  return `${adj}${noun}`;
}

// Map size presets: [width, height, label]
const MAP_SIZES = [
  [9, 9, 'Tiny (9x9)'],
  [11, 11, 'Small (11x11)'],
  [13, 13, 'Medium (13x13)'],
  [15, 15, 'Large (15x15)'],
  [17, 15, 'Wide (17x15)'],
  [19, 17, 'Huge (19x17)']
];
let selectedMapSize = 3; // Default to Large (15x15)

function getSpawnPoints() {
  return [
    { x: 1, z: 1, yaw: 0 },                     // top-left
    { x: GRID - 2, z: GRID - 2, yaw: Math.PI }, // bottom-right
    { x: GRID - 2, z: 1, yaw: Math.PI / 2 },    // top-right
    { x: 1, z: GRID - 2, yaw: -Math.PI / 2 }    // bottom-left
  ];
}

// Initialize name on page load
window.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('player-name-input');
  if (nameInput) {
    nameInput.value = generateFunnyName();
  }
});

window.randomizeName = function() {
  const nameInput = document.getElementById('player-name-input');
  if (nameInput) {
    nameInput.value = generateFunnyName();
  }
};

function getPlayerName() {
  const nameInput = document.getElementById('player-name-input');
  return nameInput?.value?.trim() || generateFunnyName();
}

window.hostGame = async function() {
  if (isConnecting) return;
  isConnecting = true;
  myPlayerName = getPlayerName();
  
  document.getElementById('host-section').classList.add('active');
  document.getElementById('join-section').classList.remove('active');
  const id = await Net.initPeer();
  document.getElementById('my-peer-id').textContent = id;
  myPlayerIndex = 0; // Host is always player 0
  
  Net.hostGame({
    onConnected: (peerId, playerCount) => {
      document.getElementById('host-status').textContent = `${playerCount} player(s) connected`;
      document.getElementById('host-status').className = 'status connected';
    },
    onData: handleNetworkData,
    onRoundStart: data => { levelSeed = data.seed; if (data.gridSize) GRID = data.gridSize; resetRound(); },
    onPlayerLeft: peerId => {
      if (remotePlayerMeshes[peerId]) {
        scene.remove(remotePlayerMeshes[peerId]);
        delete remotePlayerMeshes[peerId];
        delete remotePlayers[peerId];
      }
    }
  });
};

window.setMapSize = function(index) {
  selectedMapSize = index;
  GRID = MAP_SIZES[index][0]; // Use width as GRID (square maps use same value)
};

window.startGame = function() {
  if (Net.getPlayerCount() < 2) {
    alert('Need at least 2 players to start');
    return;
  }
  // Apply selected map size before starting
  GRID = MAP_SIZES[selectedMapSize][0];
  startMultiplayerGame(true);
};

window.joinGame = async function() {
  document.getElementById('join-section').classList.add('active');
  document.getElementById('host-section').classList.remove('active');
  await Net.initPeer();
  
  // Fetch rooms and auto-fill if only one exists
  try {
    const res = await fetch('/rooms');
    const rooms = await res.json();
    if (rooms.length === 1) {
      document.getElementById('peer-id-input').value = rooms[0].id;
      document.getElementById('join-status').textContent = `Found room: ${rooms[0].id} (${rooms[0].players} player${rooms[0].players > 1 ? 's' : ''})`;
    } else if (rooms.length > 1) {
      document.getElementById('room-list').innerHTML = rooms.map(r => 
        `<div style="cursor:pointer;padding:5px;color:#3dd6d0" onclick="document.getElementById('peer-id-input').value='${r.id}'">${r.id} (${r.players})</div>`
      ).join('');
    }
  } catch(e) {}
};

window.connectToPeer = function() {
  const hostId = document.getElementById('peer-id-input').value.trim().toLowerCase().replace(/\s+/g, '-');
  if (!hostId || isConnecting) return;
  
  // Prevent multiple clicks
  isConnecting = true;
  myPlayerName = getPlayerName();
  const btn = document.querySelector('.connect-btn');
  btn.disabled = true;
  
  document.getElementById('join-status').textContent = 'Connecting...';
  Net.joinGame(hostId, {
    onConnected: () => {
      document.getElementById('join-status').textContent = 'Connected! Waiting for host to start...';
      document.getElementById('join-status').className = 'status connected';
    },
    onData: handleNetworkData,
    onRoundStart: data => {
      levelSeed = data.seed;
      myPlayerIndex = data.playerIndex || 1;
      if (data.gridSize) GRID = data.gridSize;
      if (!gameInitialized) {
        startMultiplayerGame(false);
      } else {
        resetRound();
      }
    },
    onPlayerLeft: peerId => {
      if (remotePlayerMeshes[peerId]) {
        scene.remove(remotePlayerMeshes[peerId]);
        delete remotePlayerMeshes[peerId];
        delete remotePlayers[peerId];
      }
    }
  });
};

function handleNetworkData(data) {
  const senderId = data._from || data.id;
  if (data.type === 'restore_state') {
    // Resume position from server-saved state
    if (data.state && player) {
      player.x = data.state.x;
      player.z = data.state.z;
      player.yaw = data.state.yaw;
      myPlayerIndex = data.state.playerIndex || 0;
    }
    return;
  }
  if (data.type === 'pos') {
    if (!remotePlayers[senderId]) createRemotePlayer(senderId, data.color, data.name);
    remotePlayers[senderId] = { x: data.x, z: data.z, yaw: data.yaw, color: data.color, name: data.name };
  } else if (data.type === 'bomb') {
    dropBombAt(data.x, data.z, data.range, true);
  } else if (data.type === 'death') {
    deadPlayers.add(senderId);
    if (remotePlayerMeshes[senderId]) {
      createDebris(remotePlayerMeshes[senderId].position.x, remotePlayerMeshes[senderId].position.z, data.color || 0xff6666);
      scene.remove(remotePlayerMeshes[senderId]);
      delete remotePlayerMeshes[senderId];
    }
    delete remotePlayers[senderId];
    checkRoundEnd();
  } else if (data.type === 'ready') {
    readyPlayers.add(senderId);
    // Host starts when all others ready AND host is ready
    if (Net.getIsHost() && localReady && readyPlayers.size >= Net.getPlayerCount() - 1) startNewRound();
  }
}

let deadPlayers = new Set(), readyPlayers = new Set(), localReady = false;

function checkRoundEnd() {
  const alivePlayers = Net.getPlayerCount() - deadPlayers.size - (isDying ? 1 : 0);
  
  if (alivePlayers <= 1) {
    if (isDying) {
      showRoundEnd('YOU LOSE');
    } else {
      kills += deadPlayers.size;
      wins++;
      document.getElementById('kills').textContent = kills;
      document.getElementById('wins').textContent = wins;
      showRoundEnd('YOU WIN');
    }
  }
}

function showRoundEnd(msg) {
  locked = false;
  document.exitPointerLock();
  document.getElementById('game-over').style.display = 'flex';
  document.querySelector('#game-over h1').textContent = msg;
  document.getElementById('final-score-go').textContent = `${wins} wins, ${kills} kills`;
  document.querySelector('#game-over .restart-btn').textContent = 'NEXT ROUND';
  document.querySelector('#game-over .restart-btn').onclick = requestNextRound;
}

function requestNextRound() {
  localReady = true;
  Net.send({ type: 'ready' });
  document.querySelector('#game-over .restart-btn').textContent = Net.getIsHost() ? 'WAITING FOR PLAYERS...' : 'WAITING FOR HOST...';
  // Host starts when all others are ready, or if host is the only one left
  if (Net.getIsHost()) {
    if (readyPlayers.size >= Net.getPlayerCount() - 1) startNewRound();
  }
}

function startNewRound() {
  levelSeed = Date.now();
  // Send start with unique player indices to each client
  Net.sendToEach((peerId, idx) => ({ type: 'start', seed: levelSeed, playerIndex: idx + 1 }));
  resetRound();
}

function resetRound() {
  // Hide end screen
  document.getElementById('game-over').style.display = 'none';
  document.getElementById('win-screen').style.display = 'none';
  
  // Reset state
  isDying = false;
  deadPlayers.clear();
  readyPlayers.clear();
  localReady = false;
  bombCount = 3;
  blastRange = 3;
  speed = 5;
  roundTime = 180;
  
  // Clear scene objects
  [...walls, ...breakables, ...bombs, ...explosions, ...powerups].forEach(o => scene.remove(o.mesh || o.group || o));
  walls = []; breakables = []; bombs = []; explosions = []; powerups = []; lights = [];
  Object.values(remotePlayerMeshes).forEach(m => scene.remove(m));
  remotePlayers = {}; remotePlayerMeshes = {};
  
  // Rebuild level
  buildLevel();
  
  // Reset player position based on player index
  const spawnPoints = getSpawnPoints();
  const spawn = spawnPoints[myPlayerIndex % spawnPoints.length];
  player.x = spawn.x * CELL;
  player.z = spawn.z * CELL;
  player.yaw = spawn.yaw;
  player.pitch = 0;
  camera.position.set(player.x, 1.6, player.z);
  
  // Update UI
  document.getElementById('bombs').textContent = bombCount;
  document.getElementById('blast').textContent = blastRange;
  // User must click to regain pointer lock
}

function createTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.roundRect(0, 16, canvas.width, 40, 8);
  ctx.fill();
  
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, 45);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  return sprite;
}

// Create Bomberman-style character mesh
function createBombermanMesh(bodyColor) {
  const group = new THREE.Group();
  
  // Materials
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.25, metalness: 0.05 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xe91e8c, roughness: 0.35, metalness: 0.1 });
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xf5dcc8, roughness: 0.6, metalness: 0.0 }); // Beige face
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.2 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.15 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.2 });
  const buckleMat = new THREE.MeshStandardMaterial({ color: 0xd4a843, roughness: 0.3, metalness: 0.6 }); // Gold buckle
  
  // Head (white egg shape - wider at bottom)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 16), whiteMat);
  head.scale.set(1, 1.1, 0.95);
  head.position.y = 0.72;
  head.castShadow = true;
  group.add(head);
  
  // Face (beige oval inset)
  const faceGeo = new THREE.SphereGeometry(0.26, 16, 12);
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.scale.set(0.75, 0.85, 0.3);
  face.position.set(0, 0.7, 0.22);
  group.add(face);
  
  // Eyes (two vertical black lines)
  const eyeGeo = new THREE.CapsuleGeometry(0.018, 0.1, 4, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.06, 0.7, 0.32);
  group.add(eyeL);
  
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.06, 0.7, 0.32);
  group.add(eyeR);
  
  // Single antenna on top (pink ball with stem)
  const antenna = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), pinkMat);
  antenna.position.set(0, 1.15, -0.05);
  group.add(antenna);
  
  const stemGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.12, 8);
  const stem = new THREE.Mesh(stemGeo, whiteMat);
  stem.position.set(0, 1.02, -0.05);
  group.add(stem);
  
  // Body (dark blue sphere)
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), bodyMat);
  body.position.y = 0.26;
  body.scale.set(1, 1.05, 0.95);
  body.castShadow = true;
  group.add(body);
  
  // Belt (black ring around body)
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.045, 10, 20), beltMat);
  belt.position.y = 0.2;
  belt.rotation.x = Math.PI / 2;
  group.add(belt);
  
  // Belt buckle (gold square)
  const buckleGeo = new THREE.BoxGeometry(0.08, 0.07, 0.03);
  const buckle = new THREE.Mesh(buckleGeo, buckleMat);
  buckle.position.set(0, 0.2, 0.26);
  group.add(buckle);
  
  // Arms (curved white tubes using TorusGeometry segments)
  const armGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.12, -0.05, 0.02),
      new THREE.Vector3(0.2, -0.12, 0.05)
    ]), 8, 0.035, 8, false
  );
  
  const armL = new THREE.Mesh(armGeo, whiteMat);
  armL.position.set(-0.25, 0.38, 0);
  group.add(armL);
  
  const armR = new THREE.Mesh(armGeo, whiteMat);
  armR.position.set(0.25, 0.38, 0);
  armR.scale.x = -1;
  group.add(armR);
  
  // Hands (pink spheres)
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), pinkMat);
  handL.position.set(-0.45, 0.26, 0.05);
  group.add(handL);
  
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), pinkMat);
  handR.position.set(0.45, 0.26, 0.05);
  group.add(handR);
  
  // Legs (curved white tubes)
  const legGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.12, 0.02),
      new THREE.Vector3(0.02, -0.22, 0.05)
    ]), 8, 0.04, 8, false
  );
  
  const legL = new THREE.Mesh(legGeo, whiteMat);
  legL.position.set(-0.13, 0.05, 0);
  group.add(legL);
  
  const legR = new THREE.Mesh(legGeo, whiteMat);
  legR.position.set(0.13, 0.05, 0);
  group.add(legR);
  
  // Feet (large pink ovals)
  const footL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), pinkMat);
  footL.position.set(-0.13, -0.2, 0.08);
  footL.scale.set(0.85, 0.5, 1.4);
  group.add(footL);
  
  const footR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), pinkMat);
  footR.position.set(0.13, -0.2, 0.08);
  footR.scale.set(0.85, 0.5, 1.4);
  group.add(footR);
  
  return group;
}

function createRemotePlayer(id, color, name) {
  const group = createBombermanMesh(color || 0x00a5a5);
  
  // Name label
  const colorHex = '#' + (color || 0xff6666).toString(16).padStart(6, '0');
  const nameSprite = createTextSprite(name || 'Player', colorHex);
  nameSprite.position.y = 1.4;
  group.add(nameSprite);
  group.nameSprite = nameSprite;
  
  group.position.y = 0.25;
  scene.add(group);
  remotePlayerMeshes[id] = group;
}

function startMultiplayerGame(asHost) {
  isMultiplayer = true;
  gameInitialized = true;
  if (asHost) {
    levelSeed = Date.now();
    Net.sendToEach((peerId, idx) => ({ type: 'start', seed: levelSeed, playerIndex: idx + 1, gridSize: GRID }));
  }
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('ui').style.display = 'flex';
  init();
  audioCtx.resume();
  // Don't auto-request pointer lock - user must click canvas
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);
  scene.fog = new THREE.FogExp2(0x0a0a12, 0.025);

  camera = new THREE.PerspectiveCamera(80, innerWidth / innerHeight, 0.1, 100);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8;
  document.body.prepend(renderer.domElement);

  // Post-processing
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.4, 0.85);
  composer.addPass(bloom);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  
  const mainLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  mainLight.position.set(20, 30, 20);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(2048, 2048);
  mainLight.shadow.camera.near = 1;
  mainLight.shadow.camera.far = 100;
  mainLight.shadow.camera.left = -30;
  mainLight.shadow.camera.right = 30;
  mainLight.shadow.camera.top = 30;
  mainLight.shadow.camera.bottom = -30;
  scene.add(mainLight);

  // Additional fill lights
  const fillLight1 = new THREE.DirectionalLight(0x8888ff, 0.4);
  fillLight1.position.set(-20, 15, -20);
  scene.add(fillLight1);

  const fillLight2 = new THREE.DirectionalLight(0xffaa88, 0.3);
  fillLight2.position.set(20, 10, -20);
  scene.add(fillLight2);

  // Corner point lights for atmosphere
  const cornerPositions = [[2, 2], [2, GRID-3], [GRID-3, 2], [GRID-3, GRID-3]];
  for (const [cx, cz] of cornerPositions) {
    const pl = new THREE.PointLight(0x4488ff, 0.6, 10);
    pl.position.set(cx * CELL, 2, cz * CELL);
    scene.add(pl);
  }

  // Floor
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a24, 
    roughness: 0.8, 
    metalness: 0.2 
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(GRID * CELL + 4, GRID * CELL + 4), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(GRID * CELL / 2 - CELL / 2, 0, GRID * CELL / 2 - CELL / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid lines on floor
  const gridHelper = new THREE.GridHelper(GRID * CELL, GRID, 0x333344, 0x222233);
  gridHelper.position.set(GRID * CELL / 2 - CELL / 2, 0.01, GRID * CELL / 2 - CELL / 2);
  scene.add(gridHelper);

  buildLevel();

  // Spawn based on player index
  const spawnPoints = getSpawnPoints();
  const spawn = spawnPoints[myPlayerIndex % spawnPoints.length];
  player = { x: spawn.x * CELL, z: spawn.z * CELL, yaw: spawn.yaw, pitch: 0 };
  camera.position.set(player.x, 1.6, player.z);
  
  // Player mesh for third-person view (Bomberman style)
  const playerColor = PLAYER_COLORS[myPlayerIndex % PLAYER_COLORS.length];
  playerMesh = createBombermanMesh(playerColor);
  playerMesh.position.set(player.x, 0.25, player.z);
  playerMesh.visible = false;
  scene.add(playerMesh);
  
  // Player position tile indicator - subtle corners
  playerTile = new THREE.Group();
  const cornerGeo = new THREE.PlaneGeometry(0.15, 0.15);
  const cornerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 });
  const offsets = [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]];
  for (const [ox, oz] of offsets) {
    const corner = new THREE.Mesh(cornerGeo, cornerMat);
    corner.rotation.x = -Math.PI / 2;
    corner.position.set(ox, 0, oz);
    playerTile.add(corner);
  }
  playerTile.position.y = 0.02;
  scene.add(playerTile);

  minimap = document.getElementById('minimap');
  minimapCtx = minimap.getContext('2d');

  document.addEventListener('keydown', e => { 
    keys[e.code] = true; 
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyV' && locked) {
      cameraMode = (cameraMode + 1) % 5;
      playerMesh.visible = cameraMode !== 0;
      // Initialize spring camera position
      if (cameraMode >= 1 && cameraMode <= 3) {
        camPos.x = camera.position.x;
        camPos.y = camera.position.y;
        camPos.z = camera.position.z;
      }
      updateCameraModeUI();
    }
  });
  document.addEventListener('keyup', e => keys[e.code] = false);
  document.addEventListener('mousemove', e => {
    if (!locked) return;
    // Clamp movement to avoid Firefox pointer lock spikes
    const mx = Math.max(-100, Math.min(100, e.movementX));
    const my = Math.max(-100, Math.min(100, e.movementY));
    player.yaw -= mx * 0.002;
    player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - my * 0.002));
  });

  document.addEventListener('pointerlockchange', () => {
    locked = !!document.pointerLockElement;
  });

  // Click anywhere to get pointer lock (but not during end screens)
  renderer.domElement.onclick = () => {
    const goDisplay = getComputedStyle(document.getElementById('game-over')).display;
    const winDisplay = getComputedStyle(document.getElementById('win-screen')).display;
    if (goDisplay === 'none' && winDisplay === 'none') {
      document.body.requestPointerLock();
    }
  };

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  animate();
}

function buildLevel() {
  // Seeded random for consistent multiplayer levels
  const seededRandom = (function(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  })(levelSeed || Date.now());
  
  const wallGeo = new THREE.BoxGeometry(CELL, CELL * 1.2, CELL);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.7, metalness: 0.3 });
  const breakGeo = new THREE.BoxGeometry(CELL * 0.95, CELL * 0.95, CELL * 0.95);
  const breakMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.9 });

  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const px = x * CELL, pz = z * CELL;
      
      if (x === 0 || x === GRID - 1 || z === 0 || z === GRID - 1 || (x % 2 === 0 && z % 2 === 0)) {
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(px, CELL * 0.6, pz);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
        walls.push(wall);
      } else if (seededRandom() > 0.35 && 
        !(x < 3 && z < 3) &&                     // top-left spawn
        !(x > GRID - 4 && z > GRID - 4) &&       // bottom-right spawn
        !(x > GRID - 4 && z < 3) &&              // top-right spawn
        !(x < 3 && z > GRID - 4)) {              // bottom-left spawn
        const block = new THREE.Mesh(breakGeo, breakMat.clone());
        block.position.set(px, CELL * 0.475, pz);
        block.castShadow = true;
        block.receiveShadow = true;
        scene.add(block);
        breakables.push(block);
      }
    }
  }
}

function spawnEnemies(count) {
  for (let i = 0; i < count; i++) {
    let ex, ez;
    do {
      ex = (Math.floor(Math.random() * (GRID - 4)) + 2) * CELL;
      ez = (Math.floor(Math.random() * (GRID - 4)) + 2) * CELL;
    } while (collides(ex, ez) || (ex < CELL * 4 && ez < CELL * 4));

    const group = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.5, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xdd3355, roughness: 0.4, metalness: 0.6, emissive: 0x441122, emissiveIntensity: 0.3 })
    );
    body.castShadow = true;
    group.add(body);

    // Eyes (glowing)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const eyeGeo = new THREE.SphereGeometry(0.08);
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.12, 0.2, 0.3);
    eye2.position.set(0.12, 0.2, 0.3);
    group.add(eye1, eye2);

    // Point light for enemy glow
    const glow = new THREE.PointLight(0xff3366, 0.5, 4);
    glow.position.y = 0.5;
    group.add(glow);

    group.position.set(ex, 0.6, ez);
    scene.add(group);
    
    enemies.push({ 
      mesh: group, 
      dir: Math.floor(Math.random() * 4),
      moveTimer: 0,
      bombTimer: 6 + Math.random() * 4,
      bobPhase: Math.random() * Math.PI * 2
    });
  }
  document.getElementById('enemies').textContent = enemies.length;
}

let hunter = null;
function spawnHunter() {
  const hx = (GRID - 2) * CELL, hz = (GRID - 2) * CELL;
  
  const group = new THREE.Group();
  
  // Larger, more menacing body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 0.7, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x9922ff, roughness: 0.3, metalness: 0.7, emissive: 0x440088, emissiveIntensity: 0.5 })
  );
  body.castShadow = true;
  group.add(body);

  // Glowing eye
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.15),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  eye.position.set(0, 0.25, 0.4);
  group.add(eye);

  // Strong glow
  const glow = new THREE.PointLight(0x9922ff, 1.5, 8);
  glow.position.y = 0.5;
  group.add(glow);

  group.position.set(hx, 0.7, hz);
  scene.add(group);
  
  hunter = {
    mesh: group,
    bombTimer: 4,
    pathTimer: 0,
    target: null
  };
  
  enemies.push({
    mesh: group,
    isHunter: true,
    dir: 0,
    moveTimer: 0,
    bombTimer: 4,
    bobPhase: 0
  });
  document.getElementById('enemies').textContent = enemies.length;
}

function spawnAIBombers(count) {
  const colors = [0x00aaff, 0x00ff88];
  const spawnPoints = [[CELL, (GRID - 2) * CELL], [(GRID - 2) * CELL, CELL]];
  
  for (let i = 0; i < count; i++) {
    const [sx, sz] = spawnPoints[i % spawnPoints.length];
    const color = colors[i % colors.length];
    
    const group = new THREE.Group();
    
    // Body (humanoid bomber)
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.5, 8, 16),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 })
    );
    body.castShadow = true;
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2),
      new THREE.MeshStandardMaterial({ color: 0xffddbb, roughness: 0.6 })
    );
    head.position.y = 0.5;
    head.castShadow = true;
    group.add(head);
    
    // Glow
    const glow = new THREE.PointLight(color, 0.5, 5);
    glow.position.y = 0.5;
    group.add(glow);
    
    group.position.set(sx, 0.55, sz);
    scene.add(group);
    
    aiBombers.push({
      mesh: group,
      color,
      dir: Math.floor(Math.random() * 4),
      moveTimer: 0,
      bombTimer: 2 + Math.random() * 2,
      bombCount: 3,
      blastRange: 3,
      alive: true
    });
  }
}

function spawnPowerup(x, z) {
  if (Math.random() > 0.5) return;
  
  const types = ['bomb', 'blast', 'speed'];
  const type = types[Math.floor(Math.random() * types.length)];
  const colors = { bomb: 0x44ff66, blast: 0xffaa00, speed: 0x00ddff };
  
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.25),
    new THREE.MeshStandardMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.8 })
  );
  group.add(mesh);
  
  const glow = new THREE.PointLight(colors[type], 0.8, 3);
  group.add(glow);
  
  group.position.set(x, 0.6, z);
  scene.add(group);
  powerups.push({ mesh: group, type, phase: Math.random() * Math.PI * 2 });
}

function collides(x, z, ignoreBombAt = null) {
  for (const obj of [...walls, ...breakables]) {
    if (Math.abs(obj.position.x - x) < CELL * 0.8 && Math.abs(obj.position.z - z) < CELL * 0.8) return true;
  }
  for (const b of bombs) {
    if (ignoreBombAt && Math.abs(b.group.position.x - ignoreBombAt.x) < 0.1 && Math.abs(b.group.position.z - ignoreBombAt.z) < 0.1) continue;
    if (Math.abs(b.group.position.x - x) < CELL * 0.8 && Math.abs(b.group.position.z - z) < CELL * 0.8) return true;
  }
  return false;
}

function dropBomb(x, z, isEnemy = false) {
  if (!isEnemy && bombCount <= 0) return;
  
  const gx = Math.round(x / CELL) * CELL;
  const gz = Math.round(z / CELL) * CELL;
  if (bombs.some(b => b.group.position.x === gx && b.group.position.z === gz)) return;
  
  if (!isEnemy) {
    bombCount--;
    document.getElementById('bombs').textContent = bombCount;
    playSound('drop');
    // Send bomb to network
    if (isMultiplayer) Net.send({ type: 'bomb', x: gx, z: gz, range: blastRange });
  }

  dropBombAt(gx, gz, isEnemy ? 2 : blastRange, isEnemy);
}

function dropBombAt(gx, gz, range, isEnemy) {
  if (bombs.some(b => b.group.position.x === gx && b.group.position.z === gz)) return;

  const group = new THREE.Group();
  
  // Bomb body
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.8 })
  );
  body.castShadow = true;
  group.add(body);

  // Fuse
  const fuse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1 })
  );
  fuse.position.y = 0.45;
  group.add(fuse);

  // Spark particles
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(30 * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffaa00, size: 0.08, transparent: true }));
  sparks.position.y = 0.55;
  group.add(sparks);

  // Bomb glow
  const glow = new THREE.PointLight(0xff4400, 0, 5);
  glow.position.y = 0.3;
  group.add(glow);

  group.position.set(gx, 0.4, gz);
  scene.add(group);

  bombs.push({ group, fuse, sparks, glow, time: 3, passable: !isEnemy, isEnemy, range });
}

function explode(bomb) {
  const bx = bomb.group.position.x, bz = bomb.group.position.z;
  scene.remove(bomb.group);
  bombs = bombs.filter(b => b !== bomb);
  
  if (bomb.owner) {
    bomb.owner.bombCount++;
  } else if (!bomb.isEnemy) {
    bombCount++;
    document.getElementById('bombs').textContent = bombCount;
  }

  playSound('explode');
  if (!isDying) {
    shakeIntensity = 0.4;
    slowMo = 0.3;
    setTimeout(() => { if (!isDying) slowMo = 1; }, 150);
  }
  flashDamage(0.3);

  const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  
  for (const [dx, dz] of dirs) {
    for (let i = (dx === 0 && dz === 0 ? 0 : 1); i <= (dx === 0 && dz === 0 ? 0 : bomb.range); i++) {
      const ex = bx + dx * i * CELL, ez = bz + dz * i * CELL;
      
      if (walls.some(w => Math.abs(w.position.x - ex) < 0.5 && Math.abs(w.position.z - ez) < 0.5)) break;

      // Fire column
      createExplosion(ex, ez);

      // Dynamic light
      const light = new THREE.PointLight(0xff6600, 3, 6);
      light.position.set(ex, 1, ez);
      scene.add(light);
      lights.push({ light, time: 0.4 });

      // Destroy breakables
      const hit = breakables.find(b => Math.abs(b.position.x - ex) < 0.5 && Math.abs(b.position.z - ez) < 0.5);
      if (hit) {
        createDebris(hit.position.x, hit.position.z);
        scene.remove(hit);
        breakables = breakables.filter(b => b !== hit);
        spawnPowerup(ex, ez);
        score += 10;
        document.getElementById('score').textContent = score;
        break;
      }

      // Kill enemies
      const enemyHit = enemies.find(e => Math.abs(e.mesh.position.x - ex) < CELL && Math.abs(e.mesh.position.z - ez) < CELL);
      if (enemyHit) {
        createDebris(enemyHit.mesh.position.x, enemyHit.mesh.position.z, 0xff3366);
        scene.remove(enemyHit.mesh);
        enemies = enemies.filter(e => e !== enemyHit);
        score += 100;
        document.getElementById('score').textContent = score;
        document.getElementById('enemies').textContent = enemies.length;
        checkWin();
      }

      // Kill AI bombers
      const bomberHit = aiBombers.find(b => b.alive && Math.abs(b.mesh.position.x - ex) < CELL && Math.abs(b.mesh.position.z - ez) < CELL);
      if (bomberHit) {
        bomberHit.alive = false;
        createDebris(bomberHit.mesh.position.x, bomberHit.mesh.position.z, bomberHit.color);
        scene.remove(bomberHit.mesh);
        score += 50;
        document.getElementById('score').textContent = score;
      }

      // Player damage
      if (Math.abs(player.x - ex) < CELL && Math.abs(player.z - ez) < CELL) {
        gameOver();
        return;
      }
    }
  }
}

function createExplosion(x, z) {
  // Fire particles
  for (let i = 0; i < 15; i++) {
    const size = 0.1 + Math.random() * 0.2;
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(size),
      new THREE.MeshBasicMaterial({ color: Math.random() > 0.3 ? 0xff6600 : 0xffcc00, transparent: true })
    );
    particle.position.set(x + (Math.random() - 0.5) * 0.5, Math.random() * 0.5, z + (Math.random() - 0.5) * 0.5);
    scene.add(particle);
    explosions.push({ 
      mesh: particle, 
      time: 0.4 + Math.random() * 0.3,
      vel: new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 4, (Math.random() - 0.5) * 4),
      isParticle: true
    });
  }

  // Shockwave ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.3, 32),
    new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.1, z);
  scene.add(ring);
  explosions.push({ mesh: ring, time: 0.3, isRing: true, scale: 1 });
}

function createDebris(x, z, color = 0x5a3a2a) {
  for (let i = 0; i < 12; i++) {
    const size = 0.08 + Math.random() * 0.12;
    const debris = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    );
    debris.position.set(x + (Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 0.5, z + (Math.random() - 0.5) * 0.5);
    debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    debris.castShadow = true;
    scene.add(debris);
    explosions.push({
      mesh: debris,
      time: 1 + Math.random() * 0.5,
      vel: new THREE.Vector3((Math.random() - 0.5) * 6, 3 + Math.random() * 4, (Math.random() - 0.5) * 6),
      rotVel: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      isDebris: true
    });
  }
}

function isInDanger(x, z) {
  for (const b of bombs) {
    const bx = b.group.position.x, bz = b.group.position.z;
    const range = (b.range || 3) * CELL + CELL; // Include the cell player is standing in
    // Match explosion damage check: < CELL for both axes
    if ((Math.abs(x - bx) < CELL && Math.abs(z - bz) <= range) ||
        (Math.abs(z - bz) < CELL && Math.abs(x - bx) <= range)) {
      return true;
    }
  }
  return false;
}

function updateEnemies(dt) {
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  
  for (const enemy of enemies) {
    enemy.moveTimer -= dt;
    enemy.bombTimer -= dt;
    enemy.bobPhase += dt * 5;
    
    // Bobbing animation
    const baseY = enemy.isHunter ? 0.7 : 0.6;
    enemy.mesh.position.y = baseY + Math.sin(enemy.bobPhase) * 0.05;
    enemy.mesh.children[0].rotation.y += dt * (enemy.isHunter ? 3 : 2);

    const ex = enemy.mesh.position.x, ez = enemy.mesh.position.z;
    const inDanger = isInDanger(ex, ez);

    if (enemy.moveTimer <= 0) {
      enemy.moveTimer = enemy.isHunter ? 0.25 : 0.4;
      
      // If in danger, prioritize escaping
      if (inDanger) {
        let bestDir = enemy.dir;
        for (let d = 0; d < 4; d++) {
          const [mx, mz] = dirs[d];
          const nx = ex + mx * CELL;
          const nz = ez + mz * CELL;
          if (!collides(nx, nz) && !isInDanger(nx, nz)) {
            bestDir = d;
            break;
          }
        }
        enemy.dir = bestDir;
      } else if (enemy.isHunter) {
        // Hunter AI: pathfind toward player
        let bestDir = enemy.dir;
        let bestDist = Infinity;
        
        for (let d = 0; d < 4; d++) {
          const [mx, mz] = dirs[d];
          const nx = ex + mx * CELL;
          const nz = ez + mz * CELL;
          
          if (!collides(nx, nz) && !isInDanger(nx, nz)) {
            const dist = Math.abs(player.x - nx) + Math.abs(player.z - nz);
            if (dist < bestDist) {
              bestDist = dist;
              bestDir = d;
            }
          }
        }
        enemy.dir = bestDir;
      } else {
        // Regular enemy: random movement, avoid danger
        if (Math.random() < 0.25) enemy.dir = Math.floor(Math.random() * 4);
      }
      
      const [dx, dz] = dirs[enemy.dir];
      const nx = ex + dx * CELL;
      const nz = ez + dz * CELL;
      
      if (!collides(nx, nz)) {
        enemy.mesh.position.x = nx;
        enemy.mesh.position.z = nz;
        enemy.mesh.rotation.y = Math.atan2(dx, dz);
      } else {
        enemy.dir = Math.floor(Math.random() * 4);
      }
    }

    // Only drop bombs if not in danger and not too close to own bombs
    const distToPlayer = Math.abs(ex - player.x) + Math.abs(ez - player.z);
    const bombCooldown = enemy.isHunter ? (distToPlayer < CELL * 4 ? 4 : 8) : 12 + Math.random() * 8;
    
    if (enemy.bombTimer <= 0 && !inDanger && distToPlayer < CELL * 6) {
      enemy.bombTimer = bombCooldown;
      dropBomb(ex, ez, true);
    }

    if (Math.abs(ex - player.x) < CELL * 0.5 && Math.abs(ez - player.z) < CELL * 0.5) {
      gameOver();
    }
  }
}

function updateAIBombers(dt) {
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  
  for (const bomber of aiBombers) {
    if (!bomber.alive) continue;
    
    bomber.moveTimer -= dt;
    bomber.bombTimer -= dt;
    
    // Movement
    if (bomber.moveTimer <= 0) {
      bomber.moveTimer = 0.35;
      
      // Smart movement: avoid bombs, seek enemies or breakables
      let bestDir = bomber.dir;
      let bestScore = -Infinity;
      
      for (let d = 0; d < 4; d++) {
        const [mx, mz] = dirs[d];
        const nx = bomber.mesh.position.x + mx * CELL;
        const nz = bomber.mesh.position.z + mz * CELL;
        
        if (collides(nx, nz)) continue;
        
        // Avoid bomb blast zones
        let inDanger = bombs.some(b => {
          const bx = b.group.position.x, bz = b.group.position.z;
          return (Math.abs(nx - bx) < CELL * 0.5 && Math.abs(nz - bz) < CELL * 4) ||
                 (Math.abs(nz - bz) < CELL * 0.5 && Math.abs(nx - bx) < CELL * 4);
        });
        
        let score = inDanger ? -100 : 0;
        
        // Move toward nearest enemy
        for (const e of enemies) {
          const dist = Math.abs(e.mesh.position.x - nx) + Math.abs(e.mesh.position.z - nz);
          score -= dist * 0.1;
        }
        
        // Some randomness
        score += Math.random() * 2;
        
        if (score > bestScore) {
          bestScore = score;
          bestDir = d;
        }
      }
      
      bomber.dir = bestDir;
      const [dx, dz] = dirs[bomber.dir];
      const nx = bomber.mesh.position.x + dx * CELL;
      const nz = bomber.mesh.position.z + dz * CELL;
      
      if (!collides(nx, nz)) {
        bomber.mesh.position.x = nx;
        bomber.mesh.position.z = nz;
        bomber.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
    
    // Drop bombs near enemies or breakables
    if (bomber.bombTimer <= 0 && bomber.bombCount > 0) {
      const nearEnemy = enemies.some(e => 
        Math.abs(e.mesh.position.x - bomber.mesh.position.x) < CELL * 3 &&
        Math.abs(e.mesh.position.z - bomber.mesh.position.z) < CELL * 3
      );
      const nearBreakable = breakables.some(b =>
        Math.abs(b.position.x - bomber.mesh.position.x) < CELL * 2 &&
        Math.abs(b.position.z - bomber.mesh.position.z) < CELL * 2
      );
      
      if (nearEnemy || nearBreakable) {
        bomber.bombTimer = 3 + Math.random() * 2;
        dropAIBomb(bomber);
      }
    }
    
    // Check if killed by explosion (handled in explode function)
  }
}

function dropAIBomb(bomber) {
  const gx = Math.round(bomber.mesh.position.x / CELL) * CELL;
  const gz = Math.round(bomber.mesh.position.z / CELL) * CELL;
  
  if (bombs.some(b => b.group.position.x === gx && b.group.position.z === gz)) return;
  
  bomber.bombCount--;
  
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 32),
    new THREE.MeshStandardMaterial({ color: bomber.color, roughness: 0.3, metalness: 0.8 })
  );
  body.castShadow = true;
  group.add(body);

  const fuse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1 })
  );
  fuse.position.y = 0.45;
  group.add(fuse);

  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(30 * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffaa00, size: 0.08, transparent: true }));
  sparks.position.y = 0.55;
  group.add(sparks);

  const glow = new THREE.PointLight(bomber.color, 0, 5);
  glow.position.y = 0.3;
  group.add(glow);

  group.position.set(gx, 0.4, gz);
  scene.add(group);

  bombs.push({ 
    group, fuse, sparks, glow, 
    time: 3, 
    passable: false, 
    isEnemy: false, 
    range: bomber.blastRange,
    owner: bomber
  });
}

function updatePowerups(dt) {
  for (const p of [...powerups]) {
    p.phase += dt * 3;
    p.mesh.position.y = 0.6 + Math.sin(p.phase) * 0.15;
    p.mesh.children[0].rotation.y += dt * 2;
    p.mesh.children[0].rotation.x += dt;

    if (Math.abs(p.mesh.position.x - player.x) < CELL * 0.5 && Math.abs(p.mesh.position.z - player.z) < CELL * 0.5) {
      playSound('powerup');
      if (p.type === 'bomb') { bombCount++; document.getElementById('bombs').textContent = bombCount; }
      else if (p.type === 'blast') { blastRange++; document.getElementById('blast').textContent = blastRange; }
      else if (p.type === 'speed') speed += 0.8;
      
      scene.remove(p.mesh);
      powerups = powerups.filter(x => x !== p);
    }
  }
}

function updateExplosions(dt) {
  for (const exp of [...explosions]) {
    exp.time -= dt;
    
    if (exp.isRing) {
      exp.scale += dt * 8;
      exp.mesh.scale.set(exp.scale, exp.scale, 1);
      exp.mesh.material.opacity = exp.time / 0.3;
    } else if (exp.isDebris) {
      exp.mesh.position.add(exp.vel.clone().multiplyScalar(dt));
      exp.vel.y -= 15 * dt;
      exp.mesh.rotation.x += exp.rotVel.x * dt;
      exp.mesh.rotation.y += exp.rotVel.y * dt;
      if (exp.mesh.position.y < 0) { exp.mesh.position.y = 0; exp.vel.y *= -0.3; exp.vel.x *= 0.8; exp.vel.z *= 0.8; }
    } else if (exp.isParticle) {
      exp.mesh.position.add(exp.vel.clone().multiplyScalar(dt));
      exp.vel.y -= 8 * dt;
      exp.mesh.material.opacity = exp.time * 2;
      exp.mesh.scale.multiplyScalar(0.97);
    }

    if (exp.time <= 0) {
      scene.remove(exp.mesh);
      explosions = explosions.filter(e => e !== exp);
    }
  }

  // Update dynamic lights
  for (const l of [...lights]) {
    l.time -= dt;
    l.light.intensity = l.time * 8;
    if (l.time <= 0) {
      scene.remove(l.light);
      lights = lights.filter(x => x !== l);
    }
  }
}

function updateBombs(dt) {
  for (const bomb of [...bombs]) {
    bomb.time -= dt;
    
    // Pulsing glow
    const pulse = Math.sin(bomb.time * 12) * 0.5 + 0.5;
    bomb.glow.intensity = pulse * 2 + (3 - bomb.time) * 0.5;
    bomb.fuse.material.emissiveIntensity = pulse + 0.5;
    
    // Update sparks
    const positions = bomb.sparks.geometry.attributes.position.array;
    for (let i = 0; i < 30; i++) {
      const t = (Date.now() * 0.01 + i * 100) % 1;
      positions[i * 3] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = t * 0.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    bomb.sparks.geometry.attributes.position.needsUpdate = true;
    bomb.sparks.material.opacity = 0.5 + pulse * 0.5;

    // Scale pulse when close to exploding
    if (bomb.time < 1) {
      const s = 1 + (1 - bomb.time) * 0.1 * pulse;
      bomb.group.scale.set(s, s, s);
    }

    if (bomb.time <= 0) explode(bomb);
  }
  
  updateBlastIndicators();
}

function updateBlastIndicators() {
  // Disabled - can be enabled via options
  return;
  
  // Remove old indicators
  for (const ind of blastIndicators) scene.remove(ind);
  blastIndicators = [];
  
  const indicatorMat = new THREE.MeshBasicMaterial({ 
    color: 0xff3300, 
    transparent: true, 
    opacity: 0.25 + Math.sin(Date.now() * 0.008) * 0.15
  });
  const tileGeo = new THREE.PlaneGeometry(CELL * 0.9, CELL * 0.9);
  
  for (const bomb of bombs) {
    const bx = bomb.group.position.x, bz = bomb.group.position.z;
    const range = bomb.range || 3;
    const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    
    for (const [dx, dz] of dirs) {
      for (let i = 0; i <= (dx === 0 && dz === 0 ? 0 : range); i++) {
        const tx = bx + dx * i * CELL;
        const tz = bz + dz * i * CELL;
        
        // Stop at walls
        if (walls.some(w => Math.abs(w.position.x - tx) < 0.5 && Math.abs(w.position.z - tz) < 0.5)) break;
        
        const tile = new THREE.Mesh(tileGeo, indicatorMat);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(tx, 0.02, tz);
        scene.add(tile);
        blastIndicators.push(tile);
        
        // Stop at breakables (but show the tile)
        if (breakables.some(b => Math.abs(b.position.x - tx) < 0.5 && Math.abs(b.position.z - tz) < 0.5)) break;
      }
    }
  }
}

function drawMinimap() {
  const s = 150 / GRID;
  minimapCtx.fillStyle = 'rgba(10,10,18,0.9)';
  minimapCtx.fillRect(0, 0, 150, 150);

  minimapCtx.fillStyle = '#2a2a3a';
  for (const w of walls) minimapCtx.fillRect(w.position.x / CELL * s, w.position.z / CELL * s, s - 1, s - 1);

  minimapCtx.fillStyle = '#5a3a2a';
  for (const b of breakables) minimapCtx.fillRect(b.position.x / CELL * s + 1, b.position.z / CELL * s + 1, s - 2, s - 2);

  minimapCtx.fillStyle = '#ff4400';
  for (const b of bombs) {
    minimapCtx.beginPath();
    minimapCtx.arc(b.group.position.x / CELL * s + s/2, b.group.position.z / CELL * s + s/2, 4, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  minimapCtx.fillStyle = '#ff3366';
  for (const e of enemies) {
    minimapCtx.beginPath();
    minimapCtx.arc(e.mesh.position.x / CELL * s + s/2, e.mesh.position.z / CELL * s + s/2, 4, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  // AI Bombers
  for (const b of aiBombers) {
    if (!b.alive) continue;
    minimapCtx.fillStyle = '#' + b.color.toString(16).padStart(6, '0');
    minimapCtx.beginPath();
    minimapCtx.arc(b.mesh.position.x / CELL * s + s/2, b.mesh.position.z / CELL * s + s/2, 4, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  // Player
  const myColor = '#' + PLAYER_COLORS[myPlayerIndex % PLAYER_COLORS.length].toString(16).padStart(6, '0');
  const px = player.x / CELL * s + s/2, pz = player.z / CELL * s + s/2;
  minimapCtx.fillStyle = myColor;
  minimapCtx.beginPath();
  minimapCtx.arc(px, pz, 5, 0, Math.PI * 2);
  minimapCtx.fill();

  minimapCtx.strokeStyle = myColor;
  minimapCtx.lineWidth = 2;
  minimapCtx.beginPath();
  minimapCtx.moveTo(px, pz);
  minimapCtx.lineTo(px - Math.sin(player.yaw) * 12, pz - Math.cos(player.yaw) * 12);
  minimapCtx.stroke();
  
  // Remote players
  for (const [id, pos] of Object.entries(remotePlayers)) {
    const rpx = pos.x / CELL * s + s/2, rpz = pos.z / CELL * s + s/2;
    minimapCtx.fillStyle = '#' + (pos.color || 0xff6666).toString(16).padStart(6, '0');
    minimapCtx.beginPath();
    minimapCtx.arc(rpx, rpz, 5, 0, Math.PI * 2);
    minimapCtx.fill();
  }
}

function updatePlayerList() {
  const list = document.getElementById('player-list');
  if (!list || !isMultiplayer) return;
  
  let html = '';
  
  // Add self
  const myColor = '#' + PLAYER_COLORS[myPlayerIndex % PLAYER_COLORS.length].toString(16).padStart(6, '0');
  html += `<div class="player-entry">
    <div class="player-dot" style="background:${myColor}"></div>
    <span class="player-name" style="color:${myColor}">${myPlayerName} (You)</span>
  </div>`;
  
  // Add remote players
  for (const [id, pos] of Object.entries(remotePlayers)) {
    const color = '#' + (pos.color || 0xff6666).toString(16).padStart(6, '0');
    html += `<div class="player-entry">
      <div class="player-dot" style="background:${color}"></div>
      <span class="player-name" style="color:${color}">${pos.name || 'Player'}</span>
    </div>`;
  }
  
  list.innerHTML = html;
}

function playSound(type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const t = audioCtx.currentTime;

  if (type === 'explode') {
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.1));
    noise.buffer = buffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start(t);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  } else if (type === 'powerup') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.15);
  } else if (type === 'drop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.start(t);
    osc.stop(t + 0.1);
  } else if (type === 'death') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.8);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    osc.start(t);
    osc.stop(t + 0.8);
  }
}

function getCameraCollisionDist(playerPos, camTarget, maxDist) {
  const dir = new THREE.Vector3(camTarget.x - playerPos.x, camTarget.y - playerPos.y, camTarget.z - playerPos.z);
  const dist = dir.length();
  dir.normalize();
  
  raycaster.set(new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z), dir);
  raycaster.far = maxDist;
  
  const hits = raycaster.intersectObjects([...walls, ...breakables], false);
  if (hits.length > 0 && hits[0].distance < dist) {
    return Math.max(hits[0].distance - 0.5, 1); // Keep 0.5 buffer, min 1 unit
  }
  return dist;
}

function updateCameraModeUI() {
  const modes = ['FPV', 'THIRD PERSON', 'OVER SHOULDER', 'TOP DOWN', 'CINEMATIC'];
  const el = document.getElementById('camera-mode');
  el.textContent = modes[cameraMode];
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, 1500);
}

function flashDamage(intensity) {
  const overlay = document.getElementById('damage-overlay');
  overlay.style.opacity = intensity;
  setTimeout(() => overlay.style.opacity = 0, 100);
}

function updateDangerIndicator() {
  const inDanger = isInDanger(player.x, player.z);
  document.getElementById('danger-overlay').classList.toggle('active', inDanger);
}

function gameOver() {
  if (isDying) return;
  isDying = true;
  
  // Notify network
  if (isMultiplayer) Net.send({ type: 'death', id: 'local' });
  
  // Death VFX
  shakeIntensity = 1.5;
  slowMo = 0.15;
  flashDamage(0.8);
  playSound('death');
  
  // Create death particles at player position
  for (let i = 0; i < 30; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + Math.random() * 0.15),
      new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff0000 : 0xff6600, transparent: true })
    );
    particle.position.set(player.x, 1 + Math.random(), player.z);
    scene.add(particle);
    explosions.push({
      mesh: particle,
      time: 1.5,
      vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8),
      isParticle: true
    });
  }
  
  // Delay then check round end
  setTimeout(() => {
    slowMo = 1;
    locked = false;
    document.exitPointerLock();
    if (isMultiplayer) {
      checkRoundEnd();
    } else {
      document.getElementById('final-score-go').textContent = score;
      document.getElementById('game-over').style.display = 'flex';
    }
  }, 2000);
}

function checkWin() {
  if (enemies.length === 0) {
    setTimeout(win, 500);
  }
}

function timeUp() {
  if (isMultiplayer) {
    showRoundEnd('TIME UP');
  } else {
    locked = false;
    document.exitPointerLock();
    document.getElementById('final-score-go').textContent = `${wins} wins, ${kills} kills`;
    document.querySelector('#game-over h1').textContent = 'TIME UP';
    document.getElementById('game-over').style.display = 'flex';
  }
}

function win() {
  locked = false;
  document.exitPointerLock();
  document.getElementById('final-score-win').textContent = score;
  document.getElementById('win-screen').style.display = 'flex';
}

function updateTimer(dt) {
  roundTime -= dt;
  if (roundTime <= 0) {
    roundTime = 0;
    timeUp();
    return;
  }
  
  const mins = Math.floor(roundTime / 60);
  const secs = Math.floor(roundTime % 60);
  document.getElementById('timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  
  const timerEl = document.getElementById('timer').parentElement;
  timerEl.classList.remove('warning', 'danger');
  if (roundTime <= 30) timerEl.classList.add('danger');
  else if (roundTime <= 60) timerEl.classList.add('warning');
}

function update(dt) {
  dt *= slowMo;

  let dx = 0, dz = 0;
  
  // Only process input when locked
  if (locked) {
    // Movement
    if (keys['KeyW']) { dx -= Math.sin(player.yaw); dz -= Math.cos(player.yaw); }
    if (keys['KeyS']) { dx += Math.sin(player.yaw); dz += Math.cos(player.yaw); }
    if (keys['KeyA']) { dx -= Math.cos(player.yaw); dz += Math.sin(player.yaw); }
    if (keys['KeyD']) { dx += Math.cos(player.yaw); dz -= Math.sin(player.yaw); }

    const currentBomb = bombs.find(b => b.passable && Math.abs(b.group.position.x - player.x) < CELL * 0.8 && Math.abs(b.group.position.z - player.z) < CELL * 0.8);

    if (dx || dz) {
      const len = Math.sqrt(dx * dx + dz * dz);
      dx = dx / len * speed * dt;
      dz = dz / len * speed * dt;
      if (!collides(player.x + dx, player.z, currentBomb?.group.position)) player.x += dx;
      if (!collides(player.x, player.z + dz, currentBomb?.group.position)) player.z += dz;
    }

    for (const b of bombs) {
      if (b.passable && (Math.abs(b.group.position.x - player.x) >= CELL * 0.8 || Math.abs(b.group.position.z - player.z) >= CELL * 0.8)) {
        b.passable = false;
      }
    }

    if (keys['Space']) { keys['Space'] = false; dropBomb(player.x, player.z); }
  }

  // Network sync - send position
  if (isMultiplayer && Net.isConnected()) {
    Net.send({ type: 'pos', id: Net.getMyId(), x: player.x, z: player.z, yaw: player.yaw, color: PLAYER_COLORS[myPlayerIndex % PLAYER_COLORS.length], playerIndex: myPlayerIndex, name: myPlayerName });
  }
  
  // Update remote players
  for (const [id, pos] of Object.entries(remotePlayers)) {
    const mesh = remotePlayerMeshes[id];
    if (mesh) {
      mesh.position.x += (pos.x - mesh.position.x) * 0.3;
      mesh.position.z += (pos.z - mesh.position.z) * 0.3;
      mesh.rotation.y = pos.yaw + Math.PI;
    }
  }

  // Update player mesh and tile indicator
  playerMesh.position.set(player.x, 0.25, player.z);
  playerMesh.rotation.y = player.yaw + Math.PI;
  
  // Snap tile to grid, subtle pulse
  const gridX = Math.round(player.x / CELL) * CELL;
  const gridZ = Math.round(player.z / CELL) * CELL;
  playerTile.position.set(gridX, 0.02, gridZ);

  // Camera with shake
  shakeIntensity *= 0.9;
  const shake = shakeIntensity * (Math.random() - 0.5);
  
  if (cameraMode === 0) {
    // First-person view
    camera.position.set(player.x + shake, 1.6 + shake * 0.5, player.z + shake);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    if (dx || dz) camera.position.y += Math.sin(Date.now() * 0.01) * 0.03;
  } else if (cameraMode === 1) {
    // Third-person view (behind)
    const maxDist = 6, height = 4;
    const targetX = player.x + Math.sin(player.yaw) * maxDist;
    const targetZ = player.z + Math.cos(player.yaw) * maxDist;
    
    // Check for obstruction
    const playerPos = { x: player.x, y: 1.5, z: player.z };
    const camTarget = { x: targetX, y: height, z: targetZ };
    const actualDist = getCameraCollisionDist(playerPos, camTarget, maxDist + 2);
    const ratio = Math.min(actualDist / maxDist, 1);
    
    const adjX = player.x + Math.sin(player.yaw) * maxDist * ratio;
    const adjZ = player.z + Math.cos(player.yaw) * maxDist * ratio;
    const adjY = height * ratio + 1.5 * (1 - ratio);
    
    const spring = 1 - Math.pow(0.01, dt);
    camPos.x += (adjX - camPos.x) * spring;
    camPos.y += (adjY - camPos.y) * spring;
    camPos.z += (adjZ - camPos.z) * spring;
    
    camera.position.set(camPos.x + shake, camPos.y + shake * 0.5, camPos.z + shake);
    const lookX = player.x - Math.sin(player.yaw) * 3;
    const lookZ = player.z - Math.cos(player.yaw) * 3;
    camera.lookAt(lookX, 0.5, lookZ);
  } else if (cameraMode === 2) {
    // Over-the-shoulder (offset to right)
    const maxDist = 3, height = 2.2, offsetRight = 1;
    const targetX = player.x + Math.sin(player.yaw) * maxDist + Math.cos(player.yaw) * offsetRight;
    const targetZ = player.z + Math.cos(player.yaw) * maxDist - Math.sin(player.yaw) * offsetRight;
    
    // Check for obstruction
    const playerPos = { x: player.x, y: 1.5, z: player.z };
    const camTarget = { x: targetX, y: height, z: targetZ };
    const actualDist = getCameraCollisionDist(playerPos, camTarget, maxDist + 2);
    const ratio = Math.min(actualDist / maxDist, 1);
    
    const adjX = player.x + (Math.sin(player.yaw) * maxDist + Math.cos(player.yaw) * offsetRight) * ratio;
    const adjZ = player.z + (Math.cos(player.yaw) * maxDist - Math.sin(player.yaw) * offsetRight) * ratio;
    const adjY = height * ratio + 1.6 * (1 - ratio);
    
    const spring = 1 - Math.pow(0.005, dt);
    camPos.x += (adjX - camPos.x) * spring;
    camPos.y += (adjY - camPos.y) * spring;
    camPos.z += (adjZ - camPos.z) * spring;
    
    camera.position.set(camPos.x + shake, camPos.y + shake * 0.5, camPos.z + shake);
    const lookX = player.x - Math.sin(player.yaw) * 8;
    const lookZ = player.z - Math.cos(player.yaw) * 8;
    camera.lookAt(lookX, 1.5, lookZ);
  } else if (cameraMode === 3) {
    // Top-down view
    const height = 14;
    const spring = 1 - Math.pow(0.02, dt);
    camPos.x += (player.x - camPos.x) * spring;
    camPos.y += (height - camPos.y) * spring;
    camPos.z += (player.z + 2 - camPos.z) * spring;
    
    camera.position.set(camPos.x + shake, camPos.y, camPos.z + shake);
    camera.lookAt(player.x, 0, player.z);
  } else {
    // Cinematic orbit view
    const time = Date.now() * 0.0003;
    const dist = 12;
    const height = 8;
    const camX = player.x + Math.sin(time) * dist;
    const camZ = player.z + Math.cos(time) * dist;
    camera.position.set(camX + shake, height + shake * 0.5, camZ + shake);
    camera.lookAt(player.x, 0.5, player.z);
  }

  updateBombs(dt);
  updateExplosions(dt);
  updateEnemies(dt);
  updateAIBombers(dt);
  updatePowerups(dt);
  updateTimer(dt);
  updateDangerIndicator();
  drawMinimap();
  updatePlayerList();
  
  // Update ping display
  if (isMultiplayer) document.getElementById('ping').textContent = Net.getPing() + 'ms';
}

let lastTime = 0;
function animate(time = 0) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  update(dt);
  composer.render();
}

// Don't auto-init - wait for lobby
