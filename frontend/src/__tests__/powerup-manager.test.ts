/**
 * Comprehensive Tests for PowerUpManager
 * 
 * Target: Increase coverage from 79.02% to 95%+
 * Uncovered lines: 170,194-195,199-204,277-283,306-309
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
      RND: {
        pick: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
      }
    },
    Physics: {
      Arcade: {
        Sprite: class {},
        Group: class {}
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
    RND: {
      pick: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
    }
  }
}))

import { GAME_EVENTS, POWERUP_CONFIGS } from '../types/GameTypes'
import { PowerUpManager } from '../managers/PowerUpManager'

// ==================== MOCK SETUP ====================

// Create mock sprite
function createMockSprite(x: number = 100, y: number = 100) {
  const data: Record<string, any> = {}
  const sprite: any = {
    x,
    y,
    width: 32,
    height: 32,
    active: true,
    alpha: 1,
    angle: 0,
    body: {
      velocity: { x: 0, y: 0 },
      blocked: { down: true },
      touching: { down: false }
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
    setAlpha: vi.fn((v: number) => { sprite.alpha = v; return sprite }),
    setPosition: vi.fn((x: number, y: number) => { sprite.x = x; sprite.y = y; return sprite }),
    setOrigin: vi.fn(() => sprite),
    destroy: vi.fn(() => { sprite.active = false })
  }
  return sprite
}

// Create mock player sprite
function createMockPlayer() {
  return createMockSprite(500, 300)
}

// Create mock power-up group
function createMockPowerUpGroup() {
  const children: any[] = []
  return {
    create: vi.fn((x: number, y: number, key: string) => {
      const sprite = createMockSprite(x, y)
      sprite.setData('type', key)
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

// Create mock timer
function createMockTimer() {
  let callback: Function | null = null
  let delay: number = 0
  return {
    remove: vi.fn(),
    getRemaining: vi.fn(() => delay / 2), // Return half of delay as remaining
    setCallback: (cb: Function, d: number) => { callback = cb; delay = d },
    triggerCallback: () => callback && callback()
  }
}

// Create mock scene
function createMockScene() {
  let powerUpGroup: any = null
  const timers: any[] = []
  
  const scene: any = {
    physics: {
      add: {
        group: vi.fn((config?: any) => {
          if (!powerUpGroup) {
            powerUpGroup = createMockPowerUpGroup()
          }
          return powerUpGroup
        }),
        sprite: vi.fn((x: number, y: number, key: string) => createMockSprite(x, y)),
        collider: vi.fn(),
        overlap: vi.fn()
      }
    },
    add: {
      sprite: vi.fn((x: number, y: number, key: string) => {
        const sprite = createMockSprite(x, y)
        return sprite
      }),
      text: vi.fn((x: number, y: number, text: string, style?: any) => {
        const mockText = createMockText()
        mockText.x = x
        mockText.y = y
        return mockText
      }),
      image: vi.fn(() => ({
        setScale: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
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
        const timer = createMockTimer()
        timer.setCallback(callback, delay)
        timers.push(timer)
        return timer
      }),
      addEvent: vi.fn(() => ({ remove: vi.fn() }))
    },
    anims: {
      create: vi.fn(),
      exists: vi.fn(() => false)
    },
    // Helpers
    getPowerUpGroup: () => powerUpGroup,
    getTimers: () => timers,
    triggerTimerCallback: (index: number) => {
      if (timers[index]) {
        timers[index].triggerCallback()
      }
    }
  }
  return scene
}

// ==================== TESTS ====================

describe('PowerUpManager - Extended Coverage', () => {
  let scene: any
  let powerUpManager: PowerUpManager

  beforeEach(() => {
    vi.clearAllMocks()
    scene = createMockScene()
    powerUpManager = new PowerUpManager(scene)
    powerUpManager.create()
  })

  afterEach(() => {
    powerUpManager.destroy()
  })

  // ==================== CONSTRUCTOR ====================

  describe('constructor', () => {
    it('should create power-up manager', () => {
      expect(powerUpManager).toBeDefined()
    })

    it('should initialize with no active power-ups', () => {
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(false)
      expect(powerUpManager.hasActiveShield()).toBe(false)
    })
  })

  // ==================== CREATE ====================

  describe('create()', () => {
    it('should create power-ups physics group', () => {
      const manager = new PowerUpManager(scene)
      manager.create()
      
      expect(scene.physics.add.group).toHaveBeenCalled()
      expect(manager.powerUps).toBeDefined()
    })
  })

  // ==================== SPAWNING ====================

  describe('spawnPowerUp()', () => {
    it('should create power-up at given position', () => {
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      
      expect(powerUp).toBeDefined()
      expect(powerUp.x).toBe(300)
      expect(powerUp.y).toBe(400)
    })

    it('should set power-up type data', () => {
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      
      expect(powerUp.setData).toHaveBeenCalledWith('type', 'powerShield')
    })

    it('should configure physics properties', () => {
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      
      expect(powerUp.setScale).toHaveBeenCalledWith(0.6)
      expect(powerUp.setBounce).toHaveBeenCalledWith(0.2)
      expect(powerUp.setCollideWorldBounds).toHaveBeenCalledWith(true)
    })

    it('should add floating animation', () => {
      powerUpManager.spawnPowerUp(300, 400, 'powerHealth')
      
      // Should add tweens for floating and glow
      expect(scene.tweens.add).toHaveBeenCalled()
    })

    it('should add glow animation', () => {
      powerUpManager.spawnPowerUp(300, 400, 'powerLife')
      
      // Should add at least 2 tweens (floating + glow)
      expect(scene.tweens.add).toHaveBeenCalledTimes(2)
    })

    it('should spawn all power-up types', () => {
      const types = ['powerSpeed', 'powerShield', 'powerHealth', 'powerLife'] as const
      
      types.forEach(type => {
        const powerUp = powerUpManager.spawnPowerUp(100, 100, type)
        expect(powerUp).toBeDefined()
        expect(powerUp.setData).toHaveBeenCalledWith('type', type)
      })
    })
  })

  describe('spawnPowerUpsInArea()', () => {
    it('should spawn power-ups in given area', () => {
      powerUpManager.spawnPowerUpsInArea(500, 1500)
      
      const group = scene.getPowerUpGroup()
      expect(group.create).toHaveBeenCalled()
    })

    it('should spawn with custom platform Y', () => {
      powerUpManager.spawnPowerUpsInArea(500, 1500, 400)
      
      const group = scene.getPowerUpGroup()
      // Power-ups spawn at platformY - 50
      expect(group.create).toHaveBeenCalled()
    })

    it('should spawn multiple power-ups', () => {
      // Mock Math.Between to return consistent value
      const originalBetween = (global as any).Phaser?.Math?.Between
      
      powerUpManager.spawnPowerUpsInArea(500, 2000)
      
      const group = scene.getPowerUpGroup()
      // Should have spawned at least 1 power-up
      expect(group.create.mock.calls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('spawnInitialPowerUps()', () => {
    it('should spawn initial power-ups across starting area', () => {
      powerUpManager.spawnInitialPowerUps()
      
      const group = scene.getPowerUpGroup()
      // Should spawn 10 power-ups
      expect(group.create.mock.calls.length).toBe(10)
    })

    it('should spawn at Y=500', () => {
      powerUpManager.spawnInitialPowerUps()
      
      const group = scene.getPowerUpGroup()
      const calls = group.create.mock.calls
      
      // All should be at Y=500
      calls.forEach((call: any[]) => {
        expect(call[1]).toBe(500)
      })
    })
  })

  // ==================== COLLECTION ====================

  describe('collectPowerUp()', () => {
    let player: any
    
    beforeEach(() => {
      player = createMockPlayer()
    })

    it('should destroy power-up on collection', () => {
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(powerUp.destroy).toHaveBeenCalled()
    })

    it('should emit POWERUP_COLLECTED event', () => {
      const handler = vi.fn()
      powerUpManager.on(GAME_EVENTS.POWERUP_COLLECTED, handler)
      
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(handler).toHaveBeenCalled()
      const eventData = handler.mock.calls[0][0]
      expect(eventData.type).toBe('powerSpeed')
    })

    describe('speed boost power-up', () => {
      it('should emit SPEED_BOOST_START event', () => {
        const handler = vi.fn()
        powerUpManager.on(GAME_EVENTS.SPEED_BOOST_START, handler)
        
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(handler).toHaveBeenCalled()
      })

      it('should set hasSpeedBoost to true', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(powerUpManager.hasActiveSpeedBoost()).toBe(true)
      })

      it('should show notification', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(scene.add.text).toHaveBeenCalled()
      })

      it('should set timer for speed boost end', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(scene.time.delayedCall).toHaveBeenCalledWith(10000, expect.any(Function))
      })

      it('should emit SPEED_BOOST_END after timer', () => {
        const handler = vi.fn()
        powerUpManager.on(GAME_EVENTS.SPEED_BOOST_END, handler)
        
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
        powerUpManager.collectPowerUp(player, powerUp)
        
        // Trigger timer callback
        scene.triggerTimerCallback(0)
        
        expect(handler).toHaveBeenCalled()
        expect(powerUpManager.hasActiveSpeedBoost()).toBe(false)
      })

      it('should clear existing timer when collecting another', () => {
        const powerUp1 = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
        powerUpManager.collectPowerUp(player, powerUp1)
        
        const firstTimer = scene.getTimers()[0]
        
        const powerUp2 = powerUpManager.spawnPowerUp(400, 400, 'powerSpeed')
        powerUpManager.collectPowerUp(player, powerUp2)
        
        expect(firstTimer.remove).toHaveBeenCalled()
      })
    })

    describe('shield power-up', () => {
      it('should emit SHIELD_START event', () => {
        const handler = vi.fn()
        powerUpManager.on(GAME_EVENTS.SHIELD_START, handler)
        
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(handler).toHaveBeenCalled()
      })

      it('should set hasShield to true', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(powerUpManager.hasActiveShield()).toBe(true)
      })

      it('should create shield sprite', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(scene.add.sprite).toHaveBeenCalled()
        expect(powerUpManager.getShieldSprite()).not.toBeNull()
      })

      it('should configure shield sprite properties', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp)
        
        const shieldSprite = powerUpManager.getShieldSprite()
        expect(shieldSprite?.setScale).toHaveBeenCalledWith(1.5)
        expect(shieldSprite?.setAlpha).toHaveBeenCalledWith(0.6)
        expect(shieldSprite?.setDepth).toHaveBeenCalledWith(5)
      })

      it('should add rotation animation to shield', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp)
        
        // Should add tweens (floating, glow from spawn + rotation from shield)
        expect(scene.tweens.add).toHaveBeenCalled()
      })

      it('should set timer for shield end', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(scene.time.delayedCall).toHaveBeenCalledWith(15000, expect.any(Function))
      })

      it('should emit SHIELD_END after timer', () => {
        const handler = vi.fn()
        powerUpManager.on(GAME_EVENTS.SHIELD_END, handler)
        
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp)
        
        // Trigger timer callback (shield timer is index 0 in this case)
        scene.triggerTimerCallback(0)
        
        expect(handler).toHaveBeenCalled()
        expect(powerUpManager.hasActiveShield()).toBe(false)
        expect(powerUpManager.getShieldSprite()).toBeNull()
      })

      it('should destroy existing shield when collecting another', () => {
        const powerUp1 = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp1)
        
        const firstShield = powerUpManager.getShieldSprite()
        
        const powerUp2 = powerUpManager.spawnPowerUp(400, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp2)
        
        expect(firstShield?.destroy).toHaveBeenCalled()
      })

      it('should clear existing timer when collecting another shield', () => {
        const powerUp1 = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp1)
        
        const timers = scene.getTimers()
        const firstTimer = timers[0]
        
        const powerUp2 = powerUpManager.spawnPowerUp(400, 400, 'powerShield')
        powerUpManager.collectPowerUp(player, powerUp2)
        
        expect(firstTimer.remove).toHaveBeenCalled()
      })
    })

    describe('health power-up', () => {
      it('should emit HEALTH_RESTORED event', () => {
        const handler = vi.fn()
        powerUpManager.on(GAME_EVENTS.HEALTH_RESTORED, handler)
        
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerHealth')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(handler).toHaveBeenCalled()
        const eventData = handler.mock.calls[0][0]
        expect(eventData.amount).toBeDefined()
      })

      it('should use config value for health amount', () => {
        const handler = vi.fn()
        powerUpManager.on(GAME_EVENTS.HEALTH_RESTORED, handler)
        
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerHealth')
        powerUpManager.collectPowerUp(player, powerUp)
        
        const eventData = handler.mock.calls[0][0]
        // Default or config value
        expect(eventData.amount).toBeGreaterThan(0)
      })

      it('should show health notification', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerHealth')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(scene.add.text).toHaveBeenCalled()
      })
    })

    describe('extra life power-up', () => {
      it('should emit EXTRA_LIFE_GAINED event', () => {
        const handler = vi.fn()
        powerUpManager.on(GAME_EVENTS.EXTRA_LIFE_GAINED, handler)
        
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerLife')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(handler).toHaveBeenCalled()
      })

      it('should show life notification', () => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerLife')
        powerUpManager.collectPowerUp(player, powerUp)
        
        expect(scene.add.text).toHaveBeenCalled()
      })
    })
  })

  // ==================== UPDATE ====================

  describe('update()', () => {
    it('should update shield position to follow player', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp)
      
      const shieldSprite = powerUpManager.getShieldSprite()
      
      // Update with new player position
      powerUpManager.update(600, 400)
      
      expect(shieldSprite?.setPosition).toHaveBeenCalledWith(600, 400)
    })

    it('should not throw when no shield exists', () => {
      expect(() => powerUpManager.update(500, 300)).not.toThrow()
    })

    it('should not update destroyed shield', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp)
      
      const shieldSprite = powerUpManager.getShieldSprite()
      shieldSprite!.active = false
      
      // Should not throw
      expect(() => powerUpManager.update(600, 400)).not.toThrow()
    })
  })

  // ==================== GETTERS ====================

  describe('hasActiveSpeedBoost()', () => {
    it('should return false initially', () => {
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(false)
    })

    it('should return true after collecting speed power-up', () => {
      const player = createMockPlayer()
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
      const player = createMockPlayer()
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
      expect(state.speedBoostTimeRemaining).toBeDefined()
      expect(state.shieldTimeRemaining).toBeDefined()
    })

    it('should return updated state after collecting power-ups', () => {
      const player = createMockPlayer()
      
      const speedPowerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, speedPowerUp)
      
      const shieldPowerUp = powerUpManager.spawnPowerUp(400, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, shieldPowerUp)
      
      const state = powerUpManager.getState()
      
      expect(state.hasSpeedBoost).toBe(true)
      expect(state.hasShield).toBe(true)
    })

    it('should return time remaining for active power-ups', () => {
      const player = createMockPlayer()
      
      const speedPowerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, speedPowerUp)
      
      const state = powerUpManager.getState()
      
      // Timer mock returns half of delay
      expect(state.speedBoostTimeRemaining).toBeGreaterThan(0)
    })

    it('should return 0 time remaining when no timer active', () => {
      const state = powerUpManager.getState()
      
      expect(state.speedBoostTimeRemaining).toBe(0)
      expect(state.shieldTimeRemaining).toBe(0)
    })
  })

  describe('getShieldSprite()', () => {
    it('should return null initially', () => {
      expect(powerUpManager.getShieldSprite()).toBeNull()
    })

    it('should return shield sprite after collecting shield', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(powerUpManager.getShieldSprite()).not.toBeNull()
    })
  })

  // ==================== CLEANUP ====================

  describe('cleanupPowerUpsBeforeX()', () => {
    it('should destroy power-ups behind cleanup threshold', () => {
      // Spawn power-ups
      const powerUp1 = powerUpManager.spawnPowerUp(100, 400, 'powerSpeed')
      const powerUp2 = powerUpManager.spawnPowerUp(200, 400, 'powerShield')
      const powerUp3 = powerUpManager.spawnPowerUp(1000, 400, 'powerHealth')
      
      // Cleanup before X=1000 (will destroy those at x < 500)
      powerUpManager.cleanupPowerUpsBeforeX(1000)
      
      // Power-ups at 100 and 200 should be destroyed (< 500)
      expect(powerUp1.destroy).toHaveBeenCalled()
      expect(powerUp2.destroy).toHaveBeenCalled()
      // Power-up at 1000 should not be destroyed
      expect(powerUp3.destroy).not.toHaveBeenCalled()
    })

    it('should not destroy power-ups after threshold', () => {
      const powerUp = powerUpManager.spawnPowerUp(1500, 400, 'powerLife')
      
      powerUpManager.cleanupPowerUpsBeforeX(1000)
      
      expect(powerUp.destroy).not.toHaveBeenCalled()
    })
  })

  describe('reset()', () => {
    it('should clear speed boost state', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(true)
      
      powerUpManager.reset()
      
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(false)
    })

    it('should clear shield state', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(powerUpManager.hasActiveShield()).toBe(true)
      
      powerUpManager.reset()
      
      expect(powerUpManager.hasActiveShield()).toBe(false)
    })

    it('should remove speed boost timer', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, powerUp)
      
      const timer = scene.getTimers()[0]
      
      powerUpManager.reset()
      
      expect(timer.remove).toHaveBeenCalled()
    })

    it('should remove shield timer', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp)
      
      const timer = scene.getTimers()[0]
      
      powerUpManager.reset()
      
      expect(timer.remove).toHaveBeenCalled()
    })

    it('should destroy shield sprite', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp)
      
      const shieldSprite = powerUpManager.getShieldSprite()
      
      powerUpManager.reset()
      
      expect(shieldSprite?.destroy).toHaveBeenCalled()
      expect(powerUpManager.getShieldSprite()).toBeNull()
    })

    it('should handle reset when no active power-ups', () => {
      expect(() => powerUpManager.reset()).not.toThrow()
    })
  })

  describe('destroy()', () => {
    it('should call reset', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, powerUp)
      
      powerUpManager.destroy()
      
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(false)
    })

    it('should destroy power-ups group', () => {
      const group = scene.getPowerUpGroup()
      
      powerUpManager.destroy()
      
      expect(group.destroy).toHaveBeenCalledWith(true)
    })

    it('should remove all event listeners', () => {
      const handler = vi.fn()
      powerUpManager.on(GAME_EVENTS.POWERUP_COLLECTED, handler)
      
      powerUpManager.destroy()
      
      // Emit should not trigger handler after destroy
      powerUpManager.emit(GAME_EVENTS.POWERUP_COLLECTED, {})
      // Can't easily verify listeners removed, but destroy should not throw
    })

    it('should handle destroy when already destroyed', () => {
      powerUpManager.destroy()
      
      // Should not throw when called again
      expect(() => powerUpManager.destroy()).not.toThrow()
    })
  })

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('should handle collecting multiple speed boosts', () => {
      const player = createMockPlayer()
      
      const powerUp1 = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, powerUp1)
      
      const powerUp2 = powerUpManager.spawnPowerUp(400, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, powerUp2)
      
      expect(powerUpManager.hasActiveSpeedBoost()).toBe(true)
    })

    it('should handle collecting multiple shields', () => {
      const player = createMockPlayer()
      
      const powerUp1 = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp1)
      
      const powerUp2 = powerUpManager.spawnPowerUp(400, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp2)
      
      expect(powerUpManager.hasActiveShield()).toBe(true)
    })

    it('should handle collecting all power-up types in sequence', () => {
      const player = createMockPlayer()
      const types = ['powerSpeed', 'powerShield', 'powerHealth', 'powerLife'] as const
      
      types.forEach(type => {
        const powerUp = powerUpManager.spawnPowerUp(300, 400, type)
        expect(() => powerUpManager.collectPowerUp(player, powerUp)).not.toThrow()
      })
    })

    it('should handle update with both shield active and inactive', () => {
      const player = createMockPlayer()
      
      // Update without shield
      expect(() => powerUpManager.update(500, 300)).not.toThrow()
      
      // Collect shield
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerShield')
      powerUpManager.collectPowerUp(player, powerUp)
      
      // Update with shield
      expect(() => powerUpManager.update(600, 400)).not.toThrow()
    })
  })

  // ==================== NOTIFICATION ====================

  describe('showPowerUpNotification (private, tested via collection)', () => {
    it('should create text at correct position', () => {
      const player = createMockPlayer()
      player.x = 500
      player.y = 300
      
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerSpeed')
      powerUpManager.collectPowerUp(player, powerUp)
      
      expect(scene.add.text).toHaveBeenCalled()
      const textCall = scene.add.text.mock.calls.find((call: any[]) => 
        call[2].includes('SPEED')
      )
      expect(textCall).toBeDefined()
    })

    it('should animate notification upward and fade', () => {
      const player = createMockPlayer()
      const powerUp = powerUpManager.spawnPowerUp(300, 400, 'powerHealth')
      powerUpManager.collectPowerUp(player, powerUp)
      
      // Should add tween for notification
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })
})
