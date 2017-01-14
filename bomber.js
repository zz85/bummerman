// Game Data

// Map (rows x columns)
// Items at each coordinates

// Players

// Approach 1. Split map into cells. put items into cells.
// + Easy to lookup
// + Easy to render
// - Tedious to move items from one cell to another

// Approach 2.
// Maintain a list of items.
// Items have x, y coordinates.
// Project them onto maps.

// TODO
// Bomb
// Powerups
// Player AI

const COLUMNS = 15;
const ROWS = 15;
const CELL_PIXELS = 45;

// Cell Coordinates
// Pixels Coordinates

// Types.
// 1. Walls / Grass
// 2. Players
// 3. Items


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

const pre = document.createElement('pre');
pre.style.cssText = 'font-family: monospace; font-size: 20px; margin: 20px';

document.body.appendChild(pre);

const canvas = document.createElement('canvas');
canvas.width = CELL_PIXELS * COLUMNS * 1.2;
canvas.height = CELL_PIXELS * COLUMNS * 1.2;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// const s = map.debugWalls();
// pre.innerHTML = s;
// console.log(s);
// console.log(map);

function animate() {
	requestAnimationFrame(animate);
	render()
}

animate();

function render() {
	// Here is the game loop
	// TODO remove global timeouts?
	for (let flumes of world.flumes) {
		flumes.blow();
	}

	// Here is the render Loop



	ctx.clearRect(0, 0, canvas.width, canvas.height);

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

	for (let item of world.items) {
		if (item instanceof Bomb) {
			ctx.fillStyle = 'red';
			ctx.fillRect(item.snapX() * CELL_PIXELS, item.snapY() * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
		}
		else if (item instanceof Flumes) {
			ctx.fillStyle = 'orange';
			ctx.fillRect(item.x * CELL_PIXELS, item.y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
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
	console.log(event.keyCode);
	switch( event.keyCode ) {
		case 87:
			// up W
			player1.moveUp(); break;
		case 83:
			// down D
			player1.moveDown(); break;
		case 65:
			// left A
			player1.moveLeft(); break;
		case 68:
			// right D
			player1.moveRight(); break;

		case 38:
			// up
			player1.moveUp(); break;
		case 40:
			// down D
			player1.moveDown(); break;
		case 37:
			// left A
			player1.moveLeft(); break;
		case 39:
			// right D
			player1.moveRight(); break;

		case 13:
			// Return
			player1.dropBomb();
			break;


		case 16: isShiftDown = true; break;
		case 17: isCtrlDown = true; break;

	}

}

function onDocumentKeyUp( event ) {

	switch( event.keyCode ) {

		case 16: isShiftDown = false; break;
		case 17: isCtrlDown = false; break;

	}
}




