class AiPlayer {

	constructor(player, world) {
		this.player = player;
		this.world = world;

		this.safeMap = new Walls(COLUMNS, ROWS);


		this.last = Date.now();
	}

	update() {
		if (this.player.died) {
			return;
		}

		const now = Date.now();
		if (now - this.last < 200) {
			return;
		}

		console.log('thinking..');

		this.last = now;

		const safeMap = this.safeMap;

		safeMap.cells.fill(true);
		const realMap = this.world.map; 

		// Rule no. 1 - Survival.
		// If there are bombs, run!
		// Based on bombs, build a safe map.

		realMap.forEach((x, y, v) => {
			if (v) {
				safeMap.set(x, y, false);
				return;
			}
		});

		for (let bomb of this.world.bombs) {
			const {x, y} = bomb;
			safeMap.set(x, y, false);

			for (let l = 1; l <= bomb.strength; l++) {
				const cx = x - l;
				if (realMap.get(cx, y)) {
					break;
				}
				
				safeMap.set(cx, y, false);
			}

			for (let l = 1; l <= bomb.strength; l++) {
				const cx = x + l;
				if (realMap.get(cx, y)) {
					break;
				}
				
				safeMap.set(cx, y, false);
			}

			for (let l = 1; l <= bomb.strength; l++) {
				const cy = y - l;
				if (realMap.get(x, cy)) {
					break;
				}
				
				safeMap.set(x, cy, false);
			}

			for (let l = 1; l <= bomb.strength; l++) {
				const cy = y + l;
				if (realMap.get(x, cy)) {
					break;
				}
				
				safeMap.set(x, cy, false);
			}
		}


		// current grid
		const gridX = this.player.x + 0.5 | 0;
		const gridY = this.player.y + 0.5 | 0;

		// where can bot go?
		const places = {};

		const findPlaces = (places, x, y, prev) => {
			const key = x + ':' + y;
			if (key in places) return;

			const blocked = !!realMap.get(x, y);
			if (blocked) return;
			places[key] = {
				x: x,
				y: y,
				blocked,
				prev
			};
			findPlaces(places, x - 1, y + 0, places[key]);
			findPlaces(places, x + 1, y + 0, places[key]);
			findPlaces(places, x - 0, y - 1, places[key]);
			findPlaces(places, x - 0, y + 1, places[key]);
		};

		findPlaces(places, gridX, gridY);

		const sort = Object.keys(places).map(k => places[k])
			.map((o) => {
				const {x, y, blocked} = o;
				let score = 0;
				if (realMap.get(x - 1, y + 0) === 2) score++; 
				if (realMap.get(x + 1, y + 0) === 2) score++; 
				if (realMap.get(x - 0, y - 1) === 2) score++; 
				if (realMap.get(x - 0, y + 1) === 2) score++;

				if (!safeMap.get(x, y)) {
					score -= 10;
				}

				o.score = score;

				return o;
			});
		
		// console.log(sort);
		sort.sort((a, b) => (b.score - a.score));
		// console.log(Object.keys(places));
		// console.log('sort', sort);
		const candidate = sort[0];
		if (candidate) {
			while (candidate.prev && candidate.prev.x !== gridX && candidate.prev.y !== gridY) {
				candidate = candidate.prev;
			}

			console.log(`${gridX},${gridY} -> ${candidate.x},${candidate.y}`);

			this.player.targetBy(candidate.x - gridX, candidate.y - gridY);
		}

		if (gridX === candidate.x && gridY === candidate.y) {
			this.player.dropBomb();
		}


		// console.log(safeMap.debugWalls());
		

		// TODO to be a more intelligent bot, it should also read time.

		// this.player.targetBy( (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
	}

}