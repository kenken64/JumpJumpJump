import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} })
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Create sprite mock
const createSpriteMock = (options: any = {}) => {
  const dataStore: Record<string, any> = {
    health: options.health || 100,
    maxHealth: options.maxHealth || 100,
    ...options.data
  }
  
  return {
    setOrigin: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setCollideWorldBounds: vi.fn().mockReturnThis(),
    setBounce: vi.fn().mockReturnThis(),
    setVelocity: vi.fn().mockReturnThis(),
    setVelocityX: vi.fn().mockReturnThis(),
    setVelocityY: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    setData: vi.fn().mockImplementation(function(key: string, value: any) {
      dataStore[key] = value
      return this
    }),
    getData: vi.fn().mockImplementation((key: string) => dataStore[key]),
    clearTint: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
    setFlipX: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setActive: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    active: options.active !== undefined ? options.active : true,
    x: options.x || 400,
    y: options.y || 350,
    width: 200,
    height: 200,
    body: {
      setSize: vi.fn().mockReturnThis(),
      setOffset: vi.fn().mockReturnThis(),
      setMass: vi.fn().mockReturnThis(),
      setMaxVelocity: vi.fn().mockReturnThis(),
      setAllowGravity: vi.fn().mockReturnThis(),
      setImmovable: vi.fn().mockReturnThis(),
      velocity: { x: 0, y: 0 }
    },
    anims: {
      play: vi.fn()
    }
  }
}

// Mock EventEmitter
const createEventEmitterMock = () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn()
})

// Mock Phaser
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
      physics = {
        add: {
          sprite: vi.fn().mockImplementation(() => createSpriteMock()),
          group: vi.fn().mockReturnValue({
            create: vi.fn().mockImplementation(() => createSpriteMock()),
            getChildren: vi.fn().mockReturnValue([]),
            add: vi.fn()
          }),
          collider: vi.fn()
        }
      }
      add = {
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        rectangle: vi.fn().mockReturnValue({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        particles: vi.fn().mockReturnValue({
          createEmitter: vi.fn().mockReturnValue({
            explode: vi.fn()
          }),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })
      }
      tweens = {
        add: vi.fn().mockImplementation((config) => {
          if (config.onComplete) config.onComplete()
          return { stop: vi.fn() }
        })
      }
      time = {
        addEvent: vi.fn().mockReturnValue({ remove: vi.fn(), destroy: vi.fn() }),
        delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn() }),
        now: 1000
      }
      cameras = {
        main: {
          scrollX: 0,
          scrollY: 0,
          shake: vi.fn()
        }
      }
      textures = {
        exists: vi.fn().mockReturnValue(true)
      }
      anims = {
        exists: vi.fn().mockReturnValue(true)
      }
    },
    Events: {
      EventEmitter: class extends Object {
        private listeners: Map<string, Function[]> = new Map()
        
        on(event: string, fn: Function): this {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
          }
          this.listeners.get(event)!.push(fn)
          return this
        }
        
        off(event: string, fn?: Function): this {
          if (fn && this.listeners.has(event)) {
            const fns = this.listeners.get(event)!
            const idx = fns.indexOf(fn)
            if (idx >= 0) fns.splice(idx, 1)
          } else {
            this.listeners.delete(event)
          }
          return this
        }
        
        emit(event: string, ...args: any[]): boolean {
          if (this.listeners.has(event)) {
            this.listeners.get(event)!.forEach(fn => fn(...args))
            return true
          }
          return false
        }
      }
    },
    Math: {
      Between: vi.fn().mockReturnValue(50),
      Angle: {
        Between: vi.fn().mockReturnValue(0)
      },
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => 
          Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1))
      }
    }
  }
  return { default: Phaser, ...Phaser }
})

// Mock GameAPI
vi.mock('../services/GameAPI', () => ({
  GameAPI: {
    getAllBosses: vi.fn().mockResolvedValue([
      { boss_index: 0, boss_name: 'Fire Lord' },
      { boss_index: 1, boss_name: 'Ice Queen' },
      { boss_index: 2, boss_name: 'Stone Golem' }
    ])
  }
}))

// Mock AudioManager
vi.mock('../managers/AudioManager', () => ({
  AudioManager: vi.fn().mockImplementation(() => ({
    playBossSound: vi.fn(),
    playExplosion: vi.fn()
  }))
}))

