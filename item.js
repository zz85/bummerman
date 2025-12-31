class Item {
	static TYPES = {
		SPEED_UP: 0,
		BOMBS_UP: 1,
		FIRE_UP: 2,
		KICK: 3,
	};

	// Spawn weights (higher = more common)
	static WEIGHTS = [30, 30, 30, 10];

	static randomType() {
		const weights = Item.WEIGHTS;
		const total = weights.reduce((a, b) => a + b, 0);
		let r = Math.random() * total;
		for (let i = 0; i < weights.length; i++) {
			r -= weights[i];
			if (r <= 0) return i;
		}
		return 0;
	}

	constructor(x, y, type) {
		this.x = x;
		this.y = y;

		Object.assign(this, Item.TYPES);

		this.type = type;
	}
}