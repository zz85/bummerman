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

	targetBy(dx, dy) {
		if (this.died) return;

		// if abs(dx), check if y falls within movable range
		// should be max 0.25 above current grid,
		// 0.25 above bottom grid
		// else, abort left-right

		// if abs(dy) || up-down, check if x is within range
		// otherwise abort movements
		// now move. see if there's collision. if so, snap to bounds.

		this.lastAngle = Math.atan2(dx, dy);
		this.direction = [dx, dy];

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
		
		// if (dx === 0 && dy === 0) return;

		let tx = dx + this.x;
		let ty = dy + this.y;

		const aabb = this.aabb();
		const [x1, x2, y1, y2] = aabb;
		const new_aabb = [x1 + dx, x2 + dx, y1 + dy, y2 + dy];
		
		const rects = this.corners(new_aabb)
			.map(([x, y]) => [x | 0, y | 0])
			.reduce((bounds, [x, y]) => {
				if (this.world.isBlocked(x, y)) {
					bounds.push(this.aabb(x, y));
				}

				return bounds;
			}, []);

		
		console.log(rects.length);
	
		const c = rects.some(r => {
			if (this.collision(new_aabb, r)) {
				if (dx > 0) {
					tx = r[0] - (1 - this.SHRINK * 2);
				}

				if (dx < 0) {
					tx = r[1];
				}

				if (dy > 0) {
					ty = r[2] - (1 - this.SHRINK * 2);
				}

				if (dy > 0) {
					ty = r[3]
				}

				// this.direction = [0, 0];
				console.log('collide', r, dx, dy);
			}
		});

		console.log( `=> ${tx}, ${ty}`);

		this.x = tx;
		this.y = ty;

		// const right_top_blocked = this.world.isBlocked(tx + 1 | 0, ty | 0);
		// const right_bottom_blocked = this.world.isBlocked(tx + 1 | 0, ty + 1 | 0);

		// const left_top_blocked = this.world.isBlocked(tx | 0, ty | 0);
		// const left_bottom_blocked = this.world.isBlocked(tx | 0, ty + 1 | 0);

		// const ALLOWANCE = 0.4;

		// // check if tx is out of bounds, limit it to bounds.
		// if (dx > 0) {
		// 	const [x1, x2, y1, y2] = this.aabb(); 

		// 	// const currentGridX = x2 | 0;
		// 	const nextX = Math.ceil(x2);
		// 	const targetGridX = x2 + dx | 0;
		// 	console.log('nextX', nextX, 'targetGridX', targetGridX, x2 + dx);
		// 	let maxX = null;

		// 	for (let cx = nextX; cx <= targetGridX; cx++) {
		// 		if (
		// 			this.world.hasBomb(cx, y1 | 0) ||
		// 			this.world.isBlocked(cx, y1 | 0)
		// 			) {
		// 				console.log('blocked', cx);
		// 			maxX = cx;
		// 			break;
		// 		}
		// 	}

		// 	if (maxX) tx = maxX - (1 - this.SHRINK * 2);
		// 	console.log('tx', tx);

		// 	// const nbounds = tx + 0.99 | 0;
		// 	// const bounds = this.x + 0.99 | 0;
		// 	// if (nbounds !== bounds
		// 	// 	&& this.world.hasBomb(nbounds, ty | 0)) {
		// 	// 	tx = tx | 0;
		// 	// }

		// 	// // right
		// 	// const dec = ty % 1; // Are we y aligned?
		// 	// const blocked = (1 - dec) * right_top_blocked + dec * right_bottom_blocked;

		// 	// if (blocked > ALLOWANCE) {
		// 	// 	tx = tx | 0;
		// 	// }
		// 	// else if (blocked > 0) {
		// 	// 	// side movements
		// 	// 	ty = ty + 0.5 | 0;
		// 	// }
		// }
		// if (dx < 0) {
		// 	const nbounds = tx | 0;
		// 	const bounds = this.x | 0;
		// 	if (nbounds !== bounds
		// 		&& this.world.hasBomb(nbounds, ty | 0)) {
		// 		tx = tx + 1 | 0;
		// 	}

		// 	// left
		// 	const dec = ty % 1; // Are we y aligned?
		// 	const blocked = (1 - dec) * left_top_blocked + dec * left_bottom_blocked;

		// 	if (blocked > ALLOWANCE) {
		// 		tx = tx + 1 | 0;
		// 	}
		// 	else if (blocked > 0) {
		// 		// side movements
		// 		ty = ty + 0.5 | 0;
		// 	}
		// }
		// if (dy > 0) {
		// 	// down

		// 	const nbounds = ty + 0.99 | 0;
		// 	const bounds = this.y + 0.99 | 0;
		// 	if (nbounds !== bounds
		// 		&& this.world.hasBomb(tx | 0, nbounds)) {
		// 		ty = ty | 0;
		// 	}

		// 	const dec = tx % 1; // check x alignment
		// 	const blocked = (1 - dec) * left_bottom_blocked + dec * right_bottom_blocked;

		// 	if (blocked > ALLOWANCE) {
		// 		ty = ty | 0;
		// 	}
		// 	else if (blocked > 0) {
		// 		// side movements
		// 		tx = tx + 0.5 | 0;
		// 	}
		// 	// console.log('bottom blocked', blocked, 'ratio', dec, 'target y', ty);
		// }
		// if (dy < 0) {
		// 	// up

		// 	const nbounds = ty | 0;
		// 	const bounds = this.y | 0;
		// 	if (nbounds !== bounds
		// 		&& this.world.hasBomb(tx | 0, nbounds)) {
		// 		ty = ty + 1 | 0;
		// 	}

		// 	const dec = tx % 1; // check x alignment
		// 	const blocked = (1 - dec) * left_top_blocked + dec * right_top_blocked;

		// 	if (blocked > ALLOWANCE) {
		// 		ty = ty + 1 | 0;
		// 	}
		// 	else if (blocked > 0) {
		// 		// side movements
		// 		tx = tx + 0.5 | 0;
		// 	}
		// }

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