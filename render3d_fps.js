// FPS Mode Renderer - First Person Shooter style controls

let USE_EFFECT = false;
let scene, camera, renderer, effect;
let platform;
const threeItems = new Set();
const options = { thirdPerson: false };

// FPS camera controls
let yaw = 0;
let pitch = 0;
window.fpsYaw = 0; // Expose for bomber.js
const MOUSE_SENSITIVITY = 0.004;
let pointerLocked = false;

// FPS controls flag - set before bomber.js loads
window.FPS_MODE = true;
window.FPS_TEST_MODE = true; // Disable bots for testing

const mapType = {
	[EMPTY]: createFloor,
	[HARD_WALL]: createHardWall,
	[SOFT_WALL]: createSoftWall
};

const mapCache = {};

function init() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	// Ambient light
	const ambient = new THREE.AmbientLight(0x404040);
	scene.add(ambient);

	// Point light that follows player
	const pointLight = new THREE.PointLight(0xffffff, 1, 100);
	pointLight.position.set(0, 20, 0);
	scene.add(pointLight);

	platform = new THREE.Object3D();
	scene.add(platform);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x1a1a2e);
	document.body.appendChild(renderer.domElement);

	// Generate map meshes
	map.forEach((x, y) => {
		mapCache[x + ',' + y + '-' + SOFT_WALL] = mapType[SOFT_WALL]();
		mapCache[x + ',' + y + '-' + HARD_WALL] = mapType[HARD_WALL]();
		positionAt(x, y, mapCache[x + ',' + y + '-' + SOFT_WALL]);
		positionAt(x, y, mapCache[x + ',' + y + '-' + HARD_WALL]);
	});

	const ground = createGround(15);
	ground.scale.multiplyScalar(15);
	platform.add(ground);

	for (var m in mapCache) {
		platform.add(mapCache[m]);
	}

	effect = new THREE.OutlineEffect(renderer, { defaultThickness: 0.007 });

	// Pointer lock for FPS controls
	renderer.domElement.addEventListener('click', () => {
		renderer.domElement.requestPointerLock();
	});

	document.addEventListener('pointerlockchange', () => {
		pointerLocked = document.pointerLockElement === renderer.domElement;
	});

	document.addEventListener('mousemove', onMouseMove);
	document.addEventListener('keydown', onFPSKeyDown);
	document.addEventListener('keyup', onFPSKeyUp);
	window.addEventListener('resize', onWindowResize);
}

// FPS-specific key tracking
const fpsKeys = {};
window.fpsKeys = fpsKeys;

function onFPSKeyDown(e) {
	fpsKeys[e.keyCode] = true;
	console.log('FPS keydown:', e.keyCode, 'fpsKeys:', JSON.stringify(fpsKeys));
	// V to toggle third person view
	if (e.keyCode === 86) {
		options.thirdPerson = !options.thirdPerson;
	}
}

function onFPSKeyUp(e) {
	fpsKeys[e.keyCode] = false;
}

function onFPSKeyHeld() {
	// Arrow keys to rotate camera
	if (fpsKeys[37]) { yaw += 0.05; }
	if (fpsKeys[39]) { yaw -= 0.05; }
	if (fpsKeys[38]) { pitch += 0.03; }
	if (fpsKeys[40]) { pitch -= 0.03; }
	pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
}

function onMouseMove(e) {
	if (!pointerLocked) return;

	yaw -= e.movementX * MOUSE_SENSITIVITY;
	pitch -= e.movementY * MOUSE_SENSITIVITY;
	pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
}

function render() {
	onFPSKeyHeld();
	updateObjects();
	updateFPSCamera();

	renderer.render(scene, camera);
}

// Override any other render that might get defined
window.render = render;

function add(o) {
	threeItems.add(o);
	platform.add(o);
	return o;
}

function remove(o) {
	threeItems.delete(o);
	platform.remove(o);
}

function updateObjects() {
	const now = Date.now();
	for (let item of threeItems) {
		item.refCount = 0;
	}

	map.forEach((x, y, v) => {
		mapCache[x + ',' + y + '-' + SOFT_WALL].visible = false;
		mapCache[x + ',' + y + '-' + HARD_WALL].visible = false;
		if (v) mapCache[x + ',' + y + '-' + v].visible = true;
	});

	const f = (t) => t < 0.5 ? t * 2 : 2 - t * 2;

	for (let item of world.objects) {
		if (item instanceof Bomb) {
			if (!item.tag) {
				item.tag = add(createBomb());
			}
			const t = f(((now - item.planted) / 500) % 1);
			item.tag.rotation.y = t * 0.5;
			item.tag.scale.setScalar(1 - t * 0.05);
			positionAt(item.x, item.y, item.tag);
		}
		else if (item instanceof Flumes) {
			if (!item.tag) {
				item.tag = add(createFlumes());
			}
			item.tag.rotation.x = now * item.seed1;
			item.tag.rotation.y = now * item.seed2;
			positionAt(item.x, item.y, item.tag);
		}
		else if (item instanceof Item) {
			if (!item.tag) {
				item.tag = add(createItem(item.type));
			}
			positionAt(item.x, item.y, item.tag);
		}
		else if (item instanceof Player) {
			if (!item.tag) {
				item.tag = add(createHero(item.color, item.color2));
			}
			item.tag.head.rotation.y = Math.sin(now / 1000 * 4) * 0.2;
			const t = item.died ? Math.min((now - item.died) / 1000, 1) : 0;
			item.tag.scale.setScalar(1 - t * 0.8);
			item.tag.rotation.y = item.lastAngle;
			positionAt(item.x, item.y, item.tag);

			// Hide player 1's model in first person mode only
			if (item === players[0] && !options.thirdPerson) {
				item.tag.visible = false;
			} else if (item === players[0] && options.thirdPerson) {
				item.tag.visible = true;
			}
		}
	}

	for (let item of threeItems) {
		if (item.refCount === 0) {
			remove(item);
		}
	}
}

function positionAt(x, y, item) {
	const cols = map ? map.columns : 15;
	const rows = map ? map.rows : 15;
	const rx = (x - cols / 2) * UNITS;
	const ry = (y - rows / 2) * UNITS;

	item.position.x = rx;
	item.position.z = ry;
	item.refCount++;
}

function updateFPSCamera() {
	const player = players[0];
	if (!player) { console.log('no player'); return; }

	const cols = map ? map.columns : 15;
	const rows = map ? map.rows : 15;

	const px = (player.x - cols / 2) * UNITS;
	const pz = (player.y - rows / 2) * UNITS;

	// Look direction from yaw/pitch
	const lookX = Math.sin(yaw) * Math.cos(pitch);
	const lookY = Math.sin(pitch);
	const lookZ = Math.cos(yaw) * Math.cos(pitch);

	if (options.thirdPerson) {
		const dist = UNITS * 4;
		const height = UNITS * 2.5;
		camera.position.set(
			px - lookX * dist,
			height,
			pz - lookZ * dist
		);
		camera.lookAt(px, UNITS * 0.5, pz);
	} else {
		camera.position.set(px, UNITS * 1.5, pz);
		// Set rotation directly instead of lookAt
		camera.rotation.order = 'YXZ';
		camera.rotation.y = yaw;
		camera.rotation.x = pitch;
		window.fpsYaw = yaw; // Update for bomber.js
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
