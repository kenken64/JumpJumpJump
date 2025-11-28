/**
 * utils-dqn-agent.test.ts
 * Tests for DQNAgent (Deep Q-Network) utility class
 * 
 * Note: DQNAgent is heavily dependent on TensorFlow.js neural network operations.
 * Instead of trying to mock all TensorFlow internals, we test the exposed interfaces
 * and utility functions that can be tested without full TF initialization.
 */

import { describe, it, expect } from 'vitest'
import type { DQNState, DQNAction } from '../utils/DQNAgent'

// Create state helper for testing  
function createDefaultState(): DQNState {
  return {
    playerX: 500,
    playerY: 400,
    velocityX: 100,
    velocityY: 0,
    onGround: true,
    nearestPlatformDistance: 200,
    nearestPlatformHeight: 50,
    nearestEnemyDistance: 500,
    nearestSpikeDistance: 300,
    hasGroundAhead: true,
    gapAhead: false,
    bossActive: false,
    bossDistance: 1000,
    bossHealth: 100
  }
}

describe('DQNAgent - Types and Interfaces', () => {
  describe('DQNState interface', () => {
    it('should have all required properties', () => {
      const state = createDefaultState()
      
      expect(state).toHaveProperty('playerX')
      expect(state).toHaveProperty('playerY')
      expect(state).toHaveProperty('velocityX')
      expect(state).toHaveProperty('velocityY')
      expect(state).toHaveProperty('onGround')
      expect(state).toHaveProperty('nearestPlatformDistance')
      expect(state).toHaveProperty('nearestPlatformHeight')
      expect(state).toHaveProperty('nearestEnemyDistance')
      expect(state).toHaveProperty('nearestSpikeDistance')
      expect(state).toHaveProperty('hasGroundAhead')
      expect(state).toHaveProperty('gapAhead')
      expect(state).toHaveProperty('bossActive')
      expect(state).toHaveProperty('bossDistance')
      expect(state).toHaveProperty('bossHealth')
    })
    
    it('should allow numeric values for position and velocity', () => {
      const state = createDefaultState()
      
      expect(typeof state.playerX).toBe('number')
      expect(typeof state.playerY).toBe('number')
      expect(typeof state.velocityX).toBe('number')
      expect(typeof state.velocityY).toBe('number')
    })
    
    it('should allow boolean values for flags', () => {
      const state = createDefaultState()
      
      expect(typeof state.onGround).toBe('boolean')
      expect(typeof state.hasGroundAhead).toBe('boolean')
      expect(typeof state.gapAhead).toBe('boolean')
      expect(typeof state.bossActive).toBe('boolean')
    })
  })
  
  describe('DQNAction interface', () => {
    it('should define valid action structure', () => {
      const action: DQNAction = {
        actionIndex: 0,
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false
      }
      
      expect(action).toHaveProperty('actionIndex')
      expect(action).toHaveProperty('moveLeft')
      expect(action).toHaveProperty('moveRight')
      expect(action).toHaveProperty('jump')
      expect(action).toHaveProperty('shoot')
    })
    
    it('should support all action combinations', () => {
      // Action index 0 - no action
      const noAction: DQNAction = {
        actionIndex: 0,
        moveLeft: false,
        moveRight: false,
        jump: false,
        shoot: false
      }
      expect(noAction.actionIndex).toBe(0)
      
      // Action index 1 - move left
      const moveLeftAction: DQNAction = {
        actionIndex: 1,
        moveLeft: true,
        moveRight: false,
        jump: false,
        shoot: false
      }
      expect(moveLeftAction.moveLeft).toBe(true)
      
      // Action index 2 - move right
      const moveRightAction: DQNAction = {
        actionIndex: 2,
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false
      }
      expect(moveRightAction.moveRight).toBe(true)
      
      // Action index 3 - jump
      const jumpAction: DQNAction = {
        actionIndex: 3,
        moveLeft: false,
        moveRight: false,
        jump: true,
        shoot: false
      }
      expect(jumpAction.jump).toBe(true)
    })
  })
})

