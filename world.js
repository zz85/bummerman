class World {
	constructor() {
		// All items
		this.objects = new Set();

		this.bombs = new Set();
		this.flumes = new Set();
		this.items = new Set();

		// TODO
		// - Walls / Maps
		// - Players
	}

	add(item) {
		this.objects.add(item);
	}

	remove(item) {
		this.objects.delete(item);
	}

	addFlumes(flumes) {
		this.flumes.add(flumes);
		this.add(flumes);
	}

	removeFlumes(flumes) {
		this.flumes.delete(flumes);
		this.remove(flumes);
	}

	addBomb(bomb) {
		this.bombs.add(bomb);
		this.add(bomb);
	}

	removeBomb(bomb) {
		this.bombs.delete(bomb);
		this.remove(bomb);
	}

	addItem(item) {
		this.items.add(item);
		this.add(item);
	}

	removeItem(item) {
		this.items.delete(item);
		this.remove(item);
	}

	isBlocked(x, y) {
		// expect snapped integers
		if (map.get(x, y)) return true;
		return false;
	}

	hasBomb(x, y) {
		for (let bomb of this.bombs) {
			if (bomb.snapX() === x && bomb.snapY() === y) {
				return true;
			}
		}
		return false;
	}

	blow(x, y) {
		// check for Players
		if (player1.coverXs().find(v => v === x)
			&& player1.coverYs().find(v => v === y)) {
			pre.innerHTML = 'You died!';
			playSound('die');
			// TODO make this an event
		}

		// check for Items
		for (let item of this.items) {
			if (item.x === x && item.y === y) {
				this.removeItem(item);
			}
		}

		// check for Bombs
		for (let bomb of this.bombs) {
			if (bomb.snapX() === x && bomb.snapY() === y) {
				bomb.explode();
			}
		}

		// check for Walls
		if (map.blow(x, y)) {
			
			if (Math.random() < 0.5) {
				this.addItem(new Item(x, y, Math.random() * 3 | 0));
			}
		}

		// or should bomb going off be an event
		// and all items listen for exploding event?
	}
}