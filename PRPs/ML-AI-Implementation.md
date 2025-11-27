# PRP: Machine Learning AI Implementation

## Problem Statement
The game needs an AI player that can learn from human gameplay patterns and adapt to different playstyles, using both behavioral cloning and reinforcement learning approaches.

## Requirements
- Record player gameplay actions and game state
- Train neural networks on recorded gameplay data (behavioral cloning)
- Train AI using Deep Q-Learning (reinforcement learning)
- Enable AI to control the player character
- Support toggle between manual, rule-based AI, ML AI, and DQN AI control
- Persist trained models in browser storage (IndexedDB)
- Provide training UI with progress feedback
- Handle boss encounters on levels 5, 10, 15, etc.
- Retain recording state across level transitions

## Proposed Solution

### Architecture Overview
Two AI approaches are implemented:

1. **MLAIPlayer (Behavioral Cloning)**: Learns by imitating recorded player gameplay
2. **DQNAgent (Reinforcement Learning)**: Learns through trial-and-error with rewards

---

## Part 1: Behavioral Cloning (MLAIPlayer)

### Neural Network Design
- **Input Layer**: 17 features
  - Player state: position (x, y), velocity (x, y), health, onGround
  - Environment: nearestEnemy (distance, angle), nearestCoin (distance, angle), nearestSpike (distance)
  - Navigation: hasGroundAhead, hasGroundBehind, platformAbove, platformAboveHeight
  - Progress: score, coins
- **Hidden Layers**: 128 → dropout(0.3) → 64 → dropout(0.3) → 32 neurons
- **Output Layer**: 4 actions (moveLeft, moveRight, jump, shoot) with sigmoid activation
- **Training**: 100 epochs, batch size 16, Adam optimizer (lr=0.001), binary cross-entropy loss

### Key Controls
- **R key**: Toggle recording (stores in localStorage)
- **O key**: Toggle ML AI control

---

## Part 2: Deep Q-Network (DQNAgent) - NEW

### DQN Architecture
- **State Space**: 14 dimensions
  - `playerX`, `playerY`: Normalized player position
  - `velocityX`, `velocityY`: Player velocity
  - `onGround`: Boolean (grounded state)
  - `nearestPlatformX`, `nearestPlatformY`: Distance to nearest platform
  - `nearestEnemyX`, `nearestEnemyY`: Distance to nearest enemy
  - `nearestSpikeX`: Distance to nearest spike
  - `bossActive`: Boolean (boss encounter active)
  - `bossDistance`: Distance to boss
  - `bossHealth`: Boss health percentage

- **Action Space**: 9 discrete actions
  - 0: Idle
  - 1: Move Left
  - 2: Move Right
  - 3: Jump
  - 4: Move Left + Jump
  - 5: Move Right + Jump
  - 6: Shoot
  - 7: Move Right + Shoot
  - 8: Move Right + Jump + Shoot

- **Network Architecture**:
  - Input: 14 neurons
  - Hidden: 128 → 128 → 64 neurons (ReLU activation)
  - Output: 9 neurons (Q-values for each action)
  - Target network with soft updates (τ = 0.01)

### DQN Hyperparameters
```typescript
learningRate: 0.0005
gamma: 0.99  // Discount factor
epsilon: 1.0 → 0.1  // Exploration rate decay
epsilonDecay: 0.999  // More exploration maintained
batchSize: 64
replayBufferSize: 50000
minReplaySize: 500
targetUpdateFrequency: 100
```

### Reward Shaping
1. **Progress Rewards**:
   - Forward progress: +0.1 per unit moved right
   - Reaching new maximum X: +0.5 bonus
   - Vertical climbing: +0.3 for upward movement

2. **Survival Rewards**:
   - Staying alive: +0.05 per frame
   - Being on ground: +0.02

3. **Combat Rewards**:
   - Killing enemies: +5.0 per kill
   - Shooting at enemies (when boss active): +0.8

4. **Boss Engagement** (Levels 5, 10, 15...):
   - Approaching boss: +0.5 proximity bonus
   - Attempting portal while boss alive: -2.0 penalty
   - Portal blocked until boss defeated

5. **Stuck Detection & Penalties**:
   - Ultra-aggressive detection (5-frame threshold for retreat)
   - Retreat behavior: Move left and attempt double jump
   - Force random exploration after 90 frames stuck
   - Progressive penalties: -0.1 to -0.8 based on stuck duration

### Imitation Learning (Human Demonstrations)
The DQN can learn from recorded human gameplay:

1. **Recording** (T key):
   - Toggle recording on/off
   - Samples every 3rd frame to reduce data
   - Compresses state data to avoid localStorage quota
   - Recording persists across level transitions

