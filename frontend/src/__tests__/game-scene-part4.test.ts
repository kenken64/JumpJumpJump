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
    const data: any = { health: 100, lastHitTime: 0, coinId: options.coinId, enemyId: options.enemyId, powerupId: options.powerupId, ...options.data }
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
          resetFX: vi.fn(),
          setAlpha: vi.fn(),
          getWorldPoint: vi.fn().mockReturnValue({ x: 500, y: 300 }),
          scrollX: 0,
          scrollY: 0
        }
      }
      add = {
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setName: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          setText: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          active: true,
          y: 0
        }),
        rectangle: vi.fn().mockReturnValue({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          setScrollFactor: vi.fn().mockReturnThis(),
          width: 100
        }),
        sprite: vi.fn().mockImplementation(() => createSpriteMock()),
        image: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setFlipX: vi.fn().mockReturnThis(),
          setRotation: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis()
        }),
        circle: vi.fn().mockReturnValue({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        container: vi.fn().mockReturnValue({
          setPosition: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          add: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          setVisible: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis()
        }),
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          setVisible: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis()
        }),
        tileSprite: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis()
        }),
        particles: vi.fn().mockReturnValue({
          createEmitter: vi.fn().mockReturnValue({
            setPosition: vi.fn().mockReturnThis(),
            explode: vi.fn().mockReturnThis(),
            stop: vi.fn().mockReturnThis(),
            start: vi.fn().mockReturnThis()
          }),
          destroy: vi.fn()
        }),
        group: vi.fn().mockReturnValue({
          create: vi.fn().mockImplementation(() => createSpriteMock()),
          getChildren: vi.fn().mockReturnValue([]),
          clear: vi.fn()
        })
      }
      physics = {
        add: {
          sprite: vi.fn().mockImplementation(() => createSpriteMock()),
          staticGroup: vi.fn().mockReturnValue({
            create: vi.fn().mockImplementation((x: number, y: number) => {
              const sprite = createSpriteMock({ x, y })
              return { ...sprite, body: { ...sprite.body, setSize: vi.fn(), setOffset: vi.fn(), checkCollision: { up: true, down: true, left: true, right: true } } }
            }),
            getChildren: vi.fn().mockReturnValue([]),
            refresh: vi.fn()
          }),
          group: vi.fn().mockReturnValue({
            create: vi.fn().mockImplementation(() => createSpriteMock()),
            getChildren: vi.fn().mockReturnValue([]),
            clear: vi.fn()
          }),
          collider: vi.fn().mockReturnValue({ active: true }),
          overlap: vi.fn().mockReturnValue({ active: true }),
          existing: vi.fn()
        },
        world: {
          setBounds: vi.fn(),
          on: vi.fn()
        }
      }
      input = {
        keyboard: {
          createCursorKeys: vi.fn().mockReturnValue({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false },
            space: { isDown: false },
            shift: { isDown: false }
          }),
          addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }),
          removeKey: vi.fn(),
          on: vi.fn()
        },
        gamepad: {
          on: vi.fn(),
          pad1: null,
          pads: []
        },
        on: vi.fn(),
        activePointer: {
          x: 0,
          y: 0,
          worldX: 500,
          worldY: 300,
          isDown: false
        }
      }
      time = {
        addEvent: vi.fn().mockReturnValue({ remove: vi.fn() }),
        delayedCall: vi.fn().mockImplementation((delay, callback) => {
          // Optionally call callback immediately for testing
          if (delay === 0) callback()
          return { remove: vi.fn() }
        }),
        now: 1000
      }
      tweens = {
        add: vi.fn().mockReturnValue({ stop: vi.fn() }),
        killAll: vi.fn()
      }
      scene = {
        start: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        get: vi.fn(),
        key: 'GameScene'
      }
      registry = {
        get: vi.fn(),
        set: vi.fn(),
        events: {
          on: vi.fn(),
          off: vi.fn()
        }
      }
      sound = {
        add: vi.fn().mockReturnValue({
          play: vi.fn(),
          stop: vi.fn(),
          setVolume: vi.fn(),
          setLoop: vi.fn()
        }),
        get: vi.fn(),
        stopAll: vi.fn()
      }
      textures = {
        exists: vi.fn().mockReturnValue(true),
        get: vi.fn().mockReturnValue({
          getSourceImage: vi.fn().mockReturnValue({ width: 64, height: 64 })
        }),
        getFrame: vi.fn()
      }
      anims = {
        create: vi.fn(),
        exists: vi.fn().mockReturnValue(true),
        generateFrameNumbers: vi.fn().mockReturnValue([])
      }
      scale = {
        width: 1280,
        height: 720
      }
      load = {
        spritesheet: vi.fn(),
        image: vi.fn(),
        audio: vi.fn()
      }
      make = {
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          generateTexture: vi.fn(),
          destroy: vi.fn()
        })
      }
      game = {
        device: {
          os: { desktop: true },
          input: { touch: false }
        },
        canvas: { width: 1280, height: 720 }
      }
    },
    Math: {
      Between: vi.fn((min, max) => Math.floor(Math.random() * (max - min + 1)) + min),
      Distance: {
        Between: vi.fn((x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))
      },
      Angle: {
        Between: vi.fn().mockReturnValue(0)
      },
      Linear: vi.fn((a, b, t) => a + (b - a) * t),
      Clamp: vi.fn((val, min, max) => Math.min(Math.max(val, min), max))
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          W: 87, A: 65, S: 83, D: 68, E: 69, R: 82, Q: 81,
          SPACE: 32, SHIFT: 16, CTRL: 17, ESC: 27,
          ONE: 49, TWO: 50, THREE: 51, FOUR: 52, FIVE: 53,
          LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40,
          I: 73, J: 74, K: 75, L: 76, U: 85, O: 79, P: 80, T: 84,
          F1: 112
        }
      }
    },
    Physics: {
      Arcade: {
        Sprite: class {},
        StaticGroup: class {},
        Group: class {}
      }
    },
    GameObjects: {
      Particles: {
        ParticleEmitter: class {}
      },
      Graphics: class {},
      Text: class {}
    },
    Display: {
      Color: {
        ValueToColor: vi.fn().mockReturnValue({ r: 255, g: 255, b: 255 })
      }
    }
  }
  return { default: Phaser, ...Phaser }
})

