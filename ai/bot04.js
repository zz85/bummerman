class Bot04 extends Bot {
	/* Bot04
		A Bot that randomly walks around like Bot02,
		drop bombs with a way out to hide,
		with the addition of running away when it finds itself
		in danger

		Results: it seems to kill itself alot by bombing places
		unharmful to the player.
	*/
	constructor(player, world) {
		super(player, world);

		this.destination = null;
	}

	shortSafePathOut(sx, sy) {
		const safeMap = this.safeMap;
		const worldMap = this.world.map;

		const queue = [];
		const visited = {};
		queue.push([sx, sy, 0, null]);

		while (queue.length) {
			const [x, y, depth, prev] = queue.shift();
			
			if (depth > 10) continue;
			const key = this._(x, y);
			if (visited[key]) continue;
			
			const blocked = !!worldMap.get(x, y) || (!this.player.isIn(x, y) && this.world.hasBomb(x, y));
			if (blocked) continue;
			
			visited[key] = { x, y, depth, prev };

			if (safeMap.get(x, y)) {
				return visited[key];
			}

			queue.push([x - 1, y + 0, depth + 1, prev]);
			queue.push([x + 1, y + 0, depth + 1, prev]);
			queue.push([x + 0, y + 1, depth + 1, prev]);
			queue.push([x + 0, y - 1, depth + 1, prev]);
		}
	}

	decisionUpdate() {
		const safeMap = this.updateSafeMap();
		const player = this.player;

		const px = player.x + 0.5 | 0;
		const py = player.y + 0.5 | 0;

		if (!safeMap.get(px, py)) {
			// find shortest place to get out!
			let dest = this.shortSafePathOut(px, py);
			while (dest && dest.prev && dest.prev.prev) {
				dest = dest.prev;
			}

			if (dest) dest.source = 'getout';
			this.destination = dest;
		}

		if (this.destination) return;

		const places = this.findPlaces();
		this.places = places;

		const keys = Object.keys(places);
		const chosen = keys[keys.length * Math.random() | 0];

		this.destination = places[chosen];
		if (this.destination) this.destination.source = 'random';
	}

	botUpdate() {
		pre.innerHTML = this.destination ? this.destination.source : '';
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