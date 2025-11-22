# PRP: Player Movement & Combat System

## Problem Statement
The game needs responsive platformer movement mechanics with precise jumping, double-jump abilities, stomping attacks, shooting mechanics, and weapon aiming for engaging combat gameplay.

## Requirements
- Smooth horizontal movement with acceleration/deceleration
- Precise jump controls with variable height
- Double-jump mechanic for advanced platforming
- Stomp attack to defeat enemies (jump on them)
- Projectile shooting with aim direction
- Weapon rotation following mouse/gamepad aim
- Reload system with cooldown visualization
- Health system with damage feedback
- Lives system with respawn mechanics

## Proposed Solution

### Movement System
1. **Horizontal Movement**
   - Acceleration: Smooth speed ramp-up
   - Max speed: 200 pixels/second
   - Deceleration: Friction when no input
   - Air control: Reduced control while jumping

2. **Jump Mechanics**
   - Initial velocity: -500 (upward)
   - Variable height: Release early = shorter jump
   - Double-jump: Second jump mid-air
   - Coyote time: 100ms grace period after leaving platform
   - Jump buffering: 100ms input window before landing

3. **Combat Mechanics**
   - Stomp: Jump on enemy, bounce upward, enemy defeated
   - Shoot: Fire projectiles in aim direction
   - Reload: 1-second cooldown between shots
   - Weapon aim: Follow mouse cursor or gamepad right stick

## Implementation Details

### Files Created/Modified
1. **frontend/src/scenes/GameScene.ts**
   - Player sprite creation and physics setup
   - Movement input handling (WASD, arrow keys, gamepad)
   - Jump logic with double-jump tracking
   - Stomp detection and enemy collision
   - Shooting mechanics with bullet spawning
   - Weapon rotation and aiming
   - Lines 1200-1300: Player movement
   - Lines 1400-1500: Jump mechanics
   - Lines 1600-1700: Combat system
   - Lines 1800-1900: Collision handling

2. **frontend/src/utils/ControlManager.ts**
   - Unified input handling (keyboard + gamepad)
   - Aim direction calculation from mouse/stick
   - Input deadzone for gamepad
   - Jump button state tracking

### Movement Physics
```typescript
// Horizontal movement
if (left) {
  player.setVelocityX(-200)
} else if (right) {
  player.setVelocityX(200)
} else {
  player.setVelocityX(0)  // Instant stop for responsive feel
}

// Jump
if (jumpPressed && onGround) {
  player.setVelocityY(-500)
  canDoubleJump = true
}

// Double-jump
if (jumpPressed && !onGround && canDoubleJump) {
  player.setVelocityY(-500)
  canDoubleJump = false
  hasDoubleJumped = true
}
```

### Stomp Mechanic
```typescript
// Enemy collision
if (playerBottomOverlapsEnemyTop && playerMovingDown) {
  // Stomp successful
  enemy.destroy()
  player.setVelocityY(-300)  // Bounce upward
  score += 50
  playStompSound()
} else {
  // Damage player
  playerHealth -= 10
  knockbackPlayer()
}
```

### Shooting System
```typescript
// Fire bullet
if (shootPressed && canShoot) {
  const bullet = bullets.create(player.x, player.y, 'bullet')
  const angle = Phaser.Math.Angle.Between(
    player.x, player.y, 
    aimX, aimY
  )
  bullet.setVelocity(
    Math.cos(angle) * 400,
    Math.sin(angle) * 400
  )
  
  canShoot = false
  reloadTime = 1000  // 1 second cooldown
  showReloadBar()
}
```

### Weapon Aiming
```typescript
// Update weapon rotation
const angle = Phaser.Math.Angle.Between(
  player.x, player.y,
  pointer.x + camera.scrollX,
  pointer.y + camera.scrollY
)
weapon.rotation = angle

// Flip weapon sprite when aiming left
if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
  weapon.setFlipY(true)
} else {
  weapon.setFlipY(false)
}
```

## Advanced Mechanics

### Coyote Time
Allows jump input shortly after leaving platform:
```typescript
let coyoteTime = 0
const COYOTE_DURATION = 100  // ms

// In update loop
if (!onGround) {
  coyoteTime += delta
}

// Allow jump if within coyote time
if (jumpPressed && coyoteTime < COYOTE_DURATION) {
  jump()
}
```

### Jump Buffering
Remembers jump input before landing:
```typescript
let jumpBuffer = 0
const BUFFER_DURATION = 100  // ms

// Store jump input
if (jumpPressed) {
  jumpBuffer = BUFFER_DURATION
}

// Consume buffer on landing
if (onGround && jumpBuffer > 0) {
  jump()
  jumpBuffer = 0
}
```

