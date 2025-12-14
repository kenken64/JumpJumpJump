import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  sequential: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    predict: vi.fn().mockReturnValue({
      data: vi.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]),
      dispose: vi.fn()
    }),
    getWeights: vi.fn().mockReturnValue([]),
    setWeights: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn()
  })),
  layers: {
    dense: vi.fn().mockReturnValue({})
  },
  tensor2d: vi.fn().mockReturnValue({
    dispose: vi.fn()
  }),
  loadLayersModel: vi.fn().mockResolvedValue({
    inputs: [{ shape: [null, 20] }],
    getWeights: vi.fn().mockReturnValue([]),
    dispose: vi.fn()
  }),
  io: {
    removeModel: vi.fn().mockResolvedValue(undefined)
  }
}))

import { DQNAgent, type DQNState } from '../utils/DQNAgent'
import * as tf from '@tensorflow/tfjs'

// Create mock state
const createMockState = (overrides: Partial<DQNState> = {}): DQNState => ({
  playerX: 100,
  playerY: 300,
  velocityX: 50,
  velocityY: 0,
  onGround: true,
  nearestPlatformDistance: 200,
  nearestPlatformHeight: 50,
  nearestEnemyDistance: 500,
  nearestSpikeDistance: 600,
  hasGroundAhead: true,
  gapAhead: false,
  bossActive: false,
  bossDistance: 1000,
  bossHealth: 100,
  nearestCoinDistance: 300,
  nearestCoinX: 150,
  nearestCoinY: 280,
  nearestPowerUpDistance: 400,
  nearestPowerUpX: 200,
  nearestPowerUpY: 290,
  ...overrides
})

