
// Dimension
var cellWidth = 100;
var cellHeight = 100;

var TYPES = {
	NONE: 0,
	WALL: 1
};

var WorldMap = function( columns, rows ) {

	this.columns = columns;				
	this.rows = rows;

	var cells = [];
	
	var i = 0, il = columns, j, jl = rows;
	
	for (;i<il; i++) {
		
		cells[i] = [];
		for (j=0;j<jl;j++) {
			cells[i][j] = TYPES.NONE;
		}
		
	}
	
	this.cells = cells;
	this.width = cellWidth * columns;
	this.height = cellHeight * rows;
};

WorldMap.prototype.createWalls = function() {
	var i=0, il= this.columns, j, jl = this.rows;
	var cells = this.cells;
	
	for (i=1;i<il; i+=2) {
		for (j=1;j<jl;j+=2) {
			cells[i][j] = TYPES.WALL;
		}
	}
	
};

WorldMap.prototype.eachTile = function( emit ) {
	var i=0, il= this.columns, j, jl = this.rows;
	var cells = this.cells;

	for (i=0;i<il; i++) {
		for (j=0;j<jl;j++) {
			emit(i,j, cells[i][j]);
		}
	}
};


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

var map = new WorldMap(11, 11);
map.createWalls();
console.log(map);

const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');


// var s = '';
// map.eachTile((x, y, v) => {
// 	s += v;
// })
// console.log(s);

for (let row = 0; row < map.rows; row++) {
	let s = '';

	for (let col = 0; col < map.columns; col++) {
		s += map.cells[col][row];
	}
	console.log(s);
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




