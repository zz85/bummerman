class Bot04 extends Bot {
	/* Bot04
		A Bot that randomly walks around like Bot02,
		drop bombs with a way out to hide,
		with the addition of running away when it finds itself
		in danger
	*/
	constructor(player, world) {
		super(player, world);

		this.destination = null;
	}

	decisionUpdate() {
		const safeMap = this.updateSafeMap();
		const player = this.player;

		const px = player.x + 0.5 | 0;
		const py = player.y + 0.5 | 0;

		const safePlaces = this.findPlaces(safeMap);
		if (!safePlaces.get(px, py)) {
			// find best place to get out!

		}


		if (this.destination) return;

		const places = this.findPlaces();
		this.places = places;

		const keys = Object.keys(places);
		const chosen = keys[keys.length * Math.random() | 0];

		this.destination = places[chosen];
	}

	botUpdate() {
		const destination = this.destination;
		if (!destination) return;

		const {x, y} = destination;
		const player = this.player;

		const px = player.x + 0.5 | 0;
		const py = player.y + 0.5 | 0;

		if (player.isInSmaller(x, y)) {
			player.moveStop();
			const analysis = this.safeToBomb(this.places, px, py, player.bombStrength);
			if (analysis.safe)
				player.dropBomb();

			this.destination = null;
		}

		const shortest = this.bfsPath(x, y, px, py);
		let route = shortest && shortest.prev;
		if (route) {
			player.targetBy(route.x - player.x, route.y - player.y);
		}
	}
}