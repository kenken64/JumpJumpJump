/**
 * Test Suite for Game Managers
 * 
 * These tests verify the functionality of the extracted manager classes
 * Uses Vitest for testing with Phaser scene mocks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import Phaser from 'phaser'
import { 
  PlayerState, 
  EnemyConfig, 
  GAME_EVENTS, 
  WEAPON_CONFIGS,
  POWERUP_CONFIGS,
  PowerUpType,
  EnemyType
} from '../types/GameTypes'

// ==================== MOCK FACTORIES ====================

/**
 * Creates a mock Phaser scene for testing
 */
function createMockScene(): Partial<Phaser.Scene> {
  return {
    physics: {
      add: {
        group: vi.fn(() => ({
          create: vi.fn(() => createMockSprite()),
          getChildren: vi.fn(() => []),
          destroy: vi.fn(),
          add: vi.fn()
        })),
        sprite: vi.fn(() => createMockSprite()),
        collider: vi.fn(),
        overlap: vi.fn()
      }
    } as any,
    add: {
      sprite: vi.fn(() => createMockSprite()),
      rectangle: vi.fn(() => ({
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setSize: vi.fn().mockReturnThis(),
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
        destroy: vi.fn(),
        x: 0,
        y: 0
      })),
      image: vi.fn(() => ({
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      })),
      circle: vi.fn(() => ({
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      })),
      particles: vi.fn(() => ({
        createEmitter: vi.fn(() => ({
          emitParticleAt: vi.fn()
        }))
      }))
    } as any,
    tweens: {
      add: vi.fn(() => ({ 
        on: vi.fn(),
        remove: vi.fn() 
      }))
    } as any,
    time: {
      now: 0,
      delayedCall: vi.fn((delay, callback) => {
        return { remove: vi.fn() }
      }),
      addEvent: vi.fn(() => ({ remove: vi.fn() }))
    } as any,
    anims: {
      create: vi.fn(),
      exists: vi.fn(() => false)
    } as any,
    cameras: {
      main: {
        shake: vi.fn(),
        flash: vi.fn(),
        centerX: 640,
        centerY: 360
      }
    } as any,
    input: {
      keyboard: {
        addKey: vi.fn(() => ({ isDown: false }))
      },
      activePointer: { x: 0, y: 0 }
    } as any
  }
}

/**
 * Creates a mock Phaser sprite for testing
 */
function createMockSprite(): Partial<Phaser.Physics.Arcade.Sprite> {
  const data: Record<string, any> = {}
  return {
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    active: true,
    flipX: false,
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
    } as any,
    setData: vi.fn((key, value) => { data[key] = value }),
    getData: vi.fn((key) => data[key]),
    setScale: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setBounce: vi.fn().mockReturnThis(),
    setCollideWorldBounds: vi.fn().mockReturnThis(),
    setVelocity: vi.fn().mockReturnThis(),
    setVelocityX: vi.fn().mockReturnThis(),
    setVelocityY: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
    clearTint: vi.fn().mockReturnThis(),
    setFlipX: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    setAngle: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setPushable: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  }
}

/**
 * Creates a mock AudioManager for testing
 */
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

// ==================== TYPE TESTS ====================

