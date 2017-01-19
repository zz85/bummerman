const CELL_PIXELS = 45;

let canvas, ctx;

function init() {
	canvas = document.createElement('canvas');
	canvas.width = CELL_PIXELS * COLUMNS + 50;
	canvas.height = CELL_PIXELS * COLUMNS + 50;
	document.body.appendChild(canvas);

	ctx = canvas.getContext('2d');
}

function render() {
	// Here is the render Loop
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	let now = Date.now();
	// walls
	map.forEach((x, y, v) => {

		switch (v) {
			case 1: ctx.fillStyle = '#333'; break;
			case 2: ctx.fillStyle = '#888'; break;
			default: ctx.fillStyle = '#eee';
		}

		ctx.strokeStyle = '#333';
		ctx.fillRect(x * CELL_PIXELS, y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
		if (v) ctx.strokeRect(x * CELL_PIXELS, y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
	});

	const f = (t) => t < 0.5 ? t * 2 : 2 - t * 2;
	// Math.sin((now - item.planted)/ 1000 * 8)

	for (let item of world.objects) {
		if (item instanceof Bomb) {
			let size = 1 - f(((now - item.planted) / 800) % 1) * 0.2;
			ctx.fillStyle = 'red';
			ctx.beginPath();
			ctx.arc((item.x + 0.5) * CELL_PIXELS, (item.y + 0.5) * CELL_PIXELS, CELL_PIXELS / 3 * size, 0, Math.PI * 2);
			ctx.fill();
		}
		else if (item instanceof Flumes) {
			ctx.fillStyle = 'orange';
			ctx.fillRect(item.x * CELL_PIXELS, item.y * CELL_PIXELS, CELL_PIXELS, CELL_PIXELS);
		}
		else if (item instanceof Item) {
			ctx.fillStyle = 'orange';
			ctx.fillRect((item.x + 0.1) * CELL_PIXELS, (item.y + 0.1) * CELL_PIXELS, CELL_PIXELS * 0.8, CELL_PIXELS * 0.8);

			ctx.fillStyle = 'red';
			ctx.fillText(item.type, (item.x + 0.5) * CELL_PIXELS, (item.y + 0.5) * CELL_PIXELS);
		}
	}

	for (let player of world.players) {
		// TODO disolve player after dying...
		const x = player.x * CELL_PIXELS;
		const y = player.y * CELL_PIXELS;
		// player
		ctx.fillStyle = '#0d0';
		ctx.fillRect(x, y, CELL_PIXELS, CELL_PIXELS);

		ctx.fillStyle = '#999';
		ctx.fillText(`${player.name} (${player.x}, ${player.y})`, x + 10, y + 10);
	}
}