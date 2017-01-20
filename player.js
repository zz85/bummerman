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
		this.SHRINK = 0.0;
	}

	aabb(x = this.x, y = this.y) {
		// returns corner coordinates of rectangle.
		return [
			x,
			x + 1 - this.SHRINK * 2,
			y,
			y + 1 - this.SHRINK * 2,
		];
	}

	smallerAabb() {
		const { x, y } = this;
		const THRESHOLD = 0.25;
		return [
			x + THRESHOLD,
			x + 1 - THRESHOLD * 2,
			y + THRESHOLD,
			y + 1 - THRESHOLD * 2,
		];
	}

	corners([x1, x2, y1, y2]) {
		return [
			[x1, y1],
			[x2, y1],
			[x1, y2],
			[x2, y2],
		];
	}

	// https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
	collision([ax1, ax2, ay1, ay2], [bx1, bx2, by1, by2]) {
		return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
	}

	positionAt(x, y) {
		this.x = x;
		this.y = y;
	}

	isIn(x, y) {
		return this.collision(this.aabb(), this.aabb(x, y));
	}

	targetBy(dx, dy) {
		if (this.died) return;

		// if abs(dx), check if y falls within movable range
		// should be max 0.25 above current grid,
		// 0.25 above bottom grid
		// else, abort left-right`

		// if abs(dy) || up-down, check if x is within range
		// otherwise abort movements
		// now move. see if there's collision. if so, snap to bounds.

		this.lastAngle = Math.atan2(dx, dy);
		this.direction = [dx, dy];

		// this.corners(this.aabb())

		// const snapX = this.x + 0.5 + dx * 0.5 | 0;
		// const snapY = this.y + 0.5 + dy * 0.5 | 0;
		// if (this.world.isBlocked(snapX + dx, snapY + dy)) {
		// 	this.direction = [0, 0];
		// };

		// const snapX = this.x + 0.5 | 0;
		// const snapY = this.y + 0.5 | 0; 
		// this.targetX = snapX + dx;
		// this.targetY = snapY + dy;

		// if (this.world.isBlocked(this.targetX, this.targetY)) {
		// 	this.direction = [0, 0];
		// }

		// console.log('current', snapX, snapY);
		// console.log('target', this.targetX, this.targetY);
	}

	moveBy( dx, dy ) {
		if (this.died) return;
		
		if (dx === 0 && dy === 0) return;

		let tx = dx + this.x;
		let ty = dy + this.y;

		const aabb = this.aabb();
		const [x1, x2, y1, y2] = aabb;
		const new_aabb = [x1 + dx, x2 + dx, y1 + dy, y2 + dy];
		
		const rects = this.corners(new_aabb)
			.map(([x, y]) => [x | 0, y | 0])
			.reduce((bounds, [x, y]) => {
				if (
					this.world.isBlocked(x, y) || 
					(
						!this.isIn(x, y) && 
						this.world.hasBomb(x, y))
				) {
					bounds.push(this.aabb(x, y));
				}

				return bounds;
			}, []);
	
		rects.some(r => {
			if (this.collision(new_aabb, r)) {
				const diffX = Math.min(new_aabb[1]-r[0], r[1] - new_aabb[0]);
				const diffY = Math.min(r[3] - new_aabb[2], new_aabb[3] - r[2]);
				const THRESHOLD = 0.5;

				if (new_aabb[0] < r[0]) {
					if (diffX < THRESHOLD) tx = r[0] - (1 - this.SHRINK * 2);
				}

				if (new_aabb[0] > r[0]) {
					if (diffX < THRESHOLD) tx = r[1];
				}

				if (new_aabb[2] < r[2]) {
					if (diffY < THRESHOLD) ty = r[2] - (1 - this.SHRINK * 2);
				}

				if (new_aabb[2] > r[2]) {
					if (diffY < THRESHOLD) ty = r[3]
				}

				this.direction = [0, 0];
			}
		});

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

		/*
		if (this.direction[0] * (this.x - this.targetX) >= 0 &&
		this.direction[1] * (this.y - this.targetY) >= 0
		) {
			this.x = this.targetX;
			this.y = this.targetY;
			this.direction = [0, 0];
		}
		*/
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

	moveStop() {
		this.direction = [0, 0];
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

		const snapX = this.x + 0.5 | 0;
		const snapY = this.y + 0.5 | 0;
		for (let bomb of this.world.bombs) {
			if (snapX === bomb.x && snapY === bomb.y) {
				return;
			}
		}

		playSound('dropbomb');
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