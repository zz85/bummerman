let scene, camera, renderer;
let platform;
let dist = 15;
let angle = 0.35; // 0 for top down, 1, for isometric
const threeItems = new Set();

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.setFocalLength(35);

	const pointLight = new THREE.PointLight( 0xffffff );
	pointLight.position.set(15, 5, 15);
	scene.add(pointLight);

	// We use plaform to add game objects
	platform = new THREE.Object3D();
	scene.add(platform);

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
}

function render() {
	updateObjects();
	updateRender();
}

function add(o) {
	threeItems.add(o);
	platform.add(o);
	return o;
}

function remove(o) {
	threeItems.delete(o);
	platform.remove(o);
}

const mapType = {
	[EMPTY]: createFloor,
	[HARD_WALL]: createHardWall,
	[SOFT_WALL]: createSoftWall
}

function updateObjects() {
	for (let item of threeItems) {
		item.refCount = 0;
	}

	map.forEach((x, y, v) => {
		positionAt(x, y, add(mapType[v]()));
	});

	for (let item of world.objects) {
		if (item instanceof Bomb) {
			// let size = 1 - f(((now - item.planted) / 800) % 1) * 0.2;
			if (!item.tag) {
				item.tag = add(createBomb());
			}

			positionAt(item.x, item.y, item.tag);
		}
		else if (item instanceof Flumes) {
			if (!item.tag) {
				item.tag = add(createFlumes());
			}
			
			positionAt(item.x, item.y, item.tag);
		}
		else if (item instanceof Item) {
			// TODO
			if (!item.tag) {
				item.tag = add(createFloor());
			}

			positionAt(item.x, item.y, item.tag);
		}
		else if (item instanceof Player) {
			if (!item.tag) {
				item.tag = add(createHero());
			}

			positionAt(item.x, item.y, item.tag);
		}
	}

	for (let item of threeItems) {
		if (item.refCount === 0) {
			remove(item);	
		}
	}
}

function positionAt(x, y, item) {
	const rx = (x - COLUMNS / 2) * UNITS;
	const ry = (y - ROWS / 2) * UNITS;

	item.position.x = rx;
	item.position.z = ry;

	item.refCount++;
}

function updateRender() {
	// platform.rotation.y += 0.001;
	camera.position.y = UNITS * dist;
	camera.position.z = UNITS * dist * angle;

	camera.lookAt(scene.position);
	renderer.render(scene, camera);
}