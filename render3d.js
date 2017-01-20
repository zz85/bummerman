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
	const now = Date.now();
	for (let item of threeItems) {
		item.refCount = 0;
	}

	map.forEach((x, y, v) => {
		mapCache[x + ',' + y + '-' + EMPTY].visible = false;
		mapCache[x + ',' + y + '-' + SOFT_WALL].visible = false;
		mapCache[x + ',' + y + '-' + HARD_WALL].visible = false;

		mapCache[x + ',' + y + '-' + v].visible = true;
	});

	const f = (t) => t < 0.5 ? t * 2 : 2 - t * 2;

	// TODO move animation update into subroutines?
	for (let item of world.objects) {
		if (item instanceof Bomb) {
			let size = 1 - f(((now - item.planted) / 500) % 1) * 0.05;
			if (!item.tag) {
				item.tag = add(createBomb());
			}

			item.tag.scale.setScalar(size);

			positionAt(item.x, item.y, item.tag);
		}
		else if (item instanceof Flumes) {
			if (!item.tag) {
				item.tag = add(createFlumes());
			}
			item.tag.rotation.x = now * item.seed1;
			item.tag.rotation.y = now * item.seed2;
			item.tag.rotation.z = now * item.seed3;
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
			const player = item;
			if (!item.tag) {
				item.tag = add(createHero(item.color));
			}

			item.tag.head.rotation.y = Math.sin(now / 1000 * 4) * 0.2;
			item.tag.rotation.x = Math.sin(now / 1000 * 1) * 0.1;

			const t = player.died ? Math.min((now - player.died) / 1000, 1) : 0;
			item.tag.scale.setScalar(1 - t * 0.8);
			item.tag.rotation.x = t * -Math.PI / 2;
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

var absPosition = new THREE.Vector3();

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
	// camera.lookAt(scene.position);

	// // Rotation
	// // const t = Date.now() / 1000;
	// // camera.position.y = UNITS * dist;
	// // camera.position.x = Math.cos(t) * UNITS * dist;
	// // camera.position.z = Math.sin(t) * UNITS * dist;


	// camera.lookAt(scene.position);
	// renderer.render(scene, camera);

	// 4 4

	camera.setFocalLength(16)
	camera.position.y = player1.tag.position.y + UNITS * 2;
	camera.position.z = player1.tag.position.z + UNITS * 2;
	camera.position.x = player1.tag.position.x;
	absPosition.setFromMatrixPosition(player1.tag.matrixWorld);
	camera.lookAt(absPosition);

	renderer.render(scene, camera);
}