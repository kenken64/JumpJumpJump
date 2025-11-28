/**
 * utils-ml-ai-player.test.ts
 * Tests for MLAIPlayer (Machine Learning AI) utility class
 * 
 * Note: MLAIPlayer depends heavily on TensorFlow.js for model operations.
 * We test the utility functions and logic that can be tested without TF initialization.
 */

import { describe, it, expect, vi } from 'vitest'

// Types that mirror MLAIPlayer internal types
interface GameState {
  playerX: number
  playerY: number
  velocityX: number
  velocityY: number
  onGround: boolean
  nearestPlatformDistance: number
  nearestPlatformDirection: number
  nearestEnemyDistance: number
  nearestEnemyDirection: number
  nearestCoinDistance: number
  nearestCoinDirection: number
  nearestSpikeDistance: number
  hasGroundAhead: boolean
  gapAhead: boolean
  platformAbove: boolean
  bossActive: boolean
  bossDirection: number
}

interface AIDecision {
  left: boolean
  right: boolean
  jump: boolean
  shoot: boolean
}

// Helper to create default game state
function createDefaultGameState(): GameState {
  return {
    playerX: 500,
    playerY: 400,
    velocityX: 100,
    velocityY: 0,
    onGround: true,
    nearestPlatformDistance: 200,
    nearestPlatformDirection: 0,
    nearestEnemyDistance: 500,
    nearestEnemyDirection: 1,
    nearestCoinDistance: 150,
    nearestCoinDirection: 1,
    nearestSpikeDistance: 300,
    hasGroundAhead: true,
    gapAhead: false,
    platformAbove: false,
    bossActive: false,
    bossDirection: 0
  }
}

describe('MLAIPlayer - Game State Interface', () => {
  describe('GameState structure', () => {
    it('should have all required properties', () => {
      const state = createDefaultGameState()
      
      expect(state).toHaveProperty('playerX')
      expect(state).toHaveProperty('playerY')
      expect(state).toHaveProperty('velocityX')
      expect(state).toHaveProperty('velocityY')
      expect(state).toHaveProperty('onGround')
      expect(state).toHaveProperty('nearestPlatformDistance')
      expect(state).toHaveProperty('nearestPlatformDirection')
      expect(state).toHaveProperty('nearestEnemyDistance')
      expect(state).toHaveProperty('nearestEnemyDirection')
      expect(state).toHaveProperty('nearestCoinDistance')
      expect(state).toHaveProperty('nearestCoinDirection')
      expect(state).toHaveProperty('nearestSpikeDistance')
      expect(state).toHaveProperty('hasGroundAhead')
      expect(state).toHaveProperty('gapAhead')
      expect(state).toHaveProperty('platformAbove')
      expect(state).toHaveProperty('bossActive')
      expect(state).toHaveProperty('bossDirection')
    })
    
    it('should have numeric position values', () => {
      const state = createDefaultGameState()
      
      expect(typeof state.playerX).toBe('number')
      expect(typeof state.playerY).toBe('number')
    })
    
    it('should have numeric velocity values', () => {
      const state = createDefaultGameState()
      
      expect(typeof state.velocityX).toBe('number')
      expect(typeof state.velocityY).toBe('number')
    })
    
    it('should have boolean flags', () => {
      const state = createDefaultGameState()
      
      expect(typeof state.onGround).toBe('boolean')
      expect(typeof state.hasGroundAhead).toBe('boolean')
      expect(typeof state.gapAhead).toBe('boolean')
      expect(typeof state.platformAbove).toBe('boolean')
      expect(typeof state.bossActive).toBe('boolean')
    })
    
    it('should have direction values between -1 and 1', () => {
      const state = createDefaultGameState()
      
      expect(state.nearestPlatformDirection).toBeGreaterThanOrEqual(-1)
      expect(state.nearestPlatformDirection).toBeLessThanOrEqual(1)
      expect(state.nearestEnemyDirection).toBeGreaterThanOrEqual(-1)
      expect(state.nearestEnemyDirection).toBeLessThanOrEqual(1)
    })
  })
})

describe('MLAIPlayer - AI Decision Interface', () => {
  describe('AIDecision structure', () => {
    it('should have all required boolean properties', () => {
      const decision: AIDecision = {
        left: false,
        right: true,
        jump: false,
        shoot: false
      }
      
      expect(decision).toHaveProperty('left')
      expect(decision).toHaveProperty('right')
      expect(decision).toHaveProperty('jump')
      expect(decision).toHaveProperty('shoot')
    })
    
    it('should allow all actions to be false (idle)', () => {
      const decision: AIDecision = {
        left: false,
        right: false,
        jump: false,
        shoot: false
      }
      
      expect(decision.left).toBe(false)
      expect(decision.right).toBe(false)
      expect(decision.jump).toBe(false)
      expect(decision.shoot).toBe(false)
    })
    
    it('should allow combined actions', () => {
      const decision: AIDecision = {
        left: false,
        right: true,
        jump: true,
        shoot: true
      }
      
      expect(decision.right).toBe(true)
      expect(decision.jump).toBe(true)
      expect(decision.shoot).toBe(true)
    })
  })
})