describe('DQNAgent', () => {
  let agent: DQNAgent
  let mockScene: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockScene = {
      player: { x: 100, y: 300 }
    }
    
    agent = new DQNAgent(mockScene)
  })

  afterEach(() => {
    if (agent) {
      agent.dispose()
    }
  })

  describe('constructor', () => {
    it('should create agent with scene', () => {
      const newAgent = new DQNAgent(mockScene)
      expect(newAgent).toBeInstanceOf(DQNAgent)
      newAgent.dispose()
    })

    it('should initialize neural networks', () => {
      expect(tf.sequential).toHaveBeenCalled()
    })
  })

  describe('selectAction', () => {
    it('should return an action', async () => {
      const state = createMockState()
      
      const action = await agent.selectAction(state)
      
      expect(action).toBeDefined()
      expect(action).toHaveProperty('actionIndex')
      expect(action).toHaveProperty('moveLeft')
      expect(action).toHaveProperty('moveRight')
      expect(action).toHaveProperty('jump')
      expect(action).toHaveProperty('shoot')
    })

    it('should return idle action when disposed', async () => {
      agent.dispose()
      const state = createMockState()
      
      const action = await agent.selectAction(state)
      
      expect(action.actionIndex).toBe(0)
      expect(action.moveLeft).toBe(false)
      expect(action.moveRight).toBe(false)
      expect(action.jump).toBe(false)
      expect(action.shoot).toBe(false)
    })

    it('should perform epsilon-greedy exploration', async () => {
      const state = createMockState()
      
      // Force exploration by setting high epsilon
      ;(agent as any).epsilon = 1.0
      
      const action = await agent.selectAction(state)
      
      expect(action).toBeDefined()
    })
  })

  describe('remember', () => {
    it('should add experience to replay buffer', () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      agent.remember(state, 2, 1.0, nextState, false)
      
      expect(agent.getBufferSize()).toBe(1)
    })

    it('should accumulate total reward', () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      agent.remember(state, 2, 1.0, nextState, false)
      agent.remember(state, 2, 0.5, nextState, false)
      
      const stats = agent.getStats()
      expect(stats.totalReward).toBe(1.5)
    })

    it('should limit buffer size', () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      // Add more than max buffer size
      for (let i = 0; i < 15000; i++) {
        agent.remember(state, 2, 1.0, nextState, false)
      }
      
      expect(agent.getBufferSize()).toBeLessThanOrEqual(10000)
    })
  })

  describe('train', () => {
    it('should return null when buffer too small', async () => {
      const result = await agent.train()
      
      expect(result).toBeNull()
    })

    it('should train when buffer is large enough', async () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      // Fill buffer to minimum size
      for (let i = 0; i < 100; i++) {
        agent.remember(state, 2, 1.0, nextState, false)
      }
      
      const result = await agent.train()
      
      expect(result).not.toBeNull()
    })

    it('should decay epsilon', async () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      // Fill buffer
      for (let i = 0; i < 100; i++) {
        agent.remember(state, 2, 1.0, nextState, false)
      }
      
      const initialEpsilon = (agent as any).epsilon
      await agent.train()
      
      expect((agent as any).epsilon).toBeLessThan(initialEpsilon)
    })
  })

  describe('calculateReward', () => {
    it('should return negative reward on death', () => {
      const state = createMockState()
      
      const reward = agent.calculateReward(state, true, 0, 0)
      
      expect(reward).toBe(-10)
    })

    it('should reward forward progress', () => {
      const state1 = createMockState({ playerX: 100 })
      agent.calculateReward(state1, false, 0, 2) // Set initial position
      
      const state2 = createMockState({ playerX: 200 })
      const reward = agent.calculateReward(state2, false, 0, 2)
      
      expect(reward).toBeGreaterThan(0)
    })

    it('should reward being on ground', () => {
      const stateOnGround = createMockState({ onGround: true })
      agent.calculateReward(stateOnGround, false, 0, 0) // Initialize
      
      const reward = agent.calculateReward(stateOnGround, false, 0, 0)
      
      expect(reward).toBeGreaterThan(-1)
    })

    it('should penalize no progress', () => {
      const state = createMockState({ playerX: 100 })
      
      // Simulate being stuck
      for (let i = 0; i < 200; i++) {
        agent.calculateReward(state, false, 0, 2) // Moving right but no progress
      }
      
      const reward = agent.calculateReward(state, false, 0, 2)
      
      expect(reward).toBeLessThan(0)
    })

    it('should reward score increases', () => {
      const state = createMockState()
      agent.calculateReward(state, false, 0, 0) // Initialize
      
      const reward = agent.calculateReward(state, false, 100, 0)
      
      expect(reward).toBeGreaterThan(0)
    })

    it('should reward being close to coins', () => {
      const state = createMockState({ nearestCoinDistance: 50 })
      agent.calculateReward(state, false, 0, 0) // Initialize
      
      const reward = agent.calculateReward(state, false, 0, 0)
      
      expect(reward).toBeGreaterThan(0)
    })

    it('should reward being close to powerups', () => {
      const state = createMockState({ nearestPowerUpDistance: 50 })
      agent.calculateReward(state, false, 0, 0) // Initialize
      
      const reward = agent.calculateReward(state, false, 0, 0)
      
      expect(reward).toBeGreaterThan(0)
    })

    it('should reward engaging boss', () => {
      const state = createMockState({ 
        bossActive: true, 
        bossDistance: 300,
        bossHealth: 80
      })
      agent.calculateReward(state, false, 0, 0) // Initialize
      
      const reward = agent.calculateReward(state, false, 0, 5) // Shooting
      
      expect(reward).toBeGreaterThan(0)
    })
  })

  describe('resetEpisode', () => {
    it('should reset total reward', () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      agent.remember(state, 2, 10.0, nextState, false)
      agent.resetEpisode()
      
      const stats = agent.getStats()
      expect(stats.totalReward).toBe(0)
    })

    it('should reset progress tracking', () => {
      agent.resetEpisode()
      
      expect((agent as any).lastX).toBe(0)
      expect((agent as any).lastY).toBe(0)
      expect((agent as any).lastScore).toBe(0)
      expect((agent as any).framesSinceProgress).toBe(0)
    })

    it('should reset stuck counters', () => {
      agent.resetEpisode()
      
      expect((agent as any).stuckCounter).toBe(0)
      expect((agent as any).stuckRetreatMode).toBe(false)
      expect((agent as any).retreatFrames).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return training statistics', () => {
      const stats = agent.getStats()
      
      expect(stats).toHaveProperty('epsilon')
      expect(stats).toHaveProperty('bufferSize')
      expect(stats).toHaveProperty('trainingSteps')
      expect(stats).toHaveProperty('episodes')
      expect(stats).toHaveProperty('averageReward')
      expect(stats).toHaveProperty('totalReward')
      expect(stats).toHaveProperty('lastReward')
    })
  })

  describe('saveModel', () => {
    it('should save model to indexeddb', async () => {
      await agent.saveModel()
      
      // Save should be called on policy network
    })
  })

  describe('loadModel', () => {
    it('should load model from indexeddb', async () => {
      const result = await agent.loadModel()
      
      expect(typeof result).toBe('boolean')
    })

    it('should return false when model has wrong input shape', async () => {
      vi.mocked(tf.loadLayersModel).mockResolvedValueOnce({
        inputs: [{ shape: [null, 10] }], // Wrong shape
        getWeights: vi.fn().mockReturnValue([]),
        dispose: vi.fn()
      } as any)
      
      const result = await agent.loadModel()
      
      expect(result).toBe(false)
    })

    it('should handle load errors gracefully', async () => {
      vi.mocked(tf.loadLayersModel).mockRejectedValueOnce(new Error('Load error'))
      
      const result = await agent.loadModel()
      
      expect(result).toBe(false)
    })
  })

  describe('dispose', () => {
    it('should dispose neural networks', () => {
      agent.dispose()
      
      expect((agent as any).isDisposed).toBe(true)
    })

    it('should clear replay buffer', () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      agent.remember(state, 2, 1.0, nextState, false)
      
      agent.dispose()
      
      expect(agent.getBufferSize()).toBe(0)
    })

    it('should not dispose twice', () => {
      agent.dispose()
      
      // Should not throw
      expect(() => agent.dispose()).not.toThrow()
    })
  })

  describe('playerActionToIndex', () => {
    it('should map idle action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: false,
        moveRight: false,
        jump: false,
        shoot: false
      })
      
      expect(index).toBe(0)
    })

    it('should map move left action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: true,
        moveRight: false,
        jump: false,
        shoot: false
      })
      
      expect(index).toBe(1)
    })

    it('should map move right action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false
      })
      
      expect(index).toBe(2)
    })

    it('should map jump action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: false,
        moveRight: false,
        jump: true,
        shoot: false
      })
      
      expect(index).toBe(3)
    })

    it('should map right+jump action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: false,
        moveRight: true,
        jump: true,
        shoot: false
      })
      
      expect(index).toBe(4)
    })

    it('should map shoot action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: false,
        moveRight: false,
        jump: false,
        shoot: true
      })
      
      expect(index).toBe(5)
    })

    it('should map right+shoot action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: true
      })
      
      expect(index).toBe(6)
    })

    it('should map left+shoot action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: true,
        moveRight: false,
        jump: false,
        shoot: true
      })
      
      expect(index).toBe(7)
    })

    it('should map right+jump+shoot action', () => {
      const index = agent.playerActionToIndex({
        moveLeft: false,
        moveRight: true,
        jump: true,
        shoot: true
      })
      
      expect(index).toBe(8)
    })
  })

  describe('addDemonstration', () => {
    it('should add boosted demonstration to buffer', () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      agent.addDemonstration(
        state,
        { moveLeft: false, moveRight: true, jump: false, shoot: false },
        1.0,
        nextState,
        false
      )
      
      expect(agent.getBufferSize()).toBe(1)
    })
  })

  describe('importDemonstrations', () => {
    it('should import recordings into buffer', async () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      const recordings = [
        {
          state,
          action: { moveLeft: false, moveRight: true, jump: false, shoot: false },
          nextState,
          reward: 1.0,
          done: false
        }
      ]
      
      const count = await agent.importDemonstrations(recordings)
      
      expect(count).toBe(1)
      expect(agent.getBufferSize()).toBe(1)
    })

    it('should train when buffer reaches minimum size', async () => {
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      
      const recordings = Array(100).fill({
        state,
        action: { moveLeft: false, moveRight: true, jump: false, shoot: false },
        nextState,
        reward: 1.0,
        done: false
      })
      
      await agent.importDemonstrations(recordings)
      
      // Training should have been called
    })
  })

  describe('getBufferSize', () => {
    it('should return current buffer size', () => {
      expect(agent.getBufferSize()).toBe(0)
      
      const state = createMockState()
      const nextState = createMockState({ playerX: 150 })
      agent.remember(state, 2, 1.0, nextState, false)
      
      expect(agent.getBufferSize()).toBe(1)
    })
  })
})
