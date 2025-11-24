import * as tf from '@tensorflow/tfjs'
import type GameScene from '../scenes/GameScene'

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
}

export interface DQNAction {
    actionIndex: number
    moveLeft: boolean
    moveRight: boolean
    jump: boolean
    shoot: boolean
}

interface Experience {
    state: number[]
    action: number
    reward: number
    nextState: number[]
    done: boolean
}

export class DQNAgent {
    private policyNet!: tf.Sequential
    private targetNet!: tf.Sequential
    private readonly stateSize = 11
    private readonly actionSize = 9  // Expanded to include shooting actions
    private epsilon = 1.0
    private readonly epsilonMin = 0.1  // Keep even more exploration
    private readonly epsilonDecay = 0.999  // Very slow decay
    private replayBuffer: Experience[] = []
    private readonly maxBufferSize = 10000
    private readonly minBufferSize = 100
    private trainingSteps = 0
    private readonly targetUpdateFrequency = 100
    private totalReward = 0
    private episodeRewards: number[] = []
    private averageReward = 0
    private lastX = 0
    private lastY = 0
    private lastScore = 0
    private framesSinceProgress = 0
    private alive = true
    private stuckCounter = 0
    private stuckRetreatMode = false
    private retreatFrames = 0
    private needsDoubleJump = false
    private isDisposed = false
    private forceRandomExploration = false
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
            // Do random actions for 60 frames
            if (this.randomExplorationFrames < 60) {
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
            state.gapAhead ? 1 : 0
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
            
            // Progressive penalties for being stuck - more aggressive for vertical platforms
            if (this.stuckCounter > 10 || (this.stuckCounter > 5 && platformTooHigh) || (this.stuckCounter > 3 && platformAbove)) {
                reward -= 2.0  // Very strong penalty
                // Activate retreat mode - move far left and try double jump
                if (!this.stuckRetreatMode) {
                    this.stuckRetreatMode = true
                    this.retreatFrames = 0
                    this.needsDoubleJump = platformTooHigh || platformAbove
                    reward += 0.3  // Small reward for starting retreat
                }
            } else if (this.stuckCounter > 5) {
                reward -= 0.5  // Medium penalty
            }
        } else if (progress > 0) {
            this.stuckCounter = 0
            this.stuckRetreatMode = false
            this.retreatFrames = 0
            this.forceRandomExploration = false
            this.randomExplorationFrames = 0
        } else if (!isMovingRight) {
            // Reduce stuck counter when trying other actions
            this.stuckCounter = Math.max(0, this.stuckCounter - 2)
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
            
            // Escalating penalties for no progress
            if (this.framesSinceProgress > 180) {
                reward -= 1.0  // Very severe penalty after 3 seconds
                // Force random exploration if completely stuck
                if (!this.forceRandomExploration) {
                    this.forceRandomExploration = true
                    this.randomExplorationFrames = 0
                    console.log('🎲 Agent completely stuck - forcing random exploration')
                }
            } else if (this.framesSinceProgress > 120) {
                reward -= 0.5  // Severe penalty after 2 seconds
            } else if (this.framesSinceProgress > 60) {
                reward -= 0.2
            } else if (this.framesSinceProgress > 30 && state.onGround) {
                // Extra penalty for being stuck on ground - should be jumping
                reward -= 0.15
            }
            
            // Encourage exploration when stuck - especially for vertical platforms
            if (this.framesSinceProgress > 15) {
                if (!isMovingRight) {
                    reward += 0.15  // Reward trying different actions
                }
                if (isJumping) {
                    reward += 0.35  // Strong reward for jumping when stuck
                }
            } else if (this.framesSinceProgress > 5 && state.onGround) {
                // Early encouragement to jump when on ground
                if (isJumping) {
                    reward += 0.2
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
            this.policyNet = model as tf.Sequential
            this.targetNet.setWeights(this.policyNet.getWeights())
            console.log('✅ Model loaded')
            return true
        } catch {
            console.log('ℹ️ No saved model')
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
}
