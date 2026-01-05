import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const GRID = 15, CELL = 2;
let scene, camera, renderer, player, walls = [], breakables = [], bombs = [], explosions = [], enemies = [], powerups = [];
let keys = {}, bombCount = 3, blastRange = 3, speed = 5, score = 0, locked = false;
let minimap, minimapCtx;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 10, 30);
  
  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(10, 20, 10);
  light.castShadow = true;
  scene.add(light);
  
  // Floor with checkerboard
  const floorGeo = new THREE.PlaneGeometry(GRID * CELL, GRID * CELL, GRID, GRID);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2d4a3e, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(GRID * CELL / 2 - CELL / 2, 0, GRID * CELL / 2 - CELL / 2);
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5 });
  const breakMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
  const wallGeo = new THREE.BoxGeometry(CELL, CELL, CELL);
  
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const pos = new THREE.Vector3(x * CELL, CELL / 2, z * CELL);
      
      if (x === 0 || x === GRID - 1 || z === 0 || z === GRID - 1 || (x % 2 === 0 && z % 2 === 0)) {
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.copy(pos);
        wall.castShadow = true;
        scene.add(wall);
        walls.push(wall);
      } else if (Math.random() > 0.4 && !(x < 3 && z < 3) && !(x > GRID - 4 && z > GRID - 4)) {
        const block = new THREE.Mesh(wallGeo, breakMat);
        block.position.copy(pos);
        block.castShadow = true;
        scene.add(block);
        breakables.push(block);
      }
    }
  }
  
  // Player
  player = { x: CELL, z: CELL, yaw: 0, pitch: 0 };
  camera.position.set(player.x, 1.5, player.z);
  
  // Spawn enemies
  spawnEnemies(3);
  
  // Minimap
  minimap = document.getElementById('minimap');
  minimapCtx = minimap.getContext('2d');
  
  // Events
  document.addEventListener('keydown', e => keys[e.code] = true);
  document.addEventListener('keyup', e => keys[e.code] = false);
  document.addEventListener('mousemove', e => {
    if (!locked) return;
    player.yaw -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch));
  });
  
  document.getElementById('instructions').onclick = () => document.body.requestPointerLock();
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

function spawnEnemies(count) {
  const enemyGeo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
  const enemyMat = new THREE.MeshStandardMaterial({ color: 0xff3366 });
  
  for (let i = 0; i < count; i++) {
    let ex, ez;
    do {
      ex = (Math.floor(Math.random() * (GRID - 4)) + 2) * CELL;
      ez = (Math.floor(Math.random() * (GRID - 4)) + 2) * CELL;
    } while (collides(ex, ez) || (ex < CELL * 4 && ez < CELL * 4));
    
    const mesh = new THREE.Mesh(enemyGeo, enemyMat);
    mesh.position.set(ex, 0.6, ez);
    mesh.castShadow = true;
    scene.add(mesh);
    enemies.push({ 
      mesh, 
      dir: Math.floor(Math.random() * 4),
      moveTimer: 0,
      bombTimer: 5 + Math.random() * 5
    });
  }
}

function spawnPowerup(x, z) {
  if (Math.random() > 0.4) return;
  
  const types = ['bomb', 'blast', 'speed'];
  const type = types[Math.floor(Math.random() * types.length)];
  const colors = { bomb: 0x00ff00, blast: 0xff9900, speed: 0x00ffff };
  
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.3),
    new THREE.MeshStandardMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.5 })
  );
  mesh.position.set(x, 0.5, z);
  scene.add(mesh);
  powerups.push({ mesh, type });
}

function collides(x, z, ignoreBombAt = null) {
  for (const obj of [...walls, ...breakables]) {
    if (Math.abs(obj.position.x - x) < CELL * 0.8 && Math.abs(obj.position.z - z) < CELL * 0.8) return true;
  }
  for (const b of bombs) {
    if (ignoreBombAt && Math.abs(b.mesh.position.x - ignoreBombAt.x) < 0.1 && Math.abs(b.mesh.position.z - ignoreBombAt.z) < 0.1) continue;
    if (Math.abs(b.mesh.position.x - x) < CELL * 0.8 && Math.abs(b.mesh.position.z - z) < CELL * 0.8) return true;
  }
  return false;
}

