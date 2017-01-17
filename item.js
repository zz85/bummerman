class Item {
	constructor(x, y, type) {
		this.x = x;
		this.y = y;

		Object.assign(this, {
			SPEED_UP: 0,
			BOMBS_UP: 1,
			FIRE_UP: 2,

		});

		this.type = type;
		//  || this.SPEED_UP;
	}

	// Powerup TYPE
	// + Speed
	// + Bombs
	// + Increased fire / flames
	// + Kick / Push bomb
	// + Throw / Push bomb
	// + Remote control
	// + Tanks
	// - Poisons
	// - Misdirection
	// - Slow
}