class Bot03 extends Bot {
	/* Bot03
		A Bot that randomly walks around like Bot02
		However, it only drop bombs when
		there's a way out to hide.
	*/
	constructor(player, world) {
		super(player, world);

		this.destination = null;
	}

	decisionUpdate() {
		if (this.destination) return;

		const safeMap = this.updateSafeMap();
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
			// if (Math.random() > 0.5) player.dropBomb();
			this.destination = null;
		}

		const shortest = this.bfsPath(x, y, px, py);
		let route = shortest && shortest.prev;
		if (route) {
			player.targetBy(route.x - player.x, route.y - player.y);
		}
	}
}