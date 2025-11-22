import * as tf from '@tensorflow/tfjs'
import type GameScene from '../scenes/GameScene'
import { GameplayRecorder, type GameState, type GameplayFrame } from './GameplayRecorder'
import type { AIDecision } from './AIPlayer'

export class MLAIPlayer {
  private scene: GameScene
  private model: tf.LayersModel | null = null
  private isTraining: boolean = false
  private trainingProgress: number = 0
  
  constructor(scene: GameScene) {
    this.scene = scene
    this.loadModel()
  }

  public async getDecision(): Promise<AIDecision> {
    if (!this.model) {
      // Fallback to basic behavior if no model
      return {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
    }

    const state = this.captureGameState()
    if (!state) {
      return {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
    }

    // Convert state to tensor
    const stateTensor = this.stateToTensor(state)
    
    // Predict action
    const prediction = this.model.predict(stateTensor) as tf.Tensor
    const actionData = await prediction.data()
    
    // Clean up tensors
    stateTensor.dispose()
    prediction.dispose()

    // Convert prediction to action (4 outputs: moveLeft, moveRight, jump, shoot)
    // Use adaptive threshold: pick the action with highest confidence if > 0.25
    const [left, right, jump, shoot] = Array.from(actionData)
    
    // For movement, choose the direction with higher confidence
    const moveThreshold = 0.25
    const decision = {
      moveLeft: left > moveThreshold && left > right,
      moveRight: right > moveThreshold && right > left,
      jump: jump > 0.3,  // Jump needs higher confidence
      shoot: shoot > 0.3, // Shoot needs higher confidence
      aimX: 0,
      aimY: 0
    }
    
    // Debug logging every 60 frames (~1 second at 60fps)
    if (Math.random() < 0.016) {
      console.log('ML AI prediction:', {
        raw: [left.toFixed(3), right.toFixed(3), jump.toFixed(3), shoot.toFixed(3)],
        decision: `L:${decision.moveLeft} R:${decision.moveRight} J:${decision.jump} S:${decision.shoot}`
      })
    }
    
    return decision
  }

  private captureGameState(): GameState | null {
    const player = (this.scene as any).player
    if (!player || !player.body) return null
    
    const body = player.body as Phaser.Physics.Arcade.Body
    const playerX = player.x
    const playerY = player.y
    
    // Find nearest enemy
    const enemies = (this.scene as any).enemies
    let nearestEnemyDistance = 1000
    let nearestEnemyAngle = 0
    
    if (enemies) {
      for (const enemy of enemies.getChildren()) {
        if (!(enemy as any).active) continue
        const dist = Phaser.Math.Distance.Between(playerX, playerY, (enemy as any).x, (enemy as any).y)
        if (dist < nearestEnemyDistance) {
          nearestEnemyDistance = dist
          nearestEnemyAngle = Phaser.Math.Angle.Between(playerX, playerY, (enemy as any).x, (enemy as any).y)
        }
      }
    }
    
    // Find nearest coin
    const coins = (this.scene as any).coins
    let nearestCoinDistance = 1000
    let nearestCoinAngle = 0
    
    if (coins) {
      for (const coin of coins.getChildren()) {
        if (!(coin as any).active) continue
        const dist = Phaser.Math.Distance.Between(playerX, playerY, (coin as any).x, (coin as any).y)
        if (dist < nearestCoinDistance) {
          nearestCoinDistance = dist
          nearestCoinAngle = Phaser.Math.Angle.Between(playerX, playerY, (coin as any).x, (coin as any).y)
        }
      }
    }
    
    // Find nearest spike
    const spikes = (this.scene as any).spikes
    let nearestSpikeDistance = 1000
    
    if (spikes) {
      for (const spike of spikes.getChildren()) {
        if (!(spike as any).active) continue
        const dist = Phaser.Math.Distance.Between(playerX, playerY, (spike as any).x, (spike as any).y)
        if (dist < nearestSpikeDistance) {
          nearestSpikeDistance = dist
        }
      }
    }
    
    // Check ground ahead/behind
    const platforms = (this.scene as any).platforms
    const hasGroundAhead = this.checkGround(platforms, playerX + 100, playerY)
    const hasGroundBehind = this.checkGround(platforms, playerX - 100, playerY)
    
    return {
      playerX: playerX / 1000,
      playerY: playerY / 1000,
      velocityX: body.velocity.x / 200,
      velocityY: body.velocity.y / 500,
      health: (this.scene as any).playerHealth / 100,
      onGround: body.touching.down,
      nearestEnemyDistance: nearestEnemyDistance / 1000,
      nearestEnemyAngle: nearestEnemyAngle / Math.PI,
      nearestCoinDistance: nearestCoinDistance / 1000,
      nearestCoinAngle: nearestCoinAngle / Math.PI,
      nearestSpikeDistance: nearestSpikeDistance / 1000,
      hasGroundAhead,
      hasGroundBehind,
      score: (this.scene as any).score / 1000,
      coins: (this.scene as any).coinCount / 10
    }
  }

  private checkGround(platforms: any, x: number, y: number): boolean {
    if (!platforms) return false
    
    const checkY = y + 100
    
    for (const platform of platforms.getChildren()) {
      if (!(platform as any).active) continue
      
      const bounds = (platform as any).getBounds()
      if (x >= bounds.left && x <= bounds.right &&
          checkY >= bounds.top && checkY <= bounds.bottom + 50) {
        return true
      }
    }
    
    return false
  }

  private stateToTensor(state: GameState): tf.Tensor {
    const stateArray = [
      state.playerX,
      state.playerY,
      state.velocityX,
      state.velocityY,
      state.health,
      state.onGround ? 1 : 0,
      state.nearestEnemyDistance,
      state.nearestEnemyAngle,
      state.nearestCoinDistance,
      state.nearestCoinAngle,
      state.nearestSpikeDistance,
      state.hasGroundAhead ? 1 : 0,
      state.hasGroundBehind ? 1 : 0,
      state.score,
      state.coins
    ]
    
    return tf.tensor2d([stateArray])
  }

  public async train(onProgress?: (epoch: number, logs: any) => void): Promise<void> {
    if (this.isTraining) {
      console.log('⚠️ Training already in progress')
      return
    }

    const trainingData = GameplayRecorder.getTrainingData()
    
    if (trainingData.length < 100) {
      console.log('⚠️ Need at least 100 frames of training data. Current:', trainingData.length)
      console.log('💡 Play the game with recording enabled to collect training data!')
      return
    }

    console.log('🧠 Starting ML training with', trainingData.length, 'frames...')
    this.isTraining = true
    this.trainingProgress = 0

    try {
      // Create or recreate model
      this.model = this.createModel()

      // Prepare training data
      const { inputs, outputs } = this.prepareTrainingData(trainingData)

      // Train the model with more epochs for better learning
      await this.model.fit(inputs, outputs, {
        epochs: 100,
        batchSize: 16,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            this.trainingProgress = ((epoch + 1) / 100) * 100
            const loss = logs?.loss ?? 0
            const acc = logs?.acc ?? 0
            console.log(`📊 Epoch ${epoch + 1}/100 - Loss: ${loss.toFixed(4)} - Acc: ${acc.toFixed(4)}`)
            if (onProgress) {
              onProgress(epoch + 1, logs || { loss: 0 })
            }
          }
        }
      })

      // Save model
      await this.saveModel()

      console.log('✅ Training completed!')
      this.trainingProgress = 100
      
      // Clean up tensors
      inputs.dispose()
      outputs.dispose()

    } catch (error) {
      console.error('❌ Training failed:', error)
    } finally {
      this.isTraining = false
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential()

    // Input layer (15 state features) - increased capacity
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      inputShape: [15],
      kernelInitializer: 'heNormal'
    }))

    // Hidden layers with higher capacity
    model.add(tf.layers.dropout({ rate: 0.3 }))
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }))

    model.add(tf.layers.dropout({ rate: 0.3 }))
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }))

    // Output layer (4 actions: moveLeft, moveRight, jump, shoot)
    model.add(tf.layers.dense({
      units: 4,
      activation: 'sigmoid'
    }))

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    })

    return model
  }

  private prepareTrainingData(frames: GameplayFrame[]): { inputs: tf.Tensor, outputs: tf.Tensor } {
    const states: number[][] = []
    const actions: number[][] = []

    for (const frame of frames) {
      // Convert state to array
      const stateArray = [
        frame.state.playerX,
        frame.state.playerY,
        frame.state.velocityX,
        frame.state.velocityY,
        frame.state.health,
        frame.state.onGround ? 1 : 0,
        frame.state.nearestEnemyDistance,
        frame.state.nearestEnemyAngle,
        frame.state.nearestCoinDistance,
        frame.state.nearestCoinAngle,
        frame.state.nearestSpikeDistance,
        frame.state.hasGroundAhead ? 1 : 0,
        frame.state.hasGroundBehind ? 1 : 0,
        frame.state.score,
        frame.state.coins
      ]

      // Convert action to array
      const actionArray = [
        frame.action.moveLeft ? 1 : 0,
        frame.action.moveRight ? 1 : 0,
        frame.action.jump ? 1 : 0,
        frame.action.shoot ? 1 : 0
      ]

      states.push(stateArray)
      actions.push(actionArray)
    }

    return {
      inputs: tf.tensor2d(states),
      outputs: tf.tensor2d(actions)
    }
  }

  private async saveModel(): Promise<void> {
    if (!this.model) return

    await this.model.save('localstorage://ml-ai-model')
    console.log('💾 Model saved to browser storage')
  }

  private async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://ml-ai-model')
      console.log('✅ ML model loaded from storage')
    } catch (error) {
      console.log('ℹ️ No saved model found. Train a new model to use ML AI.')
    }
  }

  public isModelTrained(): boolean {
    return this.model !== null
  }

  public isCurrentlyTraining(): boolean {
    return this.isTraining
  }

  public getTrainingProgress(): number {
    return this.trainingProgress
  }

  public static async clearModel(): Promise<void> {
    try {
      await tf.io.removeModel('localstorage://ml-ai-model')
      console.log('🗑️ ML model cleared')
    } catch (error) {
      console.log('No model to clear')
    }
  }
}