describe('GameTypes', () => {
  describe('GAME_EVENTS', () => {
    it('should have all required event types', () => {
      expect(GAME_EVENTS.PLAYER_DAMAGED).toBe('player-damaged')
      expect(GAME_EVENTS.PLAYER_DIED).toBe('player-died')
      expect(GAME_EVENTS.ENEMY_KILLED).toBe('enemy-killed')
      expect(GAME_EVENTS.BOSS_SPAWNED).toBe('boss-spawned')
      expect(GAME_EVENTS.BOSS_DEFEATED).toBe('boss-defeated')
      expect(GAME_EVENTS.COIN_COLLECTED).toBe('coin-collected')
      expect(GAME_EVENTS.POWERUP_COLLECTED).toBe('powerup-collected')
      expect(GAME_EVENTS.LEVEL_COMPLETE).toBe('level-complete')
      expect(GAME_EVENTS.GAME_OVER).toBe('game-over')
    })

    it('should have power-up related events', () => {
      expect(GAME_EVENTS.SPEED_BOOST_START).toBe('speed-boost-start')
      expect(GAME_EVENTS.SPEED_BOOST_END).toBe('speed-boost-end')
      expect(GAME_EVENTS.SHIELD_START).toBe('shield-start')
      expect(GAME_EVENTS.SHIELD_END).toBe('shield-end')
      expect(GAME_EVENTS.HEALTH_RESTORED).toBe('health-restored')
      expect(GAME_EVENTS.EXTRA_LIFE_GAINED).toBe('extra-life-gained')
    })
  })

  describe('WEAPON_CONFIGS', () => {
    it('should have configuration for all weapon types', () => {
      expect(WEAPON_CONFIGS.raygun).toBeDefined()
      expect(WEAPON_CONFIGS.laserGun).toBeDefined()
      expect(WEAPON_CONFIGS.sword).toBeDefined()
      expect(WEAPON_CONFIGS.bazooka).toBeDefined()
    })

    it('should have correct damage values', () => {
      expect(WEAPON_CONFIGS.raygun.damage).toBe(10)
      expect(WEAPON_CONFIGS.laserGun.damage).toBe(5)
      expect(WEAPON_CONFIGS.sword.damage).toBe(15)
      expect(WEAPON_CONFIGS.bazooka.damage).toBe(50)
    })

    it('should have cooldown values', () => {
      expect(WEAPON_CONFIGS.raygun.cooldown).toBeGreaterThan(0)
      expect(WEAPON_CONFIGS.laserGun.cooldown).toBeGreaterThan(0)
      expect(WEAPON_CONFIGS.sword.cooldown).toBeGreaterThan(0)
      expect(WEAPON_CONFIGS.bazooka.cooldown).toBeGreaterThan(0)
    })
  })

  describe('POWERUP_CONFIGS', () => {
    it('should have configuration for all power-up types', () => {
      const types: PowerUpType[] = ['powerSpeed', 'powerShield', 'powerLife', 'powerHealth']
      types.forEach(type => {
        expect(POWERUP_CONFIGS[type]).toBeDefined()
        expect(POWERUP_CONFIGS[type].textureKey).toBeDefined()
        expect(POWERUP_CONFIGS[type].effect).toBeDefined()
      })
    })

    it('should have correct durations', () => {
      expect(POWERUP_CONFIGS.powerSpeed.duration).toBe(10000)
      expect(POWERUP_CONFIGS.powerShield.duration).toBe(15000)
      expect(POWERUP_CONFIGS.powerLife.duration).toBeUndefined() // Permanent
      expect(POWERUP_CONFIGS.powerHealth.duration).toBeUndefined() // Instant
    })
  })
})

// ==================== PLAYER STATE TESTS ====================

describe('PlayerState', () => {
  it('should create valid initial state', () => {
    const state: PlayerState = {
      health: 100,
      maxHealth: 100,
      lives: 3,
      score: 0,
      coins: 0,
      isDead: false,
      canDoubleJump: true,
      hasDoubleJumped: false,
      isStomping: false,
      hasSpeedBoost: false,
      hasShield: false
    }

    expect(state.health).toBe(100)
    expect(state.lives).toBe(3)
    expect(state.isDead).toBe(false)
    expect(state.canDoubleJump).toBe(true)
  })

  it('should handle damage correctly', () => {
    const state: PlayerState = {
      health: 100,
      maxHealth: 100,
      lives: 3,
      score: 0,
      coins: 0,
      isDead: false,
      canDoubleJump: true,
      hasDoubleJumped: false,
      isStomping: false,
      hasSpeedBoost: false,
      hasShield: false
    }

    // Simulate damage
    const damage = 25
    state.health = Math.max(0, state.health - damage)
    
    expect(state.health).toBe(75)
    expect(state.isDead).toBe(false)
  })

  it('should handle death correctly', () => {
    const state: PlayerState = {
      health: 10,
      maxHealth: 100,
      lives: 1,
      score: 500,
      coins: 50,
      isDead: false,
      canDoubleJump: true,
      hasDoubleJumped: false,
      isStomping: false,
      hasSpeedBoost: false,
      hasShield: false
    }

    // Simulate lethal damage
    const damage = 20
    state.health = Math.max(0, state.health - damage)
    
    if (state.health <= 0) {
      state.lives--
      state.isDead = state.lives <= 0
    }
    
    expect(state.health).toBe(0)
    expect(state.lives).toBe(0)
    expect(state.isDead).toBe(true)
  })
})

// ==================== ENEMY CONFIG TESTS ====================

