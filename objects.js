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

const MOVEMENT = 0.25;

class Player {
	constructor() {
		this.positionAt(0,0);
	}

	positionAt(x, y) {
		this.x = x;
		this.y = y;
	}

	moveBy( dx, dy ) {
		this.x += dx;
		this.y += dy;
	}

    moveUp() {
        if (this.y <= 0) return;
        this.moveBy(0, -MOVEMENT);
    }

    moveDown() {
        if (this.y >= map.rows - 1) return;
        this.moveBy(0, MOVEMENT);
    }
			
    moveLeft() {
        if (this.x <= 0) return;
        this.moveBy(-MOVEMENT, 0);
    }

    moveRight() {
        if (this.x >= map.columns - 1) return;
        this.moveBy(MOVEMENT, 0);
    }
			
}