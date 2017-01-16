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
			return true;
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
			this.index(minX + 1, maxY),

			this.index(maxX, maxY),
			this.index(maxX - 1, maxY),
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