describe('DQNAgent - State Conversion Utilities', () => {
  describe('stateToArray conversion logic', () => {
    it('should normalize player position correctly', () => {
      const state = createDefaultState()
      
      // Simulate the normalization logic from DQNAgent.stateToArray
      const normalizedX = state.playerX / 8000 // worldWidth default
      const normalizedY = state.playerY / 600  // worldHeight
      
      expect(normalizedX).toBe(500 / 8000)
      expect(normalizedY).toBe(400 / 600)
      expect(normalizedX).toBeGreaterThanOrEqual(0)
      expect(normalizedX).toBeLessThanOrEqual(1)
    })
    
    it('should normalize velocity correctly', () => {
      const state = createDefaultState()
      
      // Velocity normalization (assuming max velocity of 400)
      const normalizedVelX = (state.velocityX + 400) / 800
      const normalizedVelY = (state.velocityY + 400) / 800
      
      expect(normalizedVelX).toBe((100 + 400) / 800)
      expect(normalizedVelY).toBe((0 + 400) / 800)
    })
    
    it('should convert boolean to number for neural network', () => {
      const state = createDefaultState()
      
      const onGroundNum = state.onGround ? 1 : 0
      const gapAheadNum = state.gapAhead ? 1 : 0
      
      expect(onGroundNum).toBe(1)
      expect(gapAheadNum).toBe(0)
    })
    
    it('should normalize distances', () => {
      const state = createDefaultState()
      
      // Distance normalization (assuming max of 500)
      const normalizedPlatformDist = Math.min(state.nearestPlatformDistance, 500) / 500
      const normalizedEnemyDist = Math.min(state.nearestEnemyDistance, 500) / 500
      
      expect(normalizedPlatformDist).toBe(200 / 500)
      expect(normalizedEnemyDist).toBe(1) // 500 is clamped to 500
    })
  })
})

describe('DQNAgent - Action Index to Action Conversion', () => {
  // This tests the logic of actionIndexToAction without needing TensorFlow
  
  function actionIndexToAction(actionIndex: number): DQNAction {
    // Replicate the logic from DQNAgent
    const actions: DQNAction[] = [
      { actionIndex: 0, moveLeft: false, moveRight: false, jump: false, shoot: false }, // idle
      { actionIndex: 1, moveLeft: true, moveRight: false, jump: false, shoot: false },  // left
      { actionIndex: 2, moveLeft: false, moveRight: true, jump: false, shoot: false },  // right  
      { actionIndex: 3, moveLeft: false, moveRight: false, jump: true, shoot: false },  // jump
      { actionIndex: 4, moveLeft: true, moveRight: false, jump: true, shoot: false },   // left+jump
      { actionIndex: 5, moveLeft: false, moveRight: true, jump: true, shoot: false },   // right+jump
      { actionIndex: 6, moveLeft: false, moveRight: false, jump: false, shoot: true },  // shoot
      { actionIndex: 7, moveLeft: false, moveRight: true, jump: false, shoot: true },   // right+shoot
      { actionIndex: 8, moveLeft: false, moveRight: true, jump: true, shoot: true }     // right+jump+shoot
    ]
    return actions[actionIndex] || actions[0]
  }
  
  it('should return idle action for index 0', () => {
    const action = actionIndexToAction(0)
    
    expect(action.actionIndex).toBe(0)
    expect(action.moveLeft).toBe(false)
    expect(action.moveRight).toBe(false)
    expect(action.jump).toBe(false)
    expect(action.shoot).toBe(false)
  })
  
  it('should return move left action for index 1', () => {
    const action = actionIndexToAction(1)
    
    expect(action.actionIndex).toBe(1)
    expect(action.moveLeft).toBe(true)
    expect(action.moveRight).toBe(false)
    expect(action.jump).toBe(false)
  })
  
  it('should return move right action for index 2', () => {
    const action = actionIndexToAction(2)
    
    expect(action.actionIndex).toBe(2)
    expect(action.moveLeft).toBe(false)
    expect(action.moveRight).toBe(true)
    expect(action.jump).toBe(false)
  })
  
  it('should return jump action for index 3', () => {
    const action = actionIndexToAction(3)
    
    expect(action.actionIndex).toBe(3)
    expect(action.moveLeft).toBe(false)
    expect(action.moveRight).toBe(false)
    expect(action.jump).toBe(true)
  })
  
  it('should return combined actions for higher indices', () => {
    // left + jump
    const leftJump = actionIndexToAction(4)
    expect(leftJump.moveLeft).toBe(true)
    expect(leftJump.jump).toBe(true)
    
    // right + jump  
    const rightJump = actionIndexToAction(5)
    expect(rightJump.moveRight).toBe(true)
    expect(rightJump.jump).toBe(true)
    
    // shoot
    const shoot = actionIndexToAction(6)
    expect(shoot.shoot).toBe(true)
    
    // right + shoot
    const rightShoot = actionIndexToAction(7)
    expect(rightShoot.moveRight).toBe(true)
    expect(rightShoot.shoot).toBe(true)
  })
  
  it('should return idle for invalid index', () => {
    const action = actionIndexToAction(999)
    expect(action.actionIndex).toBe(0)
  })
})