### Jetpack Mode (Gamepad)
Continuous upward thrust when holding left stick up:
```typescript
if (leftStickY < -0.8) {  // Stick pushed up
  player.setVelocityY(-150)  // Upward thrust
  showJetpackParticles()
}
```

## Visual Feedback Systems

### Reload Bar
- Blue bar fills from 0 to 60px over 1 second
- Shows reload progress visually
- Positioned above player
- Disappears when reload complete

### Health Bar
- Green bar (100% health)
- Turns yellow (50% health)
- Turns red (25% health)
- Width scales with health percentage

### Damage Flash
- Player sprite flashes red on damage
- 200ms flash duration
- Brief invincibility period (500ms)

### Movement Particles
- Dust particles when running
- Trail particles when jumping
- Landing impact particles

## Asset Usage
Player sprites from **Kenney platformer-art-extended-enemies**:
- `alienBeige_stand.png` - Idle stance
- `alienBeige_walk1.png` / `alienBeige_walk2.png` - Walk animation
- `alienBeige_jump.png` - Jump frame
- Various color variations (blue, green, pink, yellow)

Weapon sprites from **Kenney sci-fi-rts**:
- Raygun, laser gun, energy sword, bazooka
- Multiple weapon types with different fire rates
- Projectile sprites for each weapon type

## Controls Summary

### Keyboard
- **A/D or Left/Right**: Move left/right
- **W/Space/Up**: Jump / Double-jump
- **Mouse**: Aim weapon
- **Left Click**: Shoot
- **S/Down**: Fast-fall (future feature)

### Gamepad
- **Left Stick**: Move left/right
- **Left Stick Up**: Jetpack mode
- **A Button**: Jump / Double-jump
- **Right Stick**: Aim weapon
- **RT (R2)**: Shoot
- **D-pad Up**: Jump alternative

## Performance Considerations
- **Bullet Pool**: Reuse bullet objects (max 20 active)
- **Particle Limits**: Max 50 particles per effect
- **Physics Steps**: 60 FPS physics updates
- **Collision Checks**: Only active on-screen objects
- **Animation Cache**: Pre-load all sprite animations

## Testing & Validation
1. **Movement Feel**: Test acceleration, deceleration, air control
2. **Jump Precision**: Verify variable jump height works
3. **Double-jump**: Ensure only one double-jump per air time
4. **Stomp**: Test stomp vs collision damage detection
5. **Aiming**: Verify mouse and gamepad aiming accuracy
6. **Reload**: Check reload cooldown timing (1 second)
7. **Coyote Time**: Jump shortly after leaving platform
8. **Jump Buffer**: Jump registers just before landing

## Known Issues & Solutions

### Issue: Slippery Movement
**Problem**: Player slides too much after releasing input

**Solution**: Set velocity to 0 instead of using friction/drag

### Issue: Inconsistent Double-Jump
**Problem**: Double-jump sometimes doesn't trigger

**Solution**: 
- Track hasDoubleJumped separately from canDoubleJump
- Reset both flags only when grounded
- Check for proper button press detection

### Issue: Stomp Not Registering
**Problem**: Player takes damage instead of stomping

**Solution**:
- Check if player is moving downward (velocityY > 0)
- Verify bottom of player overlaps top of enemy
- Add 10px grace zone for stomp detection

### Issue: Weapon Aim Offset
**Problem**: Weapon doesn't point exactly at cursor

**Solution**:
- Account for camera scroll in calculation
- Use getWorldPoint() for proper coordinate conversion
- Adjust weapon anchor point to rotation origin

## Balance Parameters
```typescript
const PLAYER_STATS = {
  moveSpeed: 200,          // Pixels per second
  jumpPower: 500,          // Initial jump velocity
  doubleJumpPower: 500,    // Second jump velocity
  stompBounce: 300,        // Bounce height after stomp
  health: 100,             // Starting health
  lives: 3,                // Starting lives
  shootCooldown: 1000,     // Ms between shots
  bulletSpeed: 400,        // Pixels per second
  bulletDamage: 25,        // Damage per bullet hit
  invincibilityTime: 500,  // Ms after taking damage
}
```

## Future Improvements
- Wall-jump mechanic
- Slide/dash ability
- Power-ups (speed, jump boost, invincibility)
- Melee combat (energy sword)
- Charge shots (hold to charge)
- Multiple weapons with different behaviors
- Crouch and crawl mechanics
- Ledge grab and climb
- Grappling hook

## Status
✅ **Completed** - Full movement system with double-jump, stomp, shooting, and precise controls
