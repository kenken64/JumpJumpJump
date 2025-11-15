# Jump Jump Jump - Game Flow Diagram & Function Documentation

## Game Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         GAME START                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  PreloadScene    │
                    │  - Load Assets   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   MenuScene      │
                    │  - Show Menu     │
                    │  - Leaderboard   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │  Campaign   │ │   Custom    │ │   Level     │
      │    Mode     │ │   Levels    │ │   Editor    │
      └──────┬──────┘ └─────────────┘ └─────────────┘
             │
             ▼
    ┌────────────────────┐
    │  MainGameScene     │
    │  - Game Loop       │
    └─────────┬──────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐      ┌─────────────┐
│ SUCCESS │      │ GAME OVER   │
│ Level   │      │ Submit      │
│ Complete│      │ Score       │
└────┬────┘      └──────┬──────┘
     │                  │
     ▼                  ▼
┌─────────┐      ┌─────────────┐
│ Next    │      │ Restart or  │
│ Level   │      │ Menu        │
└─────────┘      └─────────────┘
```

---

## MainGameScene - Detailed Function Call Flow

### 1. Scene Initialization

```
create()
├── Reset game state variables
├── Restore persistent score & lives
├── Get level configuration from LevelManager
├── Create background
├── new InputManager()
├── createLanes()
│   ├── Clear existing lanes & vehicles
│   ├── Get level config
│   ├── Get vehicle types
│   ├── Calculate road dimensions
│   ├── Draw grass background
│   ├── Draw road
│   ├── Create lane objects (loop)
│   └── drawTree() x5 (1 green goal, 4 red distractors)
│       └── Create tree graphics with circles & rectangles
├── new Player(startX, startY)
├── createUI()
│   ├── Create scoreText
│   ├── Create livesText
│   ├── Create levelText
│   ├── Create difficultyText
│   ├── Create gamepadText
│   ├── Create cheatModeText
│   └── Create instructions text
├── setupCollisions()
├── spawnInitialVehicles()
│   └── Create 2-3 vehicles per lane at random positions
└── showLevelIntro()
    ├── Display level name & difficulty
    ├── Show "Reach goal 3 times" message
    ├── Fade out after 2 seconds
    └── startCountdown() (only on Level 1)
        └── 10-second countdown timer
```

---

### 2. Main Game Loop (update() - called every frame)

```
update(time, delta)
├── Check ESC key → Go to MenuScene
├── Check Ctrl+C → Toggle cheat mode
│   └── Update player appearance (alpha & tint)
├── Get input state from InputManager
├── Update gamepad status text
├── IF game over AND jump pressed → Restart game
├── IF game over OR level transition → Exit early
├── IF countdown active:
│   └── Skip player update (vehicles still move)
├── ELSE:
│   └── player.update(inputState)
│       └── Move player based on arrow keys/gamepad
├── FOR each lane:
│   ├── Update spawn timer
│   ├── IF timer >= spawn interval:
│   │   ├── spawnVehicle(lane)
│   │   │   ├── Check max vehicles per lane
│   │   │   ├── Check spacing constraints
│   │   │   ├── Create new Vehicle(x, y, type, speed, direction)
│   │   │   └── Add to lane.vehicles[]
│   │   └── Reset spawn timer & interval
│   └── FOR each vehicle in lane:
│       ├── vehicle.update() (move vehicle)
│       ├── IF vehicle off-screen:
│       │   ├── vehicle.destroy()
│       │   └── Remove from lane.vehicles[]
└── IF not countdown active:
    └── checkCollisions()
        ├── IF cheat mode OR invulnerable → Skip vehicle collision
        ├── ELSE check vehicle collision:
        │   └── IF collision → handlePlayerHit()
        └── Check goal tree collision:
            └── IF reached goal → handleGoalReached()
