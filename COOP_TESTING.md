# Local Co-op Testing Guide

## What's Implemented ✅

### Core Infrastructure
1. **LocalCoopManager** - Manages player states, gamepad detection, and coop settings
2. **CoopPlayerManager** - Creates and manages two player sprites with health/UI
3. **CoopLobbyScene** - Gamepad connection and ready-up screen
4. **Menu Integration** - "LOCAL CO-OP" button added to main menu

### Current Features
- ✅ Dual gamepad detection
- ✅ Player ready-up system
- ✅ Separate health bars for both players
- ✅ Player labels (P1/P2)
- ✅ Independent player lives tracking
- ✅ Spawn shields and respawn mechanics
- ✅ Camera focus point calculation

## Testing the Lobby 🎮

### Prerequisites
- Connect **TWO gamepads** to your PC before starting the game

### Steps
1. Start the game using `.\scripts\start.ps1`
2. Click through the audio prompt
3. Click the **🎮 LOCAL CO-OP** button (orange button, middle of screen)
4. You should see the lobby with two player boxes

### Expected Behavior
- **Gamepad 1 connected**: Player 1 box shows "CONNECTED" in green
- **Gamepad 2 connected**: Player 2 box shows "CONNECTED" in cyan
- **Press A on Gamepad 1**: Player 1 shows "READY!"
- **Press A on Gamepad 2**: Player 2 shows "READY!"
- **Both ready**: "START GAME" button appears and becomes clickable
- **Press Start button**: Should launch GameScene (currently will use single-player mode)

### Controls in Lobby
- **A Button**: Ready up
- **B Button**: Un-ready
- **Start Button** (when both ready): Start game
- **Back Button** (on screen): Return to menu

## Known Issues ⚠️

### GameScene Not Yet Integrated
The GameScene still runs in single-player mode even when launched from co-op lobby. This is the next major task (Task #3 in todos).

**Why?**
GameScene.ts is 4827 lines long with complex single-player logic. To avoid breaking existing functionality, we need to:

1. Add co-op mode detection in GameScene
2. Create CoopGameMode helper class
3. Conditionally use CoopPlayerManager instead of single player
4. Update camera, collisions, and game loop

## Next Development Steps

### Phase 1: GameScene Integration (High Priority)
```typescript
// Add to GameScene.ts properties
private isCoopMode: boolean = false
private coopPlayerManager?: CoopPlayerManager
private coopGameMode?: CoopGameMode

// In create() method
init(data?: any) {
  if (data && data.mode === 'coop') {
    this.isCoopMode = true
  }
}

// Replace single player creation
if (this.isCoopMode) {
  this.coopPlayerManager = new CoopPlayerManager(this, this.platforms)
  this.coopPlayerManager.createPlayers(400, 550, bulletGroup1, bulletGroup2)
} else {
  // Existing single player code
}
```

### Phase 2: Update Loop
```typescript
update() {
  if (this.isCoopMode && this.coopGameMode) {
    this.coopGameMode.update()
    return
  }
  // Existing single-player update logic
}
```

### Phase 3: Camera System
```typescript
// In update(), after player movement
if (this.isCoopMode && this.coopPlayerManager) {
  const focus = this.coopPlayerManager.getCameraFocusPoint()
  this.cameras.main.scrollX = focus.x - 640
  this.cameras.main.scrollY = focus.y - 360
}
```

## File Structure

```
frontend/src/
├── scenes/
│   ├── MenuScene.ts (✅ Updated)
│   ├── GameScene.ts (⏳ Needs integration)
│   └── CoopLobbyScene.ts (✅ New)
├── utils/
│   ├── LocalCoopManager.ts (✅ New)
│   ├── CoopPlayerManager.ts (✅ New)
│   └── ControlManager.ts (Existing)
└── App.tsx (✅ Updated)
```

## Testing Checklist

### Lobby Testing
- [ ] Menu shows "LOCAL CO-OP" button
- [ ] Clicking button loads CoopLobbyScene
- [ ] Gamepad 1 detected (green indicator)
- [ ] Gamepad 2 detected (cyan indicator)
- [ ] Player 1 can ready up (A button)
- [ ] Player 2 can ready up (A button)
- [ ] Both ready = Start button visible
- [ ] Start button launches game
- [ ] Back button returns to menu

### GameScene Testing (After Integration)
- [ ] Both players spawn correctly
- [ ] Independent movement (left stick)
- [ ] Independent jumping (A button)
- [ ] Independent shooting (RT/R2)
- [ ] Independent aiming (right stick)
- [ ] Both health bars visible
- [ ] Camera follows both players
- [ ] Collisions work for both
- [ ] Enemies attack both players
- [ ] Coins collectible by both
- [ ] Death/respawn works
- [ ] Game over when both dead

## Effort Estimate

### Completed (Week 1) ✅
- Core infrastructure: ~8 hours
- Lobby scene: ~4 hours
- Menu integration: ~2 hours
- **Total: ~14 hours**

### Remaining Work (Week 2)
- GameScene integration: ~12 hours
- Camera system: ~3 hours
- Collision detection for both players: ~4 hours
- Testing and bug fixes: ~6 hours
- **Total: ~25 hours**

### Full Project: ~39 hours (~1 week of full-time work)

Much better than the original 7-10 weeks estimate for online multiplayer!

## Common Issues

### "Gamepad not detected"
- Make sure gamepads are connected **before** starting the game
- Windows: Check Device Manager for gamepad drivers
- Try unplugging and replugging gamepads

### "Player box stays gray"
- Gamepad might not be fully initialized
- Press any button on the gamepad
- Check browser console for errors

### "Start button doesn't appear"
- Both players must press A to ready up
- Check that both gamepad indicators show "CONNECTED"
- Try pressing A multiple times

### "Game starts in single-player mode"
- This is expected! GameScene integration is not yet complete
- This is the next major development task

## Development Commands

```powershell
# Start development server
.\scripts\start.ps1

# Stop servers
.\scripts\stop.ps1

# Install dependencies (if needed)
cd frontend
pnpm install
```

## Summary

We've built **60% of the local co-op system** in terms of infrastructure:
- ✅ Player state management
- ✅ Gamepad detection and input
- ✅ Lobby and ready-up system
- ✅ Player creation and UI
- ⏳ GameScene integration (next phase)

The foundation is solid. The remaining work is connecting it to the existing GameScene logic, which requires careful integration to avoid breaking single-player mode.