2. **Data Compression**:
   - Short property names (`playerX` → `px`)
   - Rounded floats (2 decimal places)
   - Booleans as 0/1
   - Maximum 5000 frames stored

3. **Importing** (I key):
   - Decompresses saved demonstrations
   - Adds to replay buffer with +0.5 reward boost
   - Trains immediately on imported data

### DQN Training Controls
| Key | Action |
|-----|--------|
| **A** | Toggle DQN AI control (in-game) |
| **T** | Toggle recording player gameplay |
| **I** | Import recorded demonstrations |
| **SPACE** | Pause/Resume training |
| **R** | Reset current episode |
| **S** | Save model to IndexedDB |
| **L** | Load saved model |
| **1-5** | Set game speed (1x-5x) |
| **ESC** | Exit to menu |

### DQN Training Scene
Dedicated training scene (`DQNTrainingScene`) provides:
- Live game preview during training
- Episode/step counters
- Reward history chart
- Epsilon (exploration rate) display
- Model save/load status

---

## Implementation Files

### DQN Files
1. **frontend/src/utils/DQNAgent.ts** (~530 lines)
   - DQNState interface (14 dimensions)
   - Neural network construction (policy + target)
   - Experience replay buffer
   - Reward calculation with stuck detection
   - Imitation learning methods
   - Model persistence (IndexedDB)

2. **frontend/src/scenes/DQNTrainingScene.ts** (~360 lines)
   - Training UI overlay
   - Episode management
   - Reward visualization

3. **frontend/src/scenes/GameScene.ts** (DQN integration)
   - `extractDQNState()`: Builds 14-dimension state
   - `handleDQNKeyboardControls()`: Training controls
   - `handleDQNRecordingKey()`: T/I key handlers
   - `recordPlayerFrame()`: Captures demonstrations
   - `importDemonstrationsToDQN()`: Loads saved data
   - Boss detection and portal blocking

### ML AI Files (Existing)
1. **frontend/src/utils/GameplayRecorder.ts**: Records 17-feature states
2. **frontend/src/utils/MLAIPlayer.ts**: Behavioral cloning network

---

## Game Flow Integration

### Level Transition Data
When transitioning to next level, the following state is preserved:
```typescript
{
  gameMode: 'levels',
  level: currentLevel + 1,
  lives: playerLives,      // Retained across levels
  score: score,            // Accumulated score
  isRecording: isRecordingForDQN,  // Recording continues
  mode: 'coop',            // If co-op mode
  dqnTraining: true        // If DQN training mode
}
```

### Boss Encounters (Levels 5, 10, 15...)
- Boss spawns at end of level
- Portal blocked until boss defeated
- DQN receives engagement rewards for fighting
- DQN penalized for approaching portal while boss active

---

## Testing & Validation

### DQN Training
1. Start game → Press A for DQN mode
2. Press SPACE to start training
3. Watch AI learn (epsilon decreases over time)
4. Press S to save model
5. Refresh → Press L to load

### Imitation Learning
1. Play game normally
2. Press T to start recording
3. Complete 1-3 levels while recording
4. Press T to stop recording
5. Press I to import into DQN
6. AI trains on your demonstrations

### Boss Engagement
1. Train DQN to level 5
2. Verify DQN fights boss instead of fleeing
3. Verify portal is blocked until boss dies

---

## Known Issues & Solutions

1. **Model State Mismatch**: Old 11-dimension models incompatible with new 14-dimension state
   - Solution: Auto-detect and delete incompatible models

2. **localStorage Quota**: Recording too many frames exceeds 5MB limit
   - Solution: Compress data, limit to 5000 frames, sample every 3rd frame

3. **Text Rendering Errors**: Recording status text destroyed during scene transition
   - Solution: Null checks and try-catch around setText calls

4. **Agent Gets Stuck**: AI repeats same action indefinitely
   - Solution: Ultra-aggressive stuck detection with retreat behavior

---

## Performance Metrics

- **DQN Training**: ~10ms per step (with game running)
- **Inference Time**: <5ms per decision
- **Model Size**: ~200KB in IndexedDB
- **Recording Storage**: ~50KB per 1000 compressed frames

---

## Status
✅ **Completed**:
- MLAIPlayer behavioral cloning (17 features)
- DQNAgent reinforcement learning (14 dimensions, 9 actions)
- Imitation learning from human demonstrations
- Boss engagement system
- Recording persistence across levels
- Ultra-aggressive stuck detection

🔄 **Future Improvements**:
- Prioritized experience replay
- Dueling DQN architecture
- Multi-agent training
- Curriculum learning (easy → hard levels)
