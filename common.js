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
require('ai/bot.js');
require('ai/bot02.js');
require('ai/bot03.js');
require('ai/bot04.js');
require('ai/bot05.js');

// <!-- Sounds -->
require('jsfxr.js');
require('sounds.js');

require('colors.js');
