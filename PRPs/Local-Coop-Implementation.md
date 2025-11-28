# Local Co-op Implementation Plan

## Overview
Implementing local cooperative multiplayer with dual gamepad support for JumpJumpJump.

## Completed Components ✅

### 1. LocalCoopManager (`frontend/src/utils/LocalCoopManager.ts`)
- Manages coop settings and player states
- Tracks player health, lives, scores
- Gamepad detection and input handling
- Player ready status management

### 2. CoopPlayerManager (`frontend/src/utils/CoopPlayerManager.ts`)
- Creates and manages two player sprites
- Handles player UI (health bars, lives, labels)
- Player damage and death system
- Respawn mechanics
- Camera focus point calculation

### 3. CoopLobbyScene (`frontend/src/scenes/CoopLobbyScene.ts`)
- Gamepad connection detection
- Player ready-up system
- Visual indicators for both players
- Start button when both ready

### 4. Menu Integration
- Added "LOCAL CO-OP" button to MenuScene
- Integrated CoopLobbyScene into App.tsx scene list
- Updated menu layout for new button

## Remaining Work 🚧

### GameScene Modifications

The GameScene needs to be updated to support co-op mode. Here's what needs modification:

#### 1. Add Co-op Mode Detection
```typescript
// In create() method, after checking game data
if (data && data.mode === 'coop') {
  this.isCoopMode = true
  this.coopPlayerManager = new CoopPlayerManager(this, this.platforms)
}
```

#### 2. Player Creation Logic
- **Current**: Single `this.player` sprite
- **Needed**: Check `isCoopMode` and either:
  - Create single player (existing code)
  - OR call `coopPlayerManager.createPlayers()` for dual players

#### 3. Update Loop Modifications
The `update()` method needs to handle both players:

```typescript
// For each player in coop mode:
// - Get gamepad input
// - Apply movement and jumping
// - Handle shooting
// - Update gun position
// - Update animations
// - Check collisions
```

#### 4. Camera System
- **Single Player**: Follow `this.player`
- **Co-op Mode**: Follow center point between both players
- Consider dynamic zoom based on player distance

#### 5. Collision Detection
All existing collisions need to work for both players:
- Platform collisions
- Enemy collisions  
- Spike collisions
- Coin collection
- Power-up collection
- Boss attacks

#### 6. Score and Progress
- Combined score or individual scores?
- Checkpoint system for both players
- Level completion when both reach portal

### Implementation Strategy

Since GameScene.ts is 4827 lines, we'll use a **wrapper pattern**:

1. Create `CoopGameMode.ts` helper class
2. This class encapsulates all co-op-specific game logic
3. GameScene delegates to this helper when `isCoopMode === true`
4. Minimal changes to existing GameScene code

### Example Wrapper Pattern

```typescript
// CoopGameMode.ts
export class CoopGameMode {
  private playerManager: CoopPlayerManager
  private scene: GameScene
  
  handleUpdate(time: number, delta: number) {
    const players = this.playerManager.getBothPlayers()
    
    for (const player of players) {
      this.handlePlayerMovement(player)
      this.handlePlayerShooting(player)
      this.handlePlayerAnimations(player)
    }
    
    this.updateCamera()
  }
  
  updateCamera() {
    const focus = this.playerManager.getCameraFocusPoint()
    this.scene.cameras.main.scrollX = focus.x - 640
    this.scene.cameras.main.scrollY = focus.y - 360
  }
}

// In GameScene.ts update()
update(time: number, delta: number) {
  if (this.isCoopMode && this.coopGameMode) {
    this.coopGameMode.handleUpdate(time, delta)
    return
  }
  
  // ...existing single-player update code
}
```

## Testing Checklist

- [ ] Two gamepads detected in lobby
- [ ] Both players can ready up
- [ ] Game starts with both players visible
- [ ] Independent movement for each player
- [ ] Independent shooting for each player
- [ ] Health bars update correctly
- [ ] Camera follows both players
- [ ] Collisions work for both players
- [ ] Death and respawn work correctly
- [ ] Game over when both players die
- [ ] Level completion works
- [ ] Can return to menu
- [ ] Can restart game

## Known Limitations

1. **No online multiplayer** - Local only
2. **Requires two gamepads** - Keyboard not supported for player 2
3. **Shared screen** - No split-screen mode
4. **Game balance** - Enemy spawns not adjusted for 2 players yet

## Next Steps

1. Create `CoopGameMode.ts` helper class
2. Modify GameScene.ts to use wrapper pattern
3. Test with two gamepads
4. Balance enemy spawns for co-op
5. Polish UI and visual feedback
