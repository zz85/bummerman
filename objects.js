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

	blow(x, y) {
		// check for Players
		// check for Walls
		// check for Items
		// check for Bombs

		// or should bomb going off be an event
		// and all items listen for exploding event?
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
		// About to explode (shaking)
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
		// TODO add animation flames
		const x = this.snapX();
		const y = this.snapY();

		for (let tx = -1; tx <= 1; tx++) {
			map.blow(x + tx, y);
		}

		for (let ty = -1; ty <= 1; ty++) {
			map.blow(x, y + ty);
		}

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
		this.forEach((x, y) => {
			if (x === 0
				|| x === this.columns - 1
				|| y === 0
				|| y === this.rows - 1
				|| (x % 2 === 0 && y % 2 === 0)) {
					this.cells[this.index(x, y)] = 1;
				} 
		})
		// for (let i=2; i < this.rows; i+=2) {
		// 	for (let j=2; j < this.columns; j+=2) {
		// 		this.cells[this.index(j, i)] = 1;
		// 	}
		// }

		this.buildMaze();
	}

	blow(x, y) {
		if (x < 0 || y < 0 || x > this.columns - 1 || y > this.rows - 1) return;
		if (this.cells[this.index(x, y)] === 2) {
			this.cells[this.index(x, y)] = 0;
		}
	}

	buildMaze() {
		const minX = 1;
		const maxX = this.columns - 2;
		const minY = 1;
		const maxY = this.rows - 2;

		// TODO can be futher generatize around player's spawning point
		const exceptions = new Set([
			this.index(minX, minY),
			this.index(minX, minY + 1),
			this.index(minX + 1, minY),

			this.index(maxX, minY),
			this.index(maxX - 1, minY),
			this.index(maxX, minY + 1),

			this.index(minX, maxY),
			this.index(minX, maxY - 1),
			this.index(minX, maxY),

			this.index(maxX, maxY),
			this.index(maxX - 1, maxY - 1),
			this.index(maxX, maxY - 1),
		]);

		console.log(exceptions);

		this.cells
			.map((c, i) => c === 0 && i)
			.filter(v => v && !exceptions.has(v))
			.forEach((a) => {
				// this.cells[a] = 2;
				if (Math.random() < 0.8) {
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
	constructor(x, y) {
		// knows about the world
		this.positionAt(x || 0, y || 0);
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