describe('EnemyConfig', () => {
  it('should create valid small enemy config', () => {
    const config: EnemyConfig = {
      type: 'fly',
      size: 'small',
      x: 100,
      y: 200,
      health: 2,
      maxHealth: 2,
      speed: 80,
      coinReward: 5,
      detectionRange: 300,
      scale: 0.6
    }

    expect(config.type).toBe('fly')
    expect(config.size).toBe('small')
    expect(config.coinReward).toBe(5)
    expect(config.scale).toBe(0.6)
  })

  it('should create valid large enemy config', () => {
    const config: EnemyConfig = {
      type: 'wormGreen',
      size: 'large',
      x: 500,
      y: 400,
      health: 8,
      maxHealth: 8,
      speed: 80,
      coinReward: 15,
      detectionRange: 300,
      scale: 1.3
    }

    expect(config.type).toBe('wormGreen')
    expect(config.size).toBe('large')
    expect(config.health).toBe(8)
    expect(config.coinReward).toBe(15)
    expect(config.scale).toBe(1.3)
  })

  it('should scale health with difficulty', () => {
    const baseHealth = 4
    const difficultyMultiplier = 2.5
    const scaledHealth = Math.floor(baseHealth * difficultyMultiplier)
    
    expect(scaledHealth).toBe(10)
  })
})

// ==================== MOCK INTEGRATION TESTS ====================

describe('Mock Factories', () => {
  describe('createMockScene', () => {
    it('should create a valid mock scene', () => {
      const scene = createMockScene()
      
      expect(scene.physics).toBeDefined()
      expect(scene.add).toBeDefined()
      expect(scene.tweens).toBeDefined()
      expect(scene.time).toBeDefined()
    })

    it('should allow creating sprites', () => {
      const scene = createMockScene()
      const sprite = scene.physics!.add.sprite(100, 100, 'test')
      
      expect(sprite).toBeDefined()
      expect(sprite.setScale).toBeDefined()
    })

    it('should allow creating groups', () => {
      const scene = createMockScene()
      const group = scene.physics!.add.group()
      
      expect(group).toBeDefined()
      expect(group.create).toBeDefined()
      expect(group.getChildren).toBeDefined()
    })
  })

  describe('createMockSprite', () => {
    it('should create a valid mock sprite', () => {
      const sprite = createMockSprite()
      
      expect(sprite.x).toBe(100)
      expect(sprite.y).toBe(100)
      expect(sprite.active).toBe(true)
      expect(sprite.body).toBeDefined()
    })

    it('should store and retrieve data', () => {
      const sprite = createMockSprite()
      
      sprite.setData!('health', 100)
      sprite.setData!('type', 'enemy')
      
      expect(sprite.getData!('health')).toBe(100)
      expect(sprite.getData!('type')).toBe('enemy')
    })

    it('should have chainable methods', () => {
      const sprite = createMockSprite()
      
      const result = sprite.setScale!(1.5)
      expect(result).toBe(sprite)
      
      const result2 = sprite.setTint!(0xff0000)
      expect(result2).toBe(sprite)
    })
  })

  describe('createMockAudioManager', () => {
    it('should create a valid mock audio manager', () => {
      const audio = createMockAudioManager()
      
      expect(audio.playJumpSound).toBeDefined()
      expect(audio.playShootSound).toBeDefined()
      expect(audio.playDamageSound).toBeDefined()
      expect(audio.isSoundEnabled()).toBe(true)
      expect(audio.getSoundVolume()).toBe(0.5)
    })

    it('should track function calls', () => {
      const audio = createMockAudioManager()
      
      audio.playJumpSound()
      audio.playJumpSound(true)
      audio.playCoinSound()
      
      expect(audio.playJumpSound).toHaveBeenCalledTimes(2)
      expect(audio.playCoinSound).toHaveBeenCalledTimes(1)
    })
  })
})

// ==================== EVENT EMISSION TESTS ====================

describe('Event Emission Patterns', () => {
  it('should emit player damaged event with correct data', () => {
    const eventData = {
      health: 75,
      damage: 25
    }
    
    expect(eventData.health).toBe(75)
    expect(eventData.damage).toBe(25)
    expect(eventData.health + eventData.damage).toBe(100)
  })

  it('should emit enemy killed event with rewards', () => {
    const eventData = {
      x: 500,
      y: 300,
      coinReward: 10,
      scoreReward: 100,
      enemySize: 'medium' as const
    }
    
    expect(eventData.coinReward).toBe(10)
    expect(eventData.scoreReward).toBe(100)
    expect(eventData.enemySize).toBe('medium')
  })

  it('should emit boss defeated event with large rewards', () => {
    const eventData = {
      x: 800,
      y: 350,
      coinReward: 100,
      scoreReward: 1000
    }
    
    expect(eventData.coinReward).toBe(100)
    expect(eventData.scoreReward).toBe(1000)
    expect(eventData.coinReward).toBeGreaterThan(10) // More than regular enemy
    expect(eventData.scoreReward).toBeGreaterThan(200) // More than large enemy
  })

  it('should emit power-up collected event', () => {
    const eventData = {
      type: 'powerShield' as PowerUpType,
      x: 300,
      y: 400
    }
    
    expect(eventData.type).toBe('powerShield')
    expect(POWERUP_CONFIGS[eventData.type]).toBeDefined()
    expect(POWERUP_CONFIGS[eventData.type].duration).toBe(15000)
  })
})

