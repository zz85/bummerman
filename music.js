// Procedural chiptune music generator using Web Audio API
class Music {
	constructor() {
		this.ctx = null;
		this.playing = false;
		this.bpm = 150;
		this.step = 0;
		this.nextNoteTime = 0;
		this.scheduleAhead = 0.1;
		this.timerID = null;
	}

	init() {
		if (this.ctx) return;
		this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		this.masterGain = this.ctx.createGain();
		this.masterGain.gain.value = 0.5;
		this.masterGain.connect(this.ctx.destination);
	}

	// Pentatonic scale notes (C pentatonic)
	getNote(index) {
		const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
		return scale[index % scale.length] * (index >= 8 ? 2 : 1);
	}

	// Bass pattern - 16 bars = 256 steps, plays on quarter notes
	getBass(step) {
		// 64 quarter notes over 16 bars
		const pattern = [
			// Section A (bars 1-4): C-Am-F-G
			0, 0, 0, 0, 5, 5, 5, 5,   // bars 1-2: C -> Am
			3, 3, 3, 3, 4, 4, 4, 4,   // bars 3-4: F -> G
			// Section B (bars 5-8): F-G-Em-Am (anime)
			3, 3, 3, 3, 4, 4, 4, 4,   // bars 5-6: F -> G
			2, 2, 2, 2, 5, 5, 5, 5,   // bars 7-8: Em -> Am
			// Section C (bars 9-12): Am-F-C-G (variation)
			5, 5, 5, 5, 3, 3, 3, 3,   // bars 9-10: Am -> F
			0, 0, 0, 0, 4, 4, 4, 4,   // bars 11-12: C -> G
			// Section D (bars 13-16): F-G-C (big finish)
			3, 3, 3, 3, 4, 4, 4, 4,   // bars 13-14: F -> G
			0, 0, 0, 0, 0, 0, 0, 0    // bars 15-16: C (resolve)
		];
		const roots = [130.81, 146.83, 164.81, 174.61, 196.00, 110.00]; // C3, D3, E3, F3, G3, A2
		const idx = Math.floor(step / 4) % 64;
		return roots[pattern[idx] % 6];
	}

	// Melody pattern - 16 bars = 256 steps, plays on 8th notes
	getMelody(step) {
		// 128 eighth notes over 16 bars
		const pattern = [
			// Section A (bars 1-4) - intro theme
			0, 2, 4, 7, 5, 4, 2, 0,   // bar 1 (C)
			2, 4, 5, 7, 8, 5, 4, 2,   // bar 2 (Am)
			3, 5, 7, 10, 8, 7, 5, 3,  // bar 3 (F)
			4, 7, 5, 8, 7, 5, 4, 2,   // bar 4 (G)
			// Section B (bars 5-8) - anime climax
			5, 7, 10, 12, 10, 8, 7, 5,// bar 5 (F) - soar
			7, 10, 12, 10, 8, 10, 7, 5,// bar 6 (G) - peak
			4, 7, 8, 7, 5, 4, 2, 4,   // bar 7 (Em) - descend
			5, 7, 5, 4, 2, 0, 2, 4,   // bar 8 (Am) - land
			// Section C (bars 9-12) - reflective
			2, 5, 4, 7, 5, 8, 7, 5,   // bar 9 (Am)
			3, 5, 8, 7, 5, 4, 2, 4,   // bar 10 (F)
			0, 4, 5, 7, 8, 7, 5, 4,   // bar 11 (C)
			5, 8, 10, 8, 7, 5, 7, 8,  // bar 12 (G)
			// Section D (bars 13-16) - finale
			5, 8, 7, 10, 8, 7, 5, 4,  // bar 13 (F)
			7, 10, 12, 10, 8, 7, 5, 4,// bar 14 (G) - last climb
			2, 5, 4, 7, 5, 4, 2, 0,   // bar 15 (C)
			2, 4, 5, 4, 2, 0, -1, 0   // bar 16 (C) - end
		];
		const idx = Math.floor(step / 2) % 128;
		const note = pattern[idx];
		return note < 0 ? 0 : this.getNote(note);
	}

	// Create square wave oscillator
	createSquare(freq, duration, startTime, gain = 0.15) {
		const osc = this.ctx.createOscillator();
		const env = this.ctx.createGain();
		osc.type = 'square';
		osc.frequency.value = freq;
		env.gain.setValueAtTime(gain, startTime);
		env.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.9);
		osc.connect(env);
		env.connect(this.masterGain);
		osc.start(startTime);
		osc.stop(startTime + duration);
	}

	// Create triangle wave for bass
	createBass(freq, duration, startTime) {
		const osc = this.ctx.createOscillator();
		const env = this.ctx.createGain();
		osc.type = 'triangle';
		osc.frequency.value = freq;
		env.gain.setValueAtTime(0.25, startTime);
		env.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.8);
		osc.connect(env);
		env.connect(this.masterGain);
		osc.start(startTime);
		osc.stop(startTime + duration);
	}

	// Noise for percussion
	createNoise(duration, startTime, highpass = 5000) {
		const bufferSize = this.ctx.sampleRate * duration;
		const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = Math.random() * 2 - 1;
		}
		const noise = this.ctx.createBufferSource();
		noise.buffer = buffer;
		const filter = this.ctx.createBiquadFilter();
		filter.type = 'highpass';
		filter.frequency.value = highpass;
		const env = this.ctx.createGain();
		env.gain.setValueAtTime(0.1, startTime);
		env.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.5);
		noise.connect(filter);
		filter.connect(env);
		env.connect(this.masterGain);
		noise.start(startTime);
	}

	scheduleNote(time) {
		const stepDuration = 60 / this.bpm / 4; // 16th notes

		// Bass on beats 1 and 3
		if (this.step % 4 === 0) {
			this.createBass(this.getBass(this.step), stepDuration * 2, time);
		}

		// Melody
		if (this.step % 2 === 0) {
			this.createSquare(this.getMelody(this.step), stepDuration * 1.5, time, 0.12);
		}

		// Hi-hat on every step
		this.createNoise(0.05, time, 8000);

		// Snare on beats 2 and 4
		if (this.step % 8 === 4) {
			this.createNoise(0.1, time, 2000);
		}
	}

	scheduler() {
		while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAhead) {
			this.scheduleNote(this.nextNoteTime);
			this.nextNoteTime += 60 / this.bpm / 4;
			this.step++;
		}
		this.timerID = setTimeout(() => this.scheduler(), 25);
	}

	play() {
		if (this.playing) return;
		this.init();
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
		this.playing = true;
		this.nextNoteTime = this.ctx.currentTime;
		this.scheduler();
	}

	stop() {
		if (!this.playing) return;
		this.playing = false;
		clearTimeout(this.timerID);
	}

	toggle() {
		if (this.playing) this.stop();
		else this.play();
	}

	setVolume(v) {
		if (this.masterGain) {
			this.masterGain.gain.value = Math.max(0, Math.min(1, v));
		}
	}
}

const music = new Music();
