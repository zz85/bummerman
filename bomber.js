// # TODO-list
// - Music
// Network
// GameAPI
// Touch (Mobile Controls)
// Correct resizing
// FPS View
// VR View
// Start / End Games.
// Vozelization
// Integrate Happy Fun Times

// # Improvement List
// - Better / fairer item distribution
// - Nicer Graphics (Powerup Items)
// - More Powerups
// - Time elements

// # Bug-list
// Player gets untrapped from dropped bombs.

// # Done-ish
// - Powerups
// - Better collision detections
// - 2 Players
// - Audio effects
// - Colors for players
// - Player AI

const COLUMNS = 15;
const ROWS = 15;

let player1bot = !true;
let player2bot = !true;
let player3bot = true;
let player4bot = true;

let world, map;

let player1, player2, player3, player4;

function initGame() {
	// Game World Starts

	world = new World();
	map = new Walls(COLUMNS, ROWS);

	// PC1 = '#f00'
	// PC2 = '#0f0'
	// PC3 = '#00f'
	// PC4 = '#f0f'
	PC1 = COLORS[0]
	PC2 = COLORS[1]
	PC3 = COLORS[2]
	PC4 = COLORS[3]


	player1 = new Player(5, 5, 'Player 1', PC1[8], PC1[6]);
	player2 = new Player(COLUMNS - 6, ROWS - 6, 'Player 2', PC2[8], PC2[6]);
	player3 = new Player(COLUMNS - 6, 5, 'Player 3', PC3[8], PC3[6]);
	player4 = new Player(5, ROWS - 6, 'Player 4', PC4[8], PC4[6]);

	player1b = new Player(1, 1, 'Player 1', PC1[8], PC1[6]);
	player2b = new Player(COLUMNS - 2, ROWS - 2, 'Player 2', PC2[8], PC2[6]);
	player3b = new Player(COLUMNS - 2, 1, 'Player 3', PC3[8], PC3[6]);
	player4b = new Player(1, ROWS - 2, 'Player 4', PC4[8], PC4[6]);

	world.setMap(map);
	world.addPlayer(player1);
	world.addPlayer(player2);
	world.addPlayer(player3);
	world.addPlayer(player4);
	// world.addPlayer(player1b);
	// world.addPlayer(player2b);
	// world.addPlayer(player3b);
	// world.addPlayer(player4b);

	map.defaultWalls();
	// map.emptyWalls();

	// bot1 = new Bot(player1, world);
	// bot2 = new Bot(player2, world);
	bot3 = new Bot(player3, world);
	bot4 = new Bot(player4, world);

	bots = [
		bot3,
		bot4,
		// new Bot05(player1b, world),
		// new Bot05(player2b, world),
		// new Bot05(player3b, world),
		// new Bot05(player4b, world)
	];
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
	let alive = [];
	for (let player of world.players) {
		if (!player.died) alive.push(player);
	}

	if (alive.length <= 1 && world.bombs.size === 0) {
		pre.innerHTML = 'Game over!\n';
		if (alive.length === 1) {
			pre.innerHTML += `${alive[0].name} won!`;
		}
		else {
			pre.innerHTML += `It's a Draw!`
		}
		return;
	}

	// Here is the game loop
	const t = dt / 1000;

	if (player1bot) bot1.update();
	var up = keydowns[38];
	var down = keydowns[40];
	var left = keydowns[37];
	var right = keydowns[39];
	player1.updateControls(up, down, left, right);
	if      (keydowns[13]) player1.dropBomb(); // return

	if (player2bot) bot2.update();
	if (keydowns[87]) player2.moveUp(); // W
	if (keydowns[83]) player2.moveDown(); // S
	if (keydowns[65]) player2.moveLeft(); // A
	if (keydowns[68]) player2.moveRight(); // D
	// else                   player2.moveStop();
	if (keydowns[16]) player2.dropBomb(); // shift. 15 = caps


	if (player3bot) bot3.update();
	if (keydowns[73]) player3.moveUp(); // i
	if (keydowns[75]) player3.moveDown(); // k
	if (keydowns[74]) player3.moveLeft(); // j
	if (keydowns[76]) player3.moveRight(); // l
	// else                   player3.moveStop();
	if      (keydowns[32]) player3.dropBomb(); // space

	bots.forEach(b => b.update());

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