// TODO
// Better collision detections
// Powerups
// Player AI
// Audio effects

const COLUMNS = 15;
const ROWS = 15;
const CELL_PIXELS = 45;

// Game styles
// AsCII
// 2D
// 2.5D / 3D
// VR
// MMORPG

// Game World Starts

const world = new World();
const map = new Walls(COLUMNS, ROWS);
map.defaultWalls();

const player1 = new Player(1, 1);

world.add(map);
world.add(player1);

const canvas = document.createElement('canvas');
canvas.width = CELL_PIXELS * COLUMNS + 50;
canvas.height = CELL_PIXELS * COLUMNS + 50;
document.body.appendChild(canvas);

const pre = document.createElement('pre');
pre.style.cssText = 'font-family: monospace; font-size: 20px; margin: 20px';

document.body.appendChild(pre);

const ctx = canvas.getContext('2d');
let last = performance.now();

const keydowns = {};

function globalLoop() {
	requestAnimationFrame(globalLoop);
	const now = performance.now();
	const dt = now - last;
	last = now;
	if (dt > 1000) return;
	loop(dt);
	render();
}

globalLoop();

function loop(dt) {
	const t = dt / 1000;

	if (keydowns[38]) player1.moveUp(t);
	if (keydowns[40]) player1.moveDown(t);
	if (keydowns[37]) player1.moveLeft(t);
	if (keydowns[39]) player1.moveRight(t);

	// Here is the game loop
	// TODO remove global timeouts?
	// for (let flumes of world.flumes) {
	// 	flumes.blow();
	// }
}

function render() {
	// Here is the render Loop
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	let now = Date.now();
	// walls
	map.forEach((x, y, v) => {

		switch (v) {
			case 1: ctx.fillStyle = '#333'; break;
			case 2: ctx.fillStyle = '#888'; break;
			default: ctx.fillStyle = '#eee';
		}

		ctx.strokeStyle = '#333';
		ctx.fillRect(x * CELL_PIXELS, y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
		if (v) ctx.strokeRect(x * CELL_PIXELS, y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
	});

	for (let item of world.objects) {
		if (item instanceof Bomb) {
			let size = 1 - Math.sin((now - item.planted)/ 1000 * 8) * 0.2;
			ctx.fillStyle = 'red';
			ctx.beginPath();
			ctx.arc((item.snapX() + 0.5) * CELL_PIXELS, (item.snapY() + 0.5) * CELL_PIXELS, CELL_PIXELS / 3 * size, 0, Math.PI * 2);
			ctx.fill();
		}
		else if (item instanceof Flumes) {
			ctx.fillStyle = 'orange';
			ctx.fillRect(item.x * CELL_PIXELS, item.y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
		}
		else if (item instanceof Item) {
			ctx.fillStyle = 'orange';
			ctx.fillRect((item.x + 0.1) * CELL_PIXELS, (item.y + 0.1) * CELL_PIXELS, CELL_PIXELS * 0.8, CELL_PIXELS * 0.8);

			ctx.fillStyle = 'red';
			ctx.fillText(item.type, (item.x + 0.5) * CELL_PIXELS, (item.y + 0.5) * CELL_PIXELS);
		}
	}

	// player
	ctx.fillStyle = '#0d0';
	ctx.fillRect(player1.x * CELL_PIXELS, player1.y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);

	ctx.fillStyle = '#999';
	ctx.fillText(`${player1.x}, ${player1.y}`, 50, 50);
}

document.addEventListener( 'keydown', onDocumentKeyDown, false );
document.addEventListener( 'keyup', onDocumentKeyUp, false );

function onDocumentKeyDown( event ) {
	keydowns[event.keyCode] = 1;
	console.log(event.keyCode);
	switch( event.keyCode ) {
		// case 87:
		// 	// up W
		// 	player1.moveUp(); break;
		// case 83:
		// 	// down D
		// 	player1.moveDown(); break;
		// case 65:
		// 	// left A
		// 	player1.moveLeft(); break;
		// case 68:
		// 	// right D
		// 	player1.moveRight(); break;

		// case 38:
		// 	// up
		// 	player1.moveUp(); break;
		// case 40:
		// 	// down D
		// 	player1.moveDown(); break;
		// case 37:
		// 	// left A
		// 	player1.moveLeft(); break;
		// case 39:
		// 	// right D
		// 	player1.moveRight(); break;

		case 13:
			// Return
			player1.dropBomb();
			break;


		case 16: isShiftDown = true; break;
		case 17: isCtrlDown = true; break;

	}

}

function onDocumentKeyUp( event ) {
	keydowns[event.keyCode] = 0;
	switch( event.keyCode ) {

		case 16: isShiftDown = false; break;
		case 17: isCtrlDown = false; break;

	}
}