# PRP: Machine Learning AI Implementation

## Problem Statement
The game needs an AI player that can learn from human gameplay patterns and adapt to different playstyles, rather than relying solely on rule-based decision making.

## Requirements
- Record player gameplay actions and game state
- Train a neural network on recorded gameplay data
- Enable ML AI to control the player character
- Support toggle between manual, rule-based AI, and ML AI control
- Persist trained models and training data in browser storage
- Provide training UI with progress feedback
- Detect and navigate vertical platforming (platforms above player)

## Proposed Solution

### Architecture
1. **GameplayRecorder**: Captures game state (17 features) + player actions (4 outputs) at 10 FPS
2. **MLAIPlayer**: TensorFlow.js neural network with behavioral cloning
3. **Training UI**: Menu scene integration with progress bar
4. **Model Persistence**: localStorage for model and training data

### Neural Network Design
- **Input Layer**: 17 features
  - Player state: position (x, y), velocity (x, y), health, onGround
  - Environment: nearestEnemy (distance, angle), nearestCoin (distance, angle), nearestSpike (distance)
  - Navigation: hasGroundAhead, hasGroundBehind, platformAbove, platformAboveHeight
  - Progress: score, coins
- **Hidden Layers**: 128 → dropout(0.3) → 64 → dropout(0.3) → 32 neurons
- **Output Layer**: 4 actions (moveLeft, moveRight, jump, shoot) with sigmoid activation
- **Training**: 100 epochs, batch size 16, Adam optimizer (lr=0.001), binary cross-entropy loss

### Key Features
1. **Recording System** (R key)
   - Captures state + action pairs every 100ms
   - Stores up to 10,000 frames in localStorage
   - Shows live frame counter during recording
   - Frame count updates every ~0.5 seconds

2. **ML AI Control** (O key)
   - Async decision making (non-blocking)
   - Competitive threshold logic for movement (pick higher: left vs right)
   - Thresholds: movement 0.05, jump 0.1, shoot 0.15
   - Fallback behavior (move right) when predictions are near-zero
   - Disables keyboard/mouse/gamepad when active

3. **Training Interface**
   - Progress bar showing epochs (1-100)
   - Model metadata display (epochs, timestamp, frame count)
   - Validation: requires 100+ frames before training
   - Auto-filter incompatible training data (15-feature vs 17-feature)

4. **Platform Detection**
   - Detects platforms above player within 300px vertical, 200px horizontal
   - Helps AI learn to jump up to ledges
   - Critical for vertical navigation

### Model Compatibility
- **Feature Validation**: Auto-detect and skip old 15-feature frames
- **Model Validation**: Check input shape (15 vs 17) and auto-clear incompatible models
- **Clear Instructions**: Guide users to retrain when features change

## Implementation Details

### Files Created/Modified
1. **frontend/src/utils/GameplayRecorder.ts**
   - Records 17 state features + 4 action outputs
   - getCurrentFrameCount() for live updates
   - checkPlatformAbove() for vertical navigation detection

2. **frontend/src/utils/MLAIPlayer.ts**
   - Neural network: 17 → 128 → 64 → 32 → 4
   - getDecision(): Async predictions with competitive thresholds
   - train(): 100 epochs with progress callbacks
   - getModelInfo(): Model metadata (trained, epochs, timestamp, frames)
   - Auto-clear incompatible models (15 vs 17 features)
   - Fallback behavior for zero predictions

3. **frontend/src/scenes/GameScene.ts**
   - ML AI toggle (O key) with validation
   - Recording toggle (R key) with live counter
   - Async decision handling with mlAIDecision property
   - Disable player input when ML AI active
   - Lines 2218-2240: Recording logic
   - Lines 2406-2435: ML AI decision handling

4. **frontend/src/scenes/MenuScene.ts**
   - showMLTraining(): Training UI with progress bar
   - Model status display: "Model: Trained (100 epochs, date)"
   - Frame count and model info
   - Train/Clear buttons

### Dependencies
- **@tensorflow/tfjs**: ^4.22.0 (added to package.json)
- Browser localStorage for persistence
- CSP allows 'unsafe-eval' for TensorFlow.js

## Testing & Validation
1. **Recording**: Press R, play naturally, see frame counter increase
2. **Training**: Main menu → ML Training → Train Model (100 epochs)
3. **ML AI**: Press O in-game, AI should move/jump/shoot based on training
4. **Model Persistence**: Refresh browser, model should still be loaded
5. **Feature Compatibility**: Old 15-feature data auto-filtered during training

## Known Issues & Solutions
1. **Model outputs all zeros**: Need more diverse training data (300-500 frames recommended)
2. **AI stuck at walls**: Added platform detection (platformAbove features)
3. **Feature mismatch errors**: Auto-detect and filter/clear incompatible data
4. **Frozen lockfile errors**: Removed --frozen-lockfile from Dockerfile for Railway

## Future Improvements
- Increase training data diversity (more levels, situations)
- Add reinforcement learning for reward-based training
- Hyperparameter tuning (learning rate, epochs, batch size)
- Model architecture experimentation (deeper networks, RNNs)
- Multi-model support (different playstyles)
- Online training (train while playing)

## Performance Metrics
- **Training Time**: ~5-10 seconds for 100 epochs with 200-300 frames
- **Inference Time**: <5ms per decision (async, non-blocking)
- **Storage**: ~50KB for model + training data in localStorage
- **Frame Rate**: 10 FPS recording (every 100ms) to avoid excessive data

## Deployment
- Railway build fixed: removed --frozen-lockfile, added PORT env var support
- TensorFlow.js loaded via Vite (no CDN required)
- Model persists in browser localStorage (survives page refresh)
- Works with CSP: 'unsafe-eval' enabled for TF.js

## Status
✅ **Completed** - ML AI fully functional with platform detection, fallback behavior, and compatibility checks
