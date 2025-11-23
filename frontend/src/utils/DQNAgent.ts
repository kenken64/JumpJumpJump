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
    private _scene: GameScene
    private policyNet!: tf.Sequential
    private targetNet!: tf.Sequential
    private readonly stateSize = 11
    private readonly actionSize = 9  // Expanded to include shooting actions
    private epsilon = 1.0
    private readonly epsilonMin = 0.01
    private readonly epsilonDecay = 0.995
    private replayBuffer: Experience[] = []
    private readonly maxBufferSize = 10000
    private readonly _batchSize = 32
    private readonly minBufferSize = 100
    private trainingSteps = 0
    private readonly targetUpdateFrequency = 100
    private totalReward = 0
    private episodeRewards: number[] = []
    private averageReward = 0
    private lastX = 0
    private lastScore = 0
    private framesSinceProgress = 0
    private alive = true

    constructor(scene: GameScene) {
        this._scene = scene
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

    public calculateReward(state: DQNState, isDead: boolean, score: number): number {
        let reward = 0
        if (isDead) {
            this.alive = false
            return -10
        }
        const progress = state.playerX - this.lastX
        if (progress > 0) {
            reward += progress / 100
            this.framesSinceProgress = 0
        } else {
            this.framesSinceProgress++
            if (this.framesSinceProgress > 60) reward -= 0.1
        }
        reward += (score - this.lastScore) / 10
        reward += 0.01
        if (state.playerY < 100 || state.playerY > 1000) reward -= 0.5
        if (state.onGround) reward += 0.05
        this.lastX = state.playerX
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
        this.lastScore = 0
        this.framesSinceProgress = 0
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
        this.policyNet.dispose()
        this.targetNet.dispose()
        this.replayBuffer = []
    }
}