```

---

### 3. Player Hit Flow

```
handlePlayerHit()
├── IF invulnerable → Return early
├── Set isPlayerInvulnerable = true
├── Decrement lives
├── Update lives UI text
├── player.die() (play death animation)
├── IF lives <= 0:
│   └── gameOver()
│       ├── Display game over panel
│       ├── Show level reached & final score
│       ├── showUsernameInput()
│       │   ├── Create input UI elements
│       │   ├── Wait for player to enter name
│       │   └── submitScore(username, score, level)
│       │       └── POST to API: /api/scores
│       └── Show restart instructions
└── ELSE (lives > 0):
    └── DelayedCall(1000ms):
        ├── player.reset(startX, startY)
        ├── IF cheat mode → Restore green tint & transparency
        └── DelayedCall(1000ms):
            └── Set isPlayerInvulnerable = false
```

---

### 4. Goal Reached Flow

```
handleGoalReached()
├── Calculate points (100 × level score multiplier)
├── Add points to score
├── Update score UI text
├── Increment goalsReachedThisLevel
├── IF goals >= 3:
│   └── advanceToNextLevel()
│       ├── Set isLevelTransition = true
│       ├── Reset goalsReachedThisLevel = 0
│       ├── showLevelComplete()
│       │   ├── Display "LEVEL COMPLETE!"
│       │   ├── Show current level cleared
│       │   ├── Show next level number
│       │   └── Fade out after 2.5 seconds
│       └── DelayedCall(3000ms):
│           ├── levelManager.nextLevel()
│           └── rebuildLevel()
│               └── scene.restart()
└── ELSE (goals < 3):
    ├── player.reset(startX, startY)
    └── IF cheat mode → Restore green tint & transparency
```

---

## Level Progression System

### Level Manager Configuration

```
LevelManager.getLevelConfig()
├── Levels 1-3: EASY
│   ├── 4-6 lanes
│   ├── Speed: 85-190
│   ├── Spawn interval: 4200-8000ms
│   └── Score multiplier: 1x-3x
├── Levels 4-6: MEDIUM
│   ├── 7-8 lanes
│   ├── Speed: 150-300
│   ├── Spawn interval: 2800-6500ms
│   └── Score multiplier: 4x-6x
├── Levels 7-9: HARD
│   ├── 8 lanes
│   ├── Speed: 215-385
│   ├── Spawn interval: 2000-5000ms
│   └── Score multiplier: 7x-9x
└── Level 10+: EXPERT (INSANE MODE)
    ├── 8 lanes
    ├── Speed: 290+ (increases each level)
    ├── Spawn interval: 1200-2500ms (more vehicles!)
    ├── Max vehicles per lane: 5-8
    └── Score multiplier: 2x level number
