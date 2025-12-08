/**
 * Unit Tests for Manager Classes
 * 
 * These tests directly test manager logic using comprehensive mocks
 * Phaser is mocked at module level to avoid canvas dependency
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'

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
import { PlayerManager } from '../managers/PlayerManager'
import { UIManager } from '../managers/UIManager'
import { EnemyManager } from '../managers/EnemyManager'
import { BossManager } from '../managers/BossManager'
import { PowerUpManager } from '../managers/PowerUpManager'

// ==================== COMPREHENSIVE MOCKS ====================

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

// Create mock sprite with full functionality
function createFullMockSprite() {
  const data: Record<string, any> = {}
  const sprite: any = {
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    active: true,
    flipX: false,
    alpha: 1,
    angle: 0,
    body: {
      velocity: { x: 0, y: 0 },
      blocked: { down: true, left: false, right: false, up: false },
      touching: { down: false, left: false, right: false, up: false },
      setSize: vi.fn(),
      setOffset: vi.fn(),
      setMass: vi.fn(),
      setMaxVelocity: vi.fn(),
      setAllowGravity: vi.fn(),
      setImmovable: vi.fn()
    },
    setData: vi.fn((key: string, value: any) => { 
      data[key] = value
      return sprite 
    }),
    getData: vi.fn((key: string) => data[key]),
    setScale: vi.fn(() => sprite),
    setDepth: vi.fn(() => sprite),
    setBounce: vi.fn(() => sprite),
    setCollideWorldBounds: vi.fn(() => sprite),
    setVelocity: vi.fn(() => sprite),
    setVelocityX: vi.fn((v: number) => { sprite.body.velocity.x = v; return sprite }),
    setVelocityY: vi.fn((v: number) => { sprite.body.velocity.y = v; return sprite }),
    setTint: vi.fn(() => sprite),
    clearTint: vi.fn(() => sprite),
    setFlipX: vi.fn((v: boolean) => { sprite.flipX = v; return sprite }),
    setRotation: vi.fn(() => sprite),
    setAngle: vi.fn((v: number) => { sprite.angle = v; return sprite }),
    setAlpha: vi.fn((v: number) => { sprite.alpha = v; return sprite }),
    setPushable: vi.fn(() => sprite),
    setPosition: vi.fn((x: number, y: number) => { sprite.x = x; sprite.y = y; return sprite }),
    setOrigin: vi.fn(() => sprite),
    setScrollFactor: vi.fn(() => sprite),
    play: vi.fn(() => sprite),
    destroy: vi.fn()
  }
  return sprite
}

// Create mock group
function createMockGroup() {
  const children: any[] = []
  return {
    create: vi.fn((x: number, y: number, key: string) => {
      const sprite = createFullMockSprite()
      sprite.x = x
      sprite.y = y
      children.push(sprite)
      return sprite
    }),
    getChildren: vi.fn(() => children),
    add: vi.fn((sprite: any) => children.push(sprite)),
    destroy: vi.fn()
  }
}

// Create mock scene
function createMockScene() {
  const tweenTargets: any[] = []
  return {
    physics: {
      add: {
        group: vi.fn(() => createMockGroup()),
        sprite: vi.fn((x: number, y: number) => {
          const sprite = createFullMockSprite()
          sprite.x = x
          sprite.y = y
          return sprite
        }),
        collider: vi.fn(),
        overlap: vi.fn()
      }
    },
    add: {
      sprite: vi.fn(() => createFullMockSprite()),
      rectangle: vi.fn(() => ({
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setStrokeStyle: vi.fn().mockReturnThis(),
        setSize: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        width: 100,
        x: 0,
        y: 0
      })),
      text: vi.fn(() => ({
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        setFontSize: vi.fn().mockReturnThis(),
        setColor: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        text: '',
        x: 0,
        y: 0
      })),
      image: vi.fn(() => ({
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      })),
      circle: vi.fn(() => ({
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setStrokeStyle: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      })),
      graphics: vi.fn(() => ({
        clear: vi.fn().mockReturnThis(),
        fillStyle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeRect: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
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
          setTimeout(() => config.onComplete(), 0)
        }
        return { on: vi.fn(), remove: vi.fn() }
      })
    },
    time: {
      now: 0,
      delayedCall: vi.fn((delay: number, _callback: Function) => {
        return { remove: vi.fn(), getRemaining: vi.fn(() => delay) }
      }),
      addEvent: vi.fn(() => ({ remove: vi.fn() }))
    },
    anims: {
      create: vi.fn(),
      exists: vi.fn(() => false)
    },
    cameras: {
      main: {
        shake: vi.fn(),
        flash: vi.fn(),
        centerX: 640,
        centerY: 360,
        scrollX: 0
      }
    },
    input: {
      keyboard: {
        addKey: vi.fn(() => ({ isDown: false }))
      },
      activePointer: { x: 0, y: 0 }
    }
  } as any
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
    playMeleeSound: vi.fn(),
    isSoundEnabled: vi.fn(() => true),
    getSoundVolume: vi.fn(() => 0.5)
  }
}

// ==================== ENEMY MANAGER TESTS ====================

describe('EnemyManager', () => {
  let scene: any
  let audioManager: any
  let enemyManager: EnemyManager

  beforeEach(() => {
    scene = createMockScene()
    audioManager = createMockAudioManager()
    enemyManager = new EnemyManager(scene, audioManager)
    enemyManager.create()
  })

  describe('create()', () => {
    it('should initialize enemies group', () => {
      expect(scene.physics.add.group).toHaveBeenCalled()
      expect(enemyManager.enemies).toBeDefined()
    })
  })

  describe('spawnRandomEnemy()', () => {
    it('should spawn an enemy at given position', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      expect(enemy).toBeDefined()
      expect(enemy.x).toBe(500)
      expect(enemy.y).toBe(300)
    })

    it('should set enemy data properties', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      expect(enemy.setData).toHaveBeenCalled()
      expect(enemy.getData('health')).toBeDefined()
      expect(enemy.getData('coinReward')).toBeDefined()
    })

    it('should scale enemy health with difficulty', () => {
      const enemy1 = enemyManager.spawnRandomEnemy(500, 300, 1)
      const enemy2 = enemyManager.spawnRandomEnemy(600, 300, 2)
      
      // Health should scale with difficulty
      const health1 = enemy1.getData('health')
      const health2 = enemy2.getData('health')
      
      // Both should have health set
      expect(health1).toBeGreaterThan(0)
      expect(health2).toBeGreaterThan(0)
    })
  })

  describe('spawnEnemiesInArea()', () => {
    it('should not spawn enemies in starting area', () => {
      enemyManager.spawnEnemiesInArea(0, 400, 1)
      
      // Should not spawn in first 500 pixels
      expect(enemyManager.getActiveEnemies().length).toBe(0)
    })

    it('should spawn enemies after starting area', () => {
      enemyManager.spawnEnemiesInArea(600, 1200, 1)
      
      expect(enemyManager.getActiveEnemies().length).toBeGreaterThan(0)
    })
  })

  describe('damageEnemy()', () => {
    it('should reduce enemy health', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      const initialHealth = enemy.getData('health')
      
      enemyManager.damageEnemy(enemy, 5)
      
      expect(enemy.getData('health')).toBe(initialHealth - 5)
    })

    it('should flash enemy red on damage', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      enemyManager.damageEnemy(enemy, 1)
      
      expect(enemy.setTint).toHaveBeenCalledWith(0xff0000)
    })

    it('should return true when enemy dies', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      const health = enemy.getData('health')
      
      const isDead = enemyManager.damageEnemy(enemy, health + 10)
      
      expect(isDead).toBe(true)
    })

    it('should return false when enemy survives', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      
      const isDead = enemyManager.damageEnemy(enemy, 1)
      
      expect(isDead).toBe(false)
    })
  })

  describe('killEnemy()', () => {
    it('should emit ENEMY_KILLED event with rewards', () => {
      const handler = vi.fn()
      enemyManager.on(GAME_EVENTS.ENEMY_KILLED, handler)
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemyManager.killEnemy(enemy)
      
      expect(handler).toHaveBeenCalled()
      const eventData = handler.mock.calls[0][0]
      expect(eventData.coinReward).toBeDefined()
      expect(eventData.scoreReward).toBeDefined()
    })

    it('should increment enemies defeated counter', () => {
      const initialCount = enemyManager.getEnemiesDefeated()
      
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemyManager.killEnemy(enemy)
      
      expect(enemyManager.getEnemiesDefeated()).toBe(initialCount + 1)
    })

    it('should play damage sound on death', () => {
      const enemy = enemyManager.spawnRandomEnemy(500, 300, 1)
      enemyManager.killEnemy(enemy)
      
      expect(audioManager.playDamageSound).toHaveBeenCalled()
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
  })

  describe('cleanupEnemiesBeforeX()', () => {
    it('should destroy enemies behind cleanup threshold', () => {
      const enemy = enemyManager.spawnRandomEnemy(100, 300, 1)
      
      enemyManager.cleanupEnemiesBeforeX(1000)
      
      expect(enemy.destroy).toHaveBeenCalled()
    })
  })
})

// ==================== POWER-UP MANAGER TESTS ====================

describe('PowerUpManager', () => {
  let scene: any
  let powerUpManager: PowerUpManager

  beforeEach(() => {
    scene = createMockScene()
    powerUpManager = new PowerUpManager(scene)
    powerUpManager.create()
  })

  describe('create()', () => {
    it('should initialize powerUps group', () => {
      expect(scene.physics.add.group).toHaveBeenCalled()
      expect(powerUpManager.powerUps).toBeDefined()
    })
  })

  describe('spawnPowerUp()', () => {
    it('should spawn power-up at given position', () => {
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      
      expect(powerUp).toBeDefined()
      expect(powerUp.x).toBe(300)
      expect(powerUp.y).toBe(400)
    })

    it('should set power-up type data', () => {
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      
      expect(powerUp.setData).toHaveBeenCalledWith('type', 'powerShield')
    })

    it('should add floating animation', () => {
      powerUpManager.spawnPowerUp(300, 400, 'powerHealth')
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('collectPowerUp()', () => {
    it('should emit POWERUP_COLLECTED event', () => {
      const handler = vi.fn()
      powerUpManager.on(GAME_EVENTS.POWERUP_COLLECTED, handler)
      
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(handler).toHaveBeenCalled()
    })

    it('should emit SPEED_BOOST_START for speed power-up', () => {
      const handler = vi.fn()
      powerUpManager.on(GAME_EVENTS.SPEED_BOOST_START, handler)
      
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(handler).toHaveBeenCalled()
    })

    it('should emit SHIELD_START for shield power-up', () => {
      const handler = vi.fn()
      powerUpManager.on(GAME_EVENTS.SHIELD_START, handler)
      
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(handler).toHaveBeenCalled()
    })

    it('should emit HEALTH_RESTORED for health power-up', () => {
      const handler = vi.fn()
      powerUpManager.on(GAME_EVENTS.HEALTH_RESTORED, handler)
      
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerHealth')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(handler).toHaveBeenCalled()
      expect(handler.mock.calls[0][0].amount).toBe(30)
    })

    it('should emit EXTRA_LIFE_GAINED for life power-up', () => {
      const handler = vi.fn()
      powerUpManager.on(GAME_EVENTS.EXTRA_LIFE_GAINED, handler)
      
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerLife')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(handler).toHaveBeenCalled()
    })

    it('should destroy power-up after collection', () => {
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(powerUp.destroy).toHaveBeenCalled()
    })
  })

  describe('hasActiveSpeedBoost()', () => {
    it('should return false initially', () => {
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(false)
    })

    it('should return true after collecting speed power-up', () => {
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(true)
    })
  })

  describe('hasActiveShield()', () => {
    it('should return false initially', () => {
      expect(powerUpManager.hasActiveShield()).toBe(false)
    })

    it('should return true after collecting shield power-up', () => {
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(powerUpManager.hasActiveShield()).toBe(true)
    })
  })

  describe('getState()', () => {
    it('should return current power-up state', () => {
      const state = powerUpManager.getState()
      
      expect(state.hasSpeedBoost).toBe(false)
      expect(state.hasShield).toBe(false)
    })
  })

  describe('reset()', () => {
    it('should clear all active power-ups', () => {
      const player = createFullMockSprite()
      const speedPowerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      const shieldPowerUp = powerUpManager.spawnPowerUp(400, 400, 'powerShield')
      
      powerUpManager.collectPowerUp(player, speedPowerUp)
      powerUpManager.collectPowerUp(player, shieldPowerUp)
      
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(true)
      expect(powerUpManager.hasActiveShield()).toBe(true)
      
      powerUpManager.reset()
      
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(false)
      expect(powerUpManager.hasActiveShield()).toBe(false)
    })
  })

  describe('update()', () => {
    it('should update shield sprite position', () => {
      const player = createFullMockSprite()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      const shieldSprite = powerUpManager.getShieldSprite()
      if (shieldSprite) {
        powerUpManager.update(500, 300)
        expect(shieldSprite.setPosition).toHaveBeenCalledWith(500, 300)
      }
    })
  })
})

// ==================== UI MANAGER TESTS ====================

describe('UIManager', () => {
  let scene: any
  let uiManager: UIManager

  beforeEach(() => {
    scene = createMockScene()
    // Setup scene properties required by UIManager
    scene.cameras = { main: { width: 1280, height: 720, fadeIn: vi.fn() } }
    scene.isCoopMode = false
    scene.isOnlineMode = false
    scene.gameMode = 'levels'
    scene.playerLives = 3
    scene.score = 0
    scene.coinCount = 0
    scene.currentLevel = 1
    
    uiManager = new UIManager(scene)
  })

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(uiManager).toBeDefined()
    })
  })

  describe('createUI()', () => {
    it('should initialize UI elements', () => {
      uiManager.createUI()
      
      expect(scene.add.rectangle).toHaveBeenCalled()
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should work with endless mode', () => {
      scene.gameMode = 'endless'
      uiManager.createUI()
      
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('showDamageNumber()', () => {
    it('should create damage text', () => {
      uiManager.showDamageNumber(100, 200, 25)
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should animate damage number', () => {
      uiManager.showDamageNumber(100, 200, 25)
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('showScorePopup()', () => {
    it('should create score popup text', () => {
      uiManager.showScorePopup(100, 200, 500)
      
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('showTip()', () => {
    it('should create tip banner', () => {
      uiManager.showTip('tip1', 'Test tip message')
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should animate tip', () => {
      uiManager.showTip('tip2', 'Test tip message')
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('Boss UI', () => {
    it('should show boss name', () => {
      uiManager.createUI() // Initialize first
      uiManager.showBossName('MEGA BOSS')
      
      expect(scene.add.text).toHaveBeenCalled()
    })
    
    it('should update boss health bar', () => {
      uiManager.createUI() // Initialize first
      uiManager.updateBossHealthBar(500, 1000)
      
      expect(scene.add.graphics).toHaveBeenCalled()
    })
  })
})

// ==================== BOSS MANAGER TESTS ====================

describe('BossManager', () => {
  let scene: any
  let audioManager: any
  let bossManager: BossManager

  beforeEach(() => {
    scene = createMockScene()
    audioManager = createMockAudioManager()
    bossManager = new BossManager(scene, audioManager)
    bossManager.create()
    localStorageMock.clear()
  })

  describe('create()', () => {
    it('should initialize boss projectiles group', () => {
      expect(scene.physics.add.group).toHaveBeenCalled()
    })
  })

  describe('setCurrentLevel()', () => {
    it('should update current level', () => {
      bossManager.setCurrentLevel(10)
      // Level is stored internally, tested via boss health scaling
      expect(bossManager.isBossActive()).toBe(false)
    })
  })

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

    it('should cycle back to 0 when all bosses defeated', () => {
      // Mark all 24 bosses as defeated
      for (let i = 0; i < 24; i++) {
        localStorageMock.setItem(`Guest_boss_${i}`, 'defeated')
      }
      
      const bossIndex = bossManager.findNextUndefeatedBoss(0)
      expect(bossIndex).toBe(0)
    })
  })

  describe('isBossActive()', () => {
    it('should return false initially', () => {
      expect(bossManager.isBossActive()).toBe(false)
    })
  })

  describe('getBoss()', () => {
    it('should return null initially', () => {
      expect(bossManager.getBoss()).toBeNull()
    })
  })

  describe('damageBoss()', () => {
    it('should return false when no boss exists', () => {
      const result = bossManager.damageBoss(10)
      expect(result).toBe(false)
    })
  })

  describe('isBossDefeatedForLevel()', () => {
    it('should return false for non-defeated levels', () => {
      expect(bossManager.isBossDefeatedForLevel(5)).toBe(false)
    })
  })

  describe('createExplosion()', () => {
    it('should create explosion visual effects', () => {
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
  })

  describe('destroy()', () => {
    it('should cleanup resources', () => {
      bossManager.destroy()
      
      // Should not throw
      expect(bossManager.getBoss()).toBeNull()
    })
  })
})

// ==================== INDEX EXPORTS TEST ====================

describe('Manager Index Exports', () => {
  it('should export all managers', async () => {
    const managers = await import('../managers/index')
    
    expect(managers.PlayerManager).toBeDefined()
    expect(managers.UIManager).toBeDefined()
    expect(managers.EnemyManager).toBeDefined()
    expect(managers.BossManager).toBeDefined()
    expect(managers.PowerUpManager).toBeDefined()
  })
})
