let scene, camera, renderer;
let platform;
let dist = 15;
let angle = 0.35; // 0 for top down, 1, for isometric
const threeItems = new Set();

const mapType = {
	[EMPTY]: createFloor,
	[HARD_WALL]: createHardWall,
	[SOFT_WALL]: createSoftWall
};

const mapCache = {};

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

	// Generate a poll of meshes first
	map.forEach((x, y) => {
		mapCache[x + ',' + y + '-' + EMPTY] = mapType[EMPTY]();
		mapCache[x + ',' + y + '-' + SOFT_WALL] = mapType[SOFT_WALL]();
		mapCache[x + ',' + y + '-' + HARD_WALL] = mapType[HARD_WALL]();

		positionAt(x, y, mapCache[x + ',' + y + '-' + EMPTY]);
		positionAt(x, y, mapCache[x + ',' + y + '-' + SOFT_WALL]);
		positionAt(x, y, mapCache[x + ',' + y + '-' + HARD_WALL]);
	});

	for (var m in mapCache) {
		platform.add(mapCache[m]);
	}

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

function updateObjects() {
	for (let item of threeItems) {
		item.refCount = 0;
	}

	map.forEach((x, y, v) => {
		mapCache[x + ',' + y + '-' + EMPTY].visible = false;
		mapCache[x + ',' + y + '-' + SOFT_WALL].visible = false;
		mapCache[x + ',' + y + '-' + HARD_WALL].visible = false;

		mapCache[x + ',' + y + '-' + v].visible = true;
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
				item.tag = add(createItem());
			}

			positionAt(item.x, item.y, item.tag);
		}
		else if (item instanceof Player) {
			if (!item.tag) {
				item.tag = add(createHero());
			}

			item.tag.rotation.y = item.lastAngle;
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
	// camera.position.y = UNITS * dist;
	// camera.position.z = UNITS * dist * angle;

	const t = Date.now() / 1000;
	camera.position.y = UNITS * dist;
	camera.position.x = Math.cos(t) * UNITS * dist;
	camera.position.z = Math.sin(t) * UNITS * dist;


	camera.lookAt(scene.position);
	renderer.render(scene, camera);
}