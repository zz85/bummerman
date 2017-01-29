class Bot05 extends Bot {
	/* Bot05
		Adds a couple more adjustment from
		bot04. It stops if it's moving into
		an unsafe area.
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

			if (dest) dest.source = 'getout';
			this.destination = dest;
			return;
		}

		if (this.destination) return;

		const places = this.findPlaces();
		this.places = places;

		let filtered = Object.keys(places).map(k => places[k])
			.filter((o) => {
				const {x, y} = o;
				const analysis = this.safeToBomb(places, x, y, player.bombStrength);
				return analysis.safe;
			});

		const keys = Object.keys(filtered);
		const chosen = keys[keys.length * Math.random() | 0];

		this.destination = filtered[chosen];
		if (this.destination) this.destination.source = 'random';
	}

	botUpdate() {
		pre.innerHTML = this.destination ? this.destination.source : '';
		const destination = this.destination;
		if (!destination) return;

		const { x, y } = destination;
		const player = this.player;
		const safeMap = this.safeMap;

		const px = player.x + 0.5 | 0;
		const py = player.y + 0.5 | 0;

		if (player.isInSmaller(x, y)) {
			player.moveStop();
			const analysis = this.safeToBomb(this.places, px, py, player.bombStrength);
			if (analysis.safe)
				player.dropBomb();

			this.destination = null;
		}

		const nowSafe = safeMap.get(px, py);
		const shortest = this.bfsPath(x, y, px, py);
		let route = shortest && shortest.prev;
		if (route) {
			if (nowSafe && !safeMap.get(route.x, route.y)) {
				player.moveStop();
			}
			else {
				player.targetBy(route.x - player.x, route.y - player.y);
			}
		}
	}
}