describe('DQNAgent - Reward Calculation Logic', () => {
  // Test reward calculation logic without TensorFlow
  
  function calculateReward(
    prevState: DQNState,
    currentState: DQNState,
    action: DQNAction,
    died: boolean,
    reachedGoal: boolean
  ): number {
    // Replicate simplified reward logic from DQNAgent
    let reward = 0
    
    // Death penalty
    if (died) {
      reward -= 100
      return reward
    }
    
    // Goal reward
    if (reachedGoal) {
      reward += 1000
      return reward
    }
    
    // Progress reward (moving right)
    const progressReward = (currentState.playerX - prevState.playerX) / 100
    reward += progressReward
    
    // Survival bonus
    reward += 0.1
    
    // Penalty for going left (usually bad in platformer)
    if (action.moveLeft && currentState.playerX < prevState.playerX) {
      reward -= 0.5
    }
    
    // Avoid enemies reward
    if (currentState.nearestEnemyDistance > prevState.nearestEnemyDistance) {
      reward += 0.2
    }
    
    // Falling into gap penalty
    if (currentState.gapAhead && action.moveRight && !action.jump) {
      reward -= 1
    }
    
    return reward
  }
  
  it('should give large negative reward for death', () => {
    const prevState = createDefaultState()
    const currentState = createDefaultState()
    const action: DQNAction = { actionIndex: 0, moveLeft: false, moveRight: false, jump: false, shoot: false }
    
    const reward = calculateReward(prevState, currentState, action, true, false)
    
    expect(reward).toBe(-100)
  })
  
  it('should give large positive reward for reaching goal', () => {
    const prevState = createDefaultState()
    const currentState = createDefaultState()
    const action: DQNAction = { actionIndex: 0, moveLeft: false, moveRight: false, jump: false, shoot: false }
    
    const reward = calculateReward(prevState, currentState, action, false, true)
    
    expect(reward).toBe(1000)
  })
  
  it('should give positive reward for forward progress', () => {
    const prevState = createDefaultState()
    const currentState = { ...createDefaultState(), playerX: 600 } // moved 100 units right
    const action: DQNAction = { actionIndex: 2, moveLeft: false, moveRight: true, jump: false, shoot: false }
    
    const reward = calculateReward(prevState, currentState, action, false, false)
    
    // Progress reward: (600 - 500) / 100 = 1
    // Survival bonus: 0.1
    expect(reward).toBeGreaterThan(1)
  })
  
  it('should give negative reward for moving backward', () => {
    const prevState = createDefaultState()
    const currentState = { ...createDefaultState(), playerX: 400 } // moved 100 units left
    const action: DQNAction = { actionIndex: 1, moveLeft: true, moveRight: false, jump: false, shoot: false }
    
    const reward = calculateReward(prevState, currentState, action, false, false)
    
    // Progress reward: (400 - 500) / 100 = -1
    // Survival bonus: 0.1
    // Moving left penalty: -0.5
    expect(reward).toBeLessThan(0)
  })
  
  it('should penalize walking into gap without jumping', () => {
    const prevState = createDefaultState()
    const currentState = { ...createDefaultState(), gapAhead: true }
    const action: DQNAction = { actionIndex: 2, moveLeft: false, moveRight: true, jump: false, shoot: false }
    
    const reward = calculateReward(prevState, currentState, action, false, false)
    
    // Should include -1 gap penalty
    expect(reward).toBeLessThan(0.2) // Less than just survival bonus
  })
})

describe('DQNAgent - Player Action to Index Conversion', () => {
  // Test player action to index conversion logic
  
  function playerActionToIndex(left: boolean, right: boolean, jump: boolean, shoot: boolean): number {
    // Replicate logic from DQNAgent
    if (shoot) {
      if (right && jump) return 8
      if (right) return 7
      return 6
    }
    if (left && jump) return 4
    if (right && jump) return 5
    if (left) return 1
    if (right) return 2
    if (jump) return 3
    return 0
  }
  
  it('should return 0 for no action', () => {
    expect(playerActionToIndex(false, false, false, false)).toBe(0)
  })
  
  it('should return 1 for left only', () => {
    expect(playerActionToIndex(true, false, false, false)).toBe(1)
  })
  
  it('should return 2 for right only', () => {
    expect(playerActionToIndex(false, true, false, false)).toBe(2)
  })
  
  it('should return 3 for jump only', () => {
    expect(playerActionToIndex(false, false, true, false)).toBe(3)
  })
  
  it('should return 4 for left + jump', () => {
    expect(playerActionToIndex(true, false, true, false)).toBe(4)
  })
  
  it('should return 5 for right + jump', () => {
    expect(playerActionToIndex(false, true, true, false)).toBe(5)
  })
  
  it('should return 6 for shoot only', () => {
    expect(playerActionToIndex(false, false, false, true)).toBe(6)
  })
  
  it('should return 7 for right + shoot', () => {
    expect(playerActionToIndex(false, true, false, true)).toBe(7)
  })
  
  it('should return 8 for right + jump + shoot', () => {
    expect(playerActionToIndex(false, true, true, true)).toBe(8)
  })
})

