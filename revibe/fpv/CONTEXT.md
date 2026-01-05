# Bomberman FPV - Session Context

## Project Location
`fpv`

## Git Branch
`experiments`

## Latest Commit
`34cd73a` - Gameplay improvements and AI enhancements

## Files
- `index.html` - Game UI with styled menus, minimap canvas, HUD stats, vignette/damage overlays
- `game.js` - Main game logic with Three.js
- `plan.md` - Original improvement roadmap

## Current Game Features

### Core Gameplay
- First-person Bomberman with WASD + mouse controls
- 15x15 grid arena with destructible brown blocks and indestructible gray walls
- Drop bombs with Space (3 bomb limit, 3-second fuse, regenerates after explosion)
- 3-minute round timer

### Enemies (6 total)
- 5 pink regular enemies (random patrol)
- 1 purple Hunter AI (chases player, faster, more aggressive)
- All enemies avoid bomb blast zones and flee when in danger
- Reduced bomb frequency to prevent self-kills

### AI Bomber Players (2)
- Blue and green humanoid bombers
- Spawn in opposite corners
- Smart movement: avoid blasts, seek enemies
- Drop colored bombs near targets
- Killable for +50 pts

### Power-ups (from destroyed blocks)
- Green: +1 bomb capacity
- Orange: +1 blast range
- Cyan: speed boost

### Win/Lose Conditions
- Win: Kill all 6 enemies
- Lose: Hit by explosion or enemy contact, or time runs out
- Death has 2s cinematic delay with VFX before game over screen

### Visual Effects
- Bloom post-processing (UnrealBloomPass)
- ACES filmic tone mapping, soft shadows
- Dynamic explosion lights, shockwave rings
- Debris physics, particle fire effects
- Screen shake, slow-mo on explosions
- Death particles and damage flash

### Audio
- Synthesized sounds: explosion, bomb drop, powerup, death

### UI
- Cinematic title screen with gradient
- Glassmorphism stat cards (bombs, blast, enemies, score, timer)
- Real-time minimap (top-right)
- Styled game over/victory screens

## Tech Stack
- Three.js 0.160.0 (via import map)
- Post-processing: EffectComposer, RenderPass, UnrealBloomPass
- Web Audio API for sounds
- Vanilla JS, no build step

## To Run
```bash
npx serve .
```
Open http://localhost:3000

## Potential Next Steps
- More enemy types
- Multiplayer support
- Level progression
- Better textures/models
- Background music
- Mobile controls
