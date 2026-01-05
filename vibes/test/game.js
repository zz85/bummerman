import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Game constants
const GRID_SIZE = 13;
const CELL_SIZE = 1;
const PLAYER_SPEED = 4;
const BOMB_TIMER = 2000;
const EXPLOSION_DURATION = 500;
const EXPLOSION_RANGE = 2;

// Game state
const state = {
  bombs: [],
  explosions: [],
  walls: [],
  breakableWalls: [],
  maxBombs: 3,
  activeBombs: 0
};

// Input state
const keys = {};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(GRID_SIZE / 2, 18, GRID_SIZE + 8);
camera.lookAt(GRID_SIZE / 2, 0, GRID_SIZE / 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(10, 20, 10);
directional.castShadow = true;
directional.shadow.mapSize.width = 2048;
directional.shadow.mapSize.height = 2048;
scene.add(directional);

// Materials
const materials = {
  floor: new THREE.MeshStandardMaterial({ color: 0x2d4a3e }),
  wall: new THREE.MeshStandardMaterial({ color: 0x4a4a4a }),
  breakable: new THREE.MeshStandardMaterial({ color: 0x8b4513 }),
  player: new THREE.MeshStandardMaterial({ color: 0x00aaff }),
  bomb: new THREE.MeshStandardMaterial({ color: 0x222222 }),
  explosion: new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true })
};

// Create floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE),
  materials.floor
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(GRID_SIZE / 2 - 0.5, 0, GRID_SIZE / 2 - 0.5);
floor.receiveShadow = true;
scene.add(floor);

// Create grid map (0=empty, 1=wall, 2=breakable)
const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));

// Place walls
for (let x = 0; x < GRID_SIZE; x++) {
  for (let z = 0; z < GRID_SIZE; z++) {
    // Border walls
    if (x === 0 || x === GRID_SIZE - 1 || z === 0 || z === GRID_SIZE - 1) {
      grid[x][z] = 1;
      createWall(x, z, false);
    }
    // Fixed pillars (every other cell)
    else if (x % 2 === 0 && z % 2 === 0) {
      grid[x][z] = 1;
      createWall(x, z, false);
    }
    // Breakable walls (random, avoiding spawn area)
    else if (Math.random() < 0.4 && !isSpawnArea(x, z)) {
      grid[x][z] = 2;
      createWall(x, z, true);
    }
  }
}

function isSpawnArea(x, z) {
  return (x <= 2 && z <= 2) || (x >= GRID_SIZE - 3 && z >= GRID_SIZE - 3) ||
         (x <= 2 && z >= GRID_SIZE - 3) || (x >= GRID_SIZE - 3 && z <= 2);
}

function createWall(x, z, breakable) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(CELL_SIZE * 0.95, CELL_SIZE, CELL_SIZE * 0.95),
    breakable ? materials.breakable : materials.wall
  );
  wall.position.set(x, 0.5, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
  
  if (breakable) {
    state.breakableWalls.push({ mesh: wall, x, z });
  } else {
    state.walls.push(wall);
  }
}

// Create player
const player = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.4, 8, 16), materials.player);
body.position.y = 0.5;
body.castShadow = true;
player.add(body);
player.position.set(1.5, 0, 1.5);
scene.add(player);

// Player velocity for smooth movement
const velocity = new THREE.Vector3();

// Input handlers
document.addEventListener('keydown', e => {
  e.preventDefault();
  keys[e.code] = true;
  console.log('Key down:', e.code);
  if (e.code === 'Space') placeBomb();
  if (e.code === 'KeyR') resetGame();
});
document.addEventListener('keyup', e => {
  e.preventDefault();
  keys[e.code] = false;
});

// Auto-focus
renderer.domElement.setAttribute('tabindex', '0');
renderer.domElement.focus();

function placeBomb() {
  if (state.activeBombs >= state.maxBombs) return;
  
  const bx = Math.round(player.position.x);
  const bz = Math.round(player.position.z);
  
  // Check if bomb already exists at this position
  if (state.bombs.some(b => b.x === bx && b.z === bz)) return;
  
  const bomb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), materials.bomb);
  bomb.position.set(bx, 0.35, bz);
  bomb.castShadow = true;
  scene.add(bomb);
  
  state.bombs.push({ mesh: bomb, x: bx, z: bz, time: Date.now() });
  state.activeBombs++;
  updateUI();
}

