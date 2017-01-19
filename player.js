class Player {
	constructor(x, y, name) {
		this.positionAt(x || 0, y || 0);
		this.bombsLimit = 1;
		this.bombStrength = 1;
		this.bombsUsed = 0;
		this.SPEED = 3;
		this.name = name;
		
		this.direction = [0, 0];
		this.targetX = x;
		this.targetY = y;

		this.lastAngle = 0;
	}

	positionAt(x, y) {
		this.x = x;
		this.y = y;
	}

	targetBy(dx, dy) {
		if (this.died) return;

		const [cdx, cdy] = this.direction;
		this.lastAngle = Math.atan2(dx, dy);

		if (cdx === dx && cdy === dy) {
			return;
		}

		this.direction = [dx, dy];
		const snapX = this.x + 0.5 | 0;
		const snapY = this.y + 0.5 | 0; 
		this.targetX = snapX + dx;
		this.targetY = snapY + dy;

		if (this.world.isBlocked(this.targetX, this.targetY)) {
			this.direction = [0, 0];
		}

		console.log('current', snapX, snapY);
		console.log('target', this.targetX, this.targetY);
	}

	moveBy( dx, dy ) {
		if (this.died) return;
		
		if (dx === 0 && dy === 0) return;

		let tx = dx + this.x;
		let ty = dy + this.y;

		const right_top_blocked = this.world.isBlocked(tx + 1 | 0, ty | 0);
		const right_bottom_blocked = this.world.isBlocked(tx + 1 | 0, ty + 1 | 0);

		const left_top_blocked = this.world.isBlocked(tx | 0, ty | 0);
		const left_bottom_blocked = this.world.isBlocked(tx | 0, ty + 1 | 0);

		const ALLOWANCE = 0.4;

		// check if tx is out of bounds, limit it to bounds.
		if (dx > 0) {
			const nbounds = tx + 0.99 | 0;
			const bounds = this.x + 0.99 | 0;
			if (nbounds !== bounds
				&& this.world.hasBomb(nbounds, ty | 0)) {
				tx = tx | 0;
			}

			// right
			const dec = ty % 1; // Are we y aligned?
			const blocked = (1 - dec) * right_top_blocked + dec * right_bottom_blocked;

			if (blocked > ALLOWANCE) {
				tx = tx | 0;
			}
			else if (blocked > 0) {
				// side movements
				ty = ty + 0.5 | 0;
			}
		}
		if (dx < 0) {
			const nbounds = tx | 0;
			const bounds = this.x | 0;
			if (nbounds !== bounds
				&& this.world.hasBomb(nbounds, ty | 0)) {
				tx = tx + 1 | 0;
			}

			// left
			const dec = ty % 1; // Are we y aligned?
			const blocked = (1 - dec) * left_top_blocked + dec * left_bottom_blocked;

			if (blocked > ALLOWANCE) {
				tx = tx + 1 | 0;
			}
			else if (blocked > 0) {
				// side movements
				ty = ty + 0.5 | 0;
			}
		}
		if (dy > 0) {
			// down

			const nbounds = ty + 0.99 | 0;
			const bounds = this.y + 0.99 | 0;
			if (nbounds !== bounds
				&& this.world.hasBomb(tx | 0, nbounds)) {
				ty = ty | 0;
			}

			const dec = tx % 1; // check x alignment
			const blocked = (1 - dec) * left_bottom_blocked + dec * right_bottom_blocked;

			if (blocked > ALLOWANCE) {
				ty = ty | 0;
			}
			else if (blocked > 0) {
				// side movements
				tx = tx + 0.5 | 0;
			}
			// console.log('bottom blocked', blocked, 'ratio', dec, 'target y', ty);
		}
		if (dy < 0) {
			// up

			const nbounds = ty | 0;
			const bounds = this.y | 0;
			if (nbounds !== bounds
				&& this.world.hasBomb(tx | 0, nbounds)) {
				ty = ty + 1 | 0;
			}

			const dec = tx % 1; // check x alignment
			const blocked = (1 - dec) * left_top_blocked + dec * right_top_blocked;

			if (blocked > ALLOWANCE) {
				ty = ty + 1 | 0;
			}
			else if (blocked > 0) {
				// side movements
				tx = tx + 0.5 | 0;
			}
		}

		this.x = tx;
		this.y = ty;

		const snapX = this.x + 0.5 | 0;
		const snapY = this.y + 0.5 | 0;

		for (let item of this.world.items) {
			if (item.x === snapX && item.y === snapY) {
				playSound('pickup');
				switch (item.type) {
					case item.SPEED_UP:
						if (this.SPEED < 5) {
							this.SPEED += 0.5;
						} else {
							this.SPEED += 0.2;
						}
						break;
					case item.BOMBS_UP:
						this.bombsLimit++;
						break;
					case item.FIRE_UP:
						this.bombStrength++;
						break;
				}
				this.world.removeItem(item);
			}
		}

		if (this.direction[0] * (this.x - this.targetX) >= 0 &&
		this.direction[1] * (this.y - this.targetY) >= 0
		) {
			this.x = this.targetX;
			this.y = this.targetY;
			this.direction = [0, 0];
		}
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

	moveUp() {
		this.targetBy(0, -1);
	}

	moveDown() {
		this.targetBy(0, 1);
	}

	moveLeft() {
		this.targetBy(-1, 0);
	}

	moveRight() {
		this.targetBy(1, 0);
	}

	update(t) {
		this.moveBy(t * this.SPEED * this.direction[0], t * this.SPEED * this.direction[1]);
	}

	dropBomb() {
		if (this.bombsUsed >= this.bombsLimit || this.died) {
			return;
		}

		for (let bomb of this.world.bombs) {
			if (this.x === bomb.x && this.y === bomb.y) {
				return;
			}
		}
		const bomb = new Bomb(this.x, this.y, this.bombStrength, this);
		this.bombsUsed++;
		this.world.addBomb(bomb);
		bomb.plant();
	}

	die() {
		this.died = Date.now();
		playSound('die');
	}

}