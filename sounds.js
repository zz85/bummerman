// Use http://www.superflashbros.net/as3sfxr/ to generate sounds
const EXPLOSION = [3,,0.3654,0.4985,0.3801,0.0177,,0.1077,,,,,,,,0.3124,,,1,,,,,0.54];
const SAMPLE = [0,,0.1812,,0.1349,0.4524,,0.2365,,,,,,0.0819,,,,,1,,,,,0.5];
const PICKUP = [0,,0.26,0.07,0.13,0.29,0.09,0.2087,,0.2,,,0.09,0.16,-0.0999,0.15,-0.3,0.04,0.4,,,0.2763,,0.54]
const DIE = [0,0.0216,0.1137,0.38,0.6082,0.5813,,0.2126,-0.042,,0.749,-0.9034,0.624,0.1772,0.0875,,0.5401,0.0018,0.6906,0.0125,0.0277,0.0234,,0.54]; 
// [0,,0.3533,,0.2756,0.4873,,0.2087,,,,,,0.0963,,,,,0.6217,,,0.2763,,0.54]; 
// [0,,0.0996,0.5809,0.3535,0.4349,,,,,,0.5985,0.6633,,,,,,1,,,,,0.54];
// helicopter 1,0.7494,0.8458,0.5557,0.5793,0.0422,,,0.7166,-0.458,0.5089,-0.1099,-0.6036,-0.2389,0.7689,0.6317,0.0231,-0.0273,0.9848,0.3597,0.3336,0.013,,0.54

function createAudio(params) {
	const soundURL = jsfxr(params);
	const player = new Audio();
	player.src = soundURL;
	return player;
}

const cache = {
	explosion: createAudio(EXPLOSION),
	sample: createAudio(SAMPLE),
	pickup: createAudio(PICKUP),
	die: createAudio(DIE),
};

function playSound(name) {
	const sound = cache[name]
	if (sound) {
		sound.play();
	} else {
		console.log('Sound', name, 'not found');
	}
} 


