const EMPTY = 0, HARD_WALL = 1, SOFT_WALL = 2;

class World {
	constructor() {
		// All items
		this.items = new Set();

		this.bombs = new Set();
		this.flumes = new Set();

		// TODO
		// - Walls / Maps
		// - Power ups
		// - Players
	}

	add(item) {
		this.items.add(item);
	}

	remove(item) {
		this.items.delete(item);
	}

	addFlumes(flumes) {
		this.flumes.add(flumes);
		this.add(flumes);
	}

	removeFlumes(flumes) {
		this.flumes.delete(flumes);
		this.remove(flumes);
	}

	addBomb(bomb) {
		this.bombs.add(bomb);
		this.add(bomb);
	}

	removeBomb(bomb) {
		this.bombs.delete(bomb);
		this.remove(bomb);
	}

	blow(x, y) {
		// check for Players
		if (player1.coverXs().find(v => v === x)
			&& player1.coverYs().find(v => v === y)) {
			pre.innerHTML = 'You died!';
			// TODO make this an event
		}
		// check for Items

		
		// check for Bombs
		for (let bomb of this.bombs) {
			if (bomb.snapX() === x && bomb.snapY() === y) {
				bomb.explode();
			}
		}

		// check for Walls
		map.blow(x, y);

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
class Powerups {
	// TYPE
	// + Speed
	// + Bombs
	// + Increased fire / flames
	// + Kick / Push bomb
	// + Throw bomb
	// + Remote control
	// + Tanks
	// - Poisons
	// - Misdirection
	// - Slow
}

class Flumes {
	constructor(x, y, ttl) {
		this.x = x;
		this.y = y;

		setTimeout(() => {
			world.removeFlumes(this);
		}, 300);
	}

	blow() {
		world.blow(this.x, this.y);
	}
}

class Bomb {
	constructor(x, y, strength = 2) {
		this.x = x;
		this.y = y;
		this.strength = strength;

		this.CREATED = 0; // Not exploded
		this.PLANTED = 1; // About to explode (shaking)
		this.EXPLODING = 2; // Exploding
		this.EXPLODED = 3; // Exploded (Can be removed)

		this.state = this.CREATED;
	}

	snapX() {
		return this.x + 0.5 | 0;
	}

	snapY() {
		return this.y + 0.5 | 0;
	}

	plant() {
		this.planted = Date.now();
		this.state = this.EXPLODING
		setTimeout(() => this.explode(), 2000);
	}

	explode() {
		if (this.state > this.EXPLODING) return;
		this.state = this.EXPLODED;

		const x = this.snapX();
		const y = this.snapY();

		const check = ([dx, dy]) => {
			const tx = dx + x;
			const ty = dy + y;
			const m = map.get(tx, ty);
			if (m === HARD_WALL) {
				return true;
			}
			world.addFlumes(new Flumes(tx, ty));
			if (m === SOFT_WALL) {
				return true;
			}
		};

		const count = [...new Array(this.strength + 1).keys()].slice(1);
		check([0, 0]);
		count.map(s => [s, 0]).some(check);
		count.map(s => [-s, 0]).some(check);
		count.map(s => [0, -s]).some(check);
		count.map(s => [0, s]).some(check);

		world.removeBomb(this);
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
					this.cells[this.index(x, y)] = HARD_WALL;
				}
		})

		this.buildMaze();
	}

	blow(x, y) {
		if (x < 0 || y < 0 || x > this.columns - 1 || y > this.rows - 1) return;
		if (this.cells[this.index(x, y)] === SOFT_WALL) {
			this.cells[this.index(x, y)] = EMPTY;
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
				// this.cells[a] = SOFT_WALL;
				if (Math.random() < 0.9) {
					this.cells[a] = SOFT_WALL;
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
		// this.bombs.push(bomb);
		world.addBomb(bomb);
		bomb.plant();
	}

}