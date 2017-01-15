class Player {
	constructor(x, y) {
		// knows about the world
		this.positionAt(x || 0, y || 0);
		this.bombsLimit = 1;
		this.bombStrength = 1;
		this.bombsUsed = 0;
		this.SPEED = 2;
		// TODO add direction
	}

	positionAt(x, y) {
		this.x = x;
		this.y = y;
	}

	moveBy( dx, dy ) {
		// const tx = dx + this.x;
		// const ty = dy + this.y;

		// // check if tx is out of bounds, limit it to bounds.
		// const dir = x => x > 0 ? 1 : -1;
		// if (dx > 0) {
		// 	// get right bounds
		// 	const x2 = this.x + 1 | 0;
		// 	map.get(x2, )
		// }

		// const fail = this.coverXs().some((x) => {
		// 	if (map.get(x, this.y-1)) {
		// 		return true;
		// 	}
		// })
		// if (fail) return;

		this.x += dx;
		this.y += dy;

		const snapX = this.x + 0.5 | 0;
		const snapY = this.y + 0.5 | 0;
		for (let item of world.items) {
			if (item.x === snapX && item.y === snapY) {
				switch (item.type) {
					case item.SPEED_UP:
						this.SPEED += 0.25;
						break;
					case item.BOMBS_UP:
						this.bombsLimit++;
						break;
					case item.FIRE_UP:
						this.bombStrength++;
						break;
				}
				world.removeItem(item);
			}
		}

	}

	// TODO convert moving into block into opposite direction
	// for better UX

	snapX() {
		return this.x | 0;
	}

	snapY() {
		return this.y | 0;
	}

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

	moveUp(t) {
		if (this.y <= 0) return;
		const fail = this.coverXs().some((x) => {
			if (map.get(x, this.snapY() -1)) {
				return true;
			}
		})
		if (fail) return;

		this.moveBy(0, -this.SPEED * t);
	}

	moveDown(t) {
		if (this.y >= map.rows - 1) return;
		const fail = this.coverXs().some((x) => {
			if (map.get(x, this.snapY() +1)) {
				return true;
			}
		})
		if (fail) return;

		this.moveBy(0, this.SPEED * t);
	}

	moveLeft(t) {
		if (this.x <= 0) return;
		const fail = this.coverYs().some((y) => {
			if (map.get(this.snapX() - 1, y)) {
				return true;
			}
		})
		if (fail) return;
		this.moveBy(-this.SPEED * t, 0);
	}

	moveRight(t) {
		if (this.x >= map.columns - 1) return;
		const fail = this.coverYs().some((y) => {
			if (map.get(this.snapX() + 1, y)) {
				return true;
			}
		})
		if (fail) return;

		this.moveBy(this.SPEED * t, 0);
	}

	dropBomb() {
		if (this.bombsUsed >= this.bombsLimit) {
			return;
		}
		const bomb = new Bomb(this.x, this.y, this.bombStrength, this);
		this.bombsUsed++;
		world.addBomb(bomb);
		bomb.plant();
	}

}