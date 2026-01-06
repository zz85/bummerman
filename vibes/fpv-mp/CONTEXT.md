# BUMMERMAN FPV - Multiplayer

First-person Bomberman with PeerJS multiplayer support.

## Features
- P2P multiplayer using PeerJS (WebRTC)
- Host/Join lobby system
- Synchronized level generation (seeded random)
- Real-time player position sync
- Bomb placement sync
- Death notifications

## How to Play
1. Open index.html in browser
2. Click "HOST GAME" or "JOIN GAME"
3. Host: Share the displayed code with friend
4. Join: Enter host's code and click CONNECT
5. Game starts when both players are connected

## Controls
- WASD: Move
- Mouse: Look
- Space: Drop bomb
- V: Change camera mode

## Network Protocol
- `start`: Host sends seed to sync level generation
- `pos`: Player position updates
- `bomb`: Bomb placement
- `death`: Player death notification
