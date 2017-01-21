// # TODO-list
// - Music
// Player AI
// Network
// GameAPI
// Correct resizing
// FPS View
// VR View

// # Improvement List
// - Better / fairer item distribution
// - Nicer Graphics
// - More Powerups
// - Time elements

// # Bug-list

// # Done-ish
// - Powerups
// - Better collision detections
// - 2 Players
// - Audio effects
// - Colors for players

const COLUMNS = 15;
const ROWS = 15;

let player1controls = false;

let world, map;

let player1, player2, player3, player4;

function initGame() {
	// Game World Starts

	world = new World();
	map = new Walls(COLUMNS, ROWS);
	map.defaultWalls();
	// map.emptyWalls();

	player1 = new Player(1, 1, 'Player 1', '#f00');
	player2 = new Player(COLUMNS - 2, ROWS - 2, 'Player 2', '#0f0');
	player3 = new Player(COLUMNS - 2, 1, 'Player 3', '#00f');
	player4 = new Player(1, ROWS - 2, 'Player 4', '#f0f');

	world.setMap(map);
	world.addPlayer(player1);
	world.addPlayer(player2);
	world.addPlayer(player3);
	world.addPlayer(player4);

	bot1 = new AiPlayer(player1, world);
}

const pre = document.createElement('pre');
pre.style.cssText = `font-family: monospace; font-size: 20px; margin: 20px;
position: absolute; top: 10px; left: 10px;
color: white;
text-shadow: black 2px 2px;
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

	if (player1controls) {
		if      (keydowns[38]) player1.moveUp(); // up
		else if (keydowns[40]) player1.moveDown(); // down
		else if (keydowns[37]) player1.moveLeft(); // left
		else if (keydowns[39]) player1.moveRight(); // right
		else                   player1.moveStop();
		if      (keydowns[13]) player1.dropBomb(); // return
	} else {
		bot1.update();
	}

	if (keydowns[87]) player2.moveUp(); // W
	else if (keydowns[83]) player2.moveDown(); // S
	else if (keydowns[65]) player2.moveLeft(); // A
	else if (keydowns[68]) player2.moveRight(); // D
	else                   player2.moveStop();
	if (keydowns[16]) player2.dropBomb(); // shift. 15 = caps


	if      (keydowns[73]) player3.moveUp(); // i
	else if (keydowns[75]) player3.moveDown(); // k
	else if (keydowns[74]) player3.moveLeft(); // j
	else if (keydowns[76]) player3.moveRight(); // l
	else                   player3.moveStop();
	if      (keydowns[32]) player3.dropBomb(); // space

	

	// TODO
	// Add Game Api Controllers

	for (let player of world.players) {
		player.update(t);
	}

	// TODO remove global timeouts?
	// for (let flumes of world.flumes) {
	// 	flumes.blow();
	// }
}




document.addEventListener( 'keydown', onDocumentKeyDown, false );
document.addEventListener( 'keyup', onDocumentKeyUp, false );

function onDocumentKeyDown( event ) {
	// console.log(event.keyCode);
	keydowns[event.keyCode] = 1;
	// if (keymappings[event.keyCode]) keymappings[event.keyCode]();

	switch( event.keyCode ) {


	}

}

function onDocumentKeyUp( event ) {
	keydowns[event.keyCode] = 0;
	switch( event.keyCode ) {

	}
}