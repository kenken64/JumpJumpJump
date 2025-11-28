# PRP: Core Game Mechanics - Infinite World Generation

## Problem Statement
The game needs an infinite scrolling platformer world with procedurally generated terrain, obstacles, and collectibles that maintains consistent challenge and variety throughout endless gameplay.

## Requirements
- Infinite horizontal world generation
- Procedural platform placement with varying heights and gaps
- Dynamic enemy spawning with increasing difficulty
- Coin placement for scoring and collection
- Spike hazards and obstacles
- Chunk-based generation system
- Memory management (cleanup old chunks)
- Seamless scrolling without performance drops

## Proposed Solution

### Architecture
1. **WorldGenerator**: Manages chunk generation and cleanup
2. **Chunk System**: World divided into 800px wide chunks
3. **Platform Generation**: Random heights, gaps, and patterns
4. **Enemy/Coin Spawning**: Probabilistic placement within chunks
5. **Difficulty Scaling**: Enemy count and speed increase with distance

### World Generation Algorithm
```typescript
generateChunk(chunkIndex) {
  - Calculate chunk X position (chunkIndex × chunkWidth)
  - Generate 3-8 platforms per chunk
  - Random platform heights (200-500px from bottom)
  - Random platform widths (100-300px)
  - Random gaps between platforms (50-200px)
  - Spawn enemies (20% chance per platform)
  - Spawn coins (40% chance per platform)
  - Spawn spikes (15% chance per platform)
}
```

### Difficulty Progression
- **Enemy Count**: Increases every 5 chunks
- **Enemy Speed**: +10% every 10 chunks
- **Gap Size**: Slightly increases with distance
- **Spike Density**: Increases in later chunks
- **Boss Encounters**: Every 5 levels (boss replaces regular enemies)

## Implementation Details

### Files Created/Modified
1. **frontend/src/utils/WorldGenerator.ts**
   - generateChunk(): Creates platforms, enemies, coins, spikes
   - getChunkIndex(): Calculates which chunk player is in
   - cleanupOldChunks(): Removes off-screen chunks
   - Platform class: Static platform objects
   - Enemy class: Moving enemies with AI
   - Coin class: Collectible currency

2. **frontend/src/scenes/GameScene.ts**
   - World generation in create()
   - Update loop: Generate new chunks as player advances
   - Chunk cleanup when chunks are 2 screens behind player
   - Camera follow: Smooth scrolling with player
   - Lines 500-600: World generation initialization
   - Lines 2100-2150: Chunk management in update loop

### Platform Types
1. **Standard Platforms**: Brown/grey tiles, solid ground
2. **Floating Platforms**: Higher elevation, require jumping
3. **Long Platforms**: Safe zones with coins
4. **Short Platforms**: Challenge zones, precise jumping
5. **Gap Platforms**: Far apart, test jump distance

### Enemy AI Integration
- Enemies patrol platforms
- Turn around at platform edges
- Can be defeated by stomping (jump on top)
- Deal damage on collision
- Spawn rate increases with progression

### Coin System
- Placed on platforms and in air
- Auto-collect on overlap
- Score value: 10 points per coin
- Visual feedback: Particle effect on collection
- Counted in UI: Coin counter display

### Spike Hazards
- Instant damage on contact
- Placed on platforms and ground
- Rotated to face upward
- Visual warning: Red/orange color
- Cannot be destroyed

## Technical Specifications

### Chunk Configuration
```typescript
const CHUNK_CONFIG = {
  width: 800,                    // Pixels per chunk
  platformCount: 3-8,            // Random platforms per chunk
  platformHeightRange: [200, 500], // From ground
  platformWidthRange: [100, 300], // Platform size
  gapRange: [50, 200],           // Between platforms
  enemySpawnChance: 0.2,         // 20% per platform
  coinSpawnChance: 0.4,          // 40% per platform
  spikeSpawnChance: 0.15,        // 15% per platform
}
```

### Memory Management
- **Generation Distance**: 2 chunks ahead of player
- **Cleanup Distance**: 2 chunks behind player
- **Active Chunks**: Typically 5-7 chunks in memory
- **Chunk Pool**: Reuse destroyed objects

### Physics Properties
- **Platforms**: Static bodies, immovable
- **Enemies**: Dynamic bodies, gravity enabled
- **Coins**: Static triggers, no collision
- **Spikes**: Static bodies, damage on overlap

