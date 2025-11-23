# DQN AI Training for JumpJumpJump

This implementation adds a **Distributional Deep Q-Network (DQN)** AI agent capable of learning to play JumpJumpJump automatically, similar to the Chrome Dino game AI.

## Features

### 🤖 Distributional DQN (C51 Algorithm)
- Models the full distribution of returns instead of just expected values
- More stable and robust learning compared to vanilla DQN
- Similar to the approach used in Chrome Dino AI

### 🧠 Key Components
1. **Policy Network**: Learns Q-value distributions for each action
2. **Target Network**: Provides stable training targets
3. **Experience Replay**: Stores and samples past experiences
4. **Epsilon-Greedy Exploration**: Balances exploration vs exploitation

### 🎮 How to Use

#### Starting Training
1. From the main menu, select **"AI Training"** (you'll need to add this to your menu)
2. Press **SPACE** to start/pause training
3. Watch the AI learn to play!

#### Keyboard Controls
- `SPACE`: Start/Pause Training
- `R`: Reset current episode
- `S`: Save model  to browser storage
- `L`: Load previously saved model
- `1-5`: Adjust training speed (1x to 5x)
- `A`: Toggle auto-restart
- `ESC`: Back to menu

### 📊 Training Visualization
- Real-time reward chart showing learning progress
- Training statistics (epsilon, buffer size, episodes, etc.)
- Current episode performance metrics

### 🎯 Game State Features
The AI observes:
- Player position (x, y)
- Player velocity (x, y)
- Whether player is on ground
- Distance to nearest platform
- Height of nearest platform
- Distance to nearest enemy
- Distance to nearest spike
- Whether there's ground ahead
- Whether there's a gap ahead

### 🏃 Available Actions
1. **Do Nothing** - Stand still
2. **Move Left** - Move left
3. **Move Right** - Move right
4. **Jump** - Jump
5. **Move Right + Jump** - Jump while moving right (most useful!)

### 💪 Reward System
The AI is rewarded for:
- ✅ Making progress (moving right)
- ✅ Increasing score (defeating enemies, collecting coins)
- ✅ Staying alive
- ✅ Being on solid ground

The AI is penalized for:
- ❌ Dying (-10 reward)
- ❌ Not making progress
- ❌ Getting too close to screen edges

### 💾 Saving & Loading Models
Models are automatically saved to browser's IndexedDB storage:
- Press `S` during training to save current model
- Press `L` to load a previously saved model
- Training progress persists across browser sessions!

### 🔧 Technical Details

#### Hyperparameters
```typescript
stateSize: 11           // Number of state features
actionSize: 5           // Number of possible actions
learningRate: 0.0001    // Adam optimizer learning rate
gamma: 0.99             // Discount factor for future rewards
epsilon: 1.0 → 0.01     // Exploration rate (decays over time)
epsilonDecay: 0.995     // Decay rate for epsilon
numAtoms: 51            // Distribution atoms (C51)
vMin: -10, vMax: 10     // Value range for distribution
bufferSize: 10000       // Max experiences in replay buffer
batchSize: 32           // Training batch size
minBufferSize: 100      // Min experiences before training starts
```

#### Network Architecture
```
Input (11 features)
    ↓
Dense (128 units, ReLU)
    ↓
Dense (128 units, ReLU)
    ↓
Dense (64 units, ReLU)
    ↓
Dense (actionSize × numAtoms)
    ↓
Reshape [actionSize, numAtoms]
    ↓
Output: Probability distribution for each action
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install @tensorflow/tfjs
```

### 2. Add to Your Game
The DQN training scene is already integrated! You just need to add it to your menu:

```typescript
// In MenuScene.ts, add a button:
const aiTrainingButton = this.add.text(400, 400, '🤖 AI Training', {
  fontSize: '32px',
  color: '#00ff00'
})
.setInteractive()
.on('pointerdown', () => {
  this.scene.start('DQNTrainingScene')
})
```

### 3. Register the Scene
```typescript
// In App.tsx or your game config:
import DQNTrainingScene from './scenes/DQNTrainingScene'

const config: Phaser.Types.Core.GameConfig = {
  // ... other config
  scene: [MenuScene, GameScene, DQNTrainingScene] // Add DQNTrainingScene
}
```

## 📈 Expected Training Progress

### Episode 1-50: Random Exploration
- AI explores randomly
- Short episodes (dies quickly)
- Epsilon = 1.0 (100% random actions)

### Episode 50-200: Learning Basics
- AI starts learning to jump
- Slightly longer episodes
- Epsilon declining (more exploitation)

### Episode 200-500: Improving
- AI learns to avoid simple obstacles
- Better platforming
- Reward steadily increasing

### Episode 500+: Mastery
- AI plays competently
- Can navigate complex sections
- Epsilon → 0.01 (mostly exploitation)

## 🎓 Learning More

### Resources
- [DQN Paper](https://arxiv.org/abs/1312.5602) - Original DQN paper by DeepMind
- [C51 Paper](https://arxiv.org/abs/1707.06887) - Distributional RL paper
- [TensorFlow.js Docs](https://www.tensorflow.org/js) - TensorFlow.js documentation
- [Chrome Dino AI](https://github.com/ivanseidel/IAMDinosaur) - Similar project

### Tips for Better Training
1. **Let it run**: Training takes time! Leave it running for 500+ episodes
2. **Save often**: Save your model periodically to avoid losing progress
3. **Adjust rewards**: Tweak the reward function if the AI isn't learning desired behaviors
4. **Monitor epsilon**: Lower epsilon = more exploitation of learned policy
5. **Increase training speed**: Use 3-5x speed once the AI starts learning

## 🐛 Troubleshooting

### AI not learning?
- Check that the reward function is giving meaningful signals
- Ensure the state features are being captured correctly
- Try adjusting hyperparameters (learning rate, epsilon decay)

### Training too slow?
- Increase training speed with number keys (1-5)
- Reduce visualization updates
- Use a simpler network architecture

### Browser running slow?
- The AI uses TensorFlow.js which can be memory-intensive
- Try closing other browser tabs
- Consider reducing buffer size or batch size

## 🎉 Have Fun!

Watch your AI go from completely random to playing like a pro! It's incredibly satisfying to see it learn and improve over time.

Happy training! 🤖🎮
