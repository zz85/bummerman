class Player {
	constructor(x, y, world) {
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

        const right_top_blocked = world.isBlocked(tx + 1 | 0, ty | 0);
        const right_bottom_blocked = world.isBlocked(tx + 1 | 0, ty + 1 | 0);

        const left_top_blocked = world.isBlocked(tx | 0, ty | 0);
        const left_bottom_blocked = world.isBlocked(tx | 0, ty + 1 | 0);

        const ALLOWANCE = 0.4;

        // check if tx is out of bounds, limit it to bounds.
        if (dx > 0) {
            const nbounds = tx + 0.99 | 0;
            const bounds = this.x + 0.99 | 0;
            if (nbounds !== bounds
                && world.hasBomb(nbounds, ty | 0)) {
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
                && world.hasBomb(nbounds, ty | 0)) {
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
                && world.hasBomb(tx | 0, nbounds)) {
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
                && world.hasBomb(tx | 0, nbounds)) {
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

		for (let item of world.items) {
			if (item.x === snapX && item.y === snapY) {
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
				world.removeItem(item);
			}
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