function dropBomb(x, z, isEnemy = false) {
  if (!isEnemy && bombCount <= 0) return;
  
  const gx = Math.round(x / CELL) * CELL;
  const gz = Math.round(z / CELL) * CELL;
  
  if (bombs.some(b => b.mesh.position.x === gx && b.mesh.position.z === gz)) return;
  
  if (!isEnemy) {
    bombCount--;
    document.getElementById('bombs').textContent = bombCount;
  }
  
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  const fuse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.8 })
  );
  fuse.position.y = 0.4;
  group.add(body, fuse);
  group.position.set(gx, 0.4, gz);
  scene.add(group);
  
  const bomb = { mesh: group, fuse, time: 3, passable: !isEnemy, isEnemy, range: isEnemy ? 2 : blastRange };
  bombs.push(bomb);
}

function explode(bomb) {
  const bx = bomb.mesh.position.x, bz = bomb.mesh.position.z;
  scene.remove(bomb.mesh);
  bombs = bombs.filter(b => b !== bomb);
  
  if (!bomb.isEnemy) {
    bombCount++;
    document.getElementById('bombs').textContent = bombCount;
  }
  
  playSound('explode');
  
  const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  
  for (const [dx, dz] of dirs) {
    for (let i = (dx === 0 && dz === 0 ? 0 : 1); i <= (dx === 0 && dz === 0 ? 0 : bomb.range); i++) {
      const ex = bx + dx * i * CELL, ez = bz + dz * i * CELL;
      
      if (walls.some(w => Math.abs(w.position.x - ex) < 0.5 && Math.abs(w.position.z - ez) < 0.5)) break;
      
      // Explosion particles
      for (let p = 0; p < 5; p++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.1 + Math.random() * 0.2),
          new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff6600 : 0xffcc00, transparent: true })
        );
        particle.position.set(ex + (Math.random() - 0.5), Math.random() * CELL, ez + (Math.random() - 0.5));
        scene.add(particle);
        explosions.push({ mesh: particle, time: 0.3 + Math.random() * 0.2, vel: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 3, (Math.random() - 0.5) * 5) });
      }
      
      // Destroy breakables
      const hit = breakables.find(b => Math.abs(b.position.x - ex) < 0.5 && Math.abs(b.position.z - ez) < 0.5);
      if (hit) {
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
        scene.remove(enemyHit.mesh);
        enemies = enemies.filter(e => e !== enemyHit);
        score += 100;
        document.getElementById('score').textContent = score;
        document.getElementById('enemies').textContent = enemies.length;
        if (enemies.length === 0) win();
      }
      
      // Player damage
      if (Math.abs(player.x - ex) < CELL && Math.abs(player.z - ez) < CELL) gameOver();
    }
  }
}

function updateEnemies(dt) {
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  
  for (const enemy of enemies) {
    enemy.moveTimer -= dt;
    enemy.bombTimer -= dt;
    
    if (enemy.moveTimer <= 0) {
      enemy.moveTimer = 0.5;
      
      // Change direction randomly or if blocked
      if (Math.random() < 0.2) enemy.dir = Math.floor(Math.random() * 4);
      
      const [dx, dz] = dirs[enemy.dir];
      const nx = enemy.mesh.position.x + dx * CELL;
      const nz = enemy.mesh.position.z + dz * CELL;
      
      if (!collides(nx, nz)) {
        enemy.mesh.position.x = nx;
        enemy.mesh.position.z = nz;
      } else {
        enemy.dir = Math.floor(Math.random() * 4);
      }
    }
    
    // Drop bomb occasionally
    if (enemy.bombTimer <= 0) {
      enemy.bombTimer = 8 + Math.random() * 7;
      dropBomb(enemy.mesh.position.x, enemy.mesh.position.z, true);
    }
    
    // Check collision with player
    if (Math.abs(enemy.mesh.position.x - player.x) < CELL * 0.6 && Math.abs(enemy.mesh.position.z - player.z) < CELL * 0.6) {
      gameOver();
    }
  }
}

function updatePowerups() {
  for (const p of [...powerups]) {
    p.mesh.rotation.y += 0.02;
    
    if (Math.abs(p.mesh.position.x - player.x) < CELL * 0.6 && Math.abs(p.mesh.position.z - player.z) < CELL * 0.6) {
      playSound('powerup');
      if (p.type === 'bomb') bombCount++;
      else if (p.type === 'blast') blastRange++;
      else if (p.type === 'speed') speed += 1;
      
      document.getElementById('bombs').textContent = bombCount;
      scene.remove(p.mesh);
      powerups = powerups.filter(x => x !== p);
    }
  }
}