## Asset Integration
All assets from **Kenney asset packs**:
- **Platforms**: `kenney_platformer-art-requests/Tiles/`
  - grassMid.png (standard platform)
  - grassLeft.png / grassRight.png (edges)
  - stoneMid.png (alternative platform)

- **Enemies**: `kenney_platformer-art-extended-enemies/Enemy sprites/`
  - slimeWalk1.png / slimeWalk2.png (animated)
  - flyFly1.png / flyFly2.png (flying enemies)
  - Various enemy types and colors

- **Coins**: Gold coin sprites from Kenney UI pack
- **Spikes**: Spike sprite from platformer pack

## Performance Optimization
1. **Object Pooling**: Reuse destroyed platforms/enemies/coins
2. **Culling**: Only render objects on-screen
3. **Chunk Batching**: Generate multiple platforms per frame
4. **Texture Atlas**: Single sprite sheet for all assets
5. **Physics Optimization**: Sleep inactive bodies

## Testing & Validation
1. **Infinite Generation**: Play for 10+ minutes, verify no gaps
2. **Memory**: Check for memory leaks during long sessions
3. **Difficulty Curve**: Verify enemy count increases appropriately
4. **Collision Detection**: Test platform, enemy, coin, spike collisions
5. **Visual Consistency**: No flickering or missing assets

## Difficulty Parameters
```typescript
getDifficultyMultiplier(distance) {
  enemySpeedMultiplier = 1 + (distance / 10000) * 0.1  // +10% per 10k pixels
  enemyCountMultiplier = 1 + Math.floor(distance / 4000) * 0.2 // +20% per 5 chunks
  gapSizeMultiplier = 1 + (distance / 20000) * 0.1  // Gradually wider gaps
  spikeChanceMultiplier = 1 + (distance / 15000) * 0.05  // More spikes later
}
```

## Known Issues & Solutions

### Issue: Platform Gaps Too Wide
**Problem**: Players falling through world due to missing platforms

**Solution**: 
- Minimum platform overlap check
- Max gap size enforcement (200px)
- Emergency platform generation if gap detected

### Issue: Memory Buildup
**Problem**: Old chunks not cleaned up properly

**Solution**:
- Track chunk indices in Set
- Delete chunks 2+ screens behind
- Dispose sprite textures properly

### Issue: Difficulty Spike
**Problem**: Game too hard too quickly

**Solution**:
- Gradual difficulty increase (every 5-10 chunks)
- Initial "safe zone" with no enemies
- Difficulty caps to prevent impossibility

## Boss Integration
- **Frequency**: Every 5 levels (levels 5, 10, 15, 20...)
- **Spawn**: Replace regular enemies with boss at level end
- **Platform**: Generate large flat platform for boss fight
- **Difficulty**: Boss health scales with level
- **Reward**: Bonus coins/points on defeat
- **Portal Blocking**: Level end portal blocked until boss defeated

## Level Transition System
When transitioning to next level, game state is preserved:

```typescript
nextLevelData = {
  gameMode: 'levels',
  level: currentLevel + 1,
  lives: playerLives,        // ✅ Retained across levels
  score: score,              // ✅ Accumulated score continues
  isRecording: isRecordingForDQN,  // ✅ DQN recording persists
  mode: 'coop',              // If co-op mode active
  dqnTraining: true          // If DQN training mode active
}
```

### Preserved State:
- **Lives**: Player lives carry over (no reset to 3)
- **Score**: Cumulative score across all levels
- **Recording**: DQN recording continues seamlessly
- **Game Mode**: Co-op and training modes persist

### Reset State:
- **Level Layout**: Fresh procedural generation
- **Enemies**: New enemy spawns
- **Coins**: New coin placement
- **Player Position**: Reset to level start

## Future Improvements
- Biome system (different visual themes every 10 levels)
- Weather effects (rain, snow affect physics)
- Moving platforms (horizontal/vertical)
- Breakable platforms (temporary surfaces)
- Secret areas (hidden coins/power-ups)
- Checkpoint system (save progress)
- Procedural background parallax layers
- Dynamic music that changes with difficulty

## Status
✅ **Completed** - Infinite world generation with difficulty scaling, memory management, boss encounters, and level transition state preservation