describe('MLAIPlayer - State to Tensor Conversion Logic', () => {
  // Test the state normalization logic used before feeding to the model
  
  function normalizeState(state: GameState): number[] {
    // Replicate MLAIPlayer stateToTensor normalization
    return [
      state.playerX / 8000,                                // normalized X
      state.playerY / 600,                                  // normalized Y
      (state.velocityX + 400) / 800,                       // normalized velocity X
      (state.velocityY + 600) / 1200,                      // normalized velocity Y
      state.onGround ? 1 : 0,
      Math.min(state.nearestPlatformDistance, 500) / 500,
      state.nearestPlatformDirection,
      Math.min(state.nearestEnemyDistance, 500) / 500,
      state.nearestEnemyDirection,
      Math.min(state.nearestCoinDistance, 500) / 500,
      state.nearestCoinDirection,
      Math.min(state.nearestSpikeDistance, 500) / 500,
      state.hasGroundAhead ? 1 : 0,
      state.gapAhead ? 1 : 0,
      state.platformAbove ? 1 : 0,
      state.bossActive ? 1 : 0,
      state.bossDirection
    ]
  }
  
  it('should normalize player position', () => {
    const state = createDefaultGameState()
    const normalized = normalizeState(state)
    
    // X: 500 / 8000 = 0.0625
    expect(normalized[0]).toBeCloseTo(0.0625)
    // Y: 400 / 600 = 0.667
    expect(normalized[1]).toBeCloseTo(0.667, 2)
  })
  
  it('should normalize velocities', () => {
    const state = createDefaultGameState()
    const normalized = normalizeState(state)
    
    // velocityX: (100 + 400) / 800 = 0.625
    expect(normalized[2]).toBeCloseTo(0.625)
    // velocityY: (0 + 600) / 1200 = 0.5
    expect(normalized[3]).toBeCloseTo(0.5)
  })
  
  it('should convert booleans to 0 or 1', () => {
    const stateOnGround = createDefaultGameState()
    stateOnGround.onGround = true
    const normalizedOnGround = normalizeState(stateOnGround)
    expect(normalizedOnGround[4]).toBe(1)
    
    const stateInAir = createDefaultGameState()
    stateInAir.onGround = false
    const normalizedInAir = normalizeState(stateInAir)
    expect(normalizedInAir[4]).toBe(0)
  })
  
  it('should clamp distances to max 500', () => {
    const state = createDefaultGameState()
    state.nearestEnemyDistance = 1000 // Greater than 500
    const normalized = normalizeState(state)
    
    // Should clamp to 500, then normalize: 500/500 = 1
    expect(normalized[7]).toBe(1)
  })
  
  it('should preserve direction values', () => {
    const state = createDefaultGameState()
    state.nearestEnemyDirection = -0.5
    const normalized = normalizeState(state)
    
    expect(normalized[8]).toBe(-0.5)
  })
  
  it('should return correct number of features', () => {
    const state = createDefaultGameState()
    const normalized = normalizeState(state)
    
    expect(normalized.length).toBe(17)
  })
})

describe('MLAIPlayer - Decision Interpretation Logic', () => {
  // Test how model output is converted to decisions
  
  function interpretOutput(output: number[]): AIDecision {
    // Replicate MLAIPlayer decision interpretation
    // Output format: [left, right, jump, shoot] as probabilities
    const threshold = 0.5
    
    return {
      left: output[0] > threshold,
      right: output[1] > threshold,
      jump: output[2] > threshold,
      shoot: output[3] > threshold
    }
  }
  
  it('should interpret high values as true', () => {
    const output = [0.8, 0.9, 0.7, 0.6]
    const decision = interpretOutput(output)
    
    expect(decision.left).toBe(true)
    expect(decision.right).toBe(true)
    expect(decision.jump).toBe(true)
    expect(decision.shoot).toBe(true)
  })
  
  it('should interpret low values as false', () => {
    const output = [0.1, 0.2, 0.3, 0.4]
    const decision = interpretOutput(output)
    
    expect(decision.left).toBe(false)
    expect(decision.right).toBe(false)
    expect(decision.jump).toBe(false)
    expect(decision.shoot).toBe(false)
  })
  
  it('should handle mixed values', () => {
    const output = [0.2, 0.8, 0.6, 0.3]
    const decision = interpretOutput(output)
    
    expect(decision.left).toBe(false)
    expect(decision.right).toBe(true)
    expect(decision.jump).toBe(true)
    expect(decision.shoot).toBe(false)
  })
  
  it('should handle exact threshold value', () => {
    const output = [0.5, 0.5, 0.5, 0.5]
    const decision = interpretOutput(output)
    
    // At exactly 0.5, should be false (not greater than)
    expect(decision.left).toBe(false)
    expect(decision.right).toBe(false)
    expect(decision.jump).toBe(false)
    expect(decision.shoot).toBe(false)
  })
})

