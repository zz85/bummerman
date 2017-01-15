class Flumes {
	constructor(x, y, ttl) {
		this.x = x;
		this.y = y;

		this.blow();

		setTimeout(() => {
			world.removeFlumes(this);
		}, 300);
	}

	blow() {
		world.blow(this.x, this.y);
	}
}