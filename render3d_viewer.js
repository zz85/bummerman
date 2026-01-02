// 3D Viewer that renders from synced state (no local game logic)
const EMPTY = 0, HARD_WALL = 1, SOFT_WALL = 2;

let scene, camera, renderer, platform;
let dist = 15, angle = 0.35;
const objects = new Map(); // id -> mesh
let mapCache = {};
let gridSize = 15;

const sync = new GameSync();

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.setFocalLength(35);

	scene.add(new THREE.PointLight(0xffffff).translateX(15).translateY(5).translateZ(15));
	platform = new THREE.Object3D();
	scene.add(platform);

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	const ground = createGround(15);
	ground.scale.multiplyScalar(15);
	platform.add(ground);

	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	sync.on('state', applyState);
	animate();
}

function applyState(state) {
	document.getElementById('status').textContent = `Players: ${state.players?.length || 0} | Bombs: ${state.bombs?.length || 0}`;
	
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
	(state.players || []).forEach(p => {
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
	camera.position.y = UNITS * dist;
	camera.position.z = UNITS * dist * angle;
	camera.lookAt(scene.position);
	renderer.render(scene, camera);
}

window.onload = () => {
	init();
	rebuildMapCache();
};
