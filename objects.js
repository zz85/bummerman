class World {
	constructor() {
		this.items = new Set();
	}

	add(item) {
		this.items.add(item);
	}

	remove(item) {
		this.items.delete(item);
	}
}

/*
Object {
	collides() {

	}
}
*/

class Bomb {
	constructor(x, y, strength = 1) {
		this.x = x;
		this.y = y;
		this.strength = strength;
		this.state = 0;
		// Not exploded
		// Exploding
		// Exploded (Can be removed)
	}

	snapX() {
		return this.x + 0.5 | 0;
	}

	snapY() {
		return this.y + 0.5 | 0;
	}

	plant() {
		this.planted = Date.now();
		setTimeout(() => this.explode(), 2000);
	}

	explode() {
		world.remove(this);
	}
}

class Walls {
	constructor(columns, rows) {
		this.columns = columns;
		this.rows = rows;
		this.cells = new Array(columns * rows).fill(0);
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

		this.buildMaze();
	}

	buildMaze() {
		const exceptions = new Set([
			this.index(0, 0),
			this.index(0, 1),
			this.index(1, 0),

			this.index(this.columns - 1, 0),
			this.index(this.columns - 2, 0),
			this.index(this.columns - 1, 1),

			this.index(0, this.rows - 1),
			this.index(0, this.rows - 2),
			this.index(1, this.rows - 1),

			this.index(this.columns - 1, this.rows - 1),
			this.index(this.columns - 2, this.rows - 1),
			this.index(this.columns - 1, this.rows - 2),
		]);

		console.log(exceptions);

		this.cells
			.map((c, i) => c === 0 && i)
			.filter(v => v && !exceptions.has(v))
			.forEach((a) => {
				console.log(a)
				if (Math.random() < 0.7) {
					this.cells[a] = 2;
				}
			});
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
		// knows about the world
		this.positionAt(0,0);
		this.bombLimit = 1;
		this.bombs = [];

		// TODO add direction
	}

	positionAt(x, y) {
		this.x = x;
		this.y = y;
	}

	moveBy( dx, dy ) {
		this.x += dx;
		this.y += dy;
	}

	// TODO convert moving into block into opposite direction
	// for better UX

	coverXs() {
		const basex = Math.floor(this.x);
		if (this.x > basex) {
			return [basex, basex + 1];
		}

		return [this.x];
	}

	coverYs() {
		const basey = Math.floor(this.y);
		if (this.y > basey) {
			return [basey, basey + 1];
		}

		return [this.y];
	}

	moveUp() {
		if (this.y <= 0) return;
		const fail = this.coverXs().some((x) => {
			if (map.get(x, this.y-1)) {
				return true;
			}
		})
		if (fail) return;

		this.moveBy(0, -MOVEMENT);
	}

	moveDown() {
		if (this.y >= map.rows - 1) return;
		const fail = this.coverXs().some((x) => {
			if (map.get(x, this.y+1)) {
				return true;
			}
		})
		if (fail) return;

		this.moveBy(0, MOVEMENT);
	}

	moveLeft() {
		if (this.x <= 0) return;
		const fail = this.coverYs().some((y) => {
			if (map.get(this.x - 1, y)) {
				return true;
			}
		})
		if (fail) return;
		this.moveBy(-MOVEMENT, 0);
	}

	moveRight() {
		if (this.x >= map.columns - 1) return;
		const fail = this.coverYs().some((y) => {
			if (map.get(this.x + 1, y)) {
				return true;
			}
		})
		if (fail) return;

		this.moveBy(MOVEMENT, 0);
	}

	dropBomb() {
		const bomb = new Bomb(this.x, this.y)
		this.bombs.push(bomb);
		world.add(bomb);
		bomb.plant();
	}

}