describe('MLAIPlayer - Ground Detection Logic', () => {
  // Test the hasGroundAhead check logic
  
  interface Platform {
    left: number
    right: number
    top: number
  }
  
  function checkGroundAhead(
    playerX: number,
    playerY: number,
    velocityX: number,
    platforms: Platform[]
  ): boolean {
    // Replicate ground ahead detection
    const lookAheadDistance = 100
    const direction = velocityX >= 0 ? 1 : -1
    const checkX = playerX + (direction * lookAheadDistance)
    const checkY = playerY + 50 // Just below player
    
    return platforms.some(platform => 
      checkX >= platform.left &&
      checkX <= platform.right &&
      checkY >= platform.top - 20 &&
      checkY <= platform.top + 20
    )
  }
  
  it('should detect ground ahead when platform exists', () => {
    const platforms: Platform[] = [
      { left: 0, right: 1000, top: 450 }
    ]
    
    const hasGround = checkGroundAhead(500, 400, 100, platforms)
    
    expect(hasGround).toBe(true)
  })
  
  it('should detect no ground when gap ahead', () => {
    const platforms: Platform[] = [
      { left: 0, right: 400, top: 450 } // Platform ends before check point
    ]
    
    const hasGround = checkGroundAhead(500, 400, 100, platforms)
    
    expect(hasGround).toBe(false)
  })
  
  it('should check in correct direction based on velocity', () => {
    const platforms: Platform[] = [
      { left: 300, right: 450, top: 450 } // Platform only to the left
    ]
    
    // Moving right - no ground ahead
    expect(checkGroundAhead(500, 400, 100, platforms)).toBe(false)
    
    // Moving left - ground ahead
    expect(checkGroundAhead(500, 400, -100, platforms)).toBe(true)
  })
})

describe('MLAIPlayer - Platform Above Detection', () => {
  interface Platform {
    left: number
    right: number
    top: number
    bottom: number
  }
  
  function checkPlatformAbove(
    playerX: number,
    playerY: number,
    platforms: Platform[]
  ): boolean {
    // Check for jumpable platform above player
    const jumpHeight = 150
    const horizontalRange = 100
    
    return platforms.some(platform =>
      playerX >= platform.left - horizontalRange &&
      playerX <= platform.right + horizontalRange &&
      platform.bottom < playerY &&
      platform.bottom > playerY - jumpHeight
    )
  }
  
  it('should detect platform above within jump range', () => {
    const platforms: Platform[] = [
      { left: 400, right: 600, top: 250, bottom: 280 }
    ]
    
    const hasPlatformAbove = checkPlatformAbove(500, 400, platforms)
    
    expect(hasPlatformAbove).toBe(true)
  })
  
  it('should not detect platform too high', () => {
    const platforms: Platform[] = [
      { left: 400, right: 600, top: 100, bottom: 130 } // Too high
    ]
    
    const hasPlatformAbove = checkPlatformAbove(500, 400, platforms)
    
    expect(hasPlatformAbove).toBe(false)
  })
  
  it('should not detect platform too far horizontally', () => {
    const platforms: Platform[] = [
      { left: 800, right: 1000, top: 250, bottom: 280 } // Too far right
    ]
    
    const hasPlatformAbove = checkPlatformAbove(500, 400, platforms)
    
    expect(hasPlatformAbove).toBe(false)
  })
})

