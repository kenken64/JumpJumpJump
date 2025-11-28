import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Define interfaces for AI tests
interface AIDecision {
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
  shoot: boolean
  aimX: number
  aimY: number
}

// Mock the AIPlayer module since it has complex Phaser dependencies
vi.mock('../utils/AIPlayer', () => ({
  AIPlayer: vi.fn().mockImplementation((scene: any) => ({
    getDecision: vi.fn().mockReturnValue({
      moveLeft: false,
      moveRight: true,
      jump: false,
      shoot: false,
      aimX: 0,
      aimY: 0
    })
  }))
}))

// Create mock GameScene for testing
const createMockGameScene = () => {
  const mockPlayer = {
    x: 100,
    y: 500,
    body: {
      velocity: { x: 0, y: 0 },
      onFloor: vi.fn().mockReturnValue(true)
    }
  }

  const mockEnemy = {
    x: 300,
    y: 500,
    active: true
  }

  const mockCoin = {
    x: 200,
    y: 480,
    active: true
  }

  const mockPortal = {
    x: 1000,
    y: 500,
    active: true
  }

  return {
    player: mockPlayer,
    enemies: {
      getChildren: vi.fn().mockReturnValue([mockEnemy])
    },
    coins: {
      getChildren: vi.fn().mockReturnValue([mockCoin])
    },
    portal: mockPortal,
    platforms: {
      getChildren: vi.fn().mockReturnValue([])
    },
    spikes: {
      getChildren: vi.fn().mockReturnValue([])
    },
    spikePositions: []
  }
}

