class Flumes {
	constructor(x, y, ttl) {
		this.x = x;
		this.y = y;
		this.seed1 = Math.random() * 2 - 1;
		this.seed2 = Math.random() * 2 - 1;
		this.seed3 = Math.random() * 2 - 1;

		this.blow();

		setTimeout(() => {
			world.removeFlumes(this);
		}, 300);
	}

	blow() {
		world.blow(this.x, this.y);
	}
}