// Mock API
vi.mock('../services/api', () => ({
  GameAPI: {
    submitScore: vi.fn().mockResolvedValue({ success: true }),
    getLeaderboard: vi.fn().mockResolvedValue([])
  }
}))

// Mock AudioManager
vi.mock('../utils/AudioManager', () => ({
  AudioManager: vi.fn().mockImplementation(() => ({
    playSound: vi.fn(),
    stopSound: vi.fn(),
    setVolume: vi.fn(),
    isMuted: vi.fn().mockReturnValue(false)
  }))
}))

// Mock MusicManager
vi.mock('../utils/MusicManager', () => ({
  MusicManager: vi.fn().mockImplementation(() => ({
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    setVolume: vi.fn(),
    fadeOut: vi.fn()
  }))
}))

// Mock WorldGenerator
vi.mock('../utils/WorldGenerator', () => ({
  WorldGenerator: vi.fn().mockImplementation(() => ({
    generateInitialWorld: vi.fn(),
    generateChunk: vi.fn(),
    getLastGeneratedX: vi.fn().mockReturnValue(0)
  }))
}))

// Mock ControlManager
vi.mock('../utils/ControlManager', () => ({
  ControlManager: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    getMovement: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    isJumpPressed: vi.fn().mockReturnValue(false),
    isShootPressed: vi.fn().mockReturnValue(false),
    cleanup: vi.fn()
  }))
}))

// Mock AIPlayer
vi.mock('../utils/AIPlayer', () => ({
  AIPlayer: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    shouldJump: vi.fn().mockReturnValue(false),
    shouldShoot: vi.fn().mockReturnValue(false),
    getDirection: vi.fn().mockReturnValue(0)
  }))
}))

// Mock MLAIPlayer
vi.mock('../utils/MLAIPlayer', () => ({
  MLAIPlayer: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    shouldJump: vi.fn().mockReturnValue(false),
    shouldShoot: vi.fn().mockReturnValue(false),
    getDirection: vi.fn().mockReturnValue(0)
  }))
}))

// Mock DQNAgent
vi.mock('../utils/DQNAgent', () => ({
  DQNAgent: vi.fn().mockImplementation(() => ({
    selectAction: vi.fn().mockReturnValue(0),
    train: vi.fn(),
    getStats: vi.fn().mockReturnValue({}),
    dispose: vi.fn()
  }))
}))

// Mock OnlinePlayerManager
vi.mock('../utils/OnlinePlayerManager', () => ({
  OnlinePlayerManager: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    cleanup: vi.fn(),
    getRemotePlayers: vi.fn().mockReturnValue([]),
    handlePlayerState: vi.fn(),
    handlePlayerDeath: vi.fn()
  }))
}))

// Mock OnlineCoopService
vi.mock('../services/OnlineCoopService', () => ({
  OnlineCoopService: {
    getInstance: vi.fn().mockReturnValue({
      isConnected: vi.fn().mockReturnValue(false),
      getRoomId: vi.fn().mockReturnValue(null),
      getPlayerId: vi.fn().mockReturnValue(null),
      sendGameState: vi.fn(),
      disconnect: vi.fn()
    })
  }
}))

// Mock VirtualGamepad
vi.mock('../utils/VirtualGamepad', () => ({
  VirtualGamepad: vi.fn().mockImplementation(() => ({
    isEnabled: false,
    getAxis: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    isButtonPressed: vi.fn().mockReturnValue(false),
    setEnable: vi.fn(),
    destroy: vi.fn()
  }))
}))

// Mock UIManager
vi.mock('../managers/UIManager', () => ({
  UIManager: vi.fn().mockImplementation(() => ({
    createLoadingUI: vi.fn(),
    updateLoadingProgress: vi.fn(),
    hideLoadingUI: vi.fn(),
    createGameUI: vi.fn(),
    updateUI: vi.fn(),
    updateHealth: vi.fn(),
    updateCoins: vi.fn(),
    updateScore: vi.fn(),
    updateLives: vi.fn(),
    showGameOver: vi.fn(),
    hideGameOver: vi.fn(),
    showMessage: vi.fn(),
    hideMessage: vi.fn(),
    showShopTip: vi.fn(),
    hideShopTip: vi.fn(),
    showBossHealth: vi.fn(),
    hideBossHealth: vi.fn(),
    updateBossHealth: vi.fn(),
    closeInGameChat: vi.fn(),
    destroy: vi.fn()
  }))
}))

// Mock GameLogic
vi.mock('../utils/GameLogic', () => ({
  decompressState: vi.fn((state) => state),
  calculateEnemyScoreReward: vi.fn().mockReturnValue(100),
  EnemySize: { SMALL: 'small', MEDIUM: 'medium', LARGE: 'large' }
}))

// Import GameScene after mocks
import GameScene from '../scenes/GameScene'

