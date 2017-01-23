class AiPlayer {

	constructor(player, world) {
		this.player = player;
		this.world = world;

		this.safeMap = new Walls(COLUMNS, ROWS);


		this.last = Date.now();
	}

	updateSafeMap() {
		const realMap = this.world.map;

		const safeMap = this.safeMap;
		safeMap.cells.fill(true);

		// Mark out places that are inaccessible
		realMap.forEach((x, y, v) => {
			if (v) {
				safeMap.set(x, y, false);
				return;
			}
		});

		// Mark out places where bombs and fires are
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

		return safeMap;
	}

	_(x, y) {
		return x + ':' + y;
	}

	safeToBomb(places, bx, by, strength) {
		const places2 = Object.assign({}, places);
		places2[this._(bx, by)] = false;
		for (let i = 1; i < strength; i++) {
			const key = this._(bx + i, by);
			if (key in places2) {
				places2[key] = false;
			} else {
				break;
			}
		}

		for (let i = 1; i < strength; i++) {
			const key = this._(bx - i, by);
			if (key in places2) {
				places2[key] = false;
			} else {
				break;
			}
		}

		for (let i = 1; i < strength; i++) {
			const key = this._(bx, by + i);
			if (key in places2) {
				places2[key] = false;
			} else {
				break;
			}
		}

		for (let i = 1; i < strength; i++) {
			const key = this._(bx, by - i);
			if (key in places2) {
				places2[key] = false;
			} else {
				break;
			}
		}

		for (let k in places2) {
			if (places2[k]) return true;
		}

		return false;
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

		// Bomberman Narrative

		// Bomberman sees a space
		// He places a bomb
		// He moves away from the area of fire

		// He waits for bomb to blow
		// He places another bomb
		// He moves away from the area of fire
		// He collects an item

		// He continues bombing
		// He sees enemies
		// He moves towards them
		// He drops bombs around them they might be trapped in

		// The Loop

		// Possible Actions
		// 1. Move
		// 2. Drop Bomb
		// 3. Wait

		// Do we need a "fight or flight" mode?

		const realMap = this.world.map;
		const safeMap = this.updateSafeMap();
		const player = this.player;

		// current grid
		const gridX = player.x + 0.5 | 0;
		const gridY = player.y + 0.5 | 0;

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

		// Find best places to drop bombs.
		// 1. Proximity to other players
		// 2. Best place to blow bricks

		const sort = Object.keys(places).map(k => places[k])
			.map((o) => {
				const {x, y} = o;
				let score = 0;

				// increase score if there're bricks to blow
				if (realMap.get(x - 1, y + 0) === 2) score++;
				if (realMap.get(x + 1, y + 0) === 2) score++;
				if (realMap.get(x - 0, y - 1) === 2) score++;
				if (realMap.get(x - 0, y + 1) === 2) score++;

				// boost score if items is there
				if (this.world.hasItem(x, y)) {
					score += 4;
				}

				if (this.safeToBomb(places, x, y, player.bombStrength)) {
					score += 2;
				} else {
					score -= 2;
				}

				// const dist = ((x - player.x) ** 2 + (y - player.y) ** 2) ** 0.5;
				// score += Math.max(10 - dist, 0);

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

			const dxa = a.x - player.x;
			const dya = a.y - player.y;
			const dista = dxa * dxa + dya * dya;

			const dxb = b.x - player.x;
			const dyb = b.y - player.y;
			const distb = dxb * dxb + dyb * dyb;

			return dista - distb;
		});
		// console.log(Object.keys(places));
		// console.log('sort', sort);
		const candidate = sort[0];

		const bfsPath = (startX, startY, targetX, targetY) => {
			const paths = {}; // cache
			const jobs = []; // queue

			jobs.push([startX, startY, null]); // start

			while (jobs.length) {
				const job = jobs.shift();
				const [x, y, prev] = job;

				const key = x + ':' + y;
				if (paths[key]) continue; // processed before

				const blocked = !!realMap.get(x, y); // TODO check bombs
				if (blocked) continue;

				paths[key] = { x, y, prev }; // store in cache

				if (x === targetX && y === targetY)
				// break; // we're done
					return paths[key];

				// search more
				jobs.push([x - 1, y + 0, paths[key]]);
				jobs.push([x + 1, y + 0, paths[key]]);
				jobs.push([x - 0, y - 1, paths[key]]);
				jobs.push([x - 0, y + 1, paths[key]]);
			}

			// return paths;
		}


		let debug = '';

		const nowSafe = safeMap.get(gridX, gridY);
		debug += nowSafe ? ' Safe. ' : ' Unsafe. '

		if (candidate) {
			const shortest = bfsPath(candidate.x, candidate.y, gridX, gridY);
			let route = shortest && shortest.prev;

			if (route) {
				// console.log('route', route);
				debug += `@ ${gridX},${gridY} -> ${candidate.x},${candidate.y} `;

				if (nowSafe && !safeMap.get(route.x, route.y)) {
					player.moveStop();
				}
				else {
					player.targetBy(route.x - player.x, route.y - player.y);
				}
			}
		}

		// When to drop bombs?
		// 1. You can hide after dropping bomb
		// Where? Where you can blow walls, enemy players
		if (gridX === candidate.x && gridY === candidate.y) {
			debug += ' drop bomb. '
			player.dropBomb();
		}

		pre.innerHTML = debug;

		// console.log(safeMap.debugWalls());

		// TODO to be a more intelligent bot, it should also read time.
		// Random Bot
		// player.targetBy( (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
	}

}