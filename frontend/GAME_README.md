# JumpJumpJump - Game Implementation

## Game Features

### Player Character (Alien Sprite)
- **Character**: Beige alien from `kenney_platformer-art-extended-enemies`
- **Controls**:
  - **WASD** or **Arrow Keys**: Move left/right
  - **W/Up Arrow**: Jump (with microgravity physics for higher jumps)
  - **Double Jump**: Press jump again in mid-air
  - **S Key (Easter Egg)**: Stomp attack when jumping high enough (≥60% of double jump height)

### Stomp Mechanic
When the player jumps high (at least double jump height) and presses S:
- Player rushes downward at high speed
- On landing, creates screen shake effect
- Spawns 8 metal block fragments that fly upward and outward
- Fragments fade out after 2 seconds

### Enemy AI
- **Enemy Type**: Green slime from enemy sprites
- **AI Behavior**:
  - Idle when player is far away
  - Detects player within 300 pixel range
  - Follows player when detected
  - Plays walk animation when moving
  - Plays idle animation when stationary
- **Spawn Locations**: 5 enemies placed at different positions

### Platforms
- **Flooring**: Beam tiles from `kenney_platformer-art-requests`
- Multiple platform layers at different heights
- Full collision detection with player and enemies

### Animations
#### Player Animations:
- Idle: Standing animation
- Walk: 2-frame walking cycle
- Jump: Jump pose

#### Enemy Animations:
- Idle: Stationary slime
- Walk: 2-frame walking cycle

### Physics
- **Microgravity**: Lower gravity (400) for higher jumps
- **World Bounds**: 1600x1200 pixels
- **Camera**: Follows player with smooth tracking

## How to Run

```bash
cd frontend
pnpm dev
```

Open http://localhost:3000 in your browser.

## Game Controls Summary

| Key | Action |
|-----|--------|
| W / ↑ | Jump |
| A / ← | Move Left |
| S / ↓ | Stomp (when airborne after high jump) |
| D / → | Move Right |

## Technical Details

- **Framework**: Phaser 3.90.0
- **Physics Engine**: Arcade Physics
- **Rendering**: AUTO (WebGL with Canvas fallback)
- **Resolution**: 1280x720 (scaled to fit screen)
- **Assets**: Kenney game assets

## File Structure

```
frontend/src/
├── App.tsx              # Main React component with Phaser config
├── scenes/
│   └── GameScene.ts     # Main game scene with all game logic
└── assets/              # Game assets (sprites, tiles)
```
