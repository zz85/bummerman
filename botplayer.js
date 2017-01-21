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

		const findPlaces = (places, x, y) => {
			const key = x + ':' + y;
			if (key in places) return;

			const blocked = !!realMap.get(x, y);
			if (blocked) return;
			places[key] = {
				x: x,
				y: y
			};
			findPlaces(places, x - 1, y + 0, places[key]);
			findPlaces(places, x + 1, y + 0, places[key]);
			findPlaces(places, x - 0, y - 1, places[key]);
			findPlaces(places, x - 0, y + 1, places[key]);
		};

		findPlaces(places, gridX, gridY);

		const sort = Object.keys(places).map(k => places[k])
			.map((o) => {
				const {x, y} = o;
				let score = 0;
				if (realMap.get(x - 1, y + 0) === 2) score++;
				if (realMap.get(x + 1, y + 0) === 2) score++;
				if (realMap.get(x - 0, y - 1) === 2) score++;
				if (realMap.get(x - 0, y + 1) === 2) score++;

				if (this.world.hasItem(x, y)) {
					score += 4;
				}
				if (!safeMap.get(x, y)) {
					score = -10;
				}

				o.score = score;

				return o;
			});

		// console.log(sort);
		sort.sort((a, b) => {
			if (b.score !== a.score)
				return b.score - a.score;
			const x = (b.x - a.x);
			if (x) return x;
			return (b.y - a.y);
		});
		// console.log(Object.keys(places));
		// console.log('sort', sort);
		const candidate = sort[0];

		const findPath = (paths, x, y, hx, hy, prev) => {
			const key = x + ':' + y;
			if (key in paths) return;

			const blocked = !!realMap.get(x, y);
			if (blocked) return;
			paths[key] = {
				x: x,
				y: y,
				prev
			};

			if (x === hx && y === hy) return;
			findPath(paths, x - 1, y + 0, hx, hy, paths[key]);
			findPath(paths, x + 1, y + 0, hx, hy, paths[key]);
			findPath(paths, x - 0, y - 1, hx, hy, paths[key]);
			findPath(paths, x - 0, y + 1, hx, hy, paths[key]);
		};


		let debug = '';

		const nowSafe = safeMap.get(gridX, gridY);
		debug += nowSafe ? ' Safe. ' : ' Unsafe. '

		if (candidate) {
			const paths = {};
			findPath(paths, candidate.x, candidate.y, gridX, gridY);

			let route = paths[`${gridX}:${gridY}`].prev;

			if (route) {
				// console.log('route', route);
				// console.log(`${gridX},${gridY} -> ${candidate.x},${candidate.y}`);

				if (nowSafe && !safeMap.get(route.x, route.y)) {
					this.player.moveStop();
				}
				else {
					this.player.targetBy(route.x - this.player.x, route.y - this.player.y);
				}
			}
		}

		// When to drop bombs?
		// 1. You can hide after dropping bomb
		// Where? Where you can blow walls, enemy players
		if (gridX === candidate.x && gridY === candidate.y) {
			debug += ' drop bomb. '
			this.player.dropBomb();
		}

		pre.innerHTML = debug;

		// console.log(safeMap.debugWalls());

		// TODO to be a more intelligent bot, it should also read time.

		// this.player.targetBy( (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
	}

}