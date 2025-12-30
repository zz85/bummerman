const BOMB_FUSE_TIME = 3000;
const BOMB_KICK_SPEED = 8;

class Bomb {
	constructor(x, y, strength = 1, owner) {
		this.x = (x + 0.5) | 0;
		this.y = (y + 0.5) | 0;
		this.rx = this.x;
		this.ry = this.y;
		this.strength = strength;

		this.CREATED = 0; // Not exploded
		this.PLANTED = 1; // About to explode (shaking)
		this.EXPLODING = 2; // Exploding
		this.EXPLODED = 3; // Exploded (Can be removed)

		this.state = this.CREATED;
		this.owner = owner;
		this.vx = 0;
		this.vy = 0;
	}

	kick(dx, dy, speed = BOMB_KICK_SPEED) {
		this.vx = dx * speed;
		this.vy = dy * speed;
	}

	stop() {
		this.vx = 0;
		this.vy = 0;
		this.x = (this.rx + 0.5) | 0;
		this.y = (this.ry + 0.5) | 0;
		this.rx = this.x;
		this.ry = this.y;
	}

	isMoving() {
		return this.vx !== 0 || this.vy !== 0;
	}

	update(dt) {
		if (!this.isMoving()) return;
		const nx = this.rx + this.vx * dt;
		const ny = this.ry + this.vy * dt;
		const gx = (nx + 0.5) | 0;
		const gy = (ny + 0.5) | 0;
		const otherBomb = world.hasBomb(gx, gy);
		if (world.isBlocked(gx, gy) || (otherBomb && otherBomb !== this) || world.hasItem(gx, gy) || world.hasPlayer(gx, gy)) {
			this.stop();
			return;
		}
		this.rx = nx;
		this.ry = ny;
		this.x = gx;
		this.y = gy;
	}

	/*
	get x() {
		return this.rx + 0.5 | 0;
	}
	*/

	// snapX() {
	// 	return this.x + 0.5 | 0;
	// }

	// snapY() {
	// 	return this.y + 0.5 | 0;
	// }

	plant() {
		this.planted = Date.now();
		this.state = this.EXPLODING
		setTimeout(() => this.explode(), BOMB_FUSE_TIME);
	}

	explode() {
		if (this.state > this.EXPLODING) return;
		this.state = this.EXPLODED;

		playSound('explosion');

		const {x, y} = this;

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

		this.owner.bombsUsed--;
	}
}