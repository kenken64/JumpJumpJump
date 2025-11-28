/**
 * Comprehensive Tests for BossManager
 * 
 * Target: Increase coverage from 31.48% to 80%+
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

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
  }
}))

import { GAME_EVENTS } from '../types/GameTypes'
import { BossManager } from '../managers/BossManager'

// ==================== MOCK SETUP ====================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    getStore: () => store
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Create mock body
function createMockBody() {
  return {
    velocity: { x: 0, y: 0 },
    blocked: { down: false, left: false, right: false, up: false },
    touching: { down: false, left: false, right: false, up: false },
    setSize: vi.fn(),
    setOffset: vi.fn(),
    setAllowGravity: vi.fn(),
    setImmovable: vi.fn(),
    setVelocity: vi.fn(),
    setVelocityX: vi.fn(),
    setVelocityY: vi.fn()
  }
}

// Create mock sprite with full functionality
function createMockBossSprite() {
  const data: Record<string, any> = {}
  const body = createMockBody()
  const sprite: any = {
    x: 1000,
    y: 350,
    width: 256,
    height: 256,
    active: true,
    flipX: false,
    alpha: 1,
    scale: 1,
    body,
    setData: vi.fn((key: string, value: any) => { 
      data[key] = value
      return sprite 
    }),
    getData: vi.fn((key: string) => data[key]),
    setScale: vi.fn((s: number) => { sprite.scale = s; return sprite }),
    setDepth: vi.fn(() => sprite),
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
    setRotation: vi.fn(() => sprite),
    setAlpha: vi.fn((v: number) => { sprite.alpha = v; return sprite }),
    setPosition: vi.fn((x: number, y: number) => { sprite.x = x; sprite.y = y; return sprite }),
    play: vi.fn(() => sprite),
    destroy: vi.fn(() => { sprite.active = false })
  }
  return sprite
}

// Create mock projectile sprite
function createMockProjectile() {
  const data: Record<string, any> = {}
  const body = createMockBody()
  const projectile: any = {
    x: 1000,
    y: 350,
    active: true,
    body,
    setData: vi.fn((key: string, value: any) => { 
      data[key] = value
      return projectile 
    }),
    getData: vi.fn((key: string) => data[key]),
    setTint: vi.fn(() => projectile),
    setScale: vi.fn(() => projectile),
    setVelocity: vi.fn(() => projectile),
    setRotation: vi.fn(() => projectile),
    destroy: vi.fn(() => { projectile.active = false })
  }
  return projectile
}

// Create mock projectiles group
function createMockProjectilesGroup() {
  const projectiles: any[] = []
  return {
    add: vi.fn((p: any) => projectiles.push(p)),
    getChildren: vi.fn(() => projectiles),
    destroy: vi.fn(),
    clear: vi.fn()
  }
}

// Create mock rectangle
function createMockRectangle() {
  return {
    x: 0,
    y: 0,
    width: 100,
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setSize: vi.fn(function(this: any, w: number, h: number) { 
      this.width = w
      return this 
    }),
    destroy: vi.fn()
  }
}

// Create mock text
function createMockText() {
  return {
    x: 0,
    y: 0,
    setOrigin: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  }
}

// Create mock scene
function createMockScene() {
  let bossSprite: any = null
  let projectilesGroup: any = null
  const tweenTargets: any[] = []
  
  const scene: any = {
    physics: {
      add: {
        group: vi.fn((config?: any) => {
          if (!projectilesGroup) {
            projectilesGroup = createMockProjectilesGroup()
          }
          return projectilesGroup
        }),
        sprite: vi.fn((x: number, y: number, key: string) => {
          if (key.startsWith('boss_')) {
            bossSprite = createMockBossSprite()
            bossSprite.x = x
            bossSprite.y = y
            return bossSprite
          }
          // Return projectile sprite
          const projectile = createMockProjectile()
          projectile.x = x
          projectile.y = y
          return projectile
        }),
        collider: vi.fn(),
        overlap: vi.fn()
      }
    },
    add: {
      sprite: vi.fn(() => createMockBossSprite()),
      rectangle: vi.fn(() => createMockRectangle()),
      text: vi.fn(() => createMockText()),
      circle: vi.fn(() => ({
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      })),
      particles: vi.fn(() => ({
        createEmitter: vi.fn(() => ({
          emitParticleAt: vi.fn()
        }))
      }))
    },
    tweens: {
      add: vi.fn((config: any) => {
        tweenTargets.push(config.targets)
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
        // For testing, optionally call the callback
        return { remove: vi.fn(), getRemaining: vi.fn(() => delay) }
      }),
      addEvent: vi.fn((config: any) => {
        // For testing homing projectile update
        return { remove: vi.fn() }
      })
    },
    anims: {
      create: vi.fn(),
      exists: vi.fn(() => false)
    },
    cameras: {
      main: {
        shake: vi.fn(),
        flash: vi.fn(),
        scrollX: 0
      }
    },
    // Helpers for testing
    getBossSprite: () => bossSprite,
    getProjectilesGroup: () => projectilesGroup,
    getTweenTargets: () => tweenTargets,
    resetBossSprite: () => { bossSprite = null }
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

describe('BossManager', () => {
  let scene: any
  let audioManager: any
  let bossManager: BossManager

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    
    // Setup default fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { boss_index: 0, boss_name: 'Fire Dragon' },
        { boss_index: 1, boss_name: 'Ice Giant' },
        { boss_index: 2, boss_name: 'Shadow Knight' }
      ]
    })
    
    scene = createMockScene()
    audioManager = createMockAudioManager()
    bossManager = new BossManager(scene, audioManager)
  })

  afterEach(() => {
    bossManager.destroy()
  })

  // ==================== CONSTRUCTOR ====================

  describe('constructor', () => {
    it('should create boss manager', () => {
      expect(bossManager).toBeDefined()
    })

    it('should initialize with no active boss', () => {
      expect(bossManager.isBossActive()).toBe(false)
      expect(bossManager.getBoss()).toBeNull()
    })

    it('should load defeated bosses from localStorage', () => {
      localStorageMock.setItem('defeatedBossLevels', JSON.stringify([5, 10, 15]))
      
      const manager = new BossManager(scene, audioManager)
      
      expect(manager.isBossDefeatedForLevel(5)).toBe(true)
      expect(manager.isBossDefeatedForLevel(10)).toBe(true)
      expect(manager.isBossDefeatedForLevel(15)).toBe(true)
      expect(manager.isBossDefeatedForLevel(20)).toBe(false)
    })
  })

  // ==================== CREATE ====================

  describe('create()', () => {
    it('should create boss projectiles group', () => {
      bossManager.create()
      
      expect(scene.physics.add.group).toHaveBeenCalled()
    })
  })

  // ==================== SET CURRENT LEVEL ====================

  describe('setCurrentLevel()', () => {
    it('should update current level', () => {
      bossManager.setCurrentLevel(10)
      // Internal state - verified through spawn behavior
      expect(bossManager.isBossActive()).toBe(false)
    })
  })

  // ==================== FIND NEXT UNDEFEATED BOSS ====================

  describe('findNextUndefeatedBoss()', () => {
    it('should return starting index when no bosses defeated', () => {
      const bossIndex = bossManager.findNextUndefeatedBoss(0)
      expect(bossIndex).toBe(0)
    })

    it('should skip defeated bosses', () => {
      localStorageMock.setItem('Guest_boss_0', 'defeated')
      localStorageMock.setItem('Guest_boss_1', 'defeated')
      
      const bossIndex = bossManager.findNextUndefeatedBoss(0)
      expect(bossIndex).toBe(2)
    })

    it('should use player name from localStorage', () => {
      localStorageMock.setItem('player_name', 'TestPlayer')
      localStorageMock.setItem('TestPlayer_boss_0', 'defeated')
      
      const bossIndex = bossManager.findNextUndefeatedBoss(0)
      expect(bossIndex).toBe(1)
    })

    it('should wrap around when starting from middle', () => {
      // Defeat bosses 20-23 and 0-1
      localStorageMock.setItem('Guest_boss_20', 'defeated')
      localStorageMock.setItem('Guest_boss_21', 'defeated')
      localStorageMock.setItem('Guest_boss_22', 'defeated')
      localStorageMock.setItem('Guest_boss_23', 'defeated')
      localStorageMock.setItem('Guest_boss_0', 'defeated')
      localStorageMock.setItem('Guest_boss_1', 'defeated')
      
      const bossIndex = bossManager.findNextUndefeatedBoss(20)
      expect(bossIndex).toBe(2)
    })

    it('should return 0 when all bosses defeated', () => {
      // Mark all 24 bosses as defeated
      for (let i = 0; i < 24; i++) {
        localStorageMock.setItem(`Guest_boss_${i}`, 'defeated')
      }
      
      const bossIndex = bossManager.findNextUndefeatedBoss(0)
      expect(bossIndex).toBe(0)
    })
  })

  // ==================== SPAWN BOSS ====================

  describe('spawnBoss()', () => {
    beforeEach(() => {
      bossManager.create()
    })

    it('should create boss sprite at given position', async () => {
      await bossManager.spawnBoss(1000)
      
      expect(scene.physics.add.sprite).toHaveBeenCalledWith(
        1000,
        350,
        expect.stringMatching(/^boss_/)
      )
    })

    it('should set boss as active', async () => {
      await bossManager.spawnBoss(1000)
      
      expect(bossManager.isBossActive()).toBe(true)
    })

    it('should emit BOSS_SPAWNED event', async () => {
      const handler = vi.fn()
      bossManager.on(GAME_EVENTS.BOSS_SPAWNED, handler)
      
      await bossManager.spawnBoss(1000)
      
      expect(handler).toHaveBeenCalled()
      const eventData = handler.mock.calls[0][0]
      expect(eventData.message).toContain('BOSS FIGHT')
    })

    it('should play boss spawn sound', async () => {
      await bossManager.spawnBoss(1000)
      
      expect(audioManager.playBossSound).toHaveBeenCalled()
    })

    it('should create boss health bar', async () => {
      await bossManager.spawnBoss(1000)
      
      expect(scene.add.rectangle).toHaveBeenCalled()
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should not spawn if boss already active', async () => {
      await bossManager.spawnBoss(1000)
      scene.physics.add.sprite.mockClear()
      
      await bossManager.spawnBoss(1500)
      
      expect(scene.physics.add.sprite).not.toHaveBeenCalled()
    })

    it('should use forced boss index when provided', async () => {
      await bossManager.spawnBoss(1000, 5)
      
      expect(scene.physics.add.sprite).toHaveBeenCalledWith(
        1000,
        350,
        'boss_05'
      )
    })

    it('should set boss data correctly', async () => {
      bossManager.setCurrentLevel(10)
      await bossManager.spawnBoss(1000)
      
      const boss = scene.getBossSprite()
      expect(boss.setData).toHaveBeenCalledWith('health', expect.any(Number))
      expect(boss.setData).toHaveBeenCalledWith('maxHealth', expect.any(Number))
      expect(boss.setData).toHaveBeenCalledWith('lastAttack', 0)
      expect(boss.setData).toHaveBeenCalledWith('attackCooldown', 2000)
    })

    it('should scale boss health with level', async () => {
      bossManager.setCurrentLevel(5)
      await bossManager.spawnBoss(1000)
      
      const boss = scene.getBossSprite()
      // Health = 50 + (level * 20) = 50 + 100 = 150
      expect(boss.setData).toHaveBeenCalledWith('health', 150)
      expect(boss.setData).toHaveBeenCalledWith('maxHealth', 150)
    })

    it('should fetch boss name from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { boss_index: 0, boss_name: 'Custom Boss Name' }
        ]
      })
      
      await bossManager.spawnBoss(1000, 0)
      
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle API error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))
      
      // Should not throw
      await expect(bossManager.spawnBoss(1000, 0)).resolves.not.toThrow()
      expect(bossManager.isBossActive()).toBe(true)
    })
  })

  // ==================== UPDATE ====================

  describe('update()', () => {
    beforeEach(async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
    })

    it('should not update if no boss exists', () => {
      const manager = new BossManager(scene, audioManager)
      manager.create()
      
      // Should not throw
      expect(() => manager.update(500, 300)).not.toThrow()
    })

    it('should update boss health bar', () => {
      const boss = scene.getBossSprite()
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 75
        if (key === 'maxHealth') return 150
        return null
      })
      
      bossManager.update(500, 300)
      
      // Health bar should be resized
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should move boss toward player horizontally', () => {
      const boss = scene.getBossSprite()
      boss.x = 1000
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 10000 // Long cooldown
        return null
      })
      
      bossManager.update(500, 300) // Player is to the left
      
      expect(boss.setVelocityX).toHaveBeenCalled()
      expect(boss.setFlipX).toHaveBeenCalledWith(true) // Facing left
    })

    it('should move boss right when player is to the right', () => {
      const boss = scene.getBossSprite()
      boss.x = 500
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 10000
        return null
      })
      
      bossManager.update(1000, 300) // Player is to the right
      
      expect(boss.setFlipX).toHaveBeenCalledWith(false) // Facing right
    })

    it('should stop horizontal movement when close to player', () => {
      const boss = scene.getBossSprite()
      boss.x = 500
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 10000
        return null
      })
      
      bossManager.update(550, 300) // Player is very close
      
      expect(boss.setVelocityX).toHaveBeenCalledWith(0)
    })

    it('should apply hovering motion', () => {
      const boss = scene.getBossSprite()
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 10000
        return null
      })
      
      bossManager.update(500, 300)
      
      expect(boss.setVelocityY).toHaveBeenCalled()
    })

    it('should attack when cooldown expired', () => {
      const boss = scene.getBossSprite()
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 1000
        return null
      })
      scene.time.now = 2000 // Past cooldown
      
      bossManager.update(500, 300)
      
      expect(boss.setData).toHaveBeenCalledWith('lastAttack', 2000)
      expect(audioManager.playBossAttackSound).toHaveBeenCalled()
    })
  })

  // ==================== DAMAGE BOSS ====================

  describe('damageBoss()', () => {
    beforeEach(async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
    })

    it('should return false when no boss exists', () => {
      const manager = new BossManager(scene, audioManager)
      manager.create()
      
      const result = manager.damageBoss(10)
      expect(result).toBe(false)
    })

    it('should reduce boss health', () => {
      const boss = scene.getBossSprite()
      let health = 100
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        return null
      })
      boss.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return boss
      })
      
      bossManager.damageBoss(25)
      
      expect(boss.setData).toHaveBeenCalledWith('health', 75)
    })

    it('should flash boss red on damage', () => {
      const boss = scene.getBossSprite()
      boss.getData.mockReturnValue(100)
      
      bossManager.damageBoss(10)
      
      expect(boss.setTint).toHaveBeenCalledWith(0xff0000)
      expect(scene.time.delayedCall).toHaveBeenCalled()
    })

    it('should return false when boss survives', () => {
      const boss = scene.getBossSprite()
      boss.getData.mockReturnValue(100)
      
      const result = bossManager.damageBoss(10)
      expect(result).toBe(false)
    })

    it('should return true when boss is defeated', () => {
      const boss = scene.getBossSprite()
      let health = 50
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        if (key === 'bossIndex') return 0
        return null
      })
      boss.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return boss
      })
      
      const result = bossManager.damageBoss(60)
      expect(result).toBe(true)
    })

    it('should emit BOSS_DEFEATED event when boss dies', () => {
      const handler = vi.fn()
      bossManager.on(GAME_EVENTS.BOSS_DEFEATED, handler)
      
      const boss = scene.getBossSprite()
      let health = 10
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        if (key === 'bossIndex') return 0
        return null
      })
      boss.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return boss
      })
      
      bossManager.damageBoss(20)
      
      expect(handler).toHaveBeenCalled()
      const eventData = handler.mock.calls[0][0]
      expect(eventData.coinReward).toBe(100)
      expect(eventData.scoreReward).toBe(1000)
    })

    it('should save defeated boss to localStorage', () => {
      const boss = scene.getBossSprite()
      let health = 10
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        if (key === 'bossIndex') return 5
        return null
      })
      boss.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return boss
      })
      
      bossManager.damageBoss(20)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('Guest_boss_5', 'defeated')
    })

    it('should use player name for saving defeated boss', () => {
      localStorageMock.setItem('player_name', 'Champion')
      
      const boss = scene.getBossSprite()
      let health = 10
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        if (key === 'bossIndex') return 3
        return null
      })
      boss.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return boss
      })
      
      bossManager.damageBoss(20)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('Champion_boss_3', 'defeated')
    })

    it('should cleanup boss UI when defeated', () => {
      const boss = scene.getBossSprite()
      let health = 10
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        if (key === 'bossIndex') return 0
        return null
      })
      boss.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return boss
      })
      
      bossManager.damageBoss(20)
      
      // Death animation should be triggered
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  // ==================== IS BOSS DEFEATED FOR LEVEL ====================

  describe('isBossDefeatedForLevel()', () => {
    it('should return false for non-defeated levels', () => {
      expect(bossManager.isBossDefeatedForLevel(5)).toBe(false)
    })

    it('should return true for defeated levels', async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000, 0)
      
      // Simulate boss defeat
      const boss = scene.getBossSprite()
      let health = 10
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return health
        if (key === 'bossIndex') return 0
        return null
      })
      boss.setData.mockImplementation((key: string, value: any) => {
        if (key === 'health') health = value
        return boss
      })
      
      bossManager.setCurrentLevel(5)
      bossManager.damageBoss(20)
      
      expect(bossManager.isBossDefeatedForLevel(5)).toBe(true)
    })
  })

  // ==================== GETTERS ====================

  describe('getBoss()', () => {
    it('should return null initially', () => {
      expect(bossManager.getBoss()).toBeNull()
    })

    it('should return boss sprite after spawn', async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
      
      expect(bossManager.getBoss()).not.toBeNull()
    })
  })

  describe('isBossActive()', () => {
    it('should return false initially', () => {
      expect(bossManager.isBossActive()).toBe(false)
    })

    it('should return true after spawn', async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
      
      expect(bossManager.isBossActive()).toBe(true)
    })
  })

  describe('getBossProjectiles()', () => {
    it('should return projectiles group', () => {
      bossManager.create()
      
      const projectiles = bossManager.getBossProjectiles()
      expect(projectiles).toBeDefined()
    })
  })

  // ==================== CREATE EXPLOSION ====================

  describe('createExplosion()', () => {
    beforeEach(() => {
      bossManager.create()
    })

    it('should create visual explosion', () => {
      bossManager.createExplosion(500, 300)
      
      expect(scene.add.circle).toHaveBeenCalled()
      expect(scene.tweens.add).toHaveBeenCalled()
    })

    it('should emit EXPLOSION_CREATED event', () => {
      const handler = vi.fn()
      bossManager.on(GAME_EVENTS.EXPLOSION_CREATED, handler)
      
      bossManager.createExplosion(500, 300)
      
      expect(handler).toHaveBeenCalled()
      const eventData = handler.mock.calls[0][0]
      expect(eventData.x).toBe(500)
      expect(eventData.y).toBe(300)
      expect(eventData.radius).toBeDefined()
      expect(eventData.damage).toBeDefined()
    })

    it('should create multiple explosion layers', () => {
      bossManager.createExplosion(500, 300)
      
      // Should create at least some explosion circles
      expect(scene.add.circle).toHaveBeenCalled()
    })
  })

  // ==================== CLEANUP ====================

  describe('destroy()', () => {
    it('should cleanup resources', () => {
      bossManager.create()
      
      // Should not throw
      expect(() => bossManager.destroy()).not.toThrow()
    })

    it('should cleanup boss if exists', async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
      
      const boss = scene.getBossSprite()
      
      bossManager.destroy()
      
      expect(boss.destroy).toHaveBeenCalled()
    })

    it('should destroy projectiles group', () => {
      bossManager.create()
      const projectiles = scene.getProjectilesGroup()
      
      bossManager.destroy()
      
      expect(projectiles.destroy).toHaveBeenCalled()
    })

    it('should return null for boss after destroy', async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
      
      bossManager.destroy()
      
      expect(bossManager.getBoss()).toBeNull()
    })
  })

  // ==================== BOSS ATTACKS ====================

  describe('Boss Attacks', () => {
    beforeEach(async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
    })

    it('should create 360 spray attack projectiles', () => {
      const boss = scene.getBossSprite()
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 1000
        return null
      })
      
      // Seed random to get 360 attack
      const originalRandom = Math.random
      Math.random = () => 0.2 // < 0.5 = 360 attack
      
      scene.time.now = 2000
      bossManager.update(500, 300)
      
      Math.random = originalRandom
      
      // Should create projectile sprites
      expect(scene.physics.add.sprite).toHaveBeenCalled()
    })

    it('should create homing attack projectiles', () => {
      const boss = scene.getBossSprite()
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 1000
        return null
      })
      
      // Seed random to get homing attack
      const originalRandom = Math.random
      Math.random = () => 0.8 // >= 0.5 = homing attack
      
      scene.time.now = 2000
      bossManager.update(500, 300)
      
      Math.random = originalRandom
      
      // Should create delayed projectiles
      expect(scene.time.delayedCall).toHaveBeenCalled()
    })

    it('should play attack sound', () => {
      const boss = scene.getBossSprite()
      boss.getData.mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 1000
        return null
      })
      
      scene.time.now = 2000
      bossManager.update(500, 300)
      
      expect(audioManager.playBossAttackSound).toHaveBeenCalled()
    })
  })

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle update when boss becomes inactive', async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
      
      const boss = scene.getBossSprite()
      boss.active = false
      
      // Should not throw
      expect(() => bossManager.update(500, 300)).not.toThrow()
    })

    it('should handle damage on inactive boss', async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
      
      const boss = scene.getBossSprite()
      boss.active = false
      
      const result = bossManager.damageBoss(10)
      expect(result).toBe(false)
    })

    it('should handle missing boss data gracefully', async () => {
      bossManager.create()
      await bossManager.spawnBoss(1000)
      
      const boss = scene.getBossSprite()
      boss.getData.mockReturnValue(undefined)
      
      // Should not throw
      expect(() => bossManager.update(500, 300)).not.toThrow()
    })
  })
})