function drawMinimap() {
  const s = 150 / GRID;
  minimapCtx.fillStyle = '#111';
  minimapCtx.fillRect(0, 0, 150, 150);
  
  // Walls
  minimapCtx.fillStyle = '#444';
  for (const w of walls) minimapCtx.fillRect(w.position.x / CELL * s, w.position.z / CELL * s, s, s);
  
  // Breakables
  minimapCtx.fillStyle = '#654321';
  for (const b of breakables) minimapCtx.fillRect(b.position.x / CELL * s, b.position.z / CELL * s, s, s);
  
  // Bombs
  minimapCtx.fillStyle = '#f00';
  for (const b of bombs) minimapCtx.fillRect(b.mesh.position.x / CELL * s - 2, b.mesh.position.z / CELL * s - 2, 4, 4);
  
  // Enemies
  minimapCtx.fillStyle = '#f36';
  for (const e of enemies) minimapCtx.fillRect(e.mesh.position.x / CELL * s - 3, e.mesh.position.z / CELL * s - 3, 6, 6);
  
  // Player
  minimapCtx.fillStyle = '#0f0';
  minimapCtx.beginPath();
  minimapCtx.arc(player.x / CELL * s, player.z / CELL * s, 4, 0, Math.PI * 2);
  minimapCtx.fill();
  
  // Player direction
  minimapCtx.strokeStyle = '#0f0';
  minimapCtx.beginPath();
  minimapCtx.moveTo(player.x / CELL * s, player.z / CELL * s);
  minimapCtx.lineTo(player.x / CELL * s - Math.sin(player.yaw) * 10, player.z / CELL * s - Math.cos(player.yaw) * 10);
  minimapCtx.stroke();
}

function playSound(type) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'explode') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'powerup') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }
}

function gameOver() {
  alert('BOOM! Game Over! Score: ' + score);
  location.reload();
}

function win() {
  alert('YOU WIN! All enemies defeated! Score: ' + score);
  location.reload();
}

function update(dt) {
  if (!locked) return;
  
  let dx = 0, dz = 0;
  if (keys['KeyW']) { dx -= Math.sin(player.yaw); dz -= Math.cos(player.yaw); }
  if (keys['KeyS']) { dx += Math.sin(player.yaw); dz += Math.cos(player.yaw); }
  if (keys['KeyA']) { dx -= Math.cos(player.yaw); dz += Math.sin(player.yaw); }
  if (keys['KeyD']) { dx += Math.cos(player.yaw); dz -= Math.sin(player.yaw); }
  
  const currentBomb = bombs.find(b => b.passable && Math.abs(b.mesh.position.x - player.x) < CELL * 0.8 && Math.abs(b.mesh.position.z - player.z) < CELL * 0.8);
  
  if (dx || dz) {
    const len = Math.sqrt(dx * dx + dz * dz);
    dx = dx / len * speed * dt;
    dz = dz / len * speed * dt;
    if (!collides(player.x + dx, player.z, currentBomb?.mesh.position)) player.x += dx;
    if (!collides(player.x, player.z + dz, currentBomb?.mesh.position)) player.z += dz;
  }
  
  for (const b of bombs) {
    if (b.passable && (Math.abs(b.mesh.position.x - player.x) >= CELL * 0.8 || Math.abs(b.mesh.position.z - player.z) >= CELL * 0.8)) {
      b.passable = false;
    }
  }
  
  if (keys['Space']) { keys['Space'] = false; dropBomb(player.x, player.z); }
  
  camera.position.set(player.x, 1.5, player.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
  
  // Update bombs
  for (const bomb of [...bombs]) {
    bomb.time -= dt;
    bomb.fuse.material.emissiveIntensity = Math.sin(bomb.time * 15) * 0.5 + 0.5;
    bomb.mesh.children[0].material.color.setHex(Math.sin(bomb.time * 10) > 0 ? 0xff0000 : 0x111111);
    if (bomb.time <= 0) explode(bomb);
  }
  
  // Update explosions
  for (const exp of [...explosions]) {
    exp.time -= dt;
    exp.mesh.position.add(exp.vel.clone().multiplyScalar(dt));
    exp.vel.y -= 10 * dt;
    exp.mesh.material.opacity = exp.time * 2;
    if (exp.time <= 0) {
      scene.remove(exp.mesh);
      explosions = explosions.filter(e => e !== exp);
    }
  }
  
  updateEnemies(dt);
  updatePowerups();
  drawMinimap();
}

let lastTime = 0;
function animate(time = 0) {
  requestAnimationFrame(animate);
  update((time - lastTime) / 1000);
  lastTime = time;
  renderer.render(scene, camera);
}

init();
