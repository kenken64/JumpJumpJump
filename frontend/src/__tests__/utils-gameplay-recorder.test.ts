/**
 * utils-gameplay-recorder.test.ts
 * Tests for the GameplayRecorder utility class
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GameplayRecorder, GameState, PlayerAction, GameplayFrame } from '../utils/GameplayRecorder'

// Mock Phaser globally (it's used as a global in the code)
const mockPhaser = {
  Math: {
    Distance: {
      Between: vi.fn((x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      })
    },
    Angle: {
      Between: vi.fn((x1: number, y1: number, x2: number, y2: number) => {
        return Math.atan2(y2 - y1, x2 - x1)
      })
    }
  }
};

// Set Phaser as a global
(globalThis as any).Phaser = mockPhaser

function createMockScene() {
  const mockPlayer = {
    x: 500,
    y: 400,
    body: {
      velocity: { x: 100, y: -50 },
      touching: { down: true }
    }
  }

  const mockPlatforms = {
    getChildren: vi.fn().mockReturnValue([
      {
        active: true,
        getBounds: () => ({ left: 0, right: 1000, top: 450, bottom: 500, centerX: 500, centerY: 475 })
      }
    ])
  }

  const mockEnemies = {
    getChildren: vi.fn().mockReturnValue([
      {
        active: true,
        x: 700,
        y: 400
      }
    ])
  }

  const mockCoins = {
    getChildren: vi.fn().mockReturnValue([
      {
        active: true,
        x: 600,
        y: 350
      }
    ])
  }

  const mockSpikes = {
    getChildren: vi.fn().mockReturnValue([
      {
        active: true,
        x: 800,
        y: 400
      }
    ])
  }

  return {
    player: mockPlayer,
    platforms: mockPlatforms,
    enemies: mockEnemies,
    coins: mockCoins,
    spikes: mockSpikes,
    playerHealth: 100,
    score: 500,
    coinCount: 10
  }
}

describe('GameplayRecorder', () => {
  let scene: ReturnType<typeof createMockScene>
  let recorder: GameplayRecorder

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    scene = createMockScene()
    recorder = new GameplayRecorder(scene as any)
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('constructor', () => {
    it('should create a GameplayRecorder instance', () => {
      expect(recorder).toBeDefined()
    })

    it('should start not recording', () => {
      expect(recorder.isCurrentlyRecording()).toBe(false)
    })

    it('should start with zero frames', () => {
      expect(recorder.getCurrentFrameCount()).toBe(0)
    })
  })

  describe('startRecording()', () => {
    it('should start recording', () => {
      recorder.startRecording()
      
      expect(recorder.isCurrentlyRecording()).toBe(true)
    })

    it('should reset frames on start', () => {
      // Record some frames first
      recorder.startRecording()
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.recordFrame(200, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      
      // Restart recording
      recorder.startRecording()
      
      expect(recorder.getCurrentFrameCount()).toBe(0)
    })
  })

  describe('stopRecording()', () => {
    it('should stop recording', () => {
      recorder.startRecording()
      recorder.stopRecording()
      
      expect(recorder.isCurrentlyRecording()).toBe(false)
    })

    it('should save recording to localStorage', () => {
      recorder.startRecording()
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.recordFrame(200, { moveLeft: false, moveRight: true, jump: true, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      const savedData = localStorage.getItem('ml_training_data')
      expect(savedData).not.toBeNull()
    })
  })

  describe('recordFrame()', () => {
    it('should record frames when recording', () => {
      recorder.startRecording()
      
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 100,
        aimY: 200
      }
      
      recorder.recordFrame(100, action)
      
      expect(recorder.getCurrentFrameCount()).toBe(1)
    })

    it('should not record when not recording', () => {
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
      
      recorder.recordFrame(100, action)
      
      expect(recorder.getCurrentFrameCount()).toBe(0)
    })

    it('should respect record interval', () => {
      recorder.startRecording()
      
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
      
      // First frame at 100ms (meets minimum interval from lastRecordTime=0)
      recorder.recordFrame(100, action)
      recorder.recordFrame(150, action) // Too soon (only 50ms since last), should be skipped
      recorder.recordFrame(210, action) // After interval (110ms since last), should record
      
      expect(recorder.getCurrentFrameCount()).toBe(2)
    })

    it('should handle missing player gracefully', () => {
      scene.player = null
      recorder.startRecording()
      
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
      
      recorder.recordFrame(100, action)
      
      expect(recorder.getCurrentFrameCount()).toBe(0)
    })

    it('should handle missing player body gracefully', () => {
      scene.player = { x: 500, y: 400, body: null }
      recorder.startRecording()
      
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
      
      recorder.recordFrame(100, action)
      
      expect(recorder.getCurrentFrameCount()).toBe(0)
    })
  })

  describe('isCurrentlyRecording()', () => {
    it('should return false initially', () => {
      expect(recorder.isCurrentlyRecording()).toBe(false)
    })

    it('should return true after starting', () => {
      recorder.startRecording()
      expect(recorder.isCurrentlyRecording()).toBe(true)
    })

    it('should return false after stopping', () => {
      recorder.startRecording()
      recorder.stopRecording()
      expect(recorder.isCurrentlyRecording()).toBe(false)
    })
  })

  describe('getCurrentFrameCount()', () => {
    it('should return 0 initially', () => {
      expect(recorder.getCurrentFrameCount()).toBe(0)
    })

    it('should return correct count after recording', () => {
      recorder.startRecording()
      
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
      
      recorder.recordFrame(100, action)
      recorder.recordFrame(200, action)
      recorder.recordFrame(300, action)
      
      expect(recorder.getCurrentFrameCount()).toBe(3)
    })
  })

  describe('captureGameState (tested via recordFrame)', () => {
    it('should capture player position', () => {
      recorder.startRecording()
      
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
      
      recorder.recordFrame(100, action)
      recorder.stopRecording()
      
      const savedData = JSON.parse(localStorage.getItem('ml_training_data') || '[]')
      expect(savedData.length).toBeGreaterThan(0)
      expect(savedData[0].state.playerX).toBeCloseTo(0.5, 1) // Normalized: 500/1000
      expect(savedData[0].state.playerY).toBeCloseTo(0.4, 1) // Normalized: 400/1000
    })

    it('should capture velocity', () => {
      recorder.startRecording()
      
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }
      
      recorder.recordFrame(100, action)
      recorder.stopRecording()
      
      const savedData = JSON.parse(localStorage.getItem('ml_training_data') || '[]')
      expect(savedData[0].state.velocityX).toBeCloseTo(0.5, 1) // Normalized: 100/200
      expect(savedData[0].state.velocityY).toBeCloseTo(-0.1, 1) // Normalized: -50/500
    })

    it('should capture onGround state', () => {
      recorder.startRecording()
      
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      const savedData = JSON.parse(localStorage.getItem('ml_training_data') || '[]')
      expect(savedData[0].state.onGround).toBe(true)
    })

    it('should handle missing enemies', () => {
      scene.enemies = null
      recorder.startRecording()
      
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      const savedData = JSON.parse(localStorage.getItem('ml_training_data') || '[]')
      expect(savedData[0].state.nearestEnemyDistance).toBe(1) // Default max normalized
    })

    it('should handle missing coins', () => {
      scene.coins = null
      recorder.startRecording()
      
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      const savedData = JSON.parse(localStorage.getItem('ml_training_data') || '[]')
      expect(savedData[0].state.nearestCoinDistance).toBe(1) // Default max normalized
    })

    it('should handle missing spikes', () => {
      scene.spikes = null
      recorder.startRecording()
      
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      const savedData = JSON.parse(localStorage.getItem('ml_training_data') || '[]')
      expect(savedData[0].state.nearestSpikeDistance).toBe(1) // Default max normalized
    })

    it('should handle missing platforms', () => {
      scene.platforms = null
      recorder.startRecording()
      
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      const savedData = JSON.parse(localStorage.getItem('ml_training_data') || '[]')
      expect(savedData[0].state.hasGroundAhead).toBe(false)
      expect(savedData[0].state.hasGroundBehind).toBe(false)
    })
  })

  describe('static methods', () => {
    describe('getTrainingData()', () => {
      it('should return empty array when no data', () => {
        const data = GameplayRecorder.getTrainingData()
        expect(data).toEqual([])
      })

      it('should return saved training data', () => {
        const testData: GameplayFrame[] = [
          {
            state: {} as GameState,
            action: { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 },
            timestamp: 100
          }
        ]
        localStorage.setItem('ml_training_data', JSON.stringify(testData))
        
        const data = GameplayRecorder.getTrainingData()
        expect(data.length).toBe(1)
      })

      it('should handle corrupted data gracefully', () => {
        localStorage.setItem('ml_training_data', 'invalid json{{{')
        
        const data = GameplayRecorder.getTrainingData()
        expect(data).toEqual([])
      })
    })

    describe('clearTrainingData()', () => {
      it('should clear training data from localStorage', () => {
        localStorage.setItem('ml_training_data', JSON.stringify([{ test: true }]))
        
        GameplayRecorder.clearTrainingData()
        
        expect(localStorage.getItem('ml_training_data')).toBeNull()
      })
    })

    describe('getTrainingDataCount()', () => {
      it('should return 0 when no data', () => {
        expect(GameplayRecorder.getTrainingDataCount()).toBe(0)
      })

      it('should return correct count', () => {
        const testData: GameplayFrame[] = [
          { state: {} as GameState, action: {} as PlayerAction, timestamp: 100 },
          { state: {} as GameState, action: {} as PlayerAction, timestamp: 200 },
          { state: {} as GameState, action: {} as PlayerAction, timestamp: 300 }
        ]
        localStorage.setItem('ml_training_data', JSON.stringify(testData))
        
        expect(GameplayRecorder.getTrainingDataCount()).toBe(3)
      })
    })
  })

  describe('data persistence', () => {
    it('should accumulate frames across multiple recordings', () => {
      // First recording
      recorder.startRecording()
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      // Second recording
      const recorder2 = new GameplayRecorder(scene as any)
      recorder2.startRecording()
      recorder2.recordFrame(200, { moveLeft: true, moveRight: false, jump: true, shoot: false, aimX: 0, aimY: 0 })
      recorder2.stopRecording()
      
      const data = GameplayRecorder.getTrainingData()
      expect(data.length).toBe(2)
    })

    it('should limit total frames to 10000', () => {
      // Pre-populate with 9999 frames
      const existingFrames = Array(9999).fill({ state: {}, action: {}, timestamp: 0 })
      localStorage.setItem('ml_training_data', JSON.stringify(existingFrames))
      
      // Record 5 more frames
      recorder.startRecording()
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.recordFrame(200, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.recordFrame(300, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.recordFrame(400, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.recordFrame(500, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      const data = GameplayRecorder.getTrainingData()
      expect(data.length).toBeLessThanOrEqual(10000)
    })
  })

  describe('interface validation', () => {
    it('should have correct GameState structure', () => {
      recorder.startRecording()
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorder.stopRecording()
      
      const data = GameplayRecorder.getTrainingData()
      const state = data[0].state
      
      expect('playerX' in state).toBe(true)
      expect('playerY' in state).toBe(true)
      expect('velocityX' in state).toBe(true)
      expect('velocityY' in state).toBe(true)
      expect('health' in state).toBe(true)
      expect('onGround' in state).toBe(true)
      expect('nearestEnemyDistance' in state).toBe(true)
      expect('nearestEnemyAngle' in state).toBe(true)
      expect('nearestCoinDistance' in state).toBe(true)
      expect('nearestCoinAngle' in state).toBe(true)
      expect('nearestSpikeDistance' in state).toBe(true)
      expect('hasGroundAhead' in state).toBe(true)
      expect('hasGroundBehind' in state).toBe(true)
      expect('platformAbove' in state).toBe(true)
      expect('platformAboveHeight' in state).toBe(true)
      expect('score' in state).toBe(true)
      expect('coins' in state).toBe(true)
    })
  })

  describe('inactive platform handling', () => {
    it('should skip inactive platforms in hasGroundAhead check', () => {
      const sceneWithInactivePlatforms = createMockScene()
      sceneWithInactivePlatforms.platforms.getChildren = vi.fn().mockReturnValue([
        { active: false, getBounds: () => ({ left: 0, right: 1000, top: 450, bottom: 500, centerX: 500, centerY: 475 }) },
        { active: true, getBounds: () => ({ left: 550, right: 600, top: 450, bottom: 500, centerX: 575, centerY: 475 }) }
      ])
      
      const recorderWithInactive = new GameplayRecorder(sceneWithInactivePlatforms as any)
      recorderWithInactive.startRecording()
      recorderWithInactive.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorderWithInactive.stopRecording()
      
      const data = GameplayRecorder.getTrainingData()
      expect(data.length).toBeGreaterThan(0)
    })
    
    it('should skip inactive platforms in checkPlatformAbove', () => {
      const sceneWithInactivePlatforms = createMockScene()
      sceneWithInactivePlatforms.platforms.getChildren = vi.fn().mockReturnValue([
        { active: false, getBounds: () => ({ left: 400, right: 600, top: 200, bottom: 250, centerX: 500, centerY: 225, bottom: 250 }) },
        { active: true, getBounds: () => ({ left: 400, right: 600, top: 300, bottom: 350, centerX: 500, centerY: 325, bottom: 350 }) }
      ])
      
      const recorderWithInactive = new GameplayRecorder(sceneWithInactivePlatforms as any)
      recorderWithInactive.startRecording()
      recorderWithInactive.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorderWithInactive.stopRecording()
      
      const data = GameplayRecorder.getTrainingData()
      expect(data.length).toBeGreaterThan(0)
    })

    it('should find nearest platform above among multiple', () => {
      const sceneWithMultiplePlatforms = createMockScene()
      sceneWithMultiplePlatforms.player.y = 500 // Player at y=500
      sceneWithMultiplePlatforms.platforms.getChildren = vi.fn().mockReturnValue([
        { active: true, getBounds: () => ({ left: 400, right: 600, top: 100, bottom: 150, centerX: 500 }) }, // Far above (y diff = 350)
        { active: true, getBounds: () => ({ left: 400, right: 600, top: 350, bottom: 400, centerX: 500 }) }  // Closer above (y diff = 100)
      ])
      
      const recorderWithMultiple = new GameplayRecorder(sceneWithMultiplePlatforms as any)
      recorderWithMultiple.startRecording()
      recorderWithMultiple.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      recorderWithMultiple.stopRecording()
      
      const data = GameplayRecorder.getTrainingData()
      // Should pick the closer platform
      expect(data.length).toBeGreaterThan(0)
      expect(data[0].state.platformAbove).toBeDefined()
    })
  })

  describe('invalid localStorage data handling', () => {
    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('ml_training_data', 'not valid json {{{')
      
      recorder.startRecording()
      recorder.recordFrame(100, { moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0 })
      
      // Should not throw
      expect(() => recorder.stopRecording()).not.toThrow()
    })
  })
})