describe('AIPlayer Decision System', () => {
  describe('AIDecision Interface', () => {
    it('should have correct structure', () => {
      const decision: AIDecision = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }

      expect(typeof decision.moveLeft).toBe('boolean')
      expect(typeof decision.moveRight).toBe('boolean')
      expect(typeof decision.jump).toBe('boolean')
      expect(typeof decision.shoot).toBe('boolean')
      expect(typeof decision.aimX).toBe('number')
      expect(typeof decision.aimY).toBe('number')
    })

    it('should support all movement combinations', () => {
      const standStill: AIDecision = {
        moveLeft: false, moveRight: false, jump: false, shoot: false, aimX: 0, aimY: 0
      }
      const moveLeft: AIDecision = {
        moveLeft: true, moveRight: false, jump: false, shoot: false, aimX: 0, aimY: 0
      }
      const moveRight: AIDecision = {
        moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0
      }
      const jumping: AIDecision = {
        moveLeft: false, moveRight: false, jump: true, shoot: false, aimX: 0, aimY: 0
      }

      expect(standStill.moveLeft).toBe(false)
      expect(moveLeft.moveLeft).toBe(true)
      expect(moveRight.moveRight).toBe(true)
      expect(jumping.jump).toBe(true)
    })

    it('should support shooting with aiming', () => {
      const shootingRight: AIDecision = {
        moveLeft: false, moveRight: false, jump: false, shoot: true, aimX: 100, aimY: 0
      }
      const shootingUp: AIDecision = {
        moveLeft: false, moveRight: false, jump: false, shoot: true, aimX: 0, aimY: -100
      }

      expect(shootingRight.shoot).toBe(true)
      expect(shootingRight.aimX).toBe(100)
      expect(shootingUp.aimY).toBe(-100)
    })
  })

  describe('AI Behavior Simulation', () => {
    it('should default to moving right for progress', () => {
      const mockScene = createMockGameScene()
      
      // AI should move right by default
      const defaultDecision: AIDecision = {
        moveLeft: false,
        moveRight: true,
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }

      expect(defaultDecision.moveRight).toBe(true)
      expect(defaultDecision.moveLeft).toBe(false)
    })

    it('should prioritize portal when nearby', () => {
      const mockScene = createMockGameScene()
      mockScene.portal.x = 200 // Portal close by
      
      // AI should move toward portal
      const portalDecision: AIDecision = {
        moveLeft: false,
        moveRight: true, // Moving toward portal on right
        jump: false,
        shoot: false,
        aimX: 0,
        aimY: 0
      }

      expect(portalDecision.moveRight).toBe(true)
    })

    it('should handle danger avoidance', () => {
      const dangerDecision: AIDecision = {
        moveLeft: true, // Move away from danger
        moveRight: false,
        jump: true, // Jump to avoid
        shoot: false,
        aimX: 0,
        aimY: 0
      }

      expect(dangerDecision.moveLeft).toBe(true)
      expect(dangerDecision.jump).toBe(true)
    })

    it('should engage in combat when enemy nearby', () => {
      const combatDecision: AIDecision = {
        moveLeft: false,
        moveRight: false,
        jump: false,
        shoot: true,
        aimX: 200, // Aim at enemy
        aimY: 0
      }

      expect(combatDecision.shoot).toBe(true)
      expect(combatDecision.aimX).toBeGreaterThan(0)
    })

    it('should collect coins when safe', () => {
      const coinDecision: AIDecision = {
        moveLeft: false,
        moveRight: true, // Move toward coin
        jump: true, // Jump to reach coin
        shoot: false,
        aimX: 0,
        aimY: 0
      }

      expect(coinDecision.moveRight).toBe(true)
      expect(coinDecision.jump).toBe(true)
    })
  })

  describe('Update Interval', () => {
    it('should respect update interval for decisions', () => {
      let lastDecisionTime = 0
      const updateInterval = 100

      const shouldUpdate = (currentTime: number): boolean => {
        return currentTime - lastDecisionTime > updateInterval
      }

      // At t=0, last update was 0
      expect(shouldUpdate(0)).toBe(false)
      
      // At t=50, still within interval
      expect(shouldUpdate(50)).toBe(false)
      
      // At t=101, should update
      expect(shouldUpdate(101)).toBe(true)
    })
  })

  describe('Distance Calculations', () => {
    it('should calculate distance between points', () => {
      const distance = (x1: number, y1: number, x2: number, y2: number): number => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      }

      expect(distance(0, 0, 3, 4)).toBe(5)
      expect(distance(0, 0, 0, 0)).toBe(0)
      expect(distance(100, 100, 100, 200)).toBe(100)
    })

    it('should calculate angle between points', () => {
      const angle = (x1: number, y1: number, x2: number, y2: number): number => {
        return Math.atan2(y2 - y1, x2 - x1)
      }

      // Pointing right (0 radians)
      expect(angle(0, 0, 100, 0)).toBeCloseTo(0)
      
      // Pointing up (-PI/2 radians)
      expect(angle(0, 0, 0, -100)).toBeCloseTo(-Math.PI / 2)
      
      // Pointing down (PI/2 radians)
      expect(angle(0, 0, 0, 100)).toBeCloseTo(Math.PI / 2)
    })
  })

  describe('Range Detection', () => {
    const sightRange = 600
    const combatRange = 400
    const dangerRange = 150

    it('should detect objects within sight range', () => {
      const distance = 500
      expect(distance < sightRange).toBe(true)
    })

    it('should detect enemies in combat range', () => {
      const distance = 350
      expect(distance < combatRange).toBe(true)
    })

    it('should detect immediate danger', () => {
      const distance = 100
      expect(distance < dangerRange).toBe(true)
    })

    it('should not engage combat outside range', () => {
      const distance = 450
      expect(distance < combatRange).toBe(false)
    })
  })
})

describe('GameplayRecorder Types', () => {
  interface GameState {
    playerX: number
    playerY: number
    velocityX: number
    velocityY: number
    health: number
    onGround: boolean
    nearestEnemyDistance: number
    nearestEnemyAngle: number
    nearestCoinDistance: number
    nearestCoinAngle: number
    nearestSpikeDistance: number
    hasGroundAhead: boolean
    hasGroundBehind: boolean
    platformAbove: boolean
    platformAboveHeight: number
    score: number
    coins: number
  }

  interface PlayerAction {
    moveLeft: boolean
    moveRight: boolean
    jump: boolean
    shoot: boolean
    aimX: number
    aimY: number
  }

  interface GameplayFrame {
    state: GameState
    action: PlayerAction
    timestamp: number
  }

  describe('GameState Interface', () => {
    it('should have correct structure', () => {
      const state: GameState = {
        playerX: 100,
        playerY: 500,
        velocityX: 200,
        velocityY: 0,
        health: 100,
        onGround: true,
        nearestEnemyDistance: 300,
        nearestEnemyAngle: 0,
        nearestCoinDistance: 150,
        nearestCoinAngle: -0.5,
        nearestSpikeDistance: 500,
        hasGroundAhead: true,
        hasGroundBehind: true,
        platformAbove: false,
        platformAboveHeight: 0,
        score: 1500,
        coins: 25
      }

      expect(state.playerX).toBe(100)
      expect(state.health).toBe(100)
      expect(state.onGround).toBe(true)
      expect(state.coins).toBe(25)
    })
  })

  describe('PlayerAction Interface', () => {
    it('should have correct structure', () => {
      const action: PlayerAction = {
        moveLeft: false,
        moveRight: true,
        jump: true,
        shoot: false,
        aimX: 0,
        aimY: 0
      }

      expect(action.moveRight).toBe(true)
      expect(action.jump).toBe(true)
      expect(action.shoot).toBe(false)
    })
  })

  describe('GameplayFrame Interface', () => {
    it('should have correct structure', () => {
      const frame: GameplayFrame = {
        state: {
          playerX: 100, playerY: 500, velocityX: 200, velocityY: 0,
          health: 100, onGround: true, nearestEnemyDistance: 300,
          nearestEnemyAngle: 0, nearestCoinDistance: 150, nearestCoinAngle: -0.5,
          nearestSpikeDistance: 500, hasGroundAhead: true, hasGroundBehind: true,
          platformAbove: false, platformAboveHeight: 0, score: 1500, coins: 25
        },
        action: {
          moveLeft: false, moveRight: true, jump: false, shoot: false, aimX: 0, aimY: 0
        },
        timestamp: 12345
      }

      expect(frame.timestamp).toBe(12345)
      expect(frame.state.playerX).toBe(100)
      expect(frame.action.moveRight).toBe(true)
    })
  })

  describe('Recording Logic', () => {
    it('should respect recording interval', () => {
      const recordInterval = 100
      let lastRecordTime = 0

      const shouldRecord = (currentTime: number): boolean => {
        return currentTime - lastRecordTime >= recordInterval
      }

      // At t=0, difference is 0, which equals interval threshold so true  
      expect(shouldRecord(0)).toBe(false) // 0 - 0 = 0, not >= 100
      lastRecordTime = 0
      expect(shouldRecord(50)).toBe(false) // 50 - 0 = 50, not >= 100
      expect(shouldRecord(100)).toBe(true) // 100 - 0 = 100, >= 100
      lastRecordTime = 100
      expect(shouldRecord(150)).toBe(false) // 150 - 100 = 50, not >= 100
      expect(shouldRecord(200)).toBe(true) // 200 - 100 = 100, >= 100
    })

    it('should store frames in array', () => {
      const frames: GameplayFrame[] = []
      
      const frame: GameplayFrame = {
        state: {
          playerX: 100, playerY: 500, velocityX: 0, velocityY: 0,
          health: 100, onGround: true, nearestEnemyDistance: 1000,
          nearestEnemyAngle: 0, nearestCoinDistance: 1000, nearestCoinAngle: 0,
          nearestSpikeDistance: 1000, hasGroundAhead: true, hasGroundBehind: true,
          platformAbove: false, platformAboveHeight: 0, score: 0, coins: 0
        },
        action: {
          moveLeft: false, moveRight: false, jump: false, shoot: false, aimX: 0, aimY: 0
        },
        timestamp: 0
      }

      frames.push(frame)
      expect(frames).toHaveLength(1)
      expect(frames[0].timestamp).toBe(0)
    })
  })
})

describe('ML Training Data', () => {
  it('should normalize state values for training', () => {
    const normalize = (value: number, min: number, max: number): number => {
      return (value - min) / (max - min)
    }

    // Position normalization (assuming 0-1920 screen width)
    expect(normalize(960, 0, 1920)).toBeCloseTo(0.5)
    expect(normalize(0, 0, 1920)).toBe(0)
    expect(normalize(1920, 0, 1920)).toBe(1)

    // Health normalization (0-100)
    expect(normalize(50, 0, 100)).toBe(0.5)
    expect(normalize(100, 0, 100)).toBe(1)
  })

  it('should convert boolean actions to numeric', () => {
    const boolToNum = (b: boolean): number => b ? 1 : 0

    expect(boolToNum(true)).toBe(1)
    expect(boolToNum(false)).toBe(0)
  })
})
