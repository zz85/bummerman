import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const GRID = 15, CELL = 2;
let scene, camera, renderer, player, walls = [], breakables = [], bombs = [], explosions = [];
let keys = {}, bombCount = 3, score = 0, locked = false;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  
  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);
  
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(10, 20, 10);
  scene.add(light);
  
  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID * CELL, GRID * CELL),
    new THREE.MeshStandardMaterial({ color: 0x2d4a3e })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(GRID * CELL / 2 - CELL / 2, 0, GRID * CELL / 2 - CELL / 2);
  scene.add(floor);
  
  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
  const breakMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const wallGeo = new THREE.BoxGeometry(CELL, CELL, CELL);
  
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const pos = new THREE.Vector3(x * CELL, CELL / 2, z * CELL);
      
      // Border or grid pattern walls (indestructible)
      if (x === 0 || x === GRID - 1 || z === 0 || z === GRID - 1 || (x % 2 === 0 && z % 2 === 0)) {
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.copy(pos);
        scene.add(wall);
        walls.push(wall);
      }
      // Breakable blocks (skip player spawn area)
      else if (Math.random() > 0.4 && !(x < 3 && z < 3)) {
        const block = new THREE.Mesh(wallGeo, breakMat);
        block.position.copy(pos);
        scene.add(block);
        breakables.push(block);
      }
    }
  }
  
  // Player
  player = { x: CELL, z: CELL, yaw: 0, pitch: 0 };
  camera.position.set(player.x, 1.5, player.z);
  
  // Events
  document.addEventListener('keydown', e => keys[e.code] = true);
  document.addEventListener('keyup', e => keys[e.code] = false);
  document.addEventListener('mousemove', e => {
    if (!locked) return;
    player.yaw -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch));
  });
  
  document.getElementById('instructions').onclick = () => {
    document.body.requestPointerLock();
  };
  document.addEventListener('pointerlockchange', () => {
    locked = !!document.pointerLockElement;
    document.getElementById('instructions').style.display = locked ? 'none' : 'block';
  });
  
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  
  animate();
}

function collides(x, z, ignoreBombAt = null) {
  for (const obj of [...walls, ...breakables]) {
    if (Math.abs(obj.position.x - x) < CELL * 0.8 && Math.abs(obj.position.z - z) < CELL * 0.8) {
      return true;
    }
  }
  for (const b of bombs) {
    if (ignoreBombAt && Math.abs(b.mesh.position.x - ignoreBombAt.x) < 0.1 && Math.abs(b.mesh.position.z - ignoreBombAt.z) < 0.1) continue;
    if (Math.abs(b.mesh.position.x - x) < CELL * 0.8 && Math.abs(b.mesh.position.z - z) < CELL * 0.8) {
      return true;
    }
  }
  return false;
}

function dropBomb() {
  if (bombCount <= 0) return;
  
  const gx = Math.round(player.x / CELL) * CELL;
  const gz = Math.round(player.z / CELL) * CELL;
  
  if (bombs.some(b => b.mesh.position.x === gx && b.mesh.position.z === gz)) return;
  
  bombCount--;
  document.getElementById('bombs').textContent = bombCount;
  
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  mesh.position.set(gx, 0.4, gz);
  scene.add(mesh);
  
  const bomb = { mesh, time: 3, passable: true };
  bombs.push(bomb);
}

function explode(bomb) {
  const bx = bomb.mesh.position.x, bz = bomb.mesh.position.z;
  scene.remove(bomb.mesh);
  bombs = bombs.filter(b => b !== bomb);
  bombCount++;
  document.getElementById('bombs').textContent = bombCount;
  
  const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const range = 3;
  
  for (const [dx, dz] of dirs) {
    for (let i = (dx === 0 && dz === 0 ? 0 : 1); i <= (dx === 0 && dz === 0 ? 0 : range); i++) {
      const ex = bx + dx * i * CELL, ez = bz + dz * i * CELL;
      
      // Check wall collision
      if (walls.some(w => Math.abs(w.position.x - ex) < 0.5 && Math.abs(w.position.z - ez) < 0.5)) break;
      
      // Create explosion visual
      const exp = new THREE.Mesh(
        new THREE.BoxGeometry(CELL * 0.8, CELL * 0.8, CELL * 0.8),
        new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 })
      );
      exp.position.set(ex, CELL / 2, ez);
      scene.add(exp);
      explosions.push({ mesh: exp, time: 0.5 });
      
      // Destroy breakables
      const hit = breakables.find(b => Math.abs(b.position.x - ex) < 0.5 && Math.abs(b.position.z - ez) < 0.5);
      if (hit) {
        scene.remove(hit);
        breakables = breakables.filter(b => b !== hit);
        score += 10;
        document.getElementById('score').textContent = score;
        break;
      }
      
      // Player damage
      if (Math.abs(player.x - ex) < CELL && Math.abs(player.z - ez) < CELL) {
        alert('BOOM! Game Over! Score: ' + score);
        location.reload();
      }
    }
  }
}

function update(dt) {
  if (!locked) return;
  
  // Movement
  const speed = 5 * dt;
  let dx = 0, dz = 0;
  
  if (keys['KeyW']) { dx -= Math.sin(player.yaw); dz -= Math.cos(player.yaw); }
  if (keys['KeyS']) { dx += Math.sin(player.yaw); dz += Math.cos(player.yaw); }
  if (keys['KeyA']) { dx -= Math.cos(player.yaw); dz += Math.sin(player.yaw); }
  if (keys['KeyD']) { dx += Math.cos(player.yaw); dz -= Math.sin(player.yaw); }
  
  // Find bomb player is currently on
  const currentBomb = bombs.find(b => b.passable && Math.abs(b.mesh.position.x - player.x) < CELL * 0.8 && Math.abs(b.mesh.position.z - player.z) < CELL * 0.8);
  
  if (dx || dz) {
    const len = Math.sqrt(dx * dx + dz * dz);
    dx = dx / len * speed;
    dz = dz / len * speed;
    
    if (!collides(player.x + dx, player.z, currentBomb?.mesh.position)) player.x += dx;
    if (!collides(player.x, player.z + dz, currentBomb?.mesh.position)) player.z += dz;
  }
  
  // Check if player left any bomb they were standing on
  for (const b of bombs) {
    if (b.passable && (Math.abs(b.mesh.position.x - player.x) >= CELL * 0.8 || Math.abs(b.mesh.position.z - player.z) >= CELL * 0.8)) {
      b.passable = false;
    }
  }
  
  if (keys['Space']) {
    keys['Space'] = false;
    dropBomb();
  }
  
  camera.position.set(player.x, 1.5, player.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
  
  // Update bombs
  for (const bomb of [...bombs]) {
    bomb.time -= dt;
    bomb.mesh.material.color.setHex(Math.sin(bomb.time * 10) > 0 ? 0xff0000 : 0x111111);
    if (bomb.time <= 0) explode(bomb);
  }
  
  // Update explosions
  for (const exp of [...explosions]) {
    exp.time -= dt;
    exp.mesh.material.opacity = exp.time;
    if (exp.time <= 0) {
      scene.remove(exp.mesh);
      explosions = explosions.filter(e => e !== exp);
    }
  }
}

let lastTime = 0;
function animate(time = 0) {
  requestAnimationFrame(animate);
  update((time - lastTime) / 1000);
  lastTime = time;
  renderer.render(scene, camera);
}

init();
