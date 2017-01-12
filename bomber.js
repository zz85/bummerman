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

const COLUMNS = 11;
const ROWS = 11;
const CELL_PIXELS = 40;

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

const map = new Walls(COLUMNS, ROWS);
map.defaultWalls();

const player1 = new Player();





const pre = document.createElement('pre');
pre.style.cssText = 'font-family: monospace; font-size: 20px; margin: 20px';

document.body.appendChild(pre);

const canvas = document.createElement('canvas');
canvas.width = CELL_PIXELS * COLUMNS * 1.2;
canvas.height = CELL_PIXELS * COLUMNS * 1.2;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

const s = map.debugWalls();
pre.innerHTML = s;
console.log(s);
console.log(map);


function animate() {
	requestAnimationFrame(animate);
	render()
}

animate();

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// walls
	map.forEach((x, y, v) => {
		ctx.fillStyle = v ? '#333' : '#eee';
		ctx.fillRect(x * CELL_PIXELS, y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
		ctx.strokeRect(x * CELL_PIXELS, y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
	});

	// player
	ctx.fillStyle = '#0d0';
	ctx.fillRect(player1.x * CELL_PIXELS, player1.y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
		

}

document.addEventListener( 'keydown', onDocumentKeyDown, false );
document.addEventListener( 'keyup', onDocumentKeyUp, false );

function onDocumentKeyDown( event ) {
	console.log(event.keyCode);
	switch( event.keyCode ) {
		case 87:
			// up W
			player1.moveBy(-0.5, 0); break;
		case 83:
			// down D
			player1.moveBy(0.5, 0); break;
		case 65:
			// left A
			player1.moveBy(0, -0.5); break;
		case 68:
			// right D
			player1.moveBy(0, 0.5); break;

		case 38:
			// up
			player1.moveBy(0, -0.5); break;
		case 40:
			// down D
			player1.moveBy(0, 0.5); break;
		case 37:
			// left A
			player1.moveBy(-0.5, 0); break;
		case 39:
			// right D
			player1.moveBy(0.5, 0); break;
		
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




