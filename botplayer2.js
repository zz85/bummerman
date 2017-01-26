class AiPlayer2 extends AiPlayer {

	/* A Bot that randomly walks around and drop bombs */
	constructor(player, world) {
		super(player, world);

		this.destination = null;
	}

	decisionUpdate() {
		if (this.destination) return;

		const safeMap = this.updateSafeMap();
		const places = this.findPlaces();

		const keys = Object.keys(places);
		const chosen = keys[keys.length * Math.random() | 0];

		this.destination = places[chosen];
	}

	botUpdate() {
		const destination = this.destination;
		if (!destination) return;

		const {x, y} = destination;
		const player = this.player;

		if (player.isIn(x, y)) {
			player.moveStop();
			if (Math.random() > 0.5) player.dropBomb();
			this.destination = null;
		}

		const shortest = this.bfsPath(x, y, player.x + 0.5 | 0, player.y + 0.5 | 0);
		let route = shortest && shortest.prev;
		if (route) {
			player.targetBy(route.x - player.x, route.y - player.y);
		}
	}
}