```

---

## Vehicle Spawning Logic

```
spawnVehicle(lane)
├── Determine spawn position (left or right edge)
├── Calculate max vehicles per lane:
│   ├── Level 1-9: 2-5 vehicles
│   └── Level 10+: 5-8 vehicles
├── Check if lane is full → Return if true
├── Calculate minimum spacing: max(250, 400 - level×15)
├── Check spacing with existing vehicles:
│   ├── FOR each existing vehicle:
│   │   └── IF too close → Return (don't spawn)
│   └── Check directional spacing (prevent overlap)
└── Create new Vehicle(x, y, type, speed, direction)
    └── Add to lane.vehicles[]
```

---

## Collision Detection

```
checkCollisions()
├── IF game over OR countdown active → Return
├── Get player position & bounds (16x16 hitbox)
├── Vehicle Collision Check:
│   ├── IF cheat mode OR invulnerable → Skip
│   ├── ELSE:
│   │   └── FOR each lane:
│   │       └── FOR each vehicle:
│   │           ├── Check vehicle sprite is valid
│   │           ├── Get vehicle bounds
│   │           └── IF rectangles intersect:
│   │               └── handlePlayerHit() → Return
└── Goal Tree Collision Check:
    ├── Calculate distance to goal tree
    └── IF distance < 50 pixels:
        └── handleGoalReached()
```

---

## Special Features

### 1. Cheat Mode (Ctrl+C)

```
Toggle Cheat Mode (Ctrl+C pressed)
├── cheatModeActive = !cheatModeActive
├── Update cheat mode text visibility
└── IF cheat mode ON:
    ├── player.sprite.setAlpha(0.5) (semi-transparent)
    └── player.sprite.setTint(0x00ff00) (green tint)
└── ELSE:
    ├── player.sprite.setAlpha(1.0) (normal opacity)
    └── player.sprite.clearTint() (remove tint)

Effect: Prevents vehicle collision damage
```

### 2. Invulnerability System

```
Invulnerability Flow
├── Set when hit: isPlayerInvulnerable = true
├── Duration: 2 seconds (1s death + 1s after respawn)
└── Prevents multiple rapid hits from same collision
```

### 3. Level 1 Countdown

```
Level 1 Special Flow
├── showLevelIntro():
│   └── Set countdownActive = true (prevent player movement)
├── DelayedCall(7000ms):
│   └── startCountdown():
│       ├── Display 10-second countdown (10→1→GO!)
│       ├── Change colors: Yellow→Orange→Red
│       └── After "GO!":
│           └── Set countdownActive = false (allow movement)
└── Vehicles spawn and move during countdown (visual effect)
```

---

## Key Classes & Their Responsibilities

### MainGameScene
- **Purpose**: Main gameplay controller
- **Responsibilities**:
  - Scene lifecycle (create, update)
  - Game state management
  - UI rendering and updates
  - Lane and vehicle management
  - Collision detection
  - Level progression

### LevelManager
- **Purpose**: Level configuration provider
- **Key Methods**:
  - `getLevelConfig()`: Returns difficulty settings
  - `nextLevel()`: Advance to next level
  - `reset()`: Return to level 1
  - `getDifficultyName()`: Get difficulty text
  - `getVehicleTypesForLevel()`: Vehicle variety

### Player
- **Purpose**: Player character controller
- **Key Methods**:
  - `update(inputState)`: Grid-based movement
  - `die()`: Death animation
  - `reset(x, y)`: Respawn
  - `getPosition()`: Position for collision

### Vehicle
- **Purpose**: Traffic obstacle
- **Key Methods**:
  - `update()`: Move vehicle
  - `destroy()`: Remove from scene

### InputManager
- **Purpose**: Handle keyboard and gamepad input
- **Key Methods**:
  - `getInputState()`: Return current input
  - `isGamepadConnected()`: Gamepad detection

---

## API Integration

### Score Submission
```
submitScore(username, score, levelReached)
└── POST ${API_CONFIG.BASE_URL}/api/scores
    ├── Body: { username, score, level_reached }
    └── Response: Success confirmation
```

### Leaderboard Fetch (MenuScene)
```
fetchLeaderboard()
└── GET ${API_CONFIG.BASE_URL}/api/scores/leaderboard?limit=10
    └── Display top 10 scores with medal colors
```

---

## Game State Variables

### Persistent (Static - survives scene restarts)
- `persistentScore`: Player's cumulative score
- `persistentLives`: Player's current lives (starts at 3)
- `levelManager`: Shared level configuration

### Scene-Specific (Reset on scene restart)
- `isGameOver`: Game over state
- `isLevelTransition`: Between levels
- `countdownActive`: Countdown in progress
- `isPlayerInvulnerable`: Temporary invulnerability
- `cheatModeActive`: Cheat mode enabled
- `goalsReachedThisLevel`: Progress to next level (need 3)

---

## Configuration Files

### apiConfig.ts
```typescript
API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    SCORES: '/api/scores',
    LEADERBOARD: '/api/scores/leaderboard'
  }
}
```

### .env
```
VITE_API_URL=http://localhost:8000
```

---

## Summary of Key Game Mechanics

1. **Lives System**: Start with 3 lives, lose 1 per collision, game over at 0
2. **Level Progression**: Reach goal 3 times to advance to next level
3. **Infinite Levels**: No level cap, difficulty increases forever
4. **Scoring**: 100 × level score multiplier per goal reached
5. **Difficulty Tiers**: EASY (1-3), MEDIUM (4-6), HARD (7-9), EXPERT (10+)
6. **Progressive Challenge**: More lanes, faster vehicles, tighter spawns
7. **Invulnerability**: 2-second grace period after respawn
8. **Hidden Cheat**: Ctrl+C for invincibility mode
9. **Level 1 Tutorial**: 10-second countdown before gameplay starts
10. **Leaderboard**: Score submission and top 10 display
