const CELL_PIXELS = 48;
const PADDING = 25;

let canvas, ctx;

function init() {
	const cols = map ? map.columns : 15;
	const rows = map ? map.rows : 15;
	canvas = document.createElement('canvas');
	canvas.width = CELL_PIXELS * cols + PADDING * 2;
	canvas.height = CELL_PIXELS * rows + PADDING * 2;
	document.body.appendChild(canvas);
	ctx = canvas.getContext('2d');
}

function drawRoundedRect(x, y, w, h, r) {
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
	ctx.fill();
}

function render() {
	if (!map) return;

	const now = Date.now();
	const cols = map.columns;
	const rows = map.rows;

	// Resize canvas if grid changed
	const neededWidth = CELL_PIXELS * cols + PADDING * 2;
	const neededHeight = CELL_PIXELS * rows + PADDING * 2;
	if (canvas.width !== neededWidth || canvas.height !== neededHeight) {
		canvas.width = neededWidth;
		canvas.height = neededHeight;
	}

	// Background gradient
	const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
	grad.addColorStop(0, '#16213e');
	grad.addColorStop(1, '#1a1a2e');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.save();
	ctx.translate(PADDING, PADDING);

	// Draw grid
	map.forEach((x, y, v) => {
		const px = x * CELL_PIXELS;
		const py = y * CELL_PIXELS;
		const inset = 2;

		if (v === 1) {
			// Hard wall - dark with highlight
			ctx.fillStyle = '#0f0f23';
			drawRoundedRect(px + inset, py + inset, CELL_PIXELS - inset * 2, CELL_PIXELS - inset * 2, 4);
			ctx.fillStyle = '#1a1a3a';
			drawRoundedRect(px + inset + 2, py + inset + 2, CELL_PIXELS - inset * 2 - 8, CELL_PIXELS - inset * 2 - 8, 3);
		} else if (v === 2) {
			// Soft wall - brick pattern
			ctx.fillStyle = '#4a3728';
			drawRoundedRect(px + inset, py + inset, CELL_PIXELS - inset * 2, CELL_PIXELS - inset * 2, 3);
			ctx.fillStyle = '#5d4632';
			const bh = (CELL_PIXELS - inset * 2) / 3;
			for (let i = 0; i < 3; i++) {
				const offset = i % 2 === 0 ? 0 : (CELL_PIXELS - inset * 2) / 4;
				ctx.fillRect(px + inset + 2 + offset, py + inset + 2 + i * bh, (CELL_PIXELS - inset * 2) / 2 - 4, bh - 2);
			}
		} else {
			// Floor - subtle tile
			ctx.fillStyle = '#2d4a3e';
			drawRoundedRect(px + inset, py + inset, CELL_PIXELS - inset * 2, CELL_PIXELS - inset * 2, 2);
			ctx.fillStyle = '#3d5a4e';
			ctx.fillRect(px + inset + 4, py + inset + 4, CELL_PIXELS - inset * 2 - 8, CELL_PIXELS - inset * 2 - 8);
		}
	});

	// Draw items, bombs, flumes
	const pulse = (t) => t < 0.5 ? t * 2 : 2 - t * 2;

	for (let item of world.objects) {
		if (item instanceof Bomb) {
			const px = (item.rx + 0.5) * CELL_PIXELS;
			const py = (item.ry + 0.5) * CELL_PIXELS;
			const size = 1 - pulse(((now - item.planted) / 600) % 1) * 0.15;
			const radius = CELL_PIXELS * 0.35 * size;

			// Bomb body
			const bombGrad = ctx.createRadialGradient(px - 3, py - 3, 0, px, py, radius);
			bombGrad.addColorStop(0, '#444');
			bombGrad.addColorStop(0.7, '#111');
			bombGrad.addColorStop(1, '#000');
			ctx.fillStyle = bombGrad;
			ctx.beginPath();
			ctx.arc(px, py, radius, 0, Math.PI * 2);
			ctx.fill();

			// Fuse spark
			const sparkPhase = (now / 100) % 1;
			ctx.fillStyle = `hsl(${30 + sparkPhase * 30}, 100%, ${60 + sparkPhase * 20}%)`;
			ctx.beginPath();
			ctx.arc(px, py - radius - 3, 4 + sparkPhase * 2, 0, Math.PI * 2);
			ctx.fill();
		}
		else if (item instanceof Flumes) {
			const px = item.x * CELL_PIXELS;
			const py = item.y * CELL_PIXELS;
			const phase = (now / 50) % 1;

			// Fire gradient
			const fireGrad = ctx.createRadialGradient(
				px + CELL_PIXELS / 2, py + CELL_PIXELS / 2, 0,
				px + CELL_PIXELS / 2, py + CELL_PIXELS / 2, CELL_PIXELS * 0.6
			);
			fireGrad.addColorStop(0, '#fff');
			fireGrad.addColorStop(0.2, '#ffcc00');
			fireGrad.addColorStop(0.5, '#ff6600');
			fireGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
			ctx.fillStyle = fireGrad;
			ctx.fillRect(px, py, CELL_PIXELS, CELL_PIXELS);
		}
		else if (item instanceof Item) {
			const px = (item.x + 0.5) * CELL_PIXELS;
			const py = (item.y + 0.5) * CELL_PIXELS;
			const bob = Math.sin(now / 200) * 3;
			const size = CELL_PIXELS * 0.35;

			// Item glow
			ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
			ctx.beginPath();
			ctx.arc(px, py + bob, size + 8, 0, Math.PI * 2);
			ctx.fill();

			// Item icon
			const colors = ['#00ff88', '#ff6688', '#ffaa00', '#88ccff'];
			const icons = ['⚡', '💣', '🔥', '👟'];
			ctx.fillStyle = colors[item.type] || '#fff';
			ctx.beginPath();
			ctx.arc(px, py + bob, size, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = '#000';
			ctx.font = '16px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(icons[item.type] || '?', px, py + bob);
		}
	}

	// Draw players
	for (let player of world.players) {
		let deathT = 0;
		if (player.died) deathT = Math.min((now - player.died) / 1500, 1);

		const px = (player.x + 0.5) * CELL_PIXELS;
		const py = (player.y + 0.5) * CELL_PIXELS;
		const size = CELL_PIXELS * 0.4 * (1 - deathT * 0.5);

		if (deathT > 0) {
			ctx.globalAlpha = 1 - deathT;
		}

		// Player shadow
		ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
		ctx.beginPath();
		ctx.ellipse(px, py + size * 0.8, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
		ctx.fill();

		// Player body
		const bodyGrad = ctx.createRadialGradient(px - 3, py - 5, 0, px, py, size);
		bodyGrad.addColorStop(0, player.color2 || '#fff');
		bodyGrad.addColorStop(1, player.color);
		ctx.fillStyle = bodyGrad;
		ctx.beginPath();
		ctx.arc(px, py - 4, size, 0, Math.PI * 2);
		ctx.fill();

		// Eyes
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(px - 6, py - 8, 5, 0, Math.PI * 2);
		ctx.arc(px + 6, py - 8, 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#000';
		ctx.beginPath();
		ctx.arc(px - 5, py - 7, 2, 0, Math.PI * 2);
		ctx.arc(px + 7, py - 7, 2, 0, Math.PI * 2);
		ctx.fill();

		ctx.globalAlpha = 1;
	}

	ctx.restore();
}
