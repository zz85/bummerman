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
		this.masterGain.gain.value = 0.3;
		this.masterGain.connect(this.ctx.destination);
	}

	// Pentatonic scale notes (C pentatonic)
	getNote(index) {
		const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
		return scale[index % scale.length] * (index >= 8 ? 2 : 1);
	}

	// Bass pattern (root notes)
	getBass(step) {
		const pattern = [0, 0, 3, 3, 4, 4, 3, 3];
		const roots = [130.81, 146.83, 164.81, 174.61]; // C3, D3, E3, F3
		return roots[pattern[step % 8] % 4];
	}

	// Melody pattern
	getMelody(step) {
		const pattern = [0, 2, 4, 5, 4, 2, 3, 1, 0, 4, 5, 7, 5, 4, 2, 0];
		return this.getNote(pattern[step % 16]);
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
