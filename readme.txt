Bummerman - Bomberman Clone
============================

A browser-based Bomberman clone built with vanilla JavaScript and Three.js.

Overview
--------
This is a multiplayer arena game where players place bombs to destroy walls and eliminate opponents. Supports up to 4 players with AI bots.

Vision
------
- Recreate the classic multiplayer arcade/console Bomberman feel
- Capture the Nintendo 64 3D Bomberman aesthetic
- FPS chase cam view for immersive 3D gameplay
- Fully procedural: graphics and sound generated at runtime (no external assets)
- Low-poly aesthetic for the 3D visuals

Features
--------
- 2D canvas renderer (render.js) and 3D Three.js renderer (render3d.js)
- 4-player local multiplayer with keyboard controls
- AI bots with pathfinding (BFS) and tactical decision-making
- Destructible soft walls with random powerup drops
- Sound effects using jsfxr

Controls
--------
Player 1: Arrow keys + Enter (drop bomb)
Player 2: WASD + Shift (drop bomb)
Player 3: IJKL + Space (drop bomb)
Player 4: AI controlled

Powerups
--------
- Speed Up: Increases movement speed
- Bombs Up: Increases bomb capacity
- Fire Up: Increases explosion range

Files
-----
- bomber.html / bomber.js: Main 2D game entry
- bomber3d.html / render3d.js: 3D version with Three.js
- player.js: Player movement, collision, powerup collection
- bomb.js: Bomb planting and explosion logic
- walls.js: Map generation (hard/soft walls)
- flumes.js: Explosion flames
- world.js: Game state management
- ai/bot.js: Main AI with safety maps and BFS pathfinding
- models.js: 3D models for bombs, walls, players
- sounds.js: Sound effect definitions

TODO (from source)
------------------
- Music, networking, mobile touch controls
- VR/FPS view modes
- Better item distribution and graphics
- More powerups and time elements

Roadmap
-------
See roadmap.txt for planned features and progress.
