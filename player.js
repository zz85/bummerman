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
		let tx = dx + this.x;
		let ty = dy + this.y;

        // edge cases
        // x = 0.1
        // dx = 1
        // tx = 1.1
        // tx = 1

        // check if tx is out of bounds, limit it to bounds.

        if (dx > 0) {
            // console.log(tx % 1 !== 0);
            // tx % 1 !== 0 && 
            if (map.get(tx + 1 | 0, ty | 0)) {
                tx = tx | 0;
            }
        }
        if (dx < 0) {
            if (map.get(tx | 0, ty | 0)) {
                tx = tx + 1 | 0;
            }
        }
        if (dy > 0) {
            // down
            const dec = tx % 1;
            let blocked = 0;

            if (map.get(tx | 0, ty + 1 | 0)) {
                // left bottom blocked
                blocked += 1 - dec;
            }
            
            if (map.get(tx + 1 | 0, ty + 1 | 0)) {
                // right bottom blocked
                blocked += dec;
            }

            if (blocked > 0.2) {
                ty = ty | 0;
            }
            else {
                // move left
            }
            console.log('bottom blocked', blocked, 'ratio', dec, 'target y', ty);
        }
        if (dy < 0) {
            if (map.get(tx | 0, ty | 0)) {
                console.log('up');
                ty = ty + 1 | 0;
            }
        }

		this.x = tx;
		this.y = ty;

		const snapX = this.x + 0.5 | 0;
		const snapY = this.y + 0.5 | 0;
		for (let item of world.items) {
			if (item.x === snapX && item.y === snapY) {
				switch (item.type) {
					case item.SPEED_UP:
						this.SPEED += 1;
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
		this.moveBy(0, -this.SPEED * t);
	}

	moveDown(t) {
		this.moveBy(0, this.SPEED * t);
	}

	moveLeft(t) {
		this.moveBy(-this.SPEED * t, 0);
	}

	moveRight(t) {
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