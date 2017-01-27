class Bot {

	constructor(player, world) {
		this.player = player;
		this.world = world;

		this.safeMap = new Walls(COLUMNS, ROWS);

		this.last = 0;
		this.lastDecisionTime = 0;
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
			const { x, y } = bomb;

			this.fireCheck(bomb.strength, (dx, dy) => {
				if (realMap.get(x + dx, y + dy)) {
					return true;
				}

				safeMap.set(x + dx, y + dy, false);
			});
		}

		return safeMap;
	}

	_(x, y) {
		return x + ':' + y;
	}

	fireCheck(strength, cb) {
		cb(0, 0);

		for (let i = 1; i <= strength; i++) {
			if (cb(-i, 0)) break;
		}

		for (let i = 1; i <= strength; i++) {
			if (cb(i, 0)) break;
		}

		for (let i = 1; i <= strength; i++) {
			if (cb(0, i)) break;
		}

		for (let i = 1; i <= strength; i++) {
			if (cb(0, -i)) break;
		}
	}

	safeToBomb(places, bx, by, strength) {
		const realMap = this.world.map;
		const places2 = Object.assign({}, places);

		let safe = false;
		let players = 0;
		let walls = 0;

		const firing = (dx, dy) => {
			const x = bx + dx;
			const y = by + dy;
			const wall = realMap.get(x, y);

			if (wall === 1) return true; // abort
			if (wall === 2) {
				walls++;
			}

			for (let player of this.world.players) {
				if (player.died) continue;
				if (player !== this.player && player.isIn(x, y)) {
					players++;
				}
			}

			const key = this._(x, y);
			if (key in places2) {
				places2[key] = false;
			}		
		}

		this.fireCheck(strength, firing);

		for (let k in places2) {
			if (places2[k]) {
				safe = true;
				break;
			}
		}

		return {
			safe,
			players,
			walls
		};
	}

	// breath first search 
	bfsPath(startX, startY, targetX, targetY, maxDepth = 100) {
		const paths = {}; // cache
		const jobs = []; // queue
		const realMap = this.world.map;

		jobs.push([startX, startY, null, 0]); // start

		while (jobs.length) {
			const job = jobs.shift();
			const [x, y, prev, depth] = job;
			if (depth > maxDepth) continue;

			const key = x + ':' + y;
			if (paths[key]) continue; // processed before

			const blocked = !!realMap.get(x, y); //TODO check bombs
			if (blocked) continue;
			if (!this.player.isIn(x, y) && this.world.hasBomb(x, y)) continue;

			paths[key] = { x, y, prev, depth }; // store in cache

			if (x === targetX && y === targetY)
			// break; // we're done
				return paths[key];

			// search more
			jobs.push([x - 1, y + 0, paths[key], depth + 1]);
			jobs.push([x + 1, y + 0, paths[key], depth + 1]);
			jobs.push([x - 0, y - 1, paths[key], depth + 1]);
			jobs.push([x - 0, y + 1, paths[key], depth + 1]);
		}

		// return paths;
	}

	update() {
		if (this.player.died) {
			return;
		}

		const now = Date.now();


		if (now - this.lastDecisionTime >= 1000) {
			this.decisionUpdate();
			this.lastDecisionTime = now;
		}

		if (now - this.last >= 100) {
			this.last = now;
			this.botUpdate();
		}

		// console.log('thinking..');

	}

	decisionUpdate() {
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

		// Qns
		// Do we need a "fight or flight" mode?
		// Interval decision making?

		// Find best places to drop bombs.
		// 1. Proximity to other players
		// 2. Best place to blow bricks
		// 3. Abort if after dropping attack vectors become high
		// 4. Running a chain of fire
		// 5. In general, create the biggest surface attack vector
		// 6. It's a little like Go.

		// When in the line of fire
		// 1. Find the shortest / safest place to get out of it
		// 2. Attempt to stick to the plan and avoid the fire

		// Player tatics
		// drop bomb on directional change
		// directional change on dropping bomb

		this.enemyMode = false;

		for (let player of this.world.players) {
			if (player === this.player) continue;
			if (player.died) continue;

			const found = this.bfsPath(player.x | 0, player.y | 0, this.player.x | 0, this.player.y | 0, 10);
			if (found) {
				// console.log('Enemy contacted!', found, player);
				this.enemyMode = true;
			}
		}

		// get out of fire mode

	}

	findPlaces(realMap = this.world.map) {
		// find accessible players that playaer can go to.
		const startX = this.player.x | 0;
		const startY = this.player.y | 0;

		// where can bot go?
		const places = {};
		const queue = [];
		queue.push([startX, startY, 0]);

		while (queue.length) {
			const [x, y, depth] = queue.pop();

			const key = x + ':' + y;
			if (key in places) continue;

			// if (depth > 5) continue;

			const blocked = !!realMap.get(x, y) || (!this.player.isIn(x, y) && this.world.hasBomb(x, y));
			if (blocked) continue;

			places[key] = { x, y, depth };

			queue.push([x - 1, y + 0, depth + 1]);
			queue.push([x + 1, y + 0, depth + 1]);
			queue.push([x - 0, y - 1, depth + 1]);
			queue.push([x - 0, y + 1, depth + 1]);
		}

		return places;
	}

	botUpdate() {
		const player = this.player;

		// current grid
		const gridX = player.x + 0.5 | 0;
		const gridY = player.y + 0.5 | 0;

		// where can bot go?
		const safeMap = this.updateSafeMap();
		const places = this.findPlaces();

		let best_score = -Infinity;

		// TODO
		// make safety map + then attack map
		// tweak scoring to calculating the number of liveness from a bomb
		let sort = Object.keys(places).map(k => places[k])
			.map((o) => {
				const {x, y} = o;
				let score = 0;

				// boost score if items is there
				if (this.world.hasItem(x, y)) {
					score += 10;
				}

				const analysis = this.safeToBomb(places, x, y, player.bombStrength);
				// console.log(x, y, analysis);
				if (analysis.safe) {
					score += 2;
				} else {
					// score -= 2;
				}

				if (analysis.players) {
					score += 10 * analysis.players;
				}

				// increase score if there're bricks to blow
				if (analysis.walls) {
					score += analysis.walls
				}

				if (!safeMap.get(x, y)) {
					score = -10;
				}

				o.score = score;
				best_score = Math.max(best_score, score);

				Object.assign(o, analysis);

				return o;
			})
			.filter(o => o.score === best_score)
			.sort((a, b) => {
				// if (b.score !== a.score)
				// 	return b.score - a.score;

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
		const candidate = sort[0]; // Math.random() * sort.length | 0

		let debug = '';

		const nowSafe = safeMap.get(gridX, gridY);
		debug += nowSafe ? ' Safe. ' : ' Unsafe. ';

		if (candidate) {
			const shortest = this.bfsPath(candidate.x, candidate.y, gridX, gridY);
			let route = shortest && shortest.prev;

			if (route) {
				// console.log('route', route);
				debug += ` walls ${candidate.walls}, Safe ${candidate.safe}, ${candidate.players}\n `
				debug += ` @${gridX},${gridY} -> ${candidate.x},${candidate.y}. `;

				if (nowSafe && !safeMap.get(route.x, route.y)) {
					debug += ' Unsafe to move. ';
					player.moveStop();
				}
				else {
					player.targetBy(route.x - player.x, route.y - player.y);
				}
			}
		}

		debug += ` ${player.bombsUsed}/${player.bombsLimit} bombs. `;

		const safeToBomb = this.safeToBomb(places, gridX, gridY, player.bombStrength).safe;
		debug += ` ${safeToBomb ? 'Safe' : 'Unsafe' } bomb site. `

		if (nowSafe && safeToBomb && 
			(!candidate || gridX === candidate.x && gridY === candidate.y)) {
			player.dropBomb();
			this.lastBombDrop = Date.now(); // start dropping bombs
		}

		// if (Date.now() - this.lastBombDrop < 2000 && safeToBomb && Math.random() > 0.7 && player.dropBomb()) {
		// 	// this.lastBombDrop = Date.now();
		// }

		// pre.innerHTML = debug;

		// console.log(safeMap.debugWalls());
	}

}