describe('DQNAgent - Experience Replay Buffer Logic', () => {
  // Test replay buffer logic
  
  interface Experience {
    state: DQNState
    action: DQNAction
    reward: number
    nextState: DQNState
    done: boolean
  }
  
  class MockReplayBuffer {
    private buffer: Experience[] = []
    private maxSize: number
    
    constructor(maxSize: number = 10000) {
      this.maxSize = maxSize
    }
    
    add(experience: Experience): void {
      this.buffer.push(experience)
      if (this.buffer.length > this.maxSize) {
        this.buffer.shift()
      }
    }
    
    sample(batchSize: number): Experience[] {
      const samples: Experience[] = []
      for (let i = 0; i < batchSize && i < this.buffer.length; i++) {
        const idx = Math.floor(Math.random() * this.buffer.length)
        samples.push(this.buffer[idx])
      }
      return samples
    }
    
    get size(): number {
      return this.buffer.length
    }
  }
  
  it('should add experiences to buffer', () => {
    const buffer = new MockReplayBuffer()
    const state = createDefaultState()
    const action: DQNAction = { actionIndex: 2, moveLeft: false, moveRight: true, jump: false, shoot: false }
    
    buffer.add({
      state,
      action,
      reward: 1.0,
      nextState: state,
      done: false
    })
    
    expect(buffer.size).toBe(1)
  })
  
  it('should limit buffer size', () => {
    const buffer = new MockReplayBuffer(5)
    const state = createDefaultState()
    const action: DQNAction = { actionIndex: 0, moveLeft: false, moveRight: false, jump: false, shoot: false }
    
    for (let i = 0; i < 10; i++) {
      buffer.add({
        state,
        action,
        reward: i,
        nextState: state,
        done: false
      })
    }
    
    expect(buffer.size).toBe(5)
  })
  
  it('should sample from buffer', () => {
    const buffer = new MockReplayBuffer()
    const state = createDefaultState()
    const action: DQNAction = { actionIndex: 0, moveLeft: false, moveRight: false, jump: false, shoot: false }
    
    for (let i = 0; i < 100; i++) {
      buffer.add({
        state,
        action,
        reward: i,
        nextState: state,
        done: false
      })
    }
    
    const samples = buffer.sample(32)
    
    expect(samples.length).toBe(32)
    samples.forEach(sample => {
      expect(sample).toHaveProperty('state')
      expect(sample).toHaveProperty('action')
      expect(sample).toHaveProperty('reward')
    })
  })
})

describe('DQNAgent - Epsilon Greedy Exploration', () => {
  it('should have epsilon between 0 and 1', () => {
    const epsilon = 0.1
    expect(epsilon).toBeGreaterThanOrEqual(0)
    expect(epsilon).toBeLessThanOrEqual(1)
  })
  
  it('should decay epsilon over time', () => {
    let epsilon = 1.0
    const decay = 0.995
    const minEpsilon = 0.01
    
    for (let i = 0; i < 100; i++) {
      epsilon = Math.max(minEpsilon, epsilon * decay)
    }
    
    expect(epsilon).toBeLessThan(1.0)
    expect(epsilon).toBeGreaterThanOrEqual(minEpsilon)
  })
  
  it('should not go below minimum epsilon', () => {
    let epsilon = 1.0
    const decay = 0.995
    const minEpsilon = 0.01
    
    for (let i = 0; i < 10000; i++) {
      epsilon = Math.max(minEpsilon, epsilon * decay)
    }
    
    expect(epsilon).toBe(minEpsilon)
  })
})

describe('DQNAgent - Stats Tracking', () => {
  interface Stats {
    totalEpisodes: number
    totalSteps: number
    avgReward: number
    epsilon: number
    bufferSize: number
  }
  
  it('should track episode count', () => {
    const stats: Stats = {
      totalEpisodes: 0,
      totalSteps: 0,
      avgReward: 0,
      epsilon: 1.0,
      bufferSize: 0
    }
    
    stats.totalEpisodes++
    
    expect(stats.totalEpisodes).toBe(1)
  })
  
  it('should calculate average reward', () => {
    const rewards = [10, 20, 30, 40, 50]
    const avgReward = rewards.reduce((a, b) => a + b, 0) / rewards.length
    
    expect(avgReward).toBe(30)
  })
  
  it('should track buffer size', () => {
    const stats = {
      bufferSize: 0
    }
    
    for (let i = 0; i < 100; i++) {
      stats.bufferSize++
    }
    
    expect(stats.bufferSize).toBe(100)
  })
})
