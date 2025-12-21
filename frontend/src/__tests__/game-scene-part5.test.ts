import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create comprehensive sprite mock factory
const createSpriteMock = (options: any = {}) => ({
  setOrigin: vi.fn().mockReturnThis(),
  setScale: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setPosition: vi.fn().mockReturnThis(),
  setCollideWorldBounds: vi.fn().mockReturnThis(),
  setBounce: vi.fn().mockReturnThis(),
  setGravityY: vi.fn().mockReturnThis(),
  setVelocity: vi.fn().mockReturnThis(),
  setVelocityX: vi.fn().mockReturnThis(),
  setVelocityY: vi.fn().mockReturnThis(),
  setAccelerationX: vi.fn().mockReturnThis(),
  setDragX: vi.fn().mockReturnThis(),
  setMaxVelocity: vi.fn().mockReturnThis(),
  setAngularVelocity: vi.fn().mockReturnThis(),
  play: vi.fn().mockReturnThis(),
  setData: vi.fn().mockReturnThis(),
  getData: vi.fn().mockImplementation((key: string) => {
    const data: any = { 
      health: 100, 
      lastHitTime: 0, 
      coinId: options.coinId, 
      enemyId: options.enemyId, 
      powerupId: options.powerupId,
      detectionRange: 400,
      speed: 100,
      tintTimer: options.tintTimer,
      ...options.data 
    }
    return data[key]
  }),
  clearTint: vi.fn().mockReturnThis(),
  setTint: vi.fn().mockReturnThis(),
  setFlipX: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  setPushable: vi.fn().mockReturnThis(),
  setImmovable: vi.fn().mockReturnThis(),
  setAngle: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  setActive: vi.fn().mockReturnThis(),
  setTexture: vi.fn().mockReturnThis(),
  setRotation: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
  active: options.active !== undefined ? options.active : true,
  visible: true,
  x: options.x || 400,
  y: options.y || 550,
  width: 70,
  height: 90,
  flipX: false,
  texture: { key: 'test' },
  anims: {
    play: vi.fn(),
    currentAnim: { key: 'idle' }
  },
  body: {
    setSize: vi.fn().mockReturnThis(),
    setOffset: vi.fn().mockReturnThis(),
    setMass: vi.fn().mockReturnThis(),
    setMaxVelocity: vi.fn().mockReturnThis(),
    setAllowGravity: vi.fn().mockReturnThis(),
    setImmovable: vi.fn().mockReturnThis(),
    setVelocityX: vi.fn().mockReturnThis(),
    setVelocityY: vi.fn().mockReturnThis(),
    setVelocity: vi.fn().mockReturnThis(),
    setEnable: vi.fn().mockReturnThis(),
    touching: { down: true, up: false, left: false, right: false },
    blocked: { down: true, up: false, left: false, right: false },
    velocity: { x: 0, y: 0 },
    gravity: { y: 0 },
    enable: true,
    x: options.x || 400,
    y: options.y || 550,
    width: 50,
    height: 80
  }
})

// Mock Phaser Module
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
      children = { list: [] }
      sys = {
        settings: { data: {} },
        game: {
          device: { os: { desktop: true } },
          canvas: { width: 1280, height: 720 }
        }
      }
      events = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
      }
      cameras = {
        main: {
          width: 1280,
          height: 720,
          setBackgroundColor: vi.fn(),
          fadeIn: vi.fn(),
          fadeOut: vi.fn(),
          startFollow: vi.fn(),
          setBounds: vi.fn(),
          setZoom: vi.fn(),
          shake: vi.fn(),
          flash: vi.fn(),
          centerX: 640,
          centerY: 360,
          scrollX: 0,
          scrollY: 0
        }
      }
      input = {
        keyboard: {
          addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }),
          createCursorKeys: vi.fn().mockReturnValue({
            up: { isDown: false },
            down: { isDown: false },
            left: { isDown: false },
            right: { isDown: false },
            space: { isDown: false },
            shift: { isDown: false }
          }),
          on: vi.fn(),
          off: vi.fn()
        },
        on: vi.fn(),
        activePointer: {
          x: 0,
          y: 0,
          isDown: false,
          worldX: 0,
          worldY: 0,
          rightButtonDown: vi.fn().mockReturnValue(false)
        },
        gamepad: {
          pads: []
        }
      }
      physics = {
        add: {
          sprite: vi.fn().mockImplementation(() => createSpriteMock()),
          group: vi.fn().mockReturnValue({
            create: vi.fn().mockImplementation(() => createSpriteMock()),
            clear: vi.fn(),
            getChildren: vi.fn().mockReturnValue([]),
            children: { entries: [] },
            add: vi.fn()
          }),
          collider: vi.fn(),
          overlap: vi.fn()
        },
        world: {
          setBounds: vi.fn(),
          gravity: { y: 300 }
        }
      }
      time = {
        addEvent: vi.fn(),
        delayedCall: vi.fn(),
        now: 1000
      }
      tweens = {
        add: vi.fn()
      }
      add = {
        sprite: vi.fn().mockImplementation(() => createSpriteMock()),
        image: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          displayWidth: 100
        }),
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          setStyle: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          width: 100,
          height: 20
        }),
        rectangle: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          width: 100
        }),
        circle: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        particles: vi.fn().mockReturnValue({
          stop: vi.fn(),
          start: vi.fn(),
          emitParticleAt: vi.fn(),
          createEmitter: vi.fn().mockReturnValue({
            stop: vi.fn(),
            start: vi.fn(),
            setPosition: vi.fn()
          })
        }),
        group: vi.fn().mockReturnValue({
          get: vi.fn(),
          create: vi.fn(),
          clear: vi.fn()
        }),
        container: vi.fn().mockReturnValue({
          add: vi.fn(),
          setDepth: vi.fn(),
          setScrollFactor: vi.fn(),
          setPosition: vi.fn(),
          destroy: vi.fn()
        }),
        graphics: vi.fn().mockReturnValue({
          clear: vi.fn(),
          fillStyle: vi.fn(),
          fillRect: vi.fn(),
          lineStyle: vi.fn(),
          strokeRect: vi.fn(),
          strokeCircle: vi.fn(),
          generateTexture: vi.fn(),
          destroy: vi.fn()
        })
      }
      make = {
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn(),
          fillRect: vi.fn(),
          generateTexture: vi.fn(),
          destroy: vi.fn()
        })
      }
      anims = {
        create: vi.fn(),
        exists: vi.fn().mockReturnValue(true),
        generateFrameNumbers: vi.fn()
      }
      sound = {
        add: vi.fn().mockReturnValue({
          play: vi.fn(),
          stop: vi.fn()
        })
      }
      scale = {
        width: 1280,
        height: 720,
        on: vi.fn(),
        startFullscreen: vi.fn(),
        stopFullscreen: vi.fn(),
        isFullscreen: false
      }
      game = {
        canvas: { width: 1280, height: 720 },
        config: { width: 1280, height: 720 }
      }
    },
    Physics: {
      Arcade: {
        Sprite: class {
          constructor() { return createSpriteMock() }
        },
        Image: class {}
      }
    },
    Math: {
      Between: (min: number, max: number) => min, // Deterministic for tests
      FloatBetween: (min: number, max: number) => min,
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      },
      Angle: {
        Between: () => 0
      },
      RadToDeg: (rad: number) => rad * 180 / Math.PI
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          W: 87, A: 65, S: 83, D: 68,
          SPACE: 32, SHIFT: 16, ESC: 27,
          ENTER: 13, UP: 38, DOWN: 40,
          LEFT: 37, RIGHT: 39,
          ONE: 49, TWO: 50, THREE: 51,
          Q: 81, E: 69, R: 82, T: 84,
          Z: 90, X: 88, C: 67
        }
      }
    }
  }
  return { default: Phaser, ...Phaser }
})

// Mock other dependencies
vi.mock('../utils/audio-manager', () => ({
  default: {
    getInstance: () => ({
      play: vi.fn(),
      stop: vi.fn(),
      setVolume: vi.fn()
    })
  }
}))

vi.mock('../utils/music-manager', () => ({
  default: {
    getInstance: () => ({
      playMusic: vi.fn(),
      stopMusic: vi.fn(),
      setVolume: vi.fn()
    })
  }
}))

vi.mock('../utils/ControlManager', () => ({
  ControlManager: {
    getControlSettings: vi.fn().mockReturnValue({
      inputMethod: 'keyboard',
      gamepadMapping: {
        jump: 0,
        shoot: 1,
        dash: 2,
        pause: 9,
        aimRightStick: true
      }
    })
  }
}))

import GameScene from '../scenes/GameScene'
import { ControlManager } from '../utils/ControlManager'

describe('GameScene - Part 5 Coverage', () => {
  let scene: any
  let playerMock: any
  let player2Mock: any

  beforeEach(async () => {
    vi.clearAllMocks()
    scene = new GameScene()
    
    // Initialize scene properties
    scene.sys = new (vi.mocked(await import('phaser')).Scene)().sys
    scene.input = new (vi.mocked(await import('phaser')).Scene)().input
    scene.physics = new (vi.mocked(await import('phaser')).Scene)().physics
    scene.add = new (vi.mocked(await import('phaser')).Scene)().add
    scene.cameras = new (vi.mocked(await import('phaser')).Scene)().cameras
    scene.time = new (vi.mocked(await import('phaser')).Scene)().time
    scene.tweens = new (vi.mocked(await import('phaser')).Scene)().tweens
    scene.make = new (vi.mocked(await import('phaser')).Scene)().make
    scene.events = new (vi.mocked(await import('phaser')).Scene)().events
    scene.sound = new (vi.mocked(await import('phaser')).Scene)().sound
    scene.scale = new (vi.mocked(await import('phaser')).Scene)().scale
    
    // Setup player
    playerMock = createSpriteMock({ x: 100, y: 500 })
    scene.player = playerMock
    
    // Setup groups
    scene.enemies = {
      children: { entries: [] },
      getChildren: () => scene.enemies.children.entries,
      create: vi.fn().mockImplementation((x, y, key) => {
        const enemy = createSpriteMock({ x, y })
        scene.enemies.children.entries.push(enemy)
        return enemy
      })
    }
    
    scene.bullets = {
      create: vi.fn().mockImplementation(() => createSpriteMock()),
      get: vi.fn().mockImplementation(() => createSpriteMock()),
      add: vi.fn()
    }
    
    scene.checkpoints = []
    scene.isOnlineMode = false
    scene.isOnlineHost = true
    scene.playerIsDead = false
    scene.aiEnabled = false
    scene.mlAIEnabled = false
    scene.dqnTraining = false
    scene.lastShotTime = 0
    scene.equippedWeapon = 'raygun'

    // Mock game loop
    scene.game.loop = { delta: 16 }

    // Mock managers
    scene.audioManager = {
      playShootSound: vi.fn(),
      playJumpSound: vi.fn(),
      playCollectSound: vi.fn(),
      playExplosionSound: vi.fn()
    }

    scene.uiManager = {
      updateScore: vi.fn(),
      updateHealth: vi.fn(),
      showGameOver: vi.fn()
    }

    scene.textures = {
      exists: vi.fn().mockReturnValue(true)
    }

    scene.gun = createSpriteMock()
  })

  describe('handleEnemyAI', () => {
    it('should skip if online mode and not host', () => {
      scene.isOnlineMode = true
      scene.isOnlineHost = false
      
      // Add an enemy
      const enemy = createSpriteMock({ x: 200, y: 500 })
      scene.enemies.children.entries.push(enemy)
      
      scene.handleEnemyAI()
      
      // Should not have moved
      expect(enemy.setVelocityX).not.toHaveBeenCalled()
    })

    it('should separate enemies horizontally', () => {
      const enemy1 = createSpriteMock({ x: 200, y: 500 })
      const enemy2 = createSpriteMock({ x: 210, y: 500 }) // Very close horizontally
      
      scene.enemies.children.entries.push(enemy1, enemy2)
      
      scene.handleEnemyAI()
      
      // Should apply separation force
      expect(enemy1.setVelocityX).toHaveBeenCalled()
    })

    it('should separate enemies vertically (hop off)', () => {
      const enemy1 = createSpriteMock({ x: 200, y: 470 }) // On top (within 40px)
      const enemy2 = createSpriteMock({ x: 200, y: 500 }) // Below
      
      scene.enemies.children.entries.push(enemy1, enemy2)
      
      scene.handleEnemyAI()
      
      // Top enemy should hop
      expect(enemy1.setVelocityY).toHaveBeenCalledWith(-200)
    })

    it('should target nearest player in coop mode', () => {
      scene.isCoopMode = true
      player2Mock = createSpriteMock({ x: 300, y: 500 })
      scene.player2 = player2Mock
      
      // Enemy closer to player 2
      const enemy = createSpriteMock({ x: 350, y: 500 })
      scene.enemies.children.entries.push(enemy)
      
      scene.handleEnemyAI()
      
      // Should move towards player 2 (left)
      expect(enemy.setVelocityX).toHaveBeenCalledWith(expect.any(Number))
      const velocityArg = enemy.setVelocityX.mock.calls[0][0]
      expect(velocityArg).toBeLessThan(0) // Moving left towards 300 from 350
    })
  })

  describe('handleShooting', () => {
    it('should skip if player is dead', () => {
      scene.playerIsDead = true
      scene.input.activePointer.isDown = true
      
      scene.handleShooting()
      
      expect(scene.bullets.create).not.toHaveBeenCalled()
    })

    it('should handle sword throw (right click)', () => {
      scene.equippedWeapon = 'sword'
      scene.input.activePointer.rightButtonDown.mockReturnValue(true)
      scene.throwSwordBlade = vi.fn()
      scene.time.now = 3000 // Ensure > 2000ms passed
      
      scene.handleShooting()
      
      expect(scene.throwSwordBlade).toHaveBeenCalled()
    })

    it('should set correct cooldowns for laserGun', () => {
      scene.equippedWeapon = 'laserGun'
      scene.input.activePointer.isDown = true
      scene.time.now = 2000
      scene.lastShotTime = 1000 // > 150ms ago
      
      scene.handleShooting()
      
      expect(scene.bullets.get).toHaveBeenCalled()
      expect(scene.lastShotTime).toBe(2000)
    })

    it('should set correct cooldowns for bazooka', () => {
      scene.equippedWeapon = 'bazooka'
      scene.input.activePointer.isDown = true
      scene.time.now = 2000
      scene.lastShotTime = 1500 // < 1000ms ago
      
      scene.handleShooting()
      
      expect(scene.bullets.get).not.toHaveBeenCalled()
    })

    it('should handle gamepad shooting', () => {
      vi.spyOn(ControlManager, 'getControlSettings').mockReturnValue({
        inputMethod: 'gamepad',
        gamepadMapping: { shoot: 1 }
      } as any)
      
      scene.gamepad = {
        buttons: {
          1: { pressed: true }
        }
      }
      
      scene.time.now = 2000
      scene.lastShotTime = 1000
      
      scene.handleShooting()
      
      expect(scene.bullets.get).toHaveBeenCalled()
    })

    it('should handle AI shooting', () => {
      scene.aiEnabled = true
      scene.aiPlayer = {
        getDecision: vi.fn().mockReturnValue({ shoot: true })
      }
      
      scene.time.now = 2000
      scene.lastShotTime = 1000
      
      scene.handleShooting()
      
      expect(scene.bullets.get).toHaveBeenCalled()
    })
  })

  describe('handleGunAiming', () => {
    it('should skip if player is dead', () => {
      scene.playerIsDead = true
      scene.handleGunAiming()
      // No easy way to check internal variables, but we can check if it throws
    })

    it('should use AI aiming if enabled', () => {
      scene.aiEnabled = true
      scene.aiPlayer = {
        getDecision: vi.fn().mockReturnValue({ aimX: 500, aimY: 500 })
      }
      
      // Mock gun sprite
      scene.gun = createSpriteMock()
      
      scene.handleGunAiming()
      
      expect(scene.aiPlayer.getDecision).toHaveBeenCalled()
      expect(scene.gun.setRotation).toHaveBeenCalled()
    })

    it('should use gamepad right stick if active', () => {
      vi.spyOn(ControlManager, 'getControlSettings').mockReturnValue({
        inputMethod: 'gamepad',
        gamepadMapping: { aimRightStick: true }
      } as any)
      
      scene.gamepad = {
        rightStick: { x: 1, y: 0 } // Full right
      }
      scene.gun = createSpriteMock()
      
      scene.handleGunAiming()
      
      expect(scene.gun.setRotation).toHaveBeenCalled()
    })

    it('should use auto-aim for mobile/virtual gamepad', () => {
      scene.virtualGamepad = {} // Enable virtual gamepad
      scene.gun = createSpriteMock()
      
      // Add an enemy nearby
      const enemy = createSpriteMock({ x: 200, y: 500 })
      scene.enemies.children.entries.push(enemy)
      scene.player.x = 100
      scene.player.y = 500
      
      scene.handleGunAiming()
      
      expect(scene.gun.setRotation).toHaveBeenCalled()
    })
  })

  describe('handleBulletEnemyCollision', () => {
    it('should create explosion for rockets', () => {
      const bullet = createSpriteMock({ data: { isRocket: true, damage: 10 } })
      const enemy = createSpriteMock({ data: { health: 100 } })
      
      scene.createExplosion = vi.fn()
      
      scene.handleBulletEnemyCollision(bullet, enemy)
      
      expect(scene.createExplosion).toHaveBeenCalledWith(bullet.x, bullet.y)
    })

    it('should one-shot non-boss enemies with bazooka', () => {
      const bullet = createSpriteMock({ data: { isRocket: true } })
      const enemy = createSpriteMock({ data: { health: 100, enemyType: 'alien' } })
      
      scene.handleBulletEnemyCollision(bullet, enemy)
      
      expect(enemy.setData).toHaveBeenCalledWith('health', 0)
    })

    it('should apply damage and tint', () => {
      const bullet = createSpriteMock({ data: { isRocket: false, damage: 10 } })
      const enemy = createSpriteMock({ data: { health: 100 } })
      
      scene.handleBulletEnemyCollision(bullet, enemy)
      
      expect(enemy.setData).toHaveBeenCalledWith('health', 90)
      expect(enemy.setTint).toHaveBeenCalledWith(0xff0000)
      expect(scene.time.delayedCall).toHaveBeenCalled()
    })

    it('should report kill in online mode', () => {
      scene.isOnlineMode = true
      scene.onlinePlayerManager = {
        reportEnemyKilled: vi.fn()
      }
      scene.remoteEnemies = new Map()
      
      const bullet = createSpriteMock({ data: { damage: 100 } })
      const enemy = createSpriteMock({ 
        data: { health: 10, enemyId: 'enemy1' } 
      })
      
      scene.handleBulletEnemyCollision(bullet, enemy)
      
      expect(scene.onlinePlayerManager.reportEnemyKilled).toHaveBeenCalledWith('enemy1')
    })
  })

  describe('checkCheckpoints', () => {
    it('should trigger checkpoint when player passes x coordinate', () => {
      scene.checkpoints = [{ x: 0, marker: {} }, { x: 500, marker: {} }]
      scene.currentCheckpoint = 0
      scene.player.x = 600
      scene.playerHealth = 50
      scene.maxHealth = 100
      
      scene.checkCheckpoints()
      
      expect(scene.currentCheckpoint).toBe(1)
      expect(scene.cameras.main.flash).toHaveBeenCalled()
      expect(scene.playerHealth).toBe(70) // +20 HP
    })

    it('should not trigger if already passed', () => {
      scene.checkpoints = [{ x: 0, marker: {} }, { x: 500, marker: {} }]
      scene.currentCheckpoint = 1
      scene.player.x = 600
      
      scene.checkCheckpoints()
      
      expect(scene.cameras.main.flash).not.toHaveBeenCalled()
    })
  })
})
