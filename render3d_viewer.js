// 3D Viewer that renders from synced state (no local game logic)
const EMPTY = 0, HARD_WALL = 1, SOFT_WALL = 2;

let scene, camera, renderer, platform;
let dist = 15, angle = 0.35;
const objects = new Map(); // id -> mesh
let mapCache = {};
let gridSize = 15;

// Chase cam state
let chaseCam = false;
let chaseTarget = null;
let camPos = { x: 0, y: 5, z: 5 };
let camLook = { x: 0, y: 0, z: 0 };
let debugCamMarker = null;
let debugTargetMarker = null;

const sync = new GameSync();

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(63, window.innerWidth / window.innerHeight, 0.1, 1000);

	scene.add(new THREE.PointLight(0xffffff).translateX(15).translateY(5).translateZ(15));
	platform = new THREE.Object3D();
	scene.add(platform);

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	const ground = createGround(15);
	ground.scale.multiplyScalar(15);
	platform.add(ground);

	// Debug markers - red sphere for camera target pos, blue for look-at
	debugCamMarker = new THREE.Mesh(
		new THREE.SphereGeometry(0.5),
		new THREE.MeshBasicMaterial({ color: 0xff0000 })
	);
	debugTargetMarker = new THREE.Mesh(
		new THREE.SphereGeometry(1),
		new THREE.MeshBasicMaterial({ color: 0x00ff00 })
	);
	debugCamMarker.position.set(0, 5, 0);
	debugTargetMarker.position.set(0, 5, 0);
	scene.add(debugCamMarker);
	scene.add(debugTargetMarker);
	console.log('Debug markers added', debugCamMarker, debugTargetMarker);

	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	sync.on('state', applyState);
	animate();
}

function applyState(state) {
	const p0 = state.players?.[0];
	const angleInfo = p0 ? ` | P1 angle: ${p0.angle?.toFixed(2) ?? 'undef'}` : '';
	document.getElementById('status').textContent = `Players: ${state.players?.length || 0} | Bombs: ${state.bombs?.length || 0}${angleInfo}`;
	
	if (state.gridSize && state.gridSize !== gridSize) {
		gridSize = state.gridSize;
		rebuildMapCache();
	}

	// Update map
	if (state.map) {
		for (let y = 0; y < gridSize; y++) {
			for (let x = 0; x < gridSize; x++) {
				const v = state.map[y * gridSize + x];
				const key = `${x},${y}`;
				if (mapCache[key + '-' + SOFT_WALL]) mapCache[key + '-' + SOFT_WALL].visible = v === SOFT_WALL;
				if (mapCache[key + '-' + HARD_WALL]) mapCache[key + '-' + HARD_WALL].visible = v === HARD_WALL;
			}
		}
	}

	// Track which objects are still present
	const seen = new Set();

	// Players
	(state.players || []).forEach((p, i) => {
		const id = 'player-' + p.id;
		seen.add(id);
		let mesh = objects.get(id);
		if (!mesh) {
			mesh = createHero(p.color || 0x00ff00, p.color2 || 0x0000ff);
			objects.set(id, mesh);
			platform.add(mesh);
		}
		positionAt(p.x, p.y, mesh);
		mesh.rotation.y = p.angle || 0;
		mesh.scale.setScalar(p.died ? 0.2 : 1);
		mesh._playerData = p;
		if (i === 0) chaseTarget = mesh;
	});

	// Bombs
	(state.bombs || []).forEach(b => {
		const id = 'bomb-' + b.id;
		seen.add(id);
		let mesh = objects.get(id);
		if (!mesh) {
			mesh = createBomb();
			objects.set(id, mesh);
			platform.add(mesh);
		}
		positionAt(b.x, b.y, mesh);
	});

	// Flumes
	(state.flumes || []).forEach(f => {
		const id = 'flume-' + f.id;
		seen.add(id);
		let mesh = objects.get(id);
		if (!mesh) {
			mesh = createFlumes();
			objects.set(id, mesh);
			platform.add(mesh);
		}
		positionAt(f.x, f.y, mesh);
	});

	// Items
	(state.items || []).forEach(i => {
		const id = 'item-' + i.id;
		seen.add(id);
		let mesh = objects.get(id);
		if (!mesh) {
			mesh = createItem(i.type);
			objects.set(id, mesh);
			platform.add(mesh);
		}
		positionAt(i.x, i.y, mesh);
	});

	// Remove stale objects
	for (const [id, mesh] of objects) {
		if (!seen.has(id)) {
			platform.remove(mesh);
			objects.delete(id);
		}
	}
}

function rebuildMapCache() {
	for (const m in mapCache) platform.remove(mapCache[m]);
	mapCache = {};
	for (let y = 0; y < gridSize; y++) {
		for (let x = 0; x < gridSize; x++) {
			const soft = createSoftWall();
			const hard = createHardWall();
			positionAt(x, y, soft);
			positionAt(x, y, hard);
			soft.visible = hard.visible = false;
			mapCache[`${x},${y}-${SOFT_WALL}`] = soft;
			mapCache[`${x},${y}-${HARD_WALL}`] = hard;
			platform.add(soft);
			platform.add(hard);
		}
	}
}

function positionAt(x, y, item) {
	item.position.x = (x - gridSize / 2) * UNITS;
	item.position.z = (y - gridSize / 2) * UNITS;
}

function animate() {
	requestAnimationFrame(animate);
	
	// Update debug markers always (when target exists)
	if (chaseTarget) {
		const targetWorld = new THREE.Vector3();
		chaseTarget.getWorldPosition(targetWorld);
		console.log('targetWorld', targetWorld.x, targetWorld.z);
		
		const a = chaseTarget.rotation.y;
		const behindDist = 36;
		const height = 44;
		const tx = targetWorld.x - Math.sin(a) * behindDist;
		const tz = targetWorld.z - Math.cos(a) * behindDist;
		
		// Debug markers
		debugCamMarker.position.set(tx, height, tz);
		debugTargetMarker.position.set(targetWorld.x, 15, targetWorld.z);
		console.log('green sphere at', debugTargetMarker.position.x, debugTargetMarker.position.z);
		
		// Debug
		document.getElementById('status').textContent = 
			`player(${targetWorld.x.toFixed(1)}, ${targetWorld.z.toFixed(1)}) | cam(${tx.toFixed(1)}, ${tz.toFixed(1)}) | sin:${Math.sin(a).toFixed(2)} cos:${Math.cos(a).toFixed(2)}`;
		
		if (chaseCam) {
			// Use marker positions directly
			const lerp = 0.15;
			camPos.x += (debugCamMarker.position.x - camPos.x) * lerp;
			camPos.y += (debugCamMarker.position.y - camPos.y) * lerp;
			camPos.z += (debugCamMarker.position.z - camPos.z) * lerp;
			
			camera.position.set(camPos.x, camPos.y, camPos.z);
			camera.lookAt(debugTargetMarker.position);
		} else {
			// Reset camPos when not in chase mode
			camPos.x = debugCamMarker.position.x;
			camPos.y = debugCamMarker.position.y;
			camPos.z = debugCamMarker.position.z;
		}
	}
	
	if (!chaseCam) {
		camera.position.y = UNITS * dist;
		camera.position.z = UNITS * dist * angle;
		camera.position.x = 0;
		camera.lookAt(scene.position);
	}
	
	renderer.render(scene, camera);
}

window.onload = () => {
	init();
	rebuildMapCache();
};