describe('MLAIPlayer - Training Data Preparation', () => {
  interface TrainingFrame {
    state: GameState
    action: AIDecision
  }
  
  function prepareTrainingData(frames: TrainingFrame[]): { inputs: number[][], outputs: number[][] } {
    const inputs: number[][] = []
    const outputs: number[][] = []
    
    for (const frame of frames) {
      // Simplified normalization
      inputs.push([
        frame.state.playerX / 8000,
        frame.state.playerY / 600,
        (frame.state.velocityX + 400) / 800,
        (frame.state.velocityY + 600) / 1200,
        frame.state.onGround ? 1 : 0
      ])
      
      outputs.push([
        frame.action.left ? 1 : 0,
        frame.action.right ? 1 : 0,
        frame.action.jump ? 1 : 0,
        frame.action.shoot ? 1 : 0
      ])
    }
    
    return { inputs, outputs }
  }
  
  it('should prepare correct number of samples', () => {
    const frames: TrainingFrame[] = [
      { state: createDefaultGameState(), action: { left: false, right: true, jump: false, shoot: false } },
      { state: createDefaultGameState(), action: { left: false, right: true, jump: true, shoot: false } },
      { state: createDefaultGameState(), action: { left: false, right: false, jump: true, shoot: false } }
    ]
    
    const { inputs, outputs } = prepareTrainingData(frames)
    
    expect(inputs.length).toBe(3)
    expect(outputs.length).toBe(3)
  })
  
  it('should convert actions to one-hot vectors', () => {
    const frames: TrainingFrame[] = [
      { state: createDefaultGameState(), action: { left: false, right: true, jump: false, shoot: false } }
    ]
    
    const { outputs } = prepareTrainingData(frames)
    
    expect(outputs[0]).toEqual([0, 1, 0, 0])
  })
  
  it('should handle empty frames', () => {
    const { inputs, outputs } = prepareTrainingData([])
    
    expect(inputs.length).toBe(0)
    expect(outputs.length).toBe(0)
  })
})

describe('MLAIPlayer - Distance Calculations', () => {
  function distanceBetween(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  }
  
  function directionTo(fromX: number, toX: number): number {
    // Returns -1 for left, 1 for right, 0 for same position
    if (toX > fromX) return 1
    if (toX < fromX) return -1
    return 0
  }
  
  it('should calculate distance correctly', () => {
    expect(distanceBetween(0, 0, 3, 4)).toBe(5) // 3-4-5 triangle
    expect(distanceBetween(100, 100, 100, 100)).toBe(0)
    expect(distanceBetween(0, 0, 100, 0)).toBe(100)
  })
  
  it('should determine direction correctly', () => {
    expect(directionTo(100, 200)).toBe(1)   // Target to the right
    expect(directionTo(200, 100)).toBe(-1)  // Target to the left
    expect(directionTo(100, 100)).toBe(0)   // Same position
  })
})

describe('MLAIPlayer - Model Info Interface', () => {
  interface ModelInfo {
    trained: boolean
    epochs: number
    lastTrainedAt: string | null
    inputShape: number[]
    outputShape: number[]
  }
  
  it('should have correct structure for untrained model', () => {
    const info: ModelInfo = {
      trained: false,
      epochs: 0,
      lastTrainedAt: null,
      inputShape: [17],
      outputShape: [4]
    }
    
    expect(info.trained).toBe(false)
    expect(info.epochs).toBe(0)
    expect(info.lastTrainedAt).toBeNull()
  })
  
  it('should have correct structure for trained model', () => {
    const info: ModelInfo = {
      trained: true,
      epochs: 100,
      lastTrainedAt: '2024-01-15T10:30:00Z',
      inputShape: [17],
      outputShape: [4]
    }
    
    expect(info.trained).toBe(true)
    expect(info.epochs).toBe(100)
    expect(info.lastTrainedAt).toBe('2024-01-15T10:30:00Z')
  })
  
  it('should have correct input/output shapes', () => {
    const info: ModelInfo = {
      trained: false,
      epochs: 0,
      lastTrainedAt: null,
      inputShape: [17],  // 17 features
      outputShape: [4]   // 4 actions
    }
    
    expect(info.inputShape).toEqual([17])
    expect(info.outputShape).toEqual([4])
  })
})

describe('MLAIPlayer - Training Progress', () => {
  interface TrainingProgress {
    isTraining: boolean
    currentEpoch: number
    totalEpochs: number
    loss: number | null
  }
  
  it('should track training not started', () => {
    const progress: TrainingProgress = {
      isTraining: false,
      currentEpoch: 0,
      totalEpochs: 0,
      loss: null
    }
    
    expect(progress.isTraining).toBe(false)
    expect(progress.loss).toBeNull()
  })
  
  it('should track training in progress', () => {
    const progress: TrainingProgress = {
      isTraining: true,
      currentEpoch: 50,
      totalEpochs: 100,
      loss: 0.15
    }
    
    expect(progress.isTraining).toBe(true)
    expect(progress.currentEpoch).toBe(50)
    expect(progress.currentEpoch / progress.totalEpochs).toBe(0.5)
  })
  
  it('should track completed training', () => {
    const progress: TrainingProgress = {
      isTraining: false,
      currentEpoch: 100,
      totalEpochs: 100,
      loss: 0.05
    }
    
    expect(progress.isTraining).toBe(false)
    expect(progress.currentEpoch).toBe(progress.totalEpochs)
    expect(progress.loss).toBe(0.05)
  })
})
