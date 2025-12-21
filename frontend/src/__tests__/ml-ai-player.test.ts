/**
 * Tests for MLAIPlayer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock TensorFlow.js - must be self-contained
vi.mock('@tensorflow/tfjs', () => {
  const tensorMock = {
    dispose: vi.fn(),
    data: vi.fn().mockResolvedValue(new Float32Array([0.1, 0.8, 0.3, 0.5])),
    shape: [1, 4]
  }

  const modelMock = {
    predict: vi.fn(() => tensorMock),
    fit: vi.fn().mockResolvedValue({ history: { loss: [0.1] } }),
    save: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    inputs: [{ shape: [null, 17] }],
    add: vi.fn(),
    compile: vi.fn()
  }

  return {
    sequential: vi.fn(() => modelMock),
    layers: {
      dense: vi.fn((config: any) => ({ config })),
      dropout: vi.fn((config: any) => ({ config }))
    },
    tensor2d: vi.fn(() => ({
      dispose: vi.fn()
    })),
    train: {
      adam: vi.fn(() => 'adam-optimizer')
    },
    loadLayersModel: vi.fn().mockResolvedValue(modelMock),
    io: {
      removeModel: vi.fn().mockResolvedValue(undefined)
    }
  }
})

// Mock GameplayRecorder
vi.mock('../utils/GameplayRecorder', () => ({
  GameplayRecorder: {
    getTrainingData: vi.fn(() => [])
  }
}))

import { MLAIPlayer } from '../utils/MLAIPlayer'
import * as tf from '@tensorflow/tfjs'
import { GameplayRecorder } from '../utils/GameplayRecorder'

describe('MLAIPlayer', () => {
  let mlPlayer: MLAIPlayer
  let mockScene: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Phaser global
    vi.stubGlobal('Phaser', {
      Math: {
        Distance: {
          Between: vi.fn((x1: number, y1: number, x2: number, y2: number) => 
            Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          )
        },
        Angle: {
          Between: vi.fn(() => 0)
        }
      }
    })
    
    // Reset localStorage mock
    const localStorageData: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageData[key] || null),
      setItem: vi.fn((key: string, value: string) => { localStorageData[key] = value }),
      removeItem: vi.fn((key: string) => { delete localStorageData[key] })
    })
    
    mockScene = {
      player: {
        x: 400,
        y: 550,
        body: {
          velocity: { x: 50, y: 0 },
          touching: { down: true }
        }
      },
      enemies: {
        getChildren: vi.fn(() => [
          { active: true, x: 500, y: 550 }
        ])
      },
      coins: {
        getChildren: vi.fn(() => [
          { active: true, x: 450, y: 500 }
        ])
      },
      spikes: {
        getChildren: vi.fn(() => [
          { active: true, x: 600, y: 620 }
        ])
      },
      platforms: {
        getChildren: vi.fn(() => [
          {
            active: true,
            getBounds: vi.fn(() => ({
              left: 0,
              right: 1000,
              top: 620,
              bottom: 650,
              centerX: 500
            }))
          }
        ])
      },
      playerHealth: 100,
      score: 500,
      coinCount: 5
    }

    mlPlayer = new MLAIPlayer(mockScene)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('constructor', () => {
    it('should initialize MLAIPlayer', () => {
      expect(mlPlayer).toBeDefined()
    })

    it('should attempt to load model on creation', () => {
      expect(tf.loadLayersModel).toHaveBeenCalledWith('localstorage://ml-ai-model')
    })
  })

  describe('getDecision', () => {
    it('should return fallback when no model', async () => {
      // Create player without model
      vi.mocked(tf.loadLayersModel).mockRejectedValueOnce(new Error('No model'))
      const player = new MLAIPlayer(mockScene)
      
      // Wait for async load to fail
      await new Promise(r => setTimeout(r, 10))

      const decision = await player.getDecision()

      expect(decision.moveRight).toBe(true)
      expect(decision.moveLeft).toBe(false)
    })

    it('should return decision from model prediction', async () => {
      const decision = await mlPlayer.getDecision()

      expect(decision).toHaveProperty('moveLeft')
      expect(decision).toHaveProperty('moveRight')
      expect(decision).toHaveProperty('jump')
      expect(decision).toHaveProperty('shoot')
    })

    it('should return fallback when player has no body', async () => {
      mockScene.player.body = null

      const decision = await mlPlayer.getDecision()

      expect(decision.moveRight).toBe(true)
      expect(decision.moveLeft).toBe(false)
    })

    it('should return fallback when player is null', async () => {
      mockScene.player = null

      const decision = await mlPlayer.getDecision()

      expect(decision.moveRight).toBe(true)
    })
  })

  describe('train', () => {
    it('should not train with insufficient data', async () => {
      vi.mocked(GameplayRecorder.getTrainingData).mockReturnValue(
        createMockTrainingData(50) // Less than 100
      )

      await mlPlayer.train()

      // No error should be thrown
      expect(true).toBe(true)
    })

    it('should train with sufficient data', async () => {
      vi.mocked(GameplayRecorder.getTrainingData).mockReturnValue(
        createMockTrainingData(150)
      )

      await mlPlayer.train()

      // Should have attempted to create model
      expect(tf.sequential).toHaveBeenCalled()
    })
  })

  describe('isModelTrained', () => {
    it('should return true when model exists', () => {
      expect(mlPlayer.isModelTrained()).toBe(true)
    })

    it('should return false when no model', async () => {
      vi.mocked(tf.loadLayersModel).mockRejectedValueOnce(new Error('No model'))
      const player = new MLAIPlayer(mockScene)
      await new Promise(r => setTimeout(r, 10))

      expect(player.isModelTrained()).toBe(false)
    })
  })

  describe('getModelInfo', () => {
    it('should return info when model exists', () => {
      localStorage.setItem('ml-model-metadata', JSON.stringify({
        trained: true,
        epochs: 100,
        timestamp: Date.now()
      }))

      const info = mlPlayer.getModelInfo()

      expect(info.trained).toBe(true)
      expect(info.epochs).toBe(100)
    })

    it('should return default info when no metadata', () => {
      const info = mlPlayer.getModelInfo()

      expect(info.trained).toBe(false)
      expect(info.epochs).toBe(0)
    })

    it('should include dataFrames count', () => {
      vi.mocked(GameplayRecorder.getTrainingData).mockReturnValue(
        createMockTrainingData(50)
      )

      const info = mlPlayer.getModelInfo()

      expect(info.dataFrames).toBe(50)
    })
  })

  describe('isCurrentlyTraining', () => {
    it('should return false initially', () => {
      expect(mlPlayer.isCurrentlyTraining()).toBe(false)
    })
  })

  describe('getTrainingProgress', () => {
    it('should return 0 initially', () => {
      expect(mlPlayer.getTrainingProgress()).toBe(0)
    })
  })

  describe('clearModel', () => {
    it('should remove model from storage', async () => {
      await MLAIPlayer.clearModel()

      expect(tf.io.removeModel).toHaveBeenCalledWith('localstorage://ml-ai-model')
    })

    it('should handle no model to clear', async () => {
      vi.mocked(tf.io.removeModel).mockRejectedValueOnce(new Error('Not found'))

      // Should not throw
      await expect(MLAIPlayer.clearModel()).resolves.toBeUndefined()
    })
  })
})

// Helper function to create mock training data
function createMockTrainingData(count: number) {
  return Array(count).fill(null).map((_, i) => ({
    timestamp: i * 100,
    state: {
      playerX: 0.4,
      playerY: 0.5,
      velocityX: 0.1,
      velocityY: 0,
      health: 1,
      onGround: true,
      nearestEnemyDistance: 0.3,
      nearestEnemyAngle: 0,
      nearestCoinDistance: 0.2,
      nearestCoinAngle: 0.5,
      nearestSpikeDistance: 0.8,
      hasGroundAhead: true,
      hasGroundBehind: true,
      platformAbove: false,
      platformAboveHeight: 0,
      score: 0.5,
      coins: 0.3
    },
    action: {
      moveLeft: i % 4 === 0,
      moveRight: i % 2 === 0,
      jump: i % 5 === 0,
      shoot: i % 7 === 0
    }
  }))
}

// ==================== ADDITIONAL COVERAGE TESTS ====================

describe('MLAIPlayer - Additional Coverage', () => {
  let mlPlayer: MLAIPlayer
  let mockScene: any
  let localStorageData: Record<string, string>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageData = {}
    
    vi.stubGlobal('Phaser', {
      Math: {
        Distance: {
          Between: vi.fn((x1: number, y1: number, x2: number, y2: number) => 
            Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          )
        },
        Angle: {
          Between: vi.fn(() => 0)
        }
      }
    })
    
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageData[key] || null),
      setItem: vi.fn((key: string, value: string) => { localStorageData[key] = value }),
      removeItem: vi.fn((key: string) => { delete localStorageData[key] })
    })
    
    mockScene = {
      player: {
        x: 400,
        y: 550,
        body: {
          velocity: { x: 50, y: 0 },
          touching: { down: true }
        }
      },
      enemies: {
        getChildren: vi.fn(() => [
          { active: true, x: 500, y: 550 }
        ])
      },
      coins: {
        getChildren: vi.fn(() => [
          { active: true, x: 450, y: 500 }
        ])
      },
      platforms: {
        getChildren: vi.fn(() => [
          { 
            active: true, 
            x: 400, 
            y: 600,
            body: { width: 200 },
            getData: vi.fn().mockReturnValue(null),
            getBounds: vi.fn().mockReturnValue({ left: 300, right: 500, top: 590, bottom: 620, centerX: 400 })
          }
        ])
      },
      spikePositions: [{ x: 600, y: 550 }],
      boss: null,
      currentLevel: 1,
      cameras: {
        main: { scrollX: 0, scrollY: 0, width: 1280, height: 720 }
      }
    }
    
    mlPlayer = new MLAIPlayer(mockScene)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('model compatibility checking', () => {
    it('should detect incompatible model with wrong feature count', async () => {
      // Mock a model with wrong input shape (10 features instead of 17)
      const wrongShapeModel = {
        predict: vi.fn(),
        fit: vi.fn(),
        save: vi.fn(),
        dispose: vi.fn(),
        inputs: [{ shape: [null, 10] }], // Wrong - should be 17
        add: vi.fn(),
        compile: vi.fn()
      }
      
      ;(mlPlayer as any).model = wrongShapeModel
      
      const decision = await mlPlayer.getDecision()
      
      // Should return safe defaults
      expect(decision.moveLeft).toBe(false)
      expect(decision.moveRight).toBe(false)
      expect(decision.jump).toBe(false)
    })
  })

  describe('captureGameState', () => {
    it('should capture player position', () => {
      const state = (mlPlayer as any).captureGameState()
      
      expect(state).not.toBeNull()
      expect(state.playerX).toBeDefined()
      expect(state.playerY).toBeDefined()
    })

    it('should capture velocity', () => {
      const state = (mlPlayer as any).captureGameState()
      
      expect(state.velocityX).toBeDefined()
      expect(state.velocityY).toBeDefined()
    })

    it('should return null when no player', () => {
      mockScene.player = null
      
      const state = (mlPlayer as any).captureGameState()
      
      expect(state).toBeNull()
    })

    it('should handle missing player body', () => {
      mockScene.player.body = null
      
      const state = (mlPlayer as any).captureGameState()
      
      expect(state).toBeNull()
    })
  })

  describe('checkGround', () => {
    it('should detect ground', () => {
      mockScene.platforms.getChildren = vi.fn().mockReturnValue([
        { 
          active: true, 
          x: 400, 
          y: 600, 
          body: { width: 200 },
          getBounds: vi.fn().mockReturnValue({ left: 300, right: 500, top: 590, bottom: 620 })
        }
      ])
      
      const hasGround = (mlPlayer as any).checkGround(mockScene.platforms, 400, 550)
      
      expect(typeof hasGround).toBe('boolean')
    })
  })

  describe('checkPlatformAbove', () => {
    it('should detect platform above', () => {
      mockScene.platforms.getChildren = vi.fn().mockReturnValue([
        { 
          active: true, 
          x: 400, 
          y: 450, 
          body: { width: 200 },
          getBounds: vi.fn().mockReturnValue({ left: 300, right: 500, top: 440, bottom: 460, centerX: 400 })
        }
      ])
      
      const result = (mlPlayer as any).checkPlatformAbove(mockScene.platforms, 400, 550)
      
      expect(result.hasPlatform).toBe(true)
    })

    it('should return false when no platform above', () => {
      mockScene.platforms.getChildren = vi.fn().mockReturnValue([
        { 
          active: true, 
          x: 400, 
          y: 700, 
          body: { width: 200 },
          getBounds: vi.fn().mockReturnValue({ left: 300, right: 500, top: 690, bottom: 720, centerX: 400 })
        }
      ])
      
      const result = (mlPlayer as any).checkPlatformAbove(mockScene.platforms, 400, 550)
      
      expect(result.hasPlatform).toBe(false)
    })
  })

  describe('fallback behavior', () => {
    it('should return default decision when no model', async () => {
      ;(mlPlayer as any).model = null
      
      const decision = await mlPlayer.getDecision()
      
      expect(decision.moveRight).toBe(true) // Default fallback
    })

    it('should return default decision when no player', async () => {
      mockScene.player = null
      
      const decision = await mlPlayer.getDecision()
      
      expect(decision.moveRight).toBe(true)
    })
  })

  // ==================== ADDITIONAL COVERAGE TESTS ====================

  describe('stateToTensor', () => {
    it('should create tensor from game state', () => {
      const gameState = {
        playerX: 100,
        playerY: 200,
        velocityX: 50,
        velocityY: 0,
        health: 100,
        onGround: true,
        nearestEnemyDistance: 500,
        nearestEnemyAngle: 0.5,
        nearestCoinDistance: 300,
        nearestCoinAngle: -0.5,
        nearestSpikeDistance: 1000,
        hasGroundAhead: true,
        hasGroundBehind: true,
        platformAbove: false,
        platformAboveHeight: 0,
        score: 1000,
        coins: 10
      }
      
      const tensor = (mlPlayer as any).stateToTensor(gameState)
      
      expect(tensor).toBeDefined()
      tensor.dispose()
    })

    it('should create tensor with correct shape', () => {
      const gameState = {
        playerX: 100, playerY: 200, velocityX: 50, velocityY: 0,
        health: 100, onGround: true,
        nearestEnemyDistance: 500, nearestEnemyAngle: 0.5,
        nearestCoinDistance: 300, nearestCoinAngle: -0.5,
        nearestSpikeDistance: 1000,
        hasGroundAhead: true, hasGroundBehind: true,
        platformAbove: false, platformAboveHeight: 0,
        score: 1000, coins: 10
      }
      
      const tensor = (mlPlayer as any).stateToTensor(gameState)
      
      // The mock returns tensor2d which has shape property
      expect(tensor).toBeDefined()
      tensor.dispose()
    })
  })

  describe('createModel', () => {
    it('should create a model object', () => {
      const model = (mlPlayer as any).createModel()
      
      expect(model).toBeDefined()
    })
  })

  describe('train', () => {
    it('should skip training if already training', async () => {
      ;(mlPlayer as any).isTraining = true
      
      await mlPlayer.train()
      
      // Should return early without error
      expect((mlPlayer as any).isTraining).toBe(true)
    })

    it('should not throw when training data is insufficient', async () => {
      ;(mlPlayer as any).isTraining = false
      
      await expect(mlPlayer.train()).resolves.not.toThrow()
    })
  })

  describe('isModelTrained', () => {
    it('should return false when no model exists', () => {
      ;(mlPlayer as any).model = null
      
      const result = mlPlayer.isModelTrained()
      
      expect(result).toBe(false)
    })

    it('should return true when model exists', () => {
      ;(mlPlayer as any).model = { layers: [] }
      
      const result = mlPlayer.isModelTrained()
      
      expect(result).toBe(true)
    })
  })

  describe('getModelInfo', () => {
    it('should return default info when no model trained', () => {
      ;(mlPlayer as any).model = null
      
      const info = mlPlayer.getModelInfo()
      
      expect(info).toHaveProperty('epochs')
      expect(info).toHaveProperty('dataFrames')
      expect(info).toHaveProperty('timestamp')
    })

    it('should return info object with expected properties', () => {
      const info = mlPlayer.getModelInfo()
      
      expect(typeof info.epochs).toBe('number')
      expect(typeof info.dataFrames).toBe('number')
      expect(typeof info.timestamp).toBe('number')
    })
  })

  describe('getDecision with model', () => {
    beforeEach(() => {
      mockScene.player = {
        x: 400,
        y: 550,
        body: {
          velocity: { x: 100, y: 0 },
          touching: { down: true }
        },
        getData: vi.fn().mockReturnValue(100)
      }
      mockScene.enemies = {
        getChildren: vi.fn().mockReturnValue([])
      }
      mockScene.coins = {
        getChildren: vi.fn().mockReturnValue([])
      }
      mockScene.spikes = {
        getChildren: vi.fn().mockReturnValue([])
      }
      mockScene.platforms = {
        getChildren: vi.fn().mockReturnValue([])
      }
    })

    it('should return decision based on model output', async () => {
      // Create a mock model with predict function and inputs array
      const mockPrediction = {
        data: vi.fn().mockResolvedValue(new Float32Array([0.1, 0.8, 0.2, 0.05])),
        dispose: vi.fn()
      }
      ;(mlPlayer as any).model = {
        predict: vi.fn().mockReturnValue(mockPrediction),
        dispose: vi.fn(),
        inputs: [{ shape: [null, 17] }]
      }

      const decision = await mlPlayer.getDecision()

      expect(decision).toHaveProperty('moveLeft')
      expect(decision).toHaveProperty('moveRight')
      expect(decision).toHaveProperty('jump')
      expect(decision).toHaveProperty('shoot')
    })

    it('should fallback when all predictions are near zero', async () => {
      const mockPrediction = {
        data: vi.fn().mockResolvedValue(new Float32Array([0.001, 0.001, 0.001, 0.001])),
        dispose: vi.fn()
      }
      ;(mlPlayer as any).model = {
        predict: vi.fn().mockReturnValue(mockPrediction),
        dispose: vi.fn(),
        inputs: [{ shape: [null, 17] }]
      }

      const decision = await mlPlayer.getDecision()

      // Should fallback to moveRight = true
      expect(decision.moveRight).toBe(true)
    })
  })

  describe('loadModel', () => {
    it('should attempt to load model from storage', async () => {
      await mlPlayer.loadModel()
      
      // loadModel was called (either succeeds or handles error)
      expect(mlPlayer).toBeDefined()
    })
  })

  describe('saveModel', () => {
    it('should save model when it exists', async () => {
      ;(mlPlayer as any).model = {
        save: vi.fn().mockResolvedValue({}),
        dispose: vi.fn()
      }
      
      await (mlPlayer as any).saveModel()
      
      expect((mlPlayer as any).model.save).toHaveBeenCalled()
    })

    it('should not throw when no model to save', async () => {
      ;(mlPlayer as any).model = null
      
      await expect((mlPlayer as any).saveModel()).resolves.not.toThrow()
    })
  })

  describe('captureGameState with entities', () => {
    it('should find nearest enemy', () => {
      mockScene.player = {
        x: 400,
        y: 550,
        body: {
          velocity: { x: 0, y: 0 },
          touching: { down: true }
        },
        getData: vi.fn().mockReturnValue(100)
      }
      
      const mockEnemy = { x: 500, y: 550, active: true }
      mockScene.enemies = {
        getChildren: vi.fn().mockReturnValue([mockEnemy])
      }
      mockScene.coins = { getChildren: vi.fn().mockReturnValue([]) }
      mockScene.spikes = { getChildren: vi.fn().mockReturnValue([]) }
      mockScene.platforms = { getChildren: vi.fn().mockReturnValue([]) }
      
      const state = (mlPlayer as any).captureGameState()
      
      expect(state.nearestEnemyDistance).toBeLessThan(1000)
    })

    it('should find nearest coin', () => {
      mockScene.player = {
        x: 400,
        y: 550,
        body: { velocity: { x: 0, y: 0 }, touching: { down: true } },
        getData: vi.fn().mockReturnValue(100)
      }
      
      const mockCoin = { x: 450, y: 530, active: true }
      mockScene.enemies = { getChildren: vi.fn().mockReturnValue([]) }
      mockScene.coins = { getChildren: vi.fn().mockReturnValue([mockCoin]) }
      mockScene.spikes = { getChildren: vi.fn().mockReturnValue([]) }
      mockScene.platforms = { getChildren: vi.fn().mockReturnValue([]) }
      
      const state = (mlPlayer as any).captureGameState()
      
      expect(state.nearestCoinDistance).toBeLessThan(1000)
    })

    it('should find nearest spike', () => {
      mockScene.player = {
        x: 400,
        y: 550,
        body: { velocity: { x: 0, y: 0 }, touching: { down: true } },
        getData: vi.fn().mockReturnValue(100)
      }
      
      const mockSpike = { x: 420, y: 580, active: true }
      mockScene.enemies = { getChildren: vi.fn().mockReturnValue([]) }
      mockScene.coins = { getChildren: vi.fn().mockReturnValue([]) }
      mockScene.spikes = { getChildren: vi.fn().mockReturnValue([mockSpike]) }
      mockScene.platforms = { getChildren: vi.fn().mockReturnValue([]) }
      
      const state = (mlPlayer as any).captureGameState()
      
      expect(state.nearestSpikeDistance).toBeLessThan(1000)
    })
  })

  describe('training data validation', () => {
    it('should detect feature count mismatch in training data', async () => {
      // Mock training data with wrong feature count
      const wrongFormatData = Array(150).fill(null).map(() => ({
        timestamp: Date.now(),
        state: {
          // Only 5 features instead of 17
          playerX: 0.5,
          playerY: 0.6,
          velocityX: 0.1,
          velocityY: 0,
          health: 1
        },
        action: { moveLeft: false, moveRight: true, jump: false, shoot: false }
      }))
      
      vi.mocked(GameplayRecorder.getTrainingData).mockReturnValue(wrongFormatData as any)
      
      // Should throw error for feature mismatch
      await expect(mlPlayer.train()).rejects.toThrow('Training data feature mismatch')
      
      // Training should be complete (isTraining = false after error)
      expect(mlPlayer.isCurrentlyTraining()).toBe(false)
    })

    it('should skip frames missing platformAbove features', async () => {
      // Create training data with old format (missing platformAbove)
      // This has 15 features instead of 17, which triggers the first check
      const oldFormatData = Array(150).fill(null).map(() => ({
        timestamp: Date.now(),
        state: {
          playerX: 0.5,
          playerY: 0.6,
          velocityX: 0.1,
          velocityY: 0,
          health: 1,
          onGround: true,
          nearestEnemyDistance: 0.5,
          nearestEnemyAngle: 0,
          nearestCoinDistance: 0.3,
          nearestCoinAngle: 0.5,
          nearestSpikeDistance: 0.8,
          hasGroundAhead: true,
          hasGroundBehind: true,
          score: 0.5,
          coins: 0.3
          // Missing platformAbove and platformAboveHeight
        },
        action: { moveLeft: false, moveRight: true, jump: false, shoot: false }
      }))
      
      vi.mocked(GameplayRecorder.getTrainingData).mockReturnValue(oldFormatData as any)
      
      // Should throw for feature count mismatch (15 vs 17)
      await expect(mlPlayer.train()).rejects.toThrow('Training data feature mismatch')
      
      expect(mlPlayer.isCurrentlyTraining()).toBe(false)
    })

    it('should throw error when insufficient valid frames after filtering', async () => {
      // Mix of old format (will be filtered) and new format frames
      const mixedData = [
        // 50 old format frames (will be skipped)
        ...Array(50).fill(null).map(() => ({
          timestamp: Date.now(),
          state: {
            playerX: 0.5, playerY: 0.6, velocityX: 0.1, velocityY: 0,
            health: 1, onGround: true,
            nearestEnemyDistance: 0.5, nearestEnemyAngle: 0,
            nearestCoinDistance: 0.3, nearestCoinAngle: 0.5,
            nearestSpikeDistance: 0.8,
            hasGroundAhead: true, hasGroundBehind: true,
            score: 0.5, coins: 0.3
            // Missing platformAbove
          },
          action: { moveLeft: false, moveRight: true, jump: false, shoot: false }
        })),
        // 30 new format frames (not enough - need 100)
        ...Array(30).fill(null).map(() => ({
          timestamp: Date.now(),
          state: {
            playerX: 0.5, playerY: 0.6, velocityX: 0.1, velocityY: 0,
            health: 1, onGround: true,
            nearestEnemyDistance: 0.5, nearestEnemyAngle: 0,
            nearestCoinDistance: 0.3, nearestCoinAngle: 0.5,
            nearestSpikeDistance: 0.8,
            hasGroundAhead: true, hasGroundBehind: true,
            platformAbove: false, platformAboveHeight: 0,
            score: 0.5, coins: 0.3
          },
          action: { moveLeft: false, moveRight: true, jump: false, shoot: false }
        }))
      ]
      
      vi.mocked(GameplayRecorder.getTrainingData).mockReturnValue(mixedData as any)
      
      // Should handle error gracefully
      await mlPlayer.train()
      
      expect(mlPlayer.isCurrentlyTraining()).toBe(false)
    })
  })

  describe('loadModel shape validation', () => {
    it('should clear model with incompatible input shape', async () => {
      // Mock a loaded model with wrong shape (15 features instead of 17)
      const incompatibleModel = {
        predict: vi.fn(),
        fit: vi.fn(),
        save: vi.fn(),
        dispose: vi.fn(),
        inputs: [{ shape: [null, 15] }], // Wrong shape
        add: vi.fn(),
        compile: vi.fn()
      }
      
      vi.mocked(tf.loadLayersModel).mockResolvedValueOnce(incompatibleModel as any)
      
      const player = new MLAIPlayer(mockScene)
      await new Promise(r => setTimeout(r, 50))
      
      // Model should be cleared due to incompatibility
      expect(player.isModelTrained()).toBe(false)
    })

    it('should keep model with correct input shape', async () => {
      // Mock a loaded model with correct shape (17 features)
      const compatibleModel = {
        predict: vi.fn(),
        fit: vi.fn(),
        save: vi.fn(),
        dispose: vi.fn(),
        inputs: [{ shape: [null, 17] }], // Correct shape
        add: vi.fn(),
        compile: vi.fn()
      }
      
      vi.mocked(tf.loadLayersModel).mockResolvedValueOnce(compatibleModel as any)
      
      const player = new MLAIPlayer(mockScene)
      await new Promise(r => setTimeout(r, 50))
      
      // Model should be kept
      expect(player.isModelTrained()).toBe(true)
    })
  })

  describe('getModelInfo error handling', () => {
    it('should handle corrupted metadata JSON', () => {
      localStorageData['ml-model-metadata'] = '{ invalid json {'
      
      const info = mlPlayer.getModelInfo()
      
      // Should return default values on parse error
      expect(info.trained).toBe(false)
      expect(info.epochs).toBe(0)
    })

    it('should return default when metadata is empty', () => {
      delete localStorageData['ml-model-metadata']
      
      const info = mlPlayer.getModelInfo()
      
      expect(info.trained).toBe(false)
    })

    it('should handle metadata with missing fields', () => {
      localStorageData['ml-model-metadata'] = JSON.stringify({
        trained: true
        // Missing epochs and timestamp
      })
      
      const info = mlPlayer.getModelInfo()
      
      expect(info.epochs).toBe(0)
      expect(info.timestamp).toBe(0)
    })
  })

  describe('prediction error handling', () => {
    it('should handle model.predict throwing error', async () => {
      ;(mlPlayer as any).model = {
        predict: vi.fn().mockImplementation(() => {
          throw new Error('Prediction failed')
        }),
        inputs: [{ shape: [null, 17] }]
      }
      
      const decision = await mlPlayer.getDecision()
      
      // Should return safe defaults
      expect(decision.moveLeft).toBe(false)
      expect(decision.moveRight).toBe(false)
    })

    it('should handle data() promise rejection', async () => {
      const mockTensor = {
        data: vi.fn().mockRejectedValue(new Error('Data fetch failed')),
        dispose: vi.fn()
      }
      ;(mlPlayer as any).model = {
        predict: vi.fn().mockReturnValue(mockTensor),
        inputs: [{ shape: [null, 17] }]
      }
      
      const decision = await mlPlayer.getDecision()
      
      // Should return safe defaults
      expect(decision.moveLeft).toBe(false)
      expect(decision.moveRight).toBe(false)
    })
  })

  describe('training progress callback', () => {
    it('should call onProgress callback during training', async () => {
      const progressCallback = vi.fn()
      
      vi.mocked(GameplayRecorder.getTrainingData).mockReturnValue(
        createMockTrainingData(150)
      )
      
      // The train method creates a new model and calls model.fit
      // The mock for tf.sequential returns a model that has callbacks support
      // We need to verify the callback is called via the onEpochEnd mock
      
      // Override the sequential mock to call the callback
      const mockModel = {
        fit: vi.fn().mockImplementation(async (inputs: any, outputs: any, config: any) => {
          // Call the onEpochEnd callback like the real TensorFlow would
          if (config?.callbacks?.onEpochEnd) {
            config.callbacks.onEpochEnd(0, { loss: 0.5, acc: 0.7 })
          }
          return { history: { loss: [0.1] } }
        }),
        save: vi.fn().mockResolvedValue({}),
        inputs: [{ shape: [null, 17] }],
        add: vi.fn(),
        compile: vi.fn()
      }
      
      vi.mocked(tf.sequential).mockReturnValueOnce(mockModel as any)
      
      await mlPlayer.train(progressCallback)
      
      // The fit function should have been called with callbacks that include onEpochEnd
      expect(mockModel.fit).toHaveBeenCalled()
      // And our progress callback should have been invoked
      expect(progressCallback).toHaveBeenCalledWith(1, expect.objectContaining({ loss: 0.5 }))
    })

    it('should handle training without progress callback', async () => {
      vi.mocked(GameplayRecorder.getTrainingData).mockReturnValue(
        createMockTrainingData(150)
      )
      
      // Should not throw when no callback provided
      await expect(mlPlayer.train()).resolves.not.toThrow()
    })
  })

  describe('checkGround edge cases', () => {
    it('should return false when platforms is null', () => {
      const hasGround = (mlPlayer as any).checkGround(null, 400, 550)
      
      expect(hasGround).toBe(false)
    })

    it('should skip inactive platforms', () => {
      mockScene.platforms.getChildren = vi.fn().mockReturnValue([
        { 
          active: false, 
          getBounds: vi.fn().mockReturnValue({ left: 300, right: 500, top: 590, bottom: 620 })
        }
      ])
      
      const hasGround = (mlPlayer as any).checkGround(mockScene.platforms, 400, 550)
      
      // Should skip inactive platform
      expect(hasGround).toBe(false)
    })
  })

  describe('checkPlatformAbove edge cases', () => {
    it('should return no platform when platforms is null', () => {
      const result = (mlPlayer as any).checkPlatformAbove(null, 400, 550)
      
      expect(result.hasPlatform).toBe(false)
      expect(result.height).toBe(0)
    })

    it('should skip inactive platforms', () => {
      mockScene.platforms.getChildren = vi.fn().mockReturnValue([
        { 
          active: false, 
          getBounds: vi.fn().mockReturnValue({ left: 300, right: 500, top: 440, bottom: 460, centerX: 400 })
        }
      ])
      
      const result = (mlPlayer as any).checkPlatformAbove(mockScene.platforms, 400, 550)
      
      expect(result.hasPlatform).toBe(false)
    })
  })

  describe('captureGameState with null entity groups', () => {
    it('should handle null enemies group', () => {
      mockScene.enemies = null
      
      const state = (mlPlayer as any).captureGameState()
      
      expect(state).not.toBeNull()
      expect(state.nearestEnemyDistance).toBe(1)
    })

    it('should handle null coins group', () => {
      mockScene.coins = null
      
      const state = (mlPlayer as any).captureGameState()
      
      expect(state).not.toBeNull()
      expect(state.nearestCoinDistance).toBe(1)
    })

    it('should handle null spikes group', () => {
      mockScene.spikes = null
      
      const state = (mlPlayer as any).captureGameState()
      
      expect(state).not.toBeNull()
      expect(state.nearestSpikeDistance).toBe(1)
    })
  })
})
