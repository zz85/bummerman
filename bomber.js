// # TODO-list
// - Music
// Network
// GameAPI
// Touch (Mobile Controls)
// Correct resizing
// FPS View
// VR View
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
// - Start / End Games

// Game state manager (shared between 2D/3D)
const game = new Game();

let world, map;
let players = [];
let bots = [];

const PLAYER_STARTS = [
	[1, 1],
	[null, null], // calculated from grid
	[null, 1],
	[1, null],
];

function initGame() {
	const { gridSize, players: numPlayers, bots: numBots } = game.config;
	const COLUMNS = gridSize;
	const ROWS = gridSize;

	world = new World();
	map = new Walls(COLUMNS, ROWS);
	world.setMap(map);

	players = [];
	bots = [];

	const totalPlayers = numPlayers + numBots;
	const starts = [
		[1, 1],
		[COLUMNS - 2, ROWS - 2],
		[COLUMNS - 2, 1],
		[1, ROWS - 2],
	];

	for (let i = 0; i < totalPlayers && i < 4; i++) {
		const color = COLORS[i];
		const [x, y] = starts[i];
		const player = new Player(x, y, `Player ${i + 1}`, color[8], color[6]);
		players.push(player);
		world.addPlayer(player);

		if (i >= numPlayers) {
			bots.push(new Bot(player, world));
		}
	}

	game.initStats(players.map(p => p.name));
	map.defaultWalls();
}

function showStartScreen() {
	game.restart();
	pre.innerHTML = game.getStartScreenText();
}

function startGame() {
	if (game.state === Game.STATE.GAMEOVER) {
		game.restart();
	}
	game.start();
	initGame();
}

const pre = document.createElement('pre');
pre.style.cssText = `font-family: monospace; font-size: 20px; margin: 20px;
position: absolute; top: 10px; left: 10px;
color: white;
text-shadow: black 2px 2px;
`;

document.body.appendChild(pre);

initGame(); // init game first for 3D renderer
showStartScreen();
init(); // init graphics unit

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
	if (game.state === Game.STATE.START) return;

	// Update stats overlay during gameplay
	if (game.state === Game.STATE.PLAYING) {
		pre.innerHTML = game.getStatsText();
	}

	let alive = [];
	for (let player of world.players) {
		if (!player.died) alive.push(player);
	}

	if (alive.length <= 1 && world.bombs.size === 0) {
		const winner = alive.length === 1 ? alive[0].name : null;
		game.end(winner);
		pre.innerHTML = game.getGameOverText();
		return;
	}

	// Here is the game loop
	const t = dt / 1000;

	// Player controls (only for human players)
	const controls = [
		{ up: 38, down: 40, left: 37, right: 39, bomb: 13 },  // P1: arrows + enter
		{ up: 87, down: 83, left: 65, right: 68, bomb: 16 },  // P2: WASD + shift
		{ up: 57, down: 79, left: 73, right: 80, bomb: 8 },   // P3: 9=up I=left O=down P=right + backspace
		{ up: 104, down: 101, left: 100, right: 102, bomb: 96 }, // P4: numpad
	];

	const numHumans = game.config.players;
	players.forEach((player, i) => {
		if (i < numHumans && controls[i]) {
			const c = controls[i];
			const up = keydowns[c.up];
			const down = keydowns[c.down];
			const left = keydowns[c.left];
			const right = keydowns[c.right];

			if (up) player.moveBy(0, -t * player.SPEED);
			else if (down) player.moveBy(0, t * player.SPEED);
			if (left) player.moveBy(-t * player.SPEED, 0);
			else if (right) player.moveBy(t * player.SPEED, 0);

			if (keydowns[c.bomb]) player.dropBomb();
		}
	});

	bots.forEach(b => b.update());

	for (let bomb of world.bombs) {
		bomb.update(t);
	}

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
	keydowns[event.keyCode] = 1;

	if (game.state === Game.STATE.START) {
		// Config keys on start screen
		if (event.keyCode === 49) { // 1
			game.cycleOption('players', [1, 2, 3, 4]);
			pre.innerHTML = game.getStartScreenText();
		}
		if (event.keyCode === 50) { // 2
			game.cycleOption('bots', [0, 1, 2, 3]);
			pre.innerHTML = game.getStartScreenText();
		}
		if (event.keyCode === 51) { // 3
			game.cycleOption('gridSize', [11, 13, 15, 19]);
			pre.innerHTML = game.getStartScreenText();
		}
	}

	// Space to start/restart
	if (event.keyCode === 32 && game.state !== Game.STATE.PLAYING) {
		startGame();
	}
}

function onDocumentKeyUp( event ) {
	keydowns[event.keyCode] = 0;
}