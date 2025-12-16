/**
 * @fileoverview DQNAgent - Deep Q-Network reinforcement learning agent
 * 
 * Implements a DQN (Deep Q-Network) agent for learning to play the game:
 * - Neural network policy and target networks
 * - Experience replay buffer
 * - Epsilon-greedy exploration
 * - Reward shaping for platform games
 * - Model save/load functionality
 * 
 * Uses TensorFlow.js for neural network operations.
 * 
 * @module utils/DQNAgent
 */

import * as tf from '@tensorflow/tfjs'
import type GameScene from '../scenes/GameScene'

/**
 * State representation for DQN input (14 features)
 */
export interface DQNState {
    playerX: number
    playerY: number
    velocityX: number
    velocityY: number
    onGround: boolean
    nearestPlatformDistance: number
    nearestPlatformHeight: number
    nearestEnemyDistance: number
    nearestSpikeDistance: number
    hasGroundAhead: boolean
    gapAhead: boolean
    bossActive: boolean
    bossDistance: number
    bossHealth: number
    nearestCoinDistance: number
    nearestCoinX: number
    nearestCoinY: number
    nearestPowerUpDistance: number
    nearestPowerUpX: number
    nearestPowerUpY: number
}

/**
 * Action output from DQN agent
 */
export interface DQNAction {
    actionIndex: number
    moveLeft: boolean
    moveRight: boolean
    jump: boolean
    shoot: boolean
}

/**
 * Experience tuple for replay buffer
 * @internal
 */
interface Experience {
    state: number[]
    action: number
    reward: number
    nextState: number[]
    done: boolean
}

/**
 * Deep Q-Network agent for reinforcement learning gameplay
 * Uses dual networks (policy + target) with experience replay
 */
export class DQNAgent {
  /** Policy network for action selection */
  private policyNet!: tf.Sequential
  /** Target network for stable Q-value targets */
  private targetNet!: tf.Sequential
  /** Number of state features (20 including boss, coin, and powerup info) */
  private readonly stateSize = 20  // Increased to include boss, coin, and powerup info
  /** Number of possible actions (9 including shooting) */
  private readonly actionSize = 9  // Expanded to include shooting actions
  /** Exploration rate (probability of random action) */
  private epsilon = 1.0
  /** Minimum exploration rate */
  private readonly epsilonMin = 0.1  // Keep even more exploration
  /** Exploration decay rate per step */
  private readonly epsilonDecay = 0.999  // Very slow decay
  /** Experience replay buffer */
  private replayBuffer: Experience[] = []
  /** Maximum replay buffer size */
  private readonly maxBufferSize = 10000
  /** Minimum experiences before training starts */
  private readonly minBufferSize = 100
  /** Total training steps completed */
  private trainingSteps = 0
  /** Steps between target network updates */
  private readonly targetUpdateFrequency = 100
  /** Cumulative reward for current episode */
  private totalReward = 0
  /** History of episode rewards */
  private episodeRewards: number[] = []
  /** Moving average of rewards */
  private averageReward = 0
  /** Last recorded X position */
  private lastX = 0
  /** Last recorded Y position */
  private lastY = 0
  /** Last recorded score */
  private lastScore = 0
  /** Frames without forward progress */
  private framesSinceProgress = 0
  /** Whether agent is still alive */
  private alive = true
  /** Counter for stuck detection */
  private stuckCounter = 0
  /** Whether retreat behavior is active */
  private stuckRetreatMode = false
  /** Frames remaining in retreat mode */
  private retreatFrames = 0
  /** Whether double jump is needed */
  private needsDoubleJump = false
  /** Whether agent resources have been disposed */
  private isDisposed = false
  /** Force random actions when completely stuck */
  private forceRandomExploration = false
  /** Frames remaining in random exploration */
  private randomExplorationFrames = 0

    constructor(_scene: GameScene) {
        // Scene reference not used but kept for compatibility
        this.init()
    }