function explode(bomb) {
  scene.remove(bomb.mesh);
  state.activeBombs--;
  updateUI();
  
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const explosionCells = [[bomb.x, bomb.z]];
  
  for (const [dx, dz] of directions) {
    for (let i = 1; i <= EXPLOSION_RANGE; i++) {
      const nx = bomb.x + dx * i;
      const nz = bomb.z + dz * i;
      
      if (nx < 0 || nx >= GRID_SIZE || nz < 0 || nz >= GRID_SIZE) break;
      if (grid[nx][nz] === 1) break;
      
      explosionCells.push([nx, nz]);
      
      if (grid[nx][nz] === 2) {
        destroyWall(nx, nz);
        break;
      }
    }
  }
  
  // Create explosion visuals
  for (const [ex, ez] of explosionCells) {
    const exp = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      materials.explosion.clone()
    );
    exp.position.set(ex, 0.5, ez);
    scene.add(exp);
    state.explosions.push({ mesh: exp, time: Date.now(), x: ex, z: ez });
  }
}

function destroyWall(x, z) {
  const idx = state.breakableWalls.findIndex(w => w.x === x && w.z === z);
  if (idx !== -1) {
    scene.remove(state.breakableWalls[idx].mesh);
    state.breakableWalls.splice(idx, 1);
    grid[x][z] = 0;
  }
}

function checkCollision(x, z, radius = 0.3) {
  const cells = [
    [Math.floor(x - radius), Math.floor(z - radius)],
    [Math.floor(x + radius), Math.floor(z - radius)],
    [Math.floor(x - radius), Math.floor(z + radius)],
    [Math.floor(x + radius), Math.floor(z + radius)]
  ];
  
  for (const [gx, gz] of cells) {
    if (gx < 0 || gx >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) return true;
    if (grid[gx][gz] !== 0) return true;
  }
  return false;
}

function updateUI() {
  document.getElementById('bombs').textContent = state.maxBombs - state.activeBombs;
}

function resetGame() {
  player.position.set(1.5, 0, 1.5);
  velocity.set(0, 0, 0);
  state.bombs.forEach(b => scene.remove(b.mesh));
  state.explosions.forEach(e => scene.remove(e.mesh));
  state.bombs = [];
  state.explosions = [];
  state.activeBombs = 0;
  updateUI();
}

// Game loop
let lastTime = performance.now();

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  // Player movement
  const moveDir = new THREE.Vector3();
  if (keys['KeyW'] || keys['ArrowUp']) moveDir.z -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) moveDir.z += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) moveDir.x -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;
  
  if (moveDir.length() > 0) {
    moveDir.normalize().multiplyScalar(PLAYER_SPEED);
    velocity.x += (moveDir.x - velocity.x) * 0.2;
    velocity.z += (moveDir.z - velocity.z) * 0.2;
  } else {
    velocity.x *= 0.85;
    velocity.z *= 0.85;
  }
  
  // Apply movement with collision
  const newX = player.position.x + velocity.x * delta;
  const newZ = player.position.z + velocity.z * delta;
  
  if (!checkCollision(newX, player.position.z)) {
    player.position.x = newX;
  }
  if (!checkCollision(player.position.x, newZ)) {
    player.position.z = newZ;
  }
  
  // Rotate player towards movement direction
  if (velocity.length() > 0.1) {
    const angle = Math.atan2(velocity.x, velocity.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, angle, 0.15);
  }
  
  // Update bombs
  const now = Date.now();
  for (let i = state.bombs.length - 1; i >= 0; i--) {
    const bomb = state.bombs[i];
    bomb.mesh.scale.setScalar(1 + Math.sin(now * 0.01) * 0.1);
    
    if (now - bomb.time > BOMB_TIMER) {
      explode(bomb);
      state.bombs.splice(i, 1);
    }
  }
  
  // Update explosions
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    const exp = state.explosions[i];
    const elapsed = now - exp.time;
    
    if (elapsed > EXPLOSION_DURATION) {
      scene.remove(exp.mesh);
      state.explosions.splice(i, 1);
    } else {
      exp.mesh.material.opacity = 1 - elapsed / EXPLOSION_DURATION;
      exp.mesh.scale.setScalar(1 + elapsed / EXPLOSION_DURATION * 0.5);
    }
  }
  
  // Check player hit by explosion
  for (const exp of state.explosions) {
    const dx = player.position.x - exp.x;
    const dz = player.position.z - exp.z;
    if (Math.sqrt(dx * dx + dz * dz) < 0.5) {
      resetGame();
      break;
    }
  }
  
  renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(performance.now());
