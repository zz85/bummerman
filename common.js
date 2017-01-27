function require(src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = false
    document.head.appendChild(script);
}


// <!-- Game -->
require('world.js');
require('item.js');
require('flumes.js');
require('bomb.js');
require('walls.js');
require('player.js');
require('ai/botplayer.js');
require('ai/botplayer02.js');
require('ai/botplayer03.js');

// <!-- Sounds -->
require('jsfxr.js');
require('sounds.js');

