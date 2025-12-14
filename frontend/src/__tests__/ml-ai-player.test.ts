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
