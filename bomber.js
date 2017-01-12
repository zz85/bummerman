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


const pre = document.createElement('pre');
pre.style.cssText = 'font-family: monospace; font-size: 20px; margin: 20px';

document.body.appendChild(pre);

const canvas = document.createElement('canvas');
canvas.width = CELL_PIXELS * COLUMNS * 1.2;
canvas.height = CELL_PIXELS * COLUMNS * 1.2;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

var map = new Walls(COLUMNS, ROWS);
map.defaultWalls();


const s = map.debugWalls();
pre.innerHTML = s;
console.log(s);
console.log(map);

map.forEach((x, y, v) => {
	ctx.fillStyle = v ? '#333' : '#eee';
	ctx.fillRect(x * CELL_PIXELS, y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
	ctx.strokeRect(x * CELL_PIXELS, y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
})

document.addEventListener( 'keydown', onDocumentKeyDown, false );
document.addEventListener( 'keyup', onDocumentKeyUp, false );

function onDocumentKeyDown( event ) {
	console.log(event.keyCode);
	switch( event.keyCode ) {
		case 87:
			// up
			player1.moveBy(-20, 0); break;
		case 83:
			// down
			player1.moveBy(20, 0); break;
		case 65:
			// left
			player1.moveBy(0, 20); break;
		case 68:
			// right
			player1.moveBy(0, -20); break;
		
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




