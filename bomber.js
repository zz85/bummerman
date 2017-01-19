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

let world, map, player1, player2, player3;

function initGame() {
	// Game World Starts

	world = new World();
	map = new Walls(COLUMNS, ROWS);
	// map.defaultWalls();
	map.emptyWalls();

	player1 = new Player(1, 1, 'Player 1');
	player2 = new Player(COLUMNS - 2, ROWS - 2, 'Player 2');
	player3 = new Player(COLUMNS - 2, 1, 'Player 3');

	world.add(map);
	world.addPlayer(player1);
	world.addPlayer(player2);
	world.addPlayer(player3);
}

const pre = document.createElement('pre');
pre.style.cssText = `font-family: monospace; font-size: 20px; margin: 20px;
position: absolute; top: 10px; left: 10px
`;

document.body.appendChild(pre);

initGame();
init(); // init graphics unit

let last = performance.now();

const keydowns = {};
const keymappings = {};

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

	// TODO remove global timeouts?
	// for (let flumes of world.flumes) {
	// 	flumes.blow();
	// }
}

keymappings[38] = () => player1.moveUp(); // up
keymappings[40] = () => player1.moveDown(); // down
keymappings[37] = () => player1.moveLeft(); // left
keymappings[39] = () => player1.moveRight(); // right

keymappings[87] = () => player2.moveUp(); // W
keymappings[83] = () => player2.moveDown(); // S
keymappings[65] = () => player2.moveLeft(); // A
keymappings[68] = () => player2.moveRight(); // D

keymappings[73] = () => player3.moveUp(); // i
keymappings[75] = () => player3.moveDown(); // k
keymappings[74] = () => player3.moveLeft(); // j
keymappings[76] = () => player3.moveRight(); // l

document.addEventListener( 'keydown', onDocumentKeyDown, false );
document.addEventListener( 'keyup', onDocumentKeyUp, false );

function onDocumentKeyDown( event ) {
	keydowns[event.keyCode] = 1;
	console.log(event.keyCode);
	if (keymappings[event.keyCode]) keymappings[event.keyCode]();

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