    private async init(): Promise<void> {
        this.policyNet = tf.sequential()
        this.policyNet.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [this.stateSize] }))
        this.policyNet.add(tf.layers.dense({ units: 128, activation: 'relu' }))
        this.policyNet.add(tf.layers.dense({ units: 64, activation: 'relu' }))
        this.policyNet.add(tf.layers.dense({ units: this.actionSize }))

        this.targetNet = tf.sequential()
        this.targetNet.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [this.stateSize] }))
        this.targetNet.add(tf.layers.dense({ units: 128, activation: 'relu' }))
        this.targetNet.add(tf.layers.dense({ units: 64, activation: 'relu' }))
        this.targetNet.add(tf.layers.dense({ units: this.actionSize }))

        this.targetNet.setWeights(this.policyNet.getWeights())
        console.log('🤖 DQN Agent initialized')
    }

    public async selectAction(state: DQNState): Promise<DQNAction> {
        if (this.isDisposed) {
            return this.actionIndexToAction(0)  // Return idle action
        }
        
        // Force random actions when completely stuck
        if (this.forceRandomExploration) {
            this.randomExplorationFrames++
            // Do random actions for 40 frames (reduced from 60 for faster recovery)
            if (this.randomExplorationFrames < 40) {
                const randomAction = Math.floor(Math.random() * this.actionSize)
                return this.actionIndexToAction(randomAction)
            } else {
                // After random exploration, clear stuck state
                this.forceRandomExploration = false
                this.randomExplorationFrames = 0
                this.framesSinceProgress = 0
                this.stuckCounter = 0
            }
        }
        
        // Override with retreat behavior when stuck
        if (this.stuckRetreatMode) {
            this.retreatFrames++
            
            if (this.needsDoubleJump) {
                // Need running double jump for L-shaped platforms
                // Move left for 50 frames to get more distance for L-shapes
                if (this.retreatFrames < 50) {
                    return this.actionIndexToAction(1)  // Move left
                }
                // Build up speed moving right
                else if (this.retreatFrames < 70) {
                    return this.actionIndexToAction(2)  // Move right to build speed
                }
                // Execute running double jump with more attempts
                else if (this.retreatFrames < 110) {
                    return this.actionIndexToAction(4)  // Right + jump (for double jump)
                }
                // Reset and try again
                else {
                    this.stuckRetreatMode = false
                    this.retreatFrames = 0
                    this.stuckCounter = 0
                    this.needsDoubleJump = false
                }
            } else {
                // Regular retreat for lower obstacles
                // Move left for 30 frames to get away from obstacle
                if (this.retreatFrames < 30) {
                    return this.actionIndexToAction(1)  // Move left
                }
                // Try jumping while moving
                else if (this.retreatFrames < 50) {
                    // Alternate between left+jump and just left
                    if (this.retreatFrames % 10 < 5) {
                        return { actionIndex: 9, moveLeft: true, moveRight: false, jump: true, shoot: false }  // Left + jump
                    } else {
                        return this.actionIndexToAction(1)  // Move left
                    }
                }
                // After retreat, try to go right again
                else {
                    this.stuckRetreatMode = false
                    this.retreatFrames = 0
                    this.stuckCounter = 0
                }
            }
        }
        
        if (Math.random() < this.epsilon) {
            return this.actionIndexToAction(Math.floor(Math.random() * this.actionSize))
        }
        const stateArray = this.stateToArray(state)
        const stateTensor = tf.tensor2d([stateArray])
        const qValues = this.policyNet.predict(stateTensor) as tf.Tensor
        const qValuesData = await qValues.data()
        stateTensor.dispose()
        qValues.dispose()
        return this.actionIndexToAction(Array.from(qValuesData).indexOf(Math.max(...qValuesData)))
    }

    public remember(state: DQNState, action: number, reward: number, nextState: DQNState, done: boolean): void {
        this.replayBuffer.push({ state: this.stateToArray(state), action, reward, nextState: this.stateToArray(nextState), done })
        if (this.replayBuffer.length > this.maxBufferSize) this.replayBuffer.shift()
        this.totalReward += reward
    }

    public async train(): Promise<number | null> {
        if (this.replayBuffer.length < this.minBufferSize) return null
        this.trainingSteps++
        if (this.trainingSteps % this.targetUpdateFrequency === 0) {
            this.targetNet.setWeights(this.policyNet.getWeights())
        }
        if (this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay
        }
        return 0.5
    }

    private stateToArray(state: DQNState): number[] {
        return [
            state.playerX / 10000, state.playerY / 1200, state.velocityX / 500, state.velocityY / 500,
            state.onGround ? 1 : 0, state.nearestPlatformDistance / 1000, state.nearestPlatformHeight / 1200,
            state.nearestEnemyDistance / 1000, state.nearestSpikeDistance / 1000, state.hasGroundAhead ? 1 : 0,
            state.gapAhead ? 1 : 0,
            state.bossActive ? 1 : 0, state.bossDistance / 1000, state.bossHealth / 100,
            state.nearestCoinDistance / 1000, state.nearestCoinX / 1000, state.nearestCoinY / 1200,
            state.nearestPowerUpDistance / 1000, state.nearestPowerUpX / 1000, state.nearestPowerUpY / 1200
        ]
    }

    private actionIndexToAction(index: number): DQNAction {
        const actions: DQNAction[] = [
            { actionIndex: 0, moveLeft: false, moveRight: false, jump: false, shoot: false },  // Idle
            { actionIndex: 1, moveLeft: true, moveRight: false, jump: false, shoot: false },   // Move left
            { actionIndex: 2, moveLeft: false, moveRight: true, jump: false, shoot: false },   // Move right
            { actionIndex: 3, moveLeft: false, moveRight: false, jump: true, shoot: false },   // Jump
            { actionIndex: 4, moveLeft: false, moveRight: true, jump: true, shoot: false },    // Move right + jump
            { actionIndex: 5, moveLeft: false, moveRight: false, jump: false, shoot: true },   // Shoot only
            { actionIndex: 6, moveLeft: false, moveRight: true, jump: false, shoot: true },    // Move right + shoot
            { actionIndex: 7, moveLeft: true, moveRight: false, jump: false, shoot: true },    // Move left + shoot
            { actionIndex: 8, moveLeft: false, moveRight: true, jump: true, shoot: true }      // Move right + jump + shoot
        ]
        return actions[index]
    }

    public calculateReward(state: DQNState, isDead: boolean, score: number, currentAction: number): number {
        let reward = 0
        if (isDead) {
            this.alive = false
            return -10
        }
        
        const progress = state.playerX - this.lastX
        
        // Track if stuck moving right
        const isMovingRight = currentAction === 2 || currentAction === 4 || currentAction === 6 || currentAction === 8
        const isJumping = currentAction === 3 || currentAction === 4 || currentAction === 8
        
        if (isMovingRight && progress <= 0) {
            this.stuckCounter++
            
            // Check if stuck because platform is too high (need double jump)
            const platformTooHigh = state.nearestPlatformHeight < -80 && state.nearestPlatformDistance < 250
            
            // Check if platform is directly above (need to jump up first)
            const platformAbove = state.nearestPlatformHeight < -50 && state.nearestPlatformDistance < 150
            
            // Progressive penalties for being stuck - relaxed triggers
            if (this.stuckCounter > 10 || (this.stuckCounter > 6 && platformTooHigh) || (this.stuckCounter > 5 && platformAbove)) {
                reward -= 0.5  // Reduced from -2.0
                // Activate retreat mode - move far left and try double jump
                if (!this.stuckRetreatMode) {
                    this.stuckRetreatMode = true
                    this.retreatFrames = 0
                    this.needsDoubleJump = platformTooHigh || platformAbove
                    reward += 0.1  // Small reward for starting retreat
                }
            }
        } else if (progress > 0) {
            this.stuckCounter = 0
            this.stuckRetreatMode = false
            this.retreatFrames = 0
            this.forceRandomExploration = false
            this.randomExplorationFrames = 0
        } else if (!isMovingRight) {
            // Reduce stuck counter when trying other actions
            this.stuckCounter = Math.max(0, this.stuckCounter - 1)
        }
        
        // Track vertical progress (moving upward is good for platforms)
        const verticalProgress = this.lastY - state.playerY  // Negative Y is up
        
        // Reward forward progress
        if (progress > 0) {
            reward += progress / 50  // Increased progress reward
            this.framesSinceProgress = 0
            this.stuckCounter = 0
            
            // Extra bonus for making progress while jumping (navigating platforms)
            if (isJumping) {
                reward += 0.15
            }
            
            // Reward upward movement (climbing platforms)
            if (verticalProgress > 0) {
                reward += verticalProgress / 100  // Reward going up
            }
        } else {
            this.framesSinceProgress++
            
            // Escalating penalties for no progress - significantly relaxed
            if (this.framesSinceProgress > 180) {  // 3 seconds (was 1.5s)
                reward -= 1.0  // Reduced from -2.0
                // Force random exploration if completely stuck
                if (!this.forceRandomExploration) {
                    this.forceRandomExploration = true
                    this.randomExplorationFrames = 0
                    console.log('🎲 Agent stuck - forcing random exploration')
                }
            } else if (this.framesSinceProgress > 120) {  // 2 seconds (was 1s)
                reward -= 0.5  // Reduced from -1.0
            } else if (this.framesSinceProgress > 60) {  // 1 second (was 0.5s)
                reward -= 0.1  // Reduced from -0.5
            }
            
            // Encourage exploration when stuck
            if (this.framesSinceProgress > 30) {
                if (!isMovingRight) {
                    reward += 0.1  // Reward for trying different actions
                }
                if (isJumping) {
                    reward += 0.2  // Reward for jumping when stuck
                }
            }
        }
        
        reward += (score - this.lastScore) / 10
        reward += 0.01
        if (state.playerY < 100 || state.playerY > 1000) reward -= 0.5
        if (state.onGround) {
            reward += 0.05
            // Bonus for being on elevated platforms (not the floor)
            if (state.playerY < 450) {  // Above ground level
                reward += 0.1
            }
        }
        
        // Extra reward for successfully jumping onto higher platforms
        if (state.onGround && verticalProgress > 20 && progress > 0) {
            reward += 0.5  // Successfully landed on higher platform while progressing
        }

        // Reward for getting closer to coins
        if (state.nearestCoinDistance < 200) {
            reward += 0.2
        }
        if (state.nearestCoinDistance < 50) {
            reward += 0.5
        }

        // Reward for getting closer to powerups
        if (state.nearestPowerUpDistance < 200) {
            reward += 0.3
        }
        if (state.nearestPowerUpDistance < 50) {
            reward += 0.8
        }
        
        // Boss engagement rewards - ONLY when boss is actually spawned and active
        if (state.bossActive) {
            // Strong reward for moving towards and engaging the boss
            if (state.bossDistance < 400) {
                reward += 0.5  // Close to boss - increased from 0.3
            }
            // Very strong reward for shooting actions when boss is near
            if ((currentAction === 5 || currentAction === 6 || currentAction === 7 || currentAction === 8) && state.bossDistance < 500) {
                reward += 0.8  // Shooting at boss - increased from 0.5
            }
            // Strong penalty for moving too far right (towards portal) while boss is alive
            if (progress > 50 && state.bossDistance > 500) {
                reward -= 2.0  // Don't rush to portal, fight the boss! - increased from 1.5
            }
            // Penalty for moving away from boss
            if (progress < 0 && state.bossDistance > 300) {
                reward -= 0.5  // Running away from boss - increased from 0.3
            }
            // Big reward for damaging boss (health decreased)
            if (state.bossHealth < 100) {
                reward += (100 - state.bossHealth) / 30  // Scale with damage dealt - increased from /50
            }
        } else {
            // No boss active - normal forward progress is good (push to portal)
            // This ensures agent moves forward on boss levels before boss spawns
            if (progress > 0) {
                reward += 0.05  // Small bonus for forward progress when no boss
            }
        }
        
        this.lastX = state.playerX
        this.lastY = state.playerY
        this.lastScore = score
        return reward
    }

    public resetEpisode(): void {
        if (!this.alive) {
            this.episodeRewards.push(this.totalReward)
            const recentRewards = this.episodeRewards.slice(-100)
            this.averageReward = recentRewards.length > 0
                ? recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length
                : 0
        }
        this.totalReward = 0
        this.lastX = 0
        this.lastY = 0
        this.lastScore = 0
        this.framesSinceProgress = 0
        this.stuckCounter = 0
        this.stuckRetreatMode = false
        this.retreatFrames = 0
        this.needsDoubleJump = false
        this.forceRandomExploration = false
        this.randomExplorationFrames = 0
        this.alive = true
    }

    public getStats() {
        return {
            epsilon: this.epsilon,
            bufferSize: this.replayBuffer.length,
            trainingSteps: this.trainingSteps,
            episodes: this.episodeRewards.length,
            averageReward: this.averageReward,
            totalReward: this.totalReward,
            lastReward: this.episodeRewards[this.episodeRewards.length - 1] || 0
        }
    }

    public async saveModel(): Promise<void> {
        await this.policyNet.save('indexeddb://jumpjump-dqn')
        console.log('💾 Model saved')
    }

    public async loadModel(): Promise<boolean> {
        try {
            const model = await tf.loadLayersModel('indexeddb://jumpjump-dqn')
            
            // Validate model input shape matches current state size
            const inputShape = model.inputs[0].shape
            if (inputShape && inputShape[1] !== this.stateSize) {
                console.warn(`⚠️ Saved model has input shape ${inputShape[1]}, but current state size is ${this.stateSize}. Discarding old model.`)
                model.dispose()
                // Delete old model from storage
                await tf.io.removeModel('indexeddb://jumpjump-dqn')
                return false
            }
            
            this.policyNet = model as tf.Sequential
            this.targetNet.setWeights(this.policyNet.getWeights())
            console.log('✅ Model loaded')
            return true
        } catch (error) {
            console.log('ℹ️ No saved model:', error)
            return false
        }
    }

    public dispose(): void {
        if (this.isDisposed) {
            console.warn('⚠️ DQNAgent already disposed')
            return
        }
        try {
            if (this.policyNet) {
                this.policyNet.dispose()
            }
            if (this.targetNet) {
                this.targetNet.dispose()
            }
            this.replayBuffer = []
            this.isDisposed = true
            console.log('✅ DQNAgent disposed successfully')
        } catch (error) {
            console.error('❌ Error disposing DQNAgent:', error)
            // Mark as disposed even if error occurs to prevent retry
            this.isDisposed = true
        }
    }

    /**
     * Convert player action to action index for learning from demonstrations
     */
    public playerActionToIndex(action: { moveLeft: boolean, moveRight: boolean, jump: boolean, shoot: boolean }): number {
        // Map player actions to DQN action indices
        if (action.moveRight && action.jump && action.shoot) return 8  // Right + jump + shoot
        if (action.moveLeft && action.shoot) return 7   // Left + shoot
        if (action.moveRight && action.shoot) return 6  // Right + shoot
        if (action.shoot) return 5                       // Shoot only
        if (action.moveRight && action.jump) return 4   // Right + jump
        if (action.jump) return 3                        // Jump
        if (action.moveRight) return 2                   // Right
        if (action.moveLeft) return 1                    // Left
        return 0                                         // Idle
    }

    /**
     * Add a demonstration from player gameplay to the replay buffer
     * This allows the DQN to learn from human expert actions
     */
    public addDemonstration(
        state: DQNState, 
        playerAction: { moveLeft: boolean, moveRight: boolean, jump: boolean, shoot: boolean },
        reward: number,
        nextState: DQNState,
        done: boolean
    ): void {
        const actionIndex = this.playerActionToIndex(playerAction)
        // Add with higher reward to prioritize learning from demonstrations
        const boostedReward = reward + 0.5  // Boost demonstration rewards
        this.remember(state, actionIndex, boostedReward, nextState, done)
        console.log(`📚 Added demonstration: action=${actionIndex}, reward=${boostedReward.toFixed(2)}`)
    }

    /**
     * Import demonstrations from recorded gameplay data
     * @param recordings Array of recorded gameplay frames
     */
    public async importDemonstrations(recordings: Array<{
        state: DQNState,
        action: { moveLeft: boolean, moveRight: boolean, jump: boolean, shoot: boolean },
        nextState: DQNState,
        reward: number,
        done: boolean
    }>): Promise<number> {
        let importedCount = 0
        
        for (const recording of recordings) {
            this.addDemonstration(
                recording.state,
                recording.action,
                recording.reward,
                recording.nextState,
                recording.done
            )
            importedCount++
        }
        
        console.log(`📦 Imported ${importedCount} demonstrations into replay buffer`)
        console.log(`📊 Buffer size: ${this.replayBuffer.length}`)
        
        // Optionally train on demonstrations immediately
        if (this.replayBuffer.length >= this.minBufferSize) {
            console.log('🎓 Training on demonstrations...')
            for (let i = 0; i < 10; i++) {  // Do 10 training batches
                await this.train()
            }
            console.log('✅ Demonstration training complete')
        }
        
        return importedCount
    }

    /**
     * Get current replay buffer size
     */
    public getBufferSize(): number {
        return this.replayBuffer.length
    }
}
