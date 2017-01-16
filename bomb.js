const BOMB_FUSE_TIME = 3000;

class Bomb {
	constructor(x, y, strength = 1, owner) {
		this.x = x;
		this.y = y;
		this.strength = strength;

		this.CREATED = 0; // Not exploded
		this.PLANTED = 1; // About to explode (shaking)
		this.EXPLODING = 2; // Exploding
		this.EXPLODED = 3; // Exploded (Can be removed)

		this.state = this.CREATED;
		this.owner = owner;
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
		setTimeout(() => this.explode(), BOMB_FUSE_TIME);
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

		this.owner.bombsUsed--;
	}
}