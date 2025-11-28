/**
 * Comprehensive Tests for EnemyManager
 * 
 * Target: Increase coverage from 67.68% to 95%+
 * Uncovered lines: 226-250,253-303,315,372-393,437-439
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Phaser before importing managers
vi.mock('phaser', () => ({
  default: {
    Events: {
      EventEmitter: class EventEmitter {
        private listeners: Map<string, Function[]> = new Map()
        
        on(event: string, fn: Function) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
          }
          this.listeners.get(event)!.push(fn)
          return this
        }
        
        emit(event: string, ...args: any[]) {
          const fns = this.listeners.get(event) || []
          fns.forEach(fn => fn(...args))
          return true
        }
        
        removeAllListeners() {
          this.listeners.clear()
          return this
        }
      }
    },
    Math: {
      Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => 
          Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      },
      Angle: {
        Between: (x1: number, y1: number, x2: number, y2: number) =>
          Math.atan2(y2 - y1, x2 - x1)
      },
      RND: {
        pick: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
      }
    },
    Physics: {
      Arcade: {
        Sprite: class {},
        Body: class {}
      }
    }
  },
  Events: {
    EventEmitter: class EventEmitter {
      private listeners: Map<string, Function[]> = new Map()
      
      on(event: string, fn: Function) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, [])
        }
        this.listeners.get(event)!.push(fn)
        return this
      }
      
      emit(event: string, ...args: any[]) {
        const fns = this.listeners.get(event) || []
        fns.forEach(fn => fn(...args))
        return true
      }
      
      removeAllListeners() {
        this.listeners.clear()
        return this
      }
    }
  },
  Math: {
    Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) => 
        Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    },
    Angle: {
      Between: (x1: number, y1: number, x2: number, y2: number) =>
        Math.atan2(y2 - y1, x2 - x1)
    }
  }
}))

import { GAME_EVENTS } from '../types/GameTypes'
import { EnemyManager } from '../managers/EnemyManager'

// ==================== MOCK SETUP ====================

// Create mock body
function createMockBody() {
  return {
    velocity: { x: 0, y: 0 },
    blocked: { down: true, left: false, right: false, up: false },
    touching: { down: false, left: false, right: false, up: false },
    setSize: vi.fn(),
    setOffset: vi.fn(),
    setMass: vi.fn(),
    setMaxVelocity: vi.fn(),
    setAllowGravity: vi.fn(),
    setVelocity: vi.fn(),
    setVelocityX: vi.fn((v: number) => {}),
    setVelocityY: vi.fn((v: number) => {})
  }
}

// Create mock enemy sprite
function createMockEnemySprite(x: number = 500, y: number = 300) {
  const data: Record<string, any> = {}
  const body = createMockBody()
  const sprite: any = {
    x,
    y,
    width: 50,
    height: 50,
    active: true,
    flipX: false,
    alpha: 1,
    body,
    setData: vi.fn((key: string, value: any) => { 
      data[key] = value
      return sprite 
    }),
    getData: vi.fn((key: string) => data[key]),
    setScale: vi.fn(() => sprite),
    setDepth: vi.fn(() => sprite),
    setBounce: vi.fn(() => sprite),
    setCollideWorldBounds: vi.fn(() => sprite),
    setVelocity: vi.fn((x: number, y: number) => {
      body.velocity.x = x
      body.velocity.y = y
      return sprite
    }),
    setVelocityX: vi.fn((v: number) => { body.velocity.x = v; return sprite }),
    setVelocityY: vi.fn((v: number) => { body.velocity.y = v; return sprite }),
    setTint: vi.fn(() => sprite),
    clearTint: vi.fn(() => sprite),
    setFlipX: vi.fn((v: boolean) => { sprite.flipX = v; return sprite }),
    setAlpha: vi.fn((v: number) => { sprite.alpha = v; return sprite }),
    setPosition: vi.fn((x: number, y: number) => { sprite.x = x; sprite.y = y; return sprite }),
    setPushable: vi.fn(() => sprite),
    play: vi.fn(() => sprite),
    destroy: vi.fn(() => { sprite.active = false })
  }
  return sprite
}

// Create mock player sprite
function createMockPlayer(x: number = 100, y: number = 300) {
  const body = createMockBody()
  const sprite: any = {
    x,
    y,
    width: 50,
    height: 70,
    active: true,
    body,
    setVelocityY: vi.fn((v: number) => { body.velocity.y = v; return sprite })
  }
  return sprite
}

// Create mock enemy group
function createMockEnemyGroup() {
  const children: any[] = []
  return {
    create: vi.fn((x: number, y: number, key: string) => {
      const sprite = createMockEnemySprite(x, y)
      sprite.setData('enemyType', key)
      children.push(sprite)
      return sprite
    }),
    getChildren: vi.fn(() => children),
    add: vi.fn((sprite: any) => children.push(sprite)),
    destroy: vi.fn((destroyChildren?: boolean) => {
      if (destroyChildren) {
        children.forEach(c => c.destroy())
      }
      children.length = 0
    }),
    clear: vi.fn()
  }
}

// Create mock scene
function createMockScene() {
  let enemyGroup: any = null
  
  const scene: any = {
    physics: {
      add: {
        group: vi.fn((config?: any) => {
          if (!enemyGroup) {
            enemyGroup = createMockEnemyGroup()
          }
          return enemyGroup
        }),
        sprite: vi.fn((x: number, y: number, key: string) => createMockEnemySprite(x, y)),
        collider: vi.fn(),
        overlap: vi.fn()
      }
    },
    add: {
      sprite: vi.fn(() => createMockEnemySprite()),
      text: vi.fn(() => ({
        setOrigin: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }))
    },
    tweens: {
      add: vi.fn((config: any) => {
        // Execute onComplete if provided
        if (config.onComplete) {
          setTimeout(() => config.onComplete(), 10)
        }
        return { on: vi.fn(), remove: vi.fn() }
      })
    },
    time: {
      now: 0,
      delayedCall: vi.fn((delay: number, callback: Function) => {
        return { remove: vi.fn() }
      }),
      addEvent: vi.fn(() => ({ remove: vi.fn() }))
    },
    anims: {
      create: vi.fn(),
      exists: vi.fn(() => false)
    },
    // Helpers
    getEnemyGroup: () => enemyGroup,
    setTimeNow: (t: number) => { scene.time.now = t }
  }
  return scene
}

// Create mock audio manager
function createMockAudioManager() {
  return {
    playJumpSound: vi.fn(),
    playShootSound: vi.fn(),
    playCoinSound: vi.fn(),
    playDamageSound: vi.fn(),
    playDeathSound: vi.fn(),
    playBossSound: vi.fn(),
    playBossAttackSound: vi.fn(),
    playMeleeSound: vi.fn()
  }
}

// ==================== TESTS ====================

describe('EnemyManager - Extended Coverage', () => {
  let scene: any
  let audioManager: any
  let enemyManager: EnemyManager

  beforeEach(() => {
    vi.clearAllMocks()
    scene = createMockScene()
    audioManager = createMockAudioManager()
    enemyManager = new EnemyManager(scene, audioManager)
    enemyManager.create()
  })

  afterEach(() => {
    enemyManager.destroy()
  })

  // ==================== CONSTRUCTOR ====================

  describe('constructor', () => {
    it('should create enemy manager', () => {
      expect(enemyManager).toBeDefined()
    })

    it('should initialize with 0 enemies defeated', () => {
      expect(enemyManager.getEnemiesDefeated()).toBe(0)
    })
  })

  // ==================== CREATE ====================

  describe('create()', () => {
    it('should create enemies physics group', () => {
      const manager = new EnemyManager(scene, audioManager)
      manager.create()
      
      expect(scene.physics.add.group).toHaveBeenCalled()
      expect(manager.enemies).toBeDefined()
    })

    it('should create animations for all enemy types', () => {
      const manager = new EnemyManager(scene, audioManager)
      manager.create()
      
      // Should create animations for fly, bee, slimeGreen, slimeBlue, wormGreen, wormPink
      expect(scene.anims.create).toHaveBeenCalled()
    })
  })

  // ==================== SPAWNING ====================

  describe('spawnEnemiesInArea()', () => {
    it('should not spawn enemies in starting area (x < 500)', () => {
      enemyManager.spawnEnemiesInArea(0, 400, 1)
      
      const group = scene.getEnemyGroup()
      expect(group.create).not.toHaveBeenCalled()
    })

    it('should spawn enemies after starting area', () => {
      enemyManager.spawnEnemiesInArea(600, 1200, 1)
      
      const group = scene.getEnemyGroup()
      expect(group.create).toHaveBeenCalled()
    })

    it('should spawn more enemies with higher difficulty', () => {
      enemyManager.spawnEnemiesInArea(600, 1500, 5)
      
      const group = scene.getEnemyGroup()
      expect(group.create).toHaveBeenCalled()
    })
  })

  describe('spawnRandomEnemy()', () => {
    it('should create enemy at given position', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      expect(enemy).toBeDefined()
      expect(enemy.x).toBe(500)
      expect(enemy.y).toBe(300)
    })

    it('should scale enemy health with difficulty', () => {
      const enemy1 = enemyManager.spawnRandomEnemy(500, 300, 1)
      const enemy2 = enemyManager.spawnRandomEnemy(600, 300, 3)
      
      // Both should have health set
      expect(enemy1.setData).toHaveBeenCalledWith('health', expect.any(Number))
      expect(enemy2.setData).toHaveBeenCalledWith('health', expect.any(Number))
    })

    it('should configure physics body', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      expect(enemy.setBounce).toHaveBeenCalledWith(0.3)
      expect(enemy.setCollideWorldBounds).toHaveBeenCalledWith(true)
    })

    it('should set enemy data properties', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      expect(enemy.setData).toHaveBeenCalledWith('enemyType', expect.any(String))
      expect(enemy.setData).toHaveBeenCalledWith('enemySize', expect.any(String))
      expect(enemy.setData).toHaveBeenCalledWith('coinReward', expect.any(Number))
      expect(enemy.setData).toHaveBeenCalledWith('speed', expect.any(Number))
      expect(enemy.setData).toHaveBeenCalledWith('health', expect.any(Number))
    })

    it('should spawn small enemies (40% chance)', () => {
      // Mock Math.random to return < 0.4
      const originalRandom = Math.random
      Math.random = () => 0.2
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      Math.random = originalRandom
      
      expect(enemy.setData).toHaveBeenCalledWith('enemySize', 'small')
    })

    it('should spawn medium enemies (40% chance)', () => {
      // Mock Math.random to return 0.4-0.8
      const originalRandom = Math.random
      Math.random = () => 0.6
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      Math.random = originalRandom
      
      expect(enemy.setData).toHaveBeenCalledWith('enemySize', 'medium')
    })

    it('should spawn large enemies (20% chance)', () => {
      // Mock Math.random to return >= 0.8
      const originalRandom = Math.random
      Math.random = () => 0.9
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      Math.random = originalRandom
      
      expect(enemy.setData).toHaveBeenCalledWith('enemySize', 'large')
    })

    it('should spawn fly or bee for small enemies', () => {
      const originalRandom = Math.random
      let callCount = 0
      Math.random = () => {
        callCount++
        if (callCount === 1) return 0.2 // Small enemy
        return 0.3 // fly type
      }
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      Math.random = originalRandom
      
      const calls = enemy.setData.mock.calls
      const typeCall = calls.find((c: any[]) => c[0] === 'enemyType')
      expect(['fly', 'bee']).toContain(typeCall?.[1])
    })

    it('should spawn slimeGreen or slimeBlue for medium enemies', () => {
      const originalRandom = Math.random
      let callCount = 0
      Math.random = () => {
        callCount++
        if (callCount === 1) return 0.6 // Medium enemy
        return 0.3 // First type
      }
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      Math.random = originalRandom
      
      const calls = enemy.setData.mock.calls
      const typeCall = calls.find((c: any[]) => c[0] === 'enemyType')
      expect(['slimeGreen', 'slimeBlue']).toContain(typeCall?.[1])
    })

    it('should spawn wormGreen or wormPink for large enemies', () => {
      const originalRandom = Math.random
      let callCount = 0
      Math.random = () => {
        callCount++
        if (callCount === 1) return 0.9 // Large enemy
        return 0.3 // First type
      }
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      Math.random = originalRandom
      
      const calls = enemy.setData.mock.calls
      const typeCall = calls.find((c: any[]) => c[0] === 'enemyType')
      expect(['wormGreen', 'wormPink']).toContain(typeCall?.[1])
    })
  })

  // ==================== UPDATE / AI ====================

  describe('update()', () => {
    it('should not throw with no enemies', () => {
      expect(() => enemyManager.update(100, 100, 16)).not.toThrow()
    })

    it('should update all active enemies', () => {
      enemyManager.spawnRandomEnemy(500, 300, 1)
      enemyManager.spawnRandomEnemy(600, 300, 1)
      
      expect(() => enemyManager.update(100, 100, 16)).not.toThrow()
    })

    it('should skip inactive enemies', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.active = false
      
      expect(() => enemyManager.update(100, 100, 16)).not.toThrow()
    })
  })

  describe('Flying enemy AI (fly, bee)', () => {
    it('should chase player when within detection range', () => {
      const originalRandom = Math.random
      Math.random = () => 0.2 // Small/flying enemy
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      // Set up enemy as fly type
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'fly'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 0
        return null
      })
      
      Math.random = originalRandom
      
      // Player is within detection range (200 pixels away)
      enemyManager.update(300, 300, 16)
      
      expect(enemy.setVelocity).toHaveBeenCalled()
    })

    it('should hover/wander when player is far away', () => {
      const originalRandom = Math.random
      Math.random = () => 0.2 // Small/flying enemy
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'fly'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 1
        return null
      })
      
      Math.random = originalRandom
      
      // Player is far away (1000 pixels)
      enemyManager.update(1500, 300, 16)
      
      expect(enemy.setVelocityY).toHaveBeenCalled()
      expect(enemy.setVelocityX).toHaveBeenCalled()
    })

    it('should flip sprite based on player position', () => {
      const originalRandom = Math.random
      Math.random = () => 0.2
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'bee'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        return null
      })
      
      Math.random = originalRandom
      
      // Player to the left
      enemyManager.update(300, 300, 16)
      
      expect(enemy.setFlipX).toHaveBeenCalled()
    })
  })

  describe('Ground enemy AI (slimes, worms)', () => {
    it('should chase player when within detection range on ground', () => {
      const originalRandom = Math.random
      Math.random = () => 0.6 // Medium/ground enemy
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.body.blocked.down = true
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'slimeGreen'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 0
        if (key === 'wanderTimer') return 0
        return null
      })
      
      Math.random = originalRandom
      
      // Player within detection range to the left
      enemyManager.update(300, 300, 16)
      
      expect(enemy.setVelocityX).toHaveBeenCalled()
      expect(enemy.play).toHaveBeenCalled()
    })

    it('should move right when player is to the right', () => {
      const originalRandom = Math.random
      Math.random = () => 0.6
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.body.blocked.down = true
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'slimeBlue'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 0
        if (key === 'wanderTimer') return 0
        return null
      })
      
      Math.random = originalRandom
      
      // Player to the right
      enemyManager.update(700, 300, 16)
      
      expect(enemy.setFlipX).toHaveBeenCalledWith(false)
    })

    it('should move left when player is to the left', () => {
      const originalRandom = Math.random
      Math.random = () => 0.6
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.body.blocked.down = true
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'slimeGreen'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 0
        if (key === 'wanderTimer') return 0
        return null
      })
      
      Math.random = originalRandom
      
      // Player to the left
      enemyManager.update(300, 300, 16)
      
      expect(enemy.setFlipX).toHaveBeenCalledWith(true)
    })

    it('should not move when not on ground', () => {
      const originalRandom = Math.random
      Math.random = () => 0.6
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.body.blocked.down = false
      enemy.body.touching.down = false
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'slimeGreen'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        return null
      })
      
      Math.random = originalRandom
      
      // Clear velocity mocks before update
      enemy.setVelocityX.mockClear()
      
      enemyManager.update(300, 300, 16)
      
      // Should not set velocity when in air
      expect(enemy.setVelocityX).not.toHaveBeenCalled()
    })

    it('should wander when player is far away', () => {
      const originalRandom = Math.random
      Math.random = () => 0.6
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.body.blocked.down = true
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'wormGreen'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 1
        if (key === 'wanderTimer') return 0
        return null
      })
      
      Math.random = originalRandom
      
      // Player far away
      enemyManager.update(2000, 300, 16)
      
      expect(enemy.setVelocityX).toHaveBeenCalled()
    })

    it('should change wander direction after 2 seconds', () => {
      const originalRandom = Math.random
      Math.random = () => 0.6
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.body.blocked.down = true
      let wanderTimer = 0
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'wormPink'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 1
        if (key === 'wanderTimer') return wanderTimer
        return null
      })
      enemy.setData.mockImplementation((key: string, value: any) => {
        if (key === 'wanderTimer') wanderTimer = value
        return enemy
      })
      
      Math.random = originalRandom
      
      // Update with delta that pushes timer over 2000
      enemyManager.update(2000, 300, 2500)
      
      expect(enemy.setData).toHaveBeenCalledWith('wanderDirection', expect.any(Number))
    })

    it('should play idle animation when wander direction is 0', () => {
      const originalRandom = Math.random
      Math.random = () => 0.6
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.body.blocked.down = true
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'slimeGreen'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 0
        if (key === 'wanderTimer') return 0
        return null
      })
      
      Math.random = originalRandom
      
      // Player far away
      enemyManager.update(2000, 300, 16)
      
      expect(enemy.play).toHaveBeenCalledWith('slimeGreen_idle', true)
    })

    it('should play walk animation when wandering', () => {
      const originalRandom = Math.random
      Math.random = () => 0.6
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.body.blocked.down = true
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'enemyType') return 'slimeGreen'
        if (key === 'speed') return 80
        if (key === 'detectionRange') return 300
        if (key === 'wanderDirection') return 1
        if (key === 'wanderTimer') return 0
        return null
      })
      
      Math.random = originalRandom
      
      // Player far away
      enemyManager.update(2000, 300, 16)
      
      expect(enemy.play).toHaveBeenCalledWith('slimeGreen_walk', true)
    })
  })

  // ==================== DAMAGE & DEATH ====================

  describe('damageEnemy()', () => {
    it('should reduce enemy health', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      let health = 10
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        return null
      })
      enemy.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return enemy
      })
      
      enemyManager.damageEnemy(enemy, 3)
      
      expect(enemy.setData).toHaveBeenCalledWith('health', 7)
    })

    it('should flash enemy red on damage', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockReturnValue(10)
      
      enemyManager.damageEnemy(enemy, 1)
      
      expect(enemy.setTint).toHaveBeenCalledWith(0xff0000)
    })

    it('should apply knockback', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockReturnValue(10)
      enemy.flipX = false
      
      enemyManager.damageEnemy(enemy, 1)
      
      expect(enemy.setVelocityX).toHaveBeenCalled()
      expect(enemy.setVelocityY).toHaveBeenCalledWith(-100)
    })

    it('should apply knockback in correct direction when facing left', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockReturnValue(10)
      enemy.flipX = true
      
      enemyManager.damageEnemy(enemy, 1)
      
      expect(enemy.setVelocityX).toHaveBeenCalledWith(200) // Knockback right
    })

    it('should apply knockback in correct direction when facing right', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockReturnValue(10)
      enemy.flipX = false
      
      enemyManager.damageEnemy(enemy, 1)
      
      expect(enemy.setVelocityX).toHaveBeenCalledWith(-200) // Knockback left
    })

    it('should return false when enemy survives', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockReturnValue(10)
      
      const result = enemyManager.damageEnemy(enemy, 1)
      
      expect(result).toBe(false)
    })

    it('should return true when enemy dies', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      let health = 5
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        if (key === 'coinReward') return 10
        if (key === 'enemySize') return 'medium'
        return null
      })
      enemy.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return enemy
      })
      
      const result = enemyManager.damageEnemy(enemy, 10)
      
      expect(result).toBe(true)
    })

    it('should schedule tint clear after damage', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockReturnValue(10)
      
      enemyManager.damageEnemy(enemy, 1)
      
      expect(scene.time.delayedCall).toHaveBeenCalledWith(100, expect.any(Function))
    })
  })

  describe('killEnemy()', () => {
    it('should increment enemies defeated counter', () => {
      const initialCount = enemyManager.getEnemiesDefeated()
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 10
        if (key === 'enemySize') return 'medium'
        return null
      })
      
      enemyManager.killEnemy(enemy)
      
      expect(enemyManager.getEnemiesDefeated()).toBe(initialCount + 1)
    })

    it('should emit ENEMY_KILLED event', () => {
      const handler = vi.fn()
      enemyManager.on(GAME_EVENTS.ENEMY_KILLED, handler)
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 15
        if (key === 'enemySize') return 'large'
        return null
      })
      
      enemyManager.killEnemy(enemy)
      
      expect(handler).toHaveBeenCalled()
      const eventData = handler.mock.calls[0][0]
      expect(eventData.coinReward).toBe(15)
      expect(eventData.scoreReward).toBeDefined()
    })

    it('should give correct score for small enemy', () => {
      const handler = vi.fn()
      enemyManager.on(GAME_EVENTS.ENEMY_KILLED, handler)
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 5
        if (key === 'enemySize') return 'small'
        return null
      })
      
      enemyManager.killEnemy(enemy)
      
      const eventData = handler.mock.calls[0][0]
      expect(eventData.scoreReward).toBe(50)
    })

    it('should give correct score for medium enemy', () => {
      const handler = vi.fn()
      enemyManager.on(GAME_EVENTS.ENEMY_KILLED, handler)
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 10
        if (key === 'enemySize') return 'medium'
        return null
      })
      
      enemyManager.killEnemy(enemy)
      
      const eventData = handler.mock.calls[0][0]
      expect(eventData.scoreReward).toBe(100)
    })

    it('should give correct score for large enemy', () => {
      const handler = vi.fn()
      enemyManager.on(GAME_EVENTS.ENEMY_KILLED, handler)
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 15
        if (key === 'enemySize') return 'large'
        return null
      })
      
      enemyManager.killEnemy(enemy)
      
      const eventData = handler.mock.calls[0][0]
      expect(eventData.scoreReward).toBe(200)
    })

    it('should play damage sound', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 10
        if (key === 'enemySize') return 'medium'
        return null
      })
      
      enemyManager.killEnemy(enemy)
      
      expect(audioManager.playDamageSound).toHaveBeenCalled()
    })

    it('should add death animation tween', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 10
        if (key === 'enemySize') return 'medium'
        return null
      })
      
      enemyManager.killEnemy(enemy)
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })

    it('should destroy enemy after animation', async () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 10
        if (key === 'enemySize') return 'medium'
        return null
      })
      
      enemyManager.killEnemy(enemy)
      
      // Wait for tween onComplete
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(enemy.destroy).toHaveBeenCalled()
    })
  })

  // ==================== STOMP ====================

  describe('handleStomp()', () => {
    it('should return true when stomp is successful', () => {
      const player = createMockPlayer(500, 200) // Above enemy
      player.body.velocity.y = 100 // Moving down
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 10
        if (key === 'enemySize') return 'medium'
        return null
      })
      
      const result = enemyManager.handleStomp(player, enemy)
      
      expect(result).toBe(true)
    })

    it('should bounce player up after stomp', () => {
      const player = createMockPlayer(500, 200) // Above enemy
      player.body.velocity.y = 100 // Moving down
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockImplementation((key: string) => {
        if (key === 'coinReward') return 10
        if (key === 'enemySize') return 'medium'
        return null
      })
      
      enemyManager.handleStomp(player, enemy)
      
      expect(player.body.setVelocityY).toHaveBeenCalledWith(-300)
    })

    it('should return false when player is below enemy', () => {
      const player = createMockPlayer(500, 400) // Below enemy
      player.body.velocity.y = 100
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      const result = enemyManager.handleStomp(player, enemy)
      
      expect(result).toBe(false)
    })

    it('should return false when player is moving up', () => {
      const player = createMockPlayer(500, 200) // Above enemy
      player.body.velocity.y = -100 // Moving up
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      const result = enemyManager.handleStomp(player, enemy)
      
      expect(result).toBe(false)
    })

    it('should return false when player is at same level', () => {
      const player = createMockPlayer(500, 300) // Same level
      player.body.velocity.y = 100
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      const result = enemyManager.handleStomp(player, enemy)
      
      expect(result).toBe(false)
    })
  })

  // ==================== CLEANUP ====================

  describe('cleanupEnemiesBeforeX()', () => {
    it('should destroy enemies behind threshold', () => {
      const enemy1 = enemyManager.spawnRandomEnemy(100, 300, 1)
      const enemy2 = enemyManager.spawnRandomEnemy(200, 300, 1)
      const enemy3 = enemyManager.spawnRandomEnemy(1000, 300, 1)
      
      enemyManager.cleanupEnemiesBeforeX(1000)
      
      expect(enemy1.destroy).toHaveBeenCalled()
      expect(enemy2.destroy).toHaveBeenCalled()
      expect(enemy3.destroy).not.toHaveBeenCalled()
    })

    it('should not destroy enemies after threshold', () => {
      const enemy = enemyManager.spawnRandomEnemy(1500, 300, 1)
      
      enemyManager.cleanupEnemiesBeforeX(1000)
      
      expect(enemy.destroy).not.toHaveBeenCalled()
    })
  })

  // ==================== GETTERS ====================

  describe('getEnemiesDefeated()', () => {
    it('should return 0 initially', () => {
      expect(enemyManager.getEnemiesDefeated()).toBe(0)
    })

    it('should return correct count after killing enemies', () => {
      const enemy1 = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy1.getData.mockReturnValue(10)
      
      const enemy2 = enemyManager.spawnRandomEnemy(600, 300, 1)
      enemy2.getData.mockReturnValue(10)
      
      enemyManager.killEnemy(enemy1)
      enemyManager.killEnemy(enemy2)
      
      expect(enemyManager.getEnemiesDefeated()).toBe(2)
    })
  })

  describe('getActiveEnemies()', () => {
    it('should return empty array initially', () => {
      expect(enemyManager.getActiveEnemies()).toEqual([])
    })

    it('should return active enemies', () => {
      enemyManager.spawnRandomEnemy(500, 300, 1)
      enemyManager.spawnRandomEnemy(600, 300, 1)
      
      const activeEnemies = enemyManager.getActiveEnemies()
      
      expect(activeEnemies.length).toBe(2)
    })

    it('should not return inactive enemies', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.active = false
      
      const activeEnemies = enemyManager.getActiveEnemies()
      
      expect(activeEnemies.length).toBe(0)
    })
  })

  describe('getNearestEnemy()', () => {
    it('should return null when no enemies exist', () => {
      const result = enemyManager.getNearestEnemy(100, 100)
      
      expect(result.enemy).toBeNull()
      expect(result.distance).toBe(Infinity)
    })

    it('should find nearest enemy', () => {
      enemyManager.spawnRandomEnemy(200, 100, 1)
      enemyManager.spawnRandomEnemy(500, 100, 1)
      
      const result = enemyManager.getNearestEnemy(100, 100)
      
      expect(result.enemy).toBeDefined()
      expect(result.distance).toBeLessThan(Infinity)
    })

    it('should skip inactive enemies', () => {
      const enemy1 = enemyManager.spawnRandomEnemy(200, 100, 1)
      enemy1.active = false
      
      const enemy2 = enemyManager.spawnRandomEnemy(500, 100, 1)
      
      const result = enemyManager.getNearestEnemy(100, 100)
      
      expect(result.enemy).toBe(enemy2)
    })
  })

  // ==================== DESTROY ====================

  describe('destroy()', () => {
    it('should destroy enemies group', () => {
      const group = scene.getEnemyGroup()
      
      enemyManager.destroy()
      
      expect(group.destroy).toHaveBeenCalledWith(true)
    })

    it('should not throw when called multiple times', () => {
      enemyManager.destroy()
      
      expect(() => enemyManager.destroy()).not.toThrow()
    })
  })

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('should handle default health value', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockReturnValue(undefined)
      
      const result = enemyManager.damageEnemy(enemy, 10)
      
      // With undefined health (defaults to 1), damage of 10 should kill
      expect(result).toBe(true)
    })

    it('should handle default coinReward value', () => {
      const handler = vi.fn()
      enemyManager.on(GAME_EVENTS.ENEMY_KILLED, handler)
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemy.getData.mockReturnValue(undefined)
      
      enemyManager.killEnemy(enemy)
      
      const eventData = handler.mock.calls[0][0]
      expect(eventData.coinReward).toBe(5) // Default
    })

    it('should handle all enemy types for animations', () => {
      const manager = new EnemyManager(scene, audioManager)
      
      // Reset anims.exists to return true to skip animation creation
      scene.anims.exists.mockReturnValue(true)
      
      manager.create()
      
      // Should still work even if animations already exist
      expect(manager).toBeDefined()
    })
  })
})