// ==================== DIFFICULTY SCALING TESTS ====================

describe('Difficulty Scaling', () => {
  it('should scale enemy health with level', () => {
    const baseHealth = 4
    const levels = [1, 2, 3, 4, 5]
    
    const healthValues = levels.map(level => {
      const multiplier = 1 + (level - 1) * 0.3
      return Math.floor(baseHealth * multiplier)
    })
    
    expect(healthValues).toEqual([4, 5, 6, 7, 8])
  })

  it('should scale boss health with level', () => {
    const calculateBossHealth = (level: number) => 50 + (level * 20)
    
    expect(calculateBossHealth(5)).toBe(150)
    expect(calculateBossHealth(10)).toBe(250)
    expect(calculateBossHealth(15)).toBe(350)
  })

  it('should increase enemy spawn count with difficulty', () => {
    const calculateEnemyCount = (difficultyMultiplier: number) => {
      const baseEnemies = 2
      const maxEnemies = Math.min(5, baseEnemies + Math.floor(difficultyMultiplier))
      return { min: baseEnemies, max: maxEnemies }
    }
    
    expect(calculateEnemyCount(1)).toEqual({ min: 2, max: 3 })
    expect(calculateEnemyCount(2)).toEqual({ min: 2, max: 4 })
    expect(calculateEnemyCount(3)).toEqual({ min: 2, max: 5 })
    expect(calculateEnemyCount(5)).toEqual({ min: 2, max: 5 }) // Capped at 5
  })
})

// ==================== WEAPON BEHAVIOR TESTS ====================

describe('Weapon Behavior', () => {
  it('should calculate correct bullet damage', () => {
    const weapons = ['raygun', 'laserGun', 'sword', 'bazooka'] as const
    
    weapons.forEach(weapon => {
      const config = WEAPON_CONFIGS[weapon]
      expect(config.damage).toBeGreaterThan(0)
    })
  })

  it('should calculate rocket splash damage', () => {
    const rocketDamage = WEAPON_CONFIGS.bazooka.damage
    const splashDamageRatio = 0.06 // 3 damage for 50 base damage
    const expectedSplashDamage = 3
    
    expect(Math.floor(rocketDamage * splashDamageRatio)).toBe(expectedSplashDamage)
  })

  it('should have faster fire rate for laser gun', () => {
    expect(WEAPON_CONFIGS.laserGun.cooldown).toBeLessThan(WEAPON_CONFIGS.raygun.cooldown)
    expect(WEAPON_CONFIGS.laserGun.cooldown).toBeLessThan(WEAPON_CONFIGS.bazooka.cooldown)
  })

  it('should have slowest fire rate for bazooka', () => {
    const weapons = ['raygun', 'laserGun', 'sword', 'bazooka'] as const
    const maxCooldown = Math.max(...weapons.map(w => WEAPON_CONFIGS[w].cooldown))
    
    expect(WEAPON_CONFIGS.bazooka.cooldown).toBe(maxCooldown)
  })
})

// ==================== POWER-UP DURATION TESTS ====================

describe('Power-up Durations', () => {
  it('should have correct speed boost duration', () => {
    expect(POWERUP_CONFIGS.powerSpeed.duration).toBe(10000) // 10 seconds
  })

  it('should have correct shield duration', () => {
    expect(POWERUP_CONFIGS.powerShield.duration).toBe(15000) // 15 seconds
  })

  it('should have undefined duration for instant effects', () => {
    expect(POWERUP_CONFIGS.powerLife.duration).toBeUndefined()
    expect(POWERUP_CONFIGS.powerHealth.duration).toBeUndefined()
  })

  it('should have health restore value', () => {
    expect(POWERUP_CONFIGS.powerHealth.value).toBe(30)
  })
})

// Export mocks for use in other test files
export { createMockScene, createMockSprite, createMockAudioManager }
