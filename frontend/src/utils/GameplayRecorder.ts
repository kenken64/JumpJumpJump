import type GameScene from '../scenes/GameScene'

export interface GameState {
  // Player state
  playerX: number
  playerY: number
  velocityX: number
  velocityY: number
  health: number
  onGround: boolean
  
  // Environment state (normalized)
  nearestEnemyDistance: number
  nearestEnemyAngle: number
  nearestCoinDistance: number
  nearestCoinAngle: number
  nearestSpikeDistance: number
  hasGroundAhead: boolean
  hasGroundBehind: boolean
  
  // Game progress
  score: number
  coins: number
}

export interface PlayerAction {
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
  shoot: boolean
  aimX: number
  aimY: number
}

export interface GameplayFrame {
  state: GameState
  action: PlayerAction
  timestamp: number
}

export class GameplayRecorder {
  private scene: GameScene
  private isRecording: boolean = false
  private frames: GameplayFrame[] = []
  private lastRecordTime: number = 0
  private recordInterval: number = 100 // Record every 100ms (10 fps)
  
  constructor(scene: GameScene) {
    this.scene = scene
  }

  public startRecording(): void {
    this.isRecording = true
    this.frames = []
    console.log('🎥 Started recording gameplay...')
  }

  public stopRecording(): void {
    this.isRecording = false
    console.log('🎥 Stopped recording. Frames recorded:', this.frames.length)
    
    // Save to localStorage
    this.saveRecording()
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  public getCurrentFrameCount(): number {
    return this.frames.length
  }

  public recordFrame(currentTime: number, action: PlayerAction): void {
    if (!this.isRecording) return
    if (currentTime - this.lastRecordTime < this.recordInterval) return
    
    const state = this.captureGameState()
    if (!state) return
    
    this.frames.push({
      state,
      action,
      timestamp: currentTime
    })
    
    this.lastRecordTime = currentTime
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
      playerX: playerX / 1000, // Normalize
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

  private saveRecording(): void {
    if (this.frames.length === 0) return
    
    // Get existing recordings
    const existingData = localStorage.getItem('ml_training_data')
    let allFrames: GameplayFrame[] = []
    
    if (existingData) {
      try {
        allFrames = JSON.parse(existingData)
      } catch (e) {
        console.error('Failed to parse existing training data')
      }
    }
    
    // Add new frames
    allFrames = allFrames.concat(this.frames)
    
    // Keep only last 10,000 frames (about 100 games at 10fps for 100s each)
    if (allFrames.length > 10000) {
      allFrames = allFrames.slice(-10000)
    }
    
    // Save to localStorage
    localStorage.setItem('ml_training_data', JSON.stringify(allFrames))
    console.log('💾 Saved', this.frames.length, 'frames. Total frames:', allFrames.length)
  }

  public static getTrainingData(): GameplayFrame[] {
    const data = localStorage.getItem('ml_training_data')
    if (!data) return []
    
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error('Failed to load training data')
      return []
    }
  }

  public static clearTrainingData(): void {
    localStorage.removeItem('ml_training_data')
    console.log('🗑️ Cleared all training data')
  }

  public static getTrainingDataCount(): number {
    const data = this.getTrainingData()
    return data.length
  }
}
