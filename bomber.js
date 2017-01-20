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
	map.defaultWalls();
	// map.emptyWalls();

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

	if      (keydowns[38]) player1.moveUp(); // up
	else if (keydowns[40]) player1.moveDown(); // down
	else if (keydowns[37]) player1.moveLeft(); // left
	else if (keydowns[39]) player1.moveRight(); // right
	else                   player1.moveStop();
	if      (keydowns[13]) player1.dropBomb(); // return

	if (keydowns[87]) player2.moveUp(); // W
	if (keydowns[83]) player2.moveDown(); // S
	if (keydowns[65]) player2.moveLeft(); // A
	if (keydowns[68]) player2.moveRight(); // D
	if (keydowns[16]) player2.dropBomb(); // shift. 15 = caps


	if (keydowns[73]) player3.moveUp(); // i
	if (keydowns[75]) player3.moveDown(); // k
	if (keydowns[74]) player3.moveLeft(); // j
	if (keydowns[76]) player3.moveRight(); // l
	if (keydowns[32]) player3.dropBomb(); // space

	player1.update(t);
	// for (let player of world.players) {
	// 	player.update(t);
	// }


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