# Bomberman FPV - TODO

## Planned Features

### Death Animation
- [ ] Add knockback/ragdoll animation when player is killed by explosion
- [ ] Limbs fly apart with physics
- [ ] Slow-motion death cam

### Victory/Game Over Screens
- [ ] Better end-game UI with stats display
- [ ] Match summary (kills, deaths, powerups collected)
- [ ] Animated win/lose screens
- [ ] Quick rematch button
- [ ] Return to lobby option

### Sound Effects Polish
- [ ] Footstep sounds (vary with speed)
- [ ] Countdown beeps (3, 2, 1, GO!)
- [ ] Ambient background music
- [ ] Victory/defeat jingles
- [ ] Low health warning sound
- [ ] Timer warning beeps (last 30 seconds)

### Mobile Touch Controls
- [ ] Virtual joystick for movement
- [ ] Touch buttons for bomb drop and camera switch
- [ ] Responsive UI scaling for mobile/tablet
- [ ] Gyroscope look option

### Spectator Mode
- [ ] Let dead players watch the rest of the match
- [ ] Free camera controls for spectators
- [ ] Cycle through alive players view
- [ ] Show remaining player count

### Powerup Variety
- [ ] Kick bombs (push bombs in direction you're facing)
- [ ] Remote detonator (manually trigger your bombs)
- [ ] Shield powerup (survive one explosion)
- [ ] Ghost powerup (walk through walls temporarily)
- [ ] Line bomb (drop all bombs in a line)
- [ ] Mega bomb (larger blast radius)

## Completed Features

- [x] P2P multiplayer using PeerJS (WebRTC)
- [x] WebSocket server alternative
- [x] Host/Join lobby system
- [x] Synchronized level generation (seeded random)
- [x] Real-time player position sync
- [x] Bomb placement sync
- [x] Death notifications
- [x] Map size selection
- [x] Player names with random generator
- [x] Classic Bomberman 3D model
- [x] Procedural animation system (walk, idle, bomb placing)
- [x] Head/body separation (head follows mouse, body follows movement)
- [x] Head pitch sync (up/down look)
- [x] Multiple camera modes (FPV, third-person, over-shoulder, top-down, cinematic)
- [x] Minimap with player indicators
- [x] Round-based gameplay with next round system
- [x] Powerups (bomb count, blast range, speed)
