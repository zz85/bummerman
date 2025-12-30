class Item {
	constructor(x, y, type) {
		this.x = x;
		this.y = y;

		Object.assign(this, {
			SPEED_UP: 0,
			BOMBS_UP: 1,
			FIRE_UP: 2,
			KICK: 3,
		});

		this.type = type;
	}
}