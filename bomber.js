// # TODO-list
// - Music
// Player AI
// Network
// 2.5D view
// Time elements

// # Improvement List
// - Better / fairer item distribution
// - Nicer Graphics
// - More Powerups

// # Bug-list

// # Done-ish
// - Powerups
// - Better collision detections
// - 2 Players
// - Audio effects

const COLUMNS = 15;
const ROWS = 15;
const CELL_PIXELS = 45;

// Game World Starts

const world = new World();
const map = new Walls(COLUMNS, ROWS);
// map.defaultWalls();
map.emptyWalls();

const player1 = new Player(1, 1, 'Player 1');
const player2 = new Player(COLUMNS - 2, ROWS - 2, 'Player 2');
const player3 = new Player(COLUMNS - 2, 1, 'Player 3');

world.add(map);
world.addPlayer(player1);
world.addPlayer(player2);
world.addPlayer(player3);

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
	// Here is the game loop

	const t = dt / 1000;
	player1.update(t);


	// if (keydowns[73]) player3.moveUp(t); // i
	// if (keydowns[75]) player3.moveDown(t); // k
	// if (keydowns[74]) player3.moveLeft(t); // j
	// if (keydowns[76]) player3.moveRight(t); // l

	// if (keydowns[87]) player2.moveUp(t); // W
	// if (keydowns[83]) player2.moveDown(t); // S
	// if (keydowns[65]) player2.moveLeft(t); // A
	// if (keydowns[68]) player2.moveRight(t); // D

	if (keydowns[38]) player1.moveUp(t); // up
	if (keydowns[40]) player1.moveDown(t); // down
	if (keydowns[37]) player1.moveLeft(t); // left
	if (keydowns[39]) player1.moveRight(t); // right

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

	const f = (t) => t < 0.5 ? t * 2 : 2 - t * 2;
	// Math.sin((now - item.planted)/ 1000 * 8)

	for (let item of world.objects) {
		if (item instanceof Bomb) {
			let size = 1 - f(((now - item.planted) / 800) % 1) * 0.2;
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

	for (let player of world.players) {
		// TODO disolve player after dying...
		const x = player.x * CELL_PIXELS;
		const y = player.y * CELL_PIXELS;
		// player
		ctx.fillStyle = '#0d0';
		ctx.fillRect(x, y, CELL_PIXELS, CELL_PIXELS);

		ctx.fillStyle = '#999';
		ctx.fillText(`${player.name} (${player.x}, ${player.y})`, x + 10, y + 10);
	}

}

document.addEventListener( 'keydown', onDocumentKeyDown, false );
document.addEventListener( 'keyup', onDocumentKeyUp, false );

function onDocumentKeyDown( event ) {
	keydowns[event.keyCode] = 1;
	console.log(event.keyCode);
	switch( event.keyCode ) {
		case 13:
			// Return
			player1.dropBomb();
			break;

		case 16: // 17
			player2.dropBomb();
			break;

		case 32:
			player3.dropBomb();
			break;
		// case 16: isShiftDown = true; break;
		// case 17: isCtrlDown = true; break;

	}

}

function onDocumentKeyUp( event ) {
	keydowns[event.keyCode] = 0;
	switch( event.keyCode ) {

		case 16: isShiftDown = false; break;
		case 17: isCtrlDown = false; break;

	}
}