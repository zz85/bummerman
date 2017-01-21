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
		if (now - this.last < 5000) {
			return;
		}

		console.log('thinking..');

		this.last = now;

		// current grid
		const gridX = this.player.x + 0.5 | 0;
		const gridY = this.player.y + 0.5 | 0;

		// Rule no. 1 - Survival.
		// If there are bombs, run!
		// Based on bombs, build a safe map.

		this.safeMap.cells.fill(true);
		const realMap = this.world.map; 

		realMap.forEach((x, y, v) => {
			if (v) {
				this.safeMap.set(x, y, false);
				return;
			}
		});

		for (let bomb of this.world.bombs) {
			const {x, y} = bomb;
			this.safeMap.set(x, y, false);

			for (let l = 1; l <= bomb.strength; l++) {
				const cx = x - l;
				if (realMap.get(cx, y)) {
					break;
				}
				
				this.safeMap.set(cx, y, false);
			}

			for (let l = 1; l <= bomb.strength; l++) {
				const cx = x + l;
				if (realMap.get(cx, y)) {
					break;
				}
				
				this.safeMap.set(cx, y, false);
			}

			for (let l = 1; l <= bomb.strength; l++) {
				const cy = y - l;
				if (realMap.get(x, cy)) {
					break;
				}
				
				this.safeMap.set(x, cy, false);
			}

			for (let l = 1; l <= bomb.strength; l++) {
				const cy = y + l;
				if (realMap.get(x, cy)) {
					break;
				}
				
				this.safeMap.set(x, cy, false);
			}
		}

		console.log(this.safeMap.debugWalls());
		

		// TODO to be a more intelligent bot, it should also read time.

	}

}