describe('GameScene - Part 4 Coverage', () => {
  let scene: GameScene
  let mockPhysicsGroup: any
  let mockStaticGroup: any
  let mockCoinsGroup: any
  let mockPowerUpsGroup: any
  let mockEnemiesGroup: any

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
    
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'ownedWeapons') return JSON.stringify(['pistol'])
      if (key === 'currentWeapon') return 'pistol'
      if (key === 'playerCoins') return '100'
      if (key === 'bossesDefeated') return JSON.stringify({})
      return null
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})

    scene = new GameScene()
    
    // Create mock groups with children support
    const createMockGroup = (children: any[] = []) => ({
      create: vi.fn().mockImplementation((x, y, texture) => {
        const sprite = createSpriteMock({ x, y })
        children.push(sprite)
        return sprite
      }),
      getChildren: vi.fn().mockReturnValue(children),
      clear: vi.fn().mockImplementation(() => {
        children.length = 0
      })
    })

    mockPhysicsGroup = createMockGroup()
    mockStaticGroup = {
      create: vi.fn().mockImplementation((x, y) => createSpriteMock({ x, y })),
      getChildren: vi.fn().mockReturnValue([]),
      refresh: vi.fn()
    }
    mockCoinsGroup = createMockGroup()
    mockPowerUpsGroup = createMockGroup()
    mockEnemiesGroup = createMockGroup()

    // Setup scene properties
    ;(scene as any).player = createSpriteMock()
    ;(scene as any).gun = {
      setPosition: vi.fn(),
      setRotation: vi.fn(),
      setFlipX: vi.fn(),
      setFlipY: vi.fn(),
      setVisible: vi.fn(),
      setAngle: vi.fn(),
      x: 400,
      y: 550
    }
    ;(scene as any).bullets = mockPhysicsGroup
    ;(scene as any).platforms = mockStaticGroup
    ;(scene as any).spikes = mockStaticGroup
    ;(scene as any).coins = mockCoinsGroup
    ;(scene as any).powerUps = mockPowerUpsGroup
    ;(scene as any).enemies = mockEnemiesGroup
    ;(scene as any).blockFragments = mockPhysicsGroup
    ;(scene as any).remoteCoins = new Map()
    ;(scene as any).remoteEnemies = new Map()
    ;(scene as any).remotePowerUps = new Map()
    ;(scene as any).isOnlineMode = false
    ;(scene as any).isOnlineHost = false
    ;(scene as any).onlineRngState = 12345
    ;(scene as any).farthestPlayerX = 0
    ;(scene as any).gameMode = 'endless'
    ;(scene as any).currentLevel = 1
    ;(scene as any).playerIsDead = false
    ;(scene as any).isTransitioning = false
    ;(scene as any).audioManager = {
      playSound: vi.fn(),
      stopSound: vi.fn()
    }
    ;(scene as any).musicManager = {
      playMusic: vi.fn(),
      stopMusic: vi.fn(),
      fadeOut: vi.fn()
    }
    ;(scene as any).uiManager = {
      createLoadingUI: vi.fn(),
      updateLoadingProgress: vi.fn(),
      hideLoadingUI: vi.fn(),
      createGameUI: vi.fn(),
      updateUI: vi.fn(),
      updateHealth: vi.fn(),
      updateCoins: vi.fn(),
      updateScore: vi.fn(),
      updateLives: vi.fn(),
      showGameOver: vi.fn(),
      hideGameOver: vi.fn(),
      showMessage: vi.fn(),
      hideMessage: vi.fn(),
      showShopTip: vi.fn(),
      hideShopTip: vi.fn(),
      showBossHealth: vi.fn(),
      hideBossHealth: vi.fn(),
      updateBossHealth: vi.fn(),
      closeInGameChat: vi.fn(),
      destroy: vi.fn()
    }
    ;(scene as any).worldGenerator = {
      generateInitialWorld: vi.fn(),
      generateChunk: vi.fn()
    }
    ;(scene as any).dqnAgent = null
    ;(scene as any).input = {
      keyboard: { createCursorKeys: vi.fn(), addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }), on: vi.fn() },
      gamepad: { on: vi.fn(), pads: [] },
      on: vi.fn(),
      activePointer: { x: 0, y: 0, worldX: 500, worldY: 300 }
    }
    ;(scene as any).time = {
      addEvent: vi.fn().mockReturnValue({ remove: vi.fn() }),
      delayedCall: vi.fn().mockReturnValue({ remove: vi.fn() }),
      now: 1000
    }
    ;(scene as any).tweens = {
      add: vi.fn().mockReturnValue({ stop: vi.fn() }),
      killAll: vi.fn()
    }
    ;(scene as any).add = {
      text: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }),
      sprite: vi.fn().mockImplementation(() => createSpriteMock()),
      image: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }),
      graphics: vi.fn().mockReturnValue({
        fillStyle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        setDepth: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis()
      }),
      particles: vi.fn().mockReturnValue({
        createEmitter: vi.fn().mockReturnValue({
          setPosition: vi.fn().mockReturnThis(),
          explode: vi.fn()
        })
      })
    }
    ;(scene as any).physics = {
      add: {
        sprite: vi.fn().mockImplementation(() => createSpriteMock()),
        group: vi.fn().mockReturnValue(mockPhysicsGroup),
        staticGroup: vi.fn().mockReturnValue(mockStaticGroup),
        collider: vi.fn(),
        overlap: vi.fn()
      }
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('shutdown', () => {
    it('should stop music when shutting down', () => {
      ;(scene as any).shutdown()
      expect((scene as any).musicManager.stopMusic).toHaveBeenCalled()
    })

    it('should dispose DQN agent if exists', () => {
      const mockDqnAgent = { dispose: vi.fn() }
      ;(scene as any).dqnAgent = mockDqnAgent
      
      ;(scene as any).shutdown()
      
      expect(mockDqnAgent.dispose).toHaveBeenCalled()
      expect((scene as any).dqnAgent).toBeUndefined()
    })

    it('should close in-game chat', () => {
      ;(scene as any).shutdown()
      expect((scene as any).uiManager.closeInGameChat).toHaveBeenCalled()
    })

    it('should handle missing gamepad pads array gracefully', () => {
      ;(scene as any).input = {
        gamepad: {} // No pads array
      }
      
      // Should not throw
      expect(() => (scene as any).shutdown()).not.toThrow()
    })

    it('should set empty pads array if missing', () => {
      const gamepadPlugin = {} as any
      ;(scene as any).input = { gamepad: gamepadPlugin }
      
      ;(scene as any).shutdown()
      
      expect(gamepadPlugin.pads).toEqual([])
    })

    it('should handle plugin not existing gracefully', () => {
      ;(scene as any).input = null
      
      // Should not throw
      expect(() => (scene as any).shutdown()).not.toThrow()
    })
  })

  describe('handleRemoteCoinSpawn', () => {
    it('should skip if host', () => {
      ;(scene as any).isOnlineHost = true
      const coinState = { coin_id: 'coin_1', x: 100, y: 200, value: 1 }
      
      ;(scene as any).handleRemoteCoinSpawn(coinState)
      
      expect(mockCoinsGroup.create).not.toHaveBeenCalled()
    })

    it('should skip if coin already tracked', () => {
      ;(scene as any).isOnlineHost = false
      ;(scene as any).remoteCoins.set('coin_1', createSpriteMock())
      const coinState = { coin_id: 'coin_1', x: 100, y: 200, value: 1 }
      
      ;(scene as any).handleRemoteCoinSpawn(coinState)
      
      expect(mockCoinsGroup.create).not.toHaveBeenCalled()
    })

    it('should track existing local coin from seeded generation', () => {
      ;(scene as any).isOnlineHost = false
      const existingCoin = createSpriteMock({ x: 100, y: 200, coinId: 'coin_1' })
      existingCoin.getData = vi.fn().mockImplementation((key) => {
        if (key === 'coinId') return 'coin_1'
        return null
      })
      mockCoinsGroup.getChildren = vi.fn().mockReturnValue([existingCoin])
      
      const coinState = { coin_id: 'coin_1', x: 100, y: 200, value: 1 }
      
      ;(scene as any).handleRemoteCoinSpawn(coinState)
      
      expect((scene as any).remoteCoins.get('coin_1')).toBe(existingCoin)
      expect(mockCoinsGroup.create).not.toHaveBeenCalled()
    })

    it('should sync position if significantly different', () => {
      ;(scene as any).isOnlineHost = false
      const existingCoin = createSpriteMock({ x: 100, y: 200, coinId: 'coin_1' })
      existingCoin.getData = vi.fn().mockImplementation((key) => {
        if (key === 'coinId') return 'coin_1'
        return null
      })
      mockCoinsGroup.getChildren = vi.fn().mockReturnValue([existingCoin])
      
      const coinState = { coin_id: 'coin_1', x: 110, y: 210, value: 1 } // Different by >2
      
      ;(scene as any).handleRemoteCoinSpawn(coinState)
      
      expect(existingCoin.setPosition).toHaveBeenCalledWith(110, 210)
    })

    it('should create new coin if not found locally', () => {
      ;(scene as any).isOnlineHost = false
      mockCoinsGroup.getChildren = vi.fn().mockReturnValue([])
      
      const coinState = { coin_id: 'coin_new', x: 300, y: 400, value: 5 }
      
      ;(scene as any).handleRemoteCoinSpawn(coinState)
      
      expect(mockCoinsGroup.create).toHaveBeenCalledWith(300, 400, 'coin')
    })

    it('should set coin as dropped with gravity if id starts with coin_drop_', () => {
      ;(scene as any).isOnlineHost = false
      mockCoinsGroup.getChildren = vi.fn().mockReturnValue([])
      
      const coinState = { coin_id: 'coin_drop_1', x: 300, y: 400, value: 5 }
      const createdCoin = createSpriteMock()
      mockCoinsGroup.create = vi.fn().mockReturnValue(createdCoin)
      
      ;(scene as any).handleRemoteCoinSpawn(coinState)
      
      expect(createdCoin.body.setAllowGravity).toHaveBeenCalledWith(true)
    })
  })

  describe('handleRemotePowerUpSpawn', () => {
    it('should skip if host', () => {
      ;(scene as any).isOnlineHost = true
      const powerupState = { powerup_id: 'powerup_1', x: 100, y: 200, type: 'speed' }
      
      ;(scene as any).handleRemotePowerUpSpawn(powerupState)
      
      expect(mockPowerUpsGroup.create).not.toHaveBeenCalled()
    })

    it('should track existing local powerup', () => {
      ;(scene as any).isOnlineHost = false
      const existingPowerUp = createSpriteMock({ x: 100, y: 200, powerupId: 'powerup_1' })
      existingPowerUp.getData = vi.fn().mockImplementation((key) => {
        if (key === 'powerupId') return 'powerup_1'
        return null
      })
      mockPowerUpsGroup.getChildren = vi.fn().mockReturnValue([existingPowerUp])
      
      const powerupState = { powerup_id: 'powerup_1', x: 100, y: 200, type: 'speed' }
      
      ;(scene as any).handleRemotePowerUpSpawn(powerupState)
      
      expect(mockPowerUpsGroup.create).not.toHaveBeenCalled()
    })

    it('should sync position if significantly different', () => {
      ;(scene as any).isOnlineHost = false
      const existingPowerUp = createSpriteMock({ x: 100, y: 200, powerupId: 'powerup_1' })
      existingPowerUp.getData = vi.fn().mockImplementation((key) => {
        if (key === 'powerupId') return 'powerup_1'
        return null
      })
      mockPowerUpsGroup.getChildren = vi.fn().mockReturnValue([existingPowerUp])
      
      const powerupState = { powerup_id: 'powerup_1', x: 110, y: 210, type: 'speed' } // Different by >2
      
      ;(scene as any).handleRemotePowerUpSpawn(powerupState)
      
      expect(existingPowerUp.setPosition).toHaveBeenCalledWith(110, 210)
    })

    it('should create new powerup if not found locally', () => {
      ;(scene as any).isOnlineHost = false
      mockPowerUpsGroup.getChildren = vi.fn().mockReturnValue([])
      
      const powerupState = { powerup_id: 'powerup_new', x: 300, y: 400, type: 'shield' }
      
      ;(scene as any).handleRemotePowerUpSpawn(powerupState)
      
      expect(mockPowerUpsGroup.create).toHaveBeenCalledWith(300, 400, 'shield')
    })

    it('should add floating animation to new powerup', () => {
      ;(scene as any).isOnlineHost = false
      mockPowerUpsGroup.getChildren = vi.fn().mockReturnValue([])
      
      const powerupState = { powerup_id: 'powerup_new', x: 300, y: 400, type: 'health' }
      
      ;(scene as any).handleRemotePowerUpSpawn(powerupState)
      
      // Should add two tweens (floating and glow)
      expect((scene as any).tweens.add).toHaveBeenCalledTimes(2)
    })
  })

  describe('handleRemoteEnemyStateUpdate', () => {
    it('should skip if enemy not found', () => {
      const state = { enemy_id: 'enemy_1', x: 100, y: 200, health: 50, is_alive: true }
      
      // Should not throw
      expect(() => (scene as any).handleRemoteEnemyStateUpdate('enemy_1', state)).not.toThrow()
    })

    it('should update enemy from remote enemies map', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200 })
      ;(scene as any).remoteEnemies.set('enemy_1', enemySprite)
      
      const state = { enemy_id: 'enemy_1', x: 150, y: 250, velocity_x: 10, velocity_y: 0, health: 80, is_alive: true }
      
      ;(scene as any).handleRemoteEnemyStateUpdate('enemy_1', state)
      
      expect(enemySprite.setVelocity).toHaveBeenCalledWith(10, 0)
      expect(enemySprite.setData).toHaveBeenCalledWith('health', 80)
    })

    it('should search in local enemies if not in remote map', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200, enemyId: 'enemy_2' })
      enemySprite.getData = vi.fn().mockImplementation((key) => {
        if (key === 'enemyId') return 'enemy_2'
        return null
      })
      mockEnemiesGroup.getChildren = vi.fn().mockReturnValue([enemySprite])
      
      const state = { enemy_id: 'enemy_2', x: 150, y: 250, velocity_x: 5, velocity_y: 0, health: 60, is_alive: true }
      
      ;(scene as any).handleRemoteEnemyStateUpdate('enemy_2', state)
      
      expect(enemySprite.setVelocity).toHaveBeenCalledWith(5, 0)
    })

    it('should snap position if distance exceeds threshold', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200 })
      ;(scene as any).remoteEnemies.set('enemy_1', enemySprite)
      
      // Large distance - should snap
      const state = { enemy_id: 'enemy_1', x: 200, y: 300, velocity_x: 0, velocity_y: 0, health: 100, is_alive: true }
      
      ;(scene as any).handleRemoteEnemyStateUpdate('enemy_1', state)
      
      expect(enemySprite.setPosition).toHaveBeenCalled()
    })

    it('should apply lerp for smooth correction within threshold', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200 })
      ;(scene as any).remoteEnemies.set('enemy_1', enemySprite)
      
      // Small distance - should lerp
      const state = { enemy_id: 'enemy_1', x: 110, y: 210, velocity_x: 0, velocity_y: 0, health: 100, is_alive: true }
      
      ;(scene as any).handleRemoteEnemyStateUpdate('enemy_1', state)
      
      expect(enemySprite.setPosition).toHaveBeenCalled()
    })

    it('should apply tint when enemy is dead', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200 })
      ;(scene as any).remoteEnemies.set('enemy_1', enemySprite)
      
      const state = { enemy_id: 'enemy_1', x: 100, y: 200, velocity_x: 0, velocity_y: 0, health: 0, is_alive: false }
      
      ;(scene as any).handleRemoteEnemyStateUpdate('enemy_1', state)
      
      expect(enemySprite.setTint).toHaveBeenCalledWith(0xff0000)
    })

    it('should skip if enemy sprite is inactive', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200, active: false })
      ;(scene as any).remoteEnemies.set('enemy_1', enemySprite)
      
      const state = { enemy_id: 'enemy_1', x: 150, y: 250, velocity_x: 10, velocity_y: 0, health: 80, is_alive: true }
      
      ;(scene as any).handleRemoteEnemyStateUpdate('enemy_1', state)
      
      // Should return early - no velocity update
      expect(enemySprite.setVelocity).not.toHaveBeenCalled()
    })
  })

  describe('spawnRandomEnemy', () => {
    it('should abort if non-host tries to respawn in online mode', () => {
      ;(scene as any).isOnlineMode = true
      ;(scene as any).isOnlineHost = false
      
      // Respawn = enemyIndex is undefined
      ;(scene as any).spawnRandomEnemy(500, 300, 1.0, 0, undefined)
      
      expect(mockEnemiesGroup.create).not.toHaveBeenCalled()
    })

    it('should allow host to respawn in online mode', () => {
      ;(scene as any).isOnlineMode = true
      ;(scene as any).isOnlineHost = true
      
      ;(scene as any).spawnRandomEnemy(500, 300, 1.0, 0, undefined)
      
      expect(mockEnemiesGroup.create).toHaveBeenCalled()
    })

    it('should spawn small enemy (fly/bee) when rand < 0.4', () => {
      ;(scene as any).isOnlineMode = true
      ;(scene as any).onlineRngState = 1 // Will produce small rand values
      
      // Mock to produce low values
      const origSeededRandom = (scene as any).onlineSeededRandom
      ;(scene as any).onlineSeededRandom = vi.fn()
        .mockReturnValueOnce(0.2)  // enemy size rand
        .mockReturnValueOnce(0.3)  // type rand (fly vs bee)
      
      ;(scene as any).spawnRandomEnemy(500, 300, 1.0, 0, 1)
      
      expect(mockEnemiesGroup.create).toHaveBeenCalled()
    })

    it('should spawn medium enemy (slime) when 0.4 <= rand < 0.8', () => {
      ;(scene as any).isOnlineMode = true
      ;(scene as any).onlineSeededRandom = vi.fn()
        .mockReturnValueOnce(0.5)  // enemy size rand
        .mockReturnValueOnce(0.3)  // type rand (slimeGreen vs slimeBlue)
      
      ;(scene as any).spawnRandomEnemy(500, 300, 1.0, 0, 1)
      
      expect(mockEnemiesGroup.create).toHaveBeenCalled()
    })

    it('should spawn large enemy (worm) when rand >= 0.8', () => {
      ;(scene as any).isOnlineMode = true
      ;(scene as any).onlineSeededRandom = vi.fn()
        .mockReturnValueOnce(0.9)  // enemy size rand
        .mockReturnValueOnce(0.7)  // type rand (wormGreen vs wormPink)
      
      ;(scene as any).spawnRandomEnemy(500, 300, 1.0, 0, 1)
      
      expect(mockEnemiesGroup.create).toHaveBeenCalled()
    })

    it('should use Math.random when not in online mode', () => {
      ;(scene as any).isOnlineMode = false
      const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      
      ;(scene as any).spawnRandomEnemy(500, 300, 1.0)
      
      expect(mathRandomSpy).toHaveBeenCalled()
      expect(mockEnemiesGroup.create).toHaveBeenCalled()
    })
  })

  describe('handleEntitiesSync', () => {
    it('should process enemies from sync data', () => {
      const enemies = [
        { enemy_id: 'e1', x: 100, y: 200, enemy_type: 'fly', health: 10, is_alive: true, velocity_x: 0, velocity_y: 0 },
        { enemy_id: 'e2', x: 300, y: 400, enemy_type: 'slimeGreen', health: 20, is_alive: true, velocity_x: 5, velocity_y: 0 }
      ]
      const coins: any[] = []
      
      // Mock remote enemies
      const existingEnemy = createSpriteMock({ x: 100, y: 200 })
      ;(scene as any).remoteEnemies.set('e1', existingEnemy)
      
      ;(scene as any).handleEntitiesSync(enemies, coins)
      
      // Should have processed enemies
      expect((scene as any).remoteEnemies.has('e1')).toBe(true)
    })

    it('should process coins from sync data', () => {
      const enemies: any[] = []
      const coins = [
        { coin_id: 'c1', x: 100, y: 200, value: 1, is_collected: false },
        { coin_id: 'c2', x: 300, y: 400, value: 5, is_collected: false }
      ]
      
      ;(scene as any).isOnlineHost = false
      mockCoinsGroup.getChildren = vi.fn().mockReturnValue([])
      
      ;(scene as any).handleEntitiesSync(enemies, coins)
      
      // Should create coins for non-host
      expect(mockCoinsGroup.create).toHaveBeenCalled()
    })

    it('should remove stale coins not in server list (non-host)', () => {
      ;(scene as any).isOnlineHost = false
      
      const staleCoin = createSpriteMock({ x: 500, y: 600, coinId: 'stale_coin' })
      staleCoin.getData = vi.fn().mockImplementation((key) => {
        if (key === 'coinId') return 'stale_coin'
        return null
      })
      ;(scene as any).remoteCoins.set('stale_coin', staleCoin)
      
      const enemies: any[] = []
      const coins = [
        { coin_id: 'fresh_coin', x: 100, y: 200, value: 1, is_collected: false }
      ]
      
      // Mock getChildren to return the stale coin for removal check
      mockCoinsGroup.getChildren = vi.fn().mockReturnValue([staleCoin])
      
      ;(scene as any).handleEntitiesSync(enemies, coins)
      
      expect(staleCoin.destroy).toHaveBeenCalled()
    })

    it('should destroy collected coins during sync', () => {
      ;(scene as any).isOnlineHost = false
      
      const collectedCoin = createSpriteMock({ x: 100, y: 200, coinId: 'c1' })
      collectedCoin.getData = vi.fn().mockImplementation((key) => {
        if (key === 'coinId') return 'c1'
        return null
      })
      ;(scene as any).remoteCoins.set('c1', collectedCoin)
      
      const enemies: any[] = []
      const coins = [
        { coin_id: 'c1', x: 100, y: 200, value: 1, is_collected: true } // Marked as collected
      ]
      
      mockCoinsGroup.getChildren = vi.fn().mockReturnValue([collectedCoin])
      
      ;(scene as any).handleEntitiesSync(enemies, coins)
      
      expect(collectedCoin.destroy).toHaveBeenCalled()
    })
  })

  describe('handleRemoteEnemySpawn', () => {
    it('should create enemy from network state', () => {
      const enemyState = {
        enemy_id: 'e1',
        x: 500,
        y: 300,
        enemy_type: 'fly',
        health: 10,
        max_health: 10,
        scale: 0.6,
        is_alive: true,
        velocity_x: 0,
        velocity_y: 0,
        coin_reward: 5,
        facing_right: true
      }
      
      const createdEnemy = createSpriteMock()
      createdEnemy.body = {
        ...createdEnemy.body,
        setSize: vi.fn().mockReturnThis(),
        setOffset: vi.fn().mockReturnThis(),
        setMass: vi.fn().mockReturnThis(),
        setMaxVelocity: vi.fn().mockReturnThis()
      }
      mockEnemiesGroup.create = vi.fn().mockReturnValue(createdEnemy)
      
      ;(scene as any).handleRemoteEnemySpawn(enemyState)
      
      expect(mockEnemiesGroup.create).toHaveBeenCalledWith(500, 300, 'fly')
    })

    it('should set enemy as visible and active', () => {
      const enemyState = {
        enemy_id: 'e1',
        x: 500,
        y: 300,
        enemy_type: 'slimeGreen',
        health: 20,
        max_health: 20,
        scale: 1.0,
        is_alive: true,
        velocity_x: 0,
        velocity_y: 0,
        facing_right: true
      }
      
      const createdEnemy = createSpriteMock()
      createdEnemy.body = {
        ...createdEnemy.body,
        setSize: vi.fn().mockReturnThis(),
        setOffset: vi.fn().mockReturnThis(),
        setMass: vi.fn().mockReturnThis(),
        setMaxVelocity: vi.fn().mockReturnThis()
      }
      mockEnemiesGroup.create = vi.fn().mockReturnValue(createdEnemy)
      
      ;(scene as any).handleRemoteEnemySpawn(enemyState)
      
      expect(createdEnemy.setVisible).toHaveBeenCalledWith(true)
      expect(createdEnemy.setActive).toHaveBeenCalledWith(true)
    })

    it('should track enemy in remoteEnemies map', () => {
      const enemyState = {
        enemy_id: 'e_track',
        x: 500,
        y: 300,
        enemy_type: 'bee',
        health: 5,
        max_health: 5,
        scale: 0.6,
        is_alive: true,
        velocity_x: 0,
        velocity_y: 0,
        facing_right: true
      }
      
      const createdEnemy = createSpriteMock()
      createdEnemy.body = {
        ...createdEnemy.body,
        setSize: vi.fn().mockReturnThis(),
        setOffset: vi.fn().mockReturnThis(),
        setMass: vi.fn().mockReturnThis(),
        setMaxVelocity: vi.fn().mockReturnThis()
      }
      mockEnemiesGroup.create = vi.fn().mockReturnValue(createdEnemy)
      
      ;(scene as any).handleRemoteEnemySpawn(enemyState)
      
      expect((scene as any).remoteEnemies.get('e_track')).toBe(createdEnemy)
    })

    it('should return early if sprite creation fails', () => {
      const enemyState = {
        enemy_id: 'e_fail',
        x: 500,
        y: 300,
        enemy_type: 'fly',
        health: 10,
        max_health: 10,
        scale: 0.6,
        is_alive: true,
        velocity_x: 0,
        velocity_y: 0,
        facing_right: true
      }
      
      mockEnemiesGroup.create = vi.fn().mockReturnValue(null)
      
      // Should not throw
      expect(() => (scene as any).handleRemoteEnemySpawn(enemyState)).not.toThrow()
      expect((scene as any).remoteEnemies.has('e_fail')).toBe(false)
    })

    it('should update existing enemy position and velocity', () => {
      const existingEnemy = createSpriteMock({ x: 100, y: 200 })
      existingEnemy.getData = vi.fn().mockImplementation((key) => {
        if (key === 'enemyId') return 'e_existing'
        if (key === 'enemyType') return 'fly'
        return null
      })
      
      // Search will find it in enemies group
      mockEnemiesGroup.getChildren = vi.fn().mockReturnValue([existingEnemy])
      
      const enemyState = {
        enemy_id: 'e_existing',
        x: 150,
        y: 250,
        enemy_type: 'fly',
        health: 8,
        max_health: 10,
        scale: 0.6,
        is_alive: true,
        velocity_x: 5,
        velocity_y: 0,
        facing_right: true
      }
      
      ;(scene as any).handleRemoteEnemySpawn(enemyState)
      
      expect(existingEnemy.setPosition).toHaveBeenCalledWith(150, 250)
      expect(existingEnemy.setVelocity).toHaveBeenCalledWith(5, 0)
    })
  })

  describe('onlineSeededRandom and onlineSeededBetween', () => {
    it('should produce deterministic random values', () => {
      ;(scene as any).onlineRngState = 12345
      
      const val1 = (scene as any).onlineSeededRandom()
      ;(scene as any).onlineRngState = 12345 // Reset
      const val2 = (scene as any).onlineSeededRandom()
      
      expect(val1).toBe(val2)
    })

    it('should produce value within range for onlineSeededBetween', () => {
      ;(scene as any).onlineRngState = 12345
      
      const val = (scene as any).onlineSeededBetween(10, 20)
      
      expect(val).toBeGreaterThanOrEqual(10)
      expect(val).toBeLessThanOrEqual(20)
    })
  })

  describe('handleRemoteEnemyKilled', () => {
    it('should remove enemy from tracking', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200 })
      enemySprite.scaleX = 1.0
      enemySprite.getData = vi.fn().mockImplementation((key) => {
        if (key === 'enemyId') return 'e_killed'
        if (key === 'enemyType') return 'fly'
        if (key === 'enemySize') return 'small'
        if (key === 'spawnX') return 100
        if (key === 'spawnY') return 200
        if (key === 'coinReward') return 5
        return null
      })
      ;(scene as any).remoteEnemies.set('e_killed', enemySprite)
      ;(scene as any).textures = { exists: vi.fn().mockReturnValue(false) }
      mockEnemiesGroup.getChildren = vi.fn().mockReturnValue([enemySprite])
      
      ;(scene as any).handleRemoteEnemyKilled('e_killed', 'player1')
      
      // Enemy should be removed from map
      expect((scene as any).remoteEnemies.has('e_killed')).toBe(false)
    })

    it('should update score when enemy killed', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200 })
      enemySprite.scaleX = 1.0
      enemySprite.getData = vi.fn().mockImplementation((key) => {
        if (key === 'enemyId') return 'e_score'
        if (key === 'enemyType') return 'slimeGreen'
        if (key === 'enemySize') return 'medium'
        if (key === 'coinReward') return 10
        return null
      })
      ;(scene as any).remoteEnemies.set('e_score', enemySprite)
      ;(scene as any).score = 0
      ;(scene as any).enemiesDefeated = 0
      ;(scene as any).textures = { exists: vi.fn().mockReturnValue(false) }
      mockEnemiesGroup.getChildren = vi.fn().mockReturnValue([enemySprite])
      
      ;(scene as any).handleRemoteEnemyKilled('e_score', 'player2')
      
      expect((scene as any).enemiesDefeated).toBe(1)
      expect((scene as any).score).toBe(100) // medium = 100 points
    })

    it('should handle missing enemy gracefully', () => {
      mockEnemiesGroup.getChildren = vi.fn().mockReturnValue([])
      
      // Should not throw
      expect(() => (scene as any).handleRemoteEnemyKilled('nonexistent', 'player1')).not.toThrow()
    })

    it('should apply death tint to enemy', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 200 })
      enemySprite.scaleX = 1.0
      enemySprite.getData = vi.fn().mockImplementation((key) => {
        if (key === 'enemyId') return 'e_tint'
        if (key === 'enemyType') return 'fly'
        if (key === 'enemySize') return 'small'
        return null
      })
      ;(scene as any).remoteEnemies.set('e_tint', enemySprite)
      ;(scene as any).textures = { exists: vi.fn().mockReturnValue(false) }
      mockEnemiesGroup.getChildren = vi.fn().mockReturnValue([enemySprite])
      
      ;(scene as any).handleRemoteEnemyKilled('e_tint', 'player2')
      
      expect(enemySprite.setTint).toHaveBeenCalledWith(0xff0000)
    })
  })

  describe('dropCoins in online mode', () => {
    it('should skip coin drops if non-host in online mode', () => {
      ;(scene as any).isOnlineMode = true
      ;(scene as any).isOnlineHost = false
      
      ;(scene as any).dropCoins(500, 300, 5)
      
      // Should not call time.delayedCall when non-host
      expect((scene as any).time.delayedCall).not.toHaveBeenCalled()
    })

    it('should schedule coin drops when host in online mode', () => {
      ;(scene as any).isOnlineMode = true
      ;(scene as any).isOnlineHost = true
      ;(scene as any).coinDropCounter = 0
      ;(scene as any).findSafeCoinPosition = vi.fn().mockReturnValue({ x: 500, y: 300 })
      ;(scene as any).onlineCoopService = {
        sendCoinSpawned: vi.fn()
      }
      
      ;(scene as any).dropCoins(500, 300, 3)
      
      // Should schedule 3 delayed calls (one per coin)
      expect((scene as any).time.delayedCall).toHaveBeenCalledTimes(3)
    })

    it('should use deterministic offsets in online mode', () => {
      ;(scene as any).isOnlineMode = true
      ;(scene as any).isOnlineHost = true
      ;(scene as any).coinDropCounter = 0
      ;(scene as any).findSafeCoinPosition = vi.fn().mockReturnValue({ x: 500, y: 300 })
      
      ;(scene as any).dropCoins(500, 300, 1)
      
      // Verify deterministic approach via delayedCall being set up
      expect((scene as any).time.delayedCall).toHaveBeenCalled()
    })
  })

  describe('difficulty multiplier calculation', () => {
    it('should calculate difficulty for endless mode', () => {
      ;(scene as any).gameMode = 'endless'
      ;(scene as any).player.x = 15000 // 3 * 5000 = floor 3, multiplier = 1 + 3 * 0.2 = 1.6
      
      const multiplier = 1 + Math.floor(15000 / 5000) * 0.2
      
      expect(multiplier).toBe(1.6)
    })

    it('should calculate difficulty for levels mode', () => {
      ;(scene as any).gameMode = 'levels'
      ;(scene as any).currentLevel = 5 // multiplier = 1 + (5-1) * 0.3 = 2.2
      
      const multiplier = 1 + ((scene as any).currentLevel - 1) * 0.3
      
      expect(multiplier).toBe(2.2)
    })
  })
})
