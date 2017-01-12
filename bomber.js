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

class Walls {
	constructor(columns, rows) {
		this.columns = columns;
		this.rows = rows;
		this.cells = new Array(columns * rows);
	}

	get(x, y) {
		return this.cells[this.index(x, y)];
	}

	index(x, y) {
		return x + this.columns * y;
	}

	coords(i) {
		const x = i % this.columns;
		const y = i / this.columns | 0;
		return [x, y];
	}

	defaultWalls() {
		for (let i=1; i < this.rows; i+=2) {
			for (let j=1; j < this.columns; j+=2) {
				this.cells[this.index(j, i)] = 1;
			}
		}
	}

	forEach(cb) {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.columns; col++) {
				cb(col, row, this.get(col, row));
			}
		}
	}

	debugWalls() {
		let s = '';
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.columns; col++) {
				s += this.get(col, row) ? '#' : '.';
			}
			s += '\n'
		}
		return s;
	}
}
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


var Player = function() {
	this.positionAt(0,0)
};

Player.prototype.positionAt = function(column, row ) {
	positionAt(this.mesh.position, column, row);
};

Player.prototype.moveBy = function( x, z ) {
	this.mesh.position.x += x;
	this.mesh.position.z += z;
};

function positionAt(vector, column, row) {
	vector.x = column * cellWidth - map.width/2 + cellWidth/2;
	vector.z = row * cellHeight - map.height/2 + cellHeight/2;
}

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