describe('BossManager - Comprehensive Tests', () => {
  let BossManager: any
  let bossManager: any
  let mockScene: any
  let mockAudioManager: any
  
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageMock.clear()
    
    // Create mock scene
    mockScene = {
      physics: {
        add: {
          sprite: vi.fn().mockImplementation(() => createSpriteMock()),
          group: vi.fn().mockReturnValue({
            create: vi.fn().mockImplementation((x: number, y: number) => 
              createSpriteMock({ x, y })
            ),
            getChildren: vi.fn().mockReturnValue([]),
            add: vi.fn(),
            runChildUpdate: true
          }),
          collider: vi.fn()
        }
      },
      add: {
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        rectangle: vi.fn().mockReturnValue({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        particles: vi.fn().mockReturnValue({
          createEmitter: vi.fn().mockReturnValue({
            explode: vi.fn()
          }),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          emitParticleAt: vi.fn(),
          destroy: vi.fn()
        })
      },
      tweens: {
        add: vi.fn().mockImplementation((config) => {
          if (config.onComplete) config.onComplete()
          return { stop: vi.fn() }
        })
      },
      time: {
        addEvent: vi.fn().mockReturnValue({ remove: vi.fn(), destroy: vi.fn() }),
        delayedCall: vi.fn().mockImplementation((delay, callback) => {
          setTimeout(callback, 0)
          return { destroy: vi.fn() }
        }),
        now: 1000
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0,
          shake: vi.fn()
        }
      },
      textures: {
        exists: vi.fn().mockReturnValue(true)
      },
      anims: {
        exists: vi.fn().mockReturnValue(true)
      }
    }
    
    mockAudioManager = {
      playBossSound: vi.fn(),
      playExplosion: vi.fn()
    }
    
    // Import BossManager
    const module = await import('../managers/BossManager')
    BossManager = module.BossManager
    
    bossManager = new BossManager(mockScene, mockAudioManager)
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  describe('findNextUndefeatedBoss', () => {
    it('should return start index when no bosses defeated', () => {
      const result = bossManager.findNextUndefeatedBoss(5)
      expect(result).toBe(5)
    })
    
    it('should skip defeated bosses', () => {
      localStorageMock.setItem('Guest_boss_5', 'defeated')
      localStorageMock.setItem('Guest_boss_6', 'defeated')
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'Guest_boss_5') return 'defeated'
        if (key === 'Guest_boss_6') return 'defeated'
        if (key === 'player_name') return null
        return null
      })
      
      const result = bossManager.findNextUndefeatedBoss(5)
      expect(result).toBe(7)
    })
    
    it('should wrap around when all bosses after start are defeated', () => {
      // Mock all bosses from 22 to 23 as defeated
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'Guest_boss_22') return 'defeated'
        if (key === 'Guest_boss_23') return 'defeated'
        if (key === 'player_name') return null
        return null
      })
      
      const result = bossManager.findNextUndefeatedBoss(22)
      // Should wrap around to 0
      expect(result).toBe(0)
    })
    
    it('should return 0 when all bosses are defeated', () => {
      // Mock all 24 bosses as defeated
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key.startsWith('Guest_boss_')) return 'defeated'
        if (key === 'player_name') return null
        return null
      })
      
      const result = bossManager.findNextUndefeatedBoss(0)
      expect(result).toBe(0)
    })
    
    it('should use player_name from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'player_name') return 'TestPlayer'
        if (key === 'TestPlayer_boss_0') return 'defeated'
        return null
      })
      
      const result = bossManager.findNextUndefeatedBoss(0)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('player_name')
      expect(result).toBe(1)
    })
  })
  
  describe('create', () => {
    it('should create boss projectiles group', () => {
      bossManager.create()
      expect(mockScene.physics.add.group).toHaveBeenCalledWith({ runChildUpdate: true })
    })
  })
  
  describe('setCurrentLevel', () => {
    it('should set current level', () => {
      bossManager.setCurrentLevel(10)
      expect(bossManager.currentLevel).toBe(10)
    })
  })
  
  describe('spawnBoss', () => {
    beforeEach(() => {
      bossManager.create()
    })
    
    it('should not spawn if boss already active', async () => {
      bossManager.bossActive = true
      await bossManager.spawnBoss(1000)
      expect(mockScene.physics.add.sprite).not.toHaveBeenCalled()
    })
    
    it('should spawn boss sprite at correct position', async () => {
      await bossManager.spawnBoss(1000)
      expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(1000, 350, expect.any(String))
    })
    
    it('should set boss as active after spawn', async () => {
      await bossManager.spawnBoss(1000)
      expect(bossManager.bossActive).toBe(true)
    })
    
    it('should emit boss-spawned event', async () => {
      const emitSpy = vi.spyOn(bossManager, 'emit')
      await bossManager.spawnBoss(1000)
      // Event name is 'boss-spawned' from GAME_EVENTS.BOSS_SPAWNED
      expect(emitSpy).toHaveBeenCalledWith('boss-spawned', expect.any(Object))
    })
    
    it('should play boss sound', async () => {
      await bossManager.spawnBoss(1000)
      expect(mockAudioManager.playBossSound).toHaveBeenCalled()
    })
    
    it('should use forced boss index when provided', async () => {
      await bossManager.spawnBoss(1000, 5)
      expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(1000, 350, 'boss_05')
    })
    
    it('should calculate boss index from level when not forced', async () => {
      bossManager.currentLevel = 10 // Level 10 -> boss index = floor(10/5) - 1 = 1
      await bossManager.spawnBoss(1000)
      expect(mockScene.physics.add.sprite).toHaveBeenCalled()
    })
    
    it('should scale boss health with level', async () => {
      bossManager.currentLevel = 5
      await bossManager.spawnBoss(1000)
      
      // Boss health = 50 + (level * 20) = 50 + (5 * 20) = 150
      expect(bossManager.boss.setData).toHaveBeenCalledWith('health', 150)
      expect(bossManager.boss.setData).toHaveBeenCalledWith('maxHealth', 150)
    })
    
    it('should configure boss physics body', async () => {
      await bossManager.spawnBoss(1000)
      
      expect(bossManager.boss.body.setSize).toHaveBeenCalled()
      expect(bossManager.boss.body.setOffset).toHaveBeenCalled()
      expect(bossManager.boss.body.setAllowGravity).toHaveBeenCalledWith(false)
    })
  })
  
  describe('attack360Spray', () => {
    beforeEach(() => {
      bossManager.create()
      bossManager.boss = createSpriteMock({ x: 500, y: 350 })
      bossManager.bossActive = true
    })
    
    it('should create 12 projectiles in a circle', () => {
      bossManager.attack360Spray()
      
      // Uses scene.physics.add.sprite directly, not group.create
      expect(mockScene.physics.add.sprite).toHaveBeenCalledTimes(12)
    })
    
    it('should set projectile tint to red', () => {
      const projectile = createSpriteMock()
      mockScene.physics.add.sprite = vi.fn().mockReturnValue(projectile)
      
      bossManager.attack360Spray()
      
      expect(projectile.setTint).toHaveBeenCalledWith(0xff0000)
    })
    
    it('should not create projectiles if no boss', () => {
      bossManager.boss = null
      mockScene.physics.add.sprite = vi.fn()
      bossManager.attack360Spray()
      expect(mockScene.physics.add.sprite).not.toHaveBeenCalled()
    })
  })
  
  describe('attackHoming', () => {
    beforeEach(() => {
      bossManager.create()
      bossManager.boss = createSpriteMock({ x: 500, y: 350 })
      bossManager.bossActive = true
    })
    
    it('should create homing projectiles with delay', async () => {
      // attackHoming takes playerX, playerY as params
      bossManager.attackHoming(300, 400)
      
      // Wait for delayed calls
      await new Promise(r => setTimeout(r, 10))
      
      // Should schedule 3 projectiles
      expect(mockScene.time.delayedCall).toHaveBeenCalled()
    })
    
    it('should not create projectiles if no boss', () => {
      bossManager.boss = null
      bossManager.attackHoming(300, 400)
      expect(mockScene.time.delayedCall).not.toHaveBeenCalled()
    })
  })
  
  describe('defeatBoss', () => {
    beforeEach(() => {
      bossManager.create()
      bossManager.boss = createSpriteMock({ x: 500, y: 350 })
      bossManager.bossActive = true
      // UI elements are created during spawnBoss, but we're testing defeatBoss directly
    })
    
    it('should mark boss as inactive', () => {
      bossManager.defeatBoss()
      expect(bossManager.bossActive).toBe(false)
    })
    
    it('should emit boss-defeated event', () => {
      const emitSpy = vi.spyOn(bossManager, 'emit')
      bossManager.defeatBoss()
      expect(emitSpy).toHaveBeenCalledWith('boss-defeated', expect.any(Object))
    })
    
    it('should save boss as defeated in localStorage', () => {
      bossManager.boss.setData('bossIndex', 5)
      bossManager.defeatBoss()
      // Uses player_name from localStorage (mocked as 'TestPlayer' or 'Guest')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(expect.stringContaining('_boss_5'), 'defeated')
    })
    
    it('should create death animation', () => {
      bossManager.defeatBoss()
      expect(mockScene.tweens.add).toHaveBeenCalled()
    })
    
    it('should handle missing boss gracefully', () => {
      bossManager.boss = null
      expect(() => bossManager.defeatBoss()).not.toThrow()
    })
  })
  
  describe('cleanupBossUI', () => {
    it('should destroy health bar if exists and set to null', () => {
      const destroyFn = vi.fn()
      bossManager.bossHealthBar = { destroy: destroyFn }
      bossManager.cleanupBossUI()
      expect(destroyFn).toHaveBeenCalled()
      expect(bossManager.bossHealthBar).toBeNull()
    })
    
    it('should destroy health background if exists and set to null', () => {
      const destroyFn = vi.fn()
      bossManager.bossHealthBarBg = { destroy: destroyFn }
      bossManager.cleanupBossUI()
      expect(destroyFn).toHaveBeenCalled()
      expect(bossManager.bossHealthBarBg).toBeNull()
    })
    
    it('should destroy name text if exists and set to null', () => {
      const destroyFn = vi.fn()
      bossManager.bossNameText = { destroy: destroyFn }
      bossManager.cleanupBossUI()
      expect(destroyFn).toHaveBeenCalled()
      expect(bossManager.bossNameText).toBeNull()
    })
    
    it('should handle missing UI elements gracefully', () => {
      bossManager.bossHealthBar = null
      bossManager.bossHealthBarBg = null
      bossManager.bossNameText = null
      expect(() => bossManager.cleanupBossUI()).not.toThrow()
    })
  })
  
  describe('update', () => {
    beforeEach(() => {
      bossManager.create()
      bossManager.bossActive = true
    })
    
    it('should not update if boss not active', () => {
      bossManager.bossActive = false
      bossManager.boss = createSpriteMock()
      bossManager.update(300, 400)
      expect(bossManager.boss.setVelocityX).not.toHaveBeenCalled()
    })
    
    it('should not update if no boss sprite', () => {
      bossManager.boss = null
      expect(() => bossManager.update(300, 400)).not.toThrow()
    })
    
    it('should update boss movement toward player', () => {
      bossManager.boss = createSpriteMock({ x: 500, y: 350, active: true })
      bossManager.boss.getData = vi.fn().mockImplementation((key: string) => {
        if (key === 'lastAttack') return 0
        if (key === 'attackCooldown') return 20000 // Long cooldown to avoid attack
        if (key === 'phase') return 1
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        return null
      })
      
      // Player is far to the left
      bossManager.update(100, 400)
      
      // Boss should move toward player
      expect(bossManager.boss.setVelocityX).toHaveBeenCalled()
    })
  })
  
  describe('damageBoss', () => {
    beforeEach(() => {
      bossManager.create()
      bossManager.boss = createSpriteMock({ x: 500, y: 350, health: 100, maxHealth: 100, active: true })
      bossManager.bossActive = true
    })
    
    it('should reduce boss health', () => {
      bossManager.boss.getData = vi.fn().mockImplementation((key: string) => {
        if (key === 'health') return 100
        if (key === 'maxHealth') return 100
        return null
      })
      
      bossManager.damageBoss(20)
      
      expect(bossManager.boss.setData).toHaveBeenCalledWith('health', 80)
    })
    
    it('should trigger defeat when health reaches 0', () => {
      const defeatSpy = vi.spyOn(bossManager, 'defeatBoss').mockImplementation(() => {})
      
      bossManager.boss.getData = vi.fn().mockImplementation((key: string) => {
        if (key === 'health') return 10
        return null
      })
      
      bossManager.damageBoss(10)
      
      expect(defeatSpy).toHaveBeenCalled()
    })
    
    it('should return false if boss not present', () => {
      bossManager.boss = null
      const result = bossManager.damageBoss(20)
      expect(result).toBe(false)
    })
    
    it('should return false if boss not active', () => {
      bossManager.boss.active = false
      const result = bossManager.damageBoss(20)
      expect(result).toBe(false)
    })
    
    it('should flash boss red on damage', () => {
      bossManager.boss.getData = vi.fn().mockReturnValue(100)
      bossManager.damageBoss(20)
      expect(bossManager.boss.setTint).toHaveBeenCalledWith(0xff0000)
    })
  })
  
  describe('getBoss', () => {
    it('should return boss sprite when exists', () => {
      bossManager.boss = createSpriteMock()
      expect(bossManager.getBoss()).toBe(bossManager.boss)
    })
    
    it('should return null when no boss', () => {
      bossManager.boss = null
      expect(bossManager.getBoss()).toBeNull()
    })
  })
  
  describe('isBossActive', () => {
    it('should return true when boss is active', () => {
      bossManager.bossActive = true
      expect(bossManager.isBossActive()).toBe(true)
    })
    
    it('should return false when boss is not active', () => {
      bossManager.bossActive = false
      expect(bossManager.isBossActive()).toBe(false)
    })
  })
  
  describe('getBossProjectiles', () => {
    it('should return boss projectiles group', () => {
      bossManager.create()
      expect(bossManager.getBossProjectiles()).toBeDefined()
    })
  })
})
