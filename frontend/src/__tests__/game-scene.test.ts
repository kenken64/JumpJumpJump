import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create comprehensive sprite mock factory
const createSpriteMock = () => ({
  setOrigin: vi.fn().mockReturnThis(),
  setScale: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setCollideWorldBounds: vi.fn().mockReturnThis(),
  setBounce: vi.fn().mockReturnThis(),
  setGravityY: vi.fn().mockReturnThis(),
  setVelocity: vi.fn().mockReturnThis(),
  setVelocityX: vi.fn().mockReturnThis(),
  setVelocityY: vi.fn().mockReturnThis(),
  setAccelerationX: vi.fn().mockReturnThis(),
  setDragX: vi.fn().mockReturnThis(),
  setMaxVelocity: vi.fn().mockReturnThis(),
  play: vi.fn().mockReturnThis(),
  setData: vi.fn().mockReturnThis(),
  getData: vi.fn().mockReturnValue(0),
  clearTint: vi.fn().mockReturnThis(),
  setTint: vi.fn().mockReturnThis(),
  setFlipX: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  setPushable: vi.fn().mockReturnThis(),
  setImmovable: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
  x: 400,
  y: 550,
  width: 70,
  height: 90,
  anims: {
    play: vi.fn(),
    currentAnim: { key: 'idle' }
  },
  body: {
    setSize: vi.fn().mockReturnThis(),
    setOffset: vi.fn().mockReturnThis(),
    setMass: vi.fn().mockReturnThis(),
    setMaxVelocity: vi.fn().mockReturnThis(),
    touching: { down: true },
    blocked: { down: true },
    velocity: { x: 0, y: 0 },
    gravity: { y: 0 },
    enable: true,
    x: 400,
    y: 550,
    width: 50,
    height: 80
  }
})

// Mock Phaser Module
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
      sys = {
        settings: { data: {} },
        game: {
          device: {
            os: { desktop: true }
          },
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
          setScrollFactor: vi.fn().mockReturnThis()
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
          setRotation: vi.fn().mockReturnThis()
        }),
        circle: vi.fn().mockReturnValue({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillEllipse: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          generateTexture: vi.fn(),
          setDepth: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          setScrollFactor: vi.fn().mockReturnThis()
        }),
        container: vi.fn().mockReturnValue({
          add: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis()
        }),
        particles: vi.fn().mockReturnValue({
          createEmitter: vi.fn().mockReturnValue({
            setPosition: vi.fn().mockReturnThis(),
            start: vi.fn().mockReturnThis(),
            stop: vi.fn().mockReturnThis(),
            explode: vi.fn()
          }),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        group: vi.fn().mockReturnValue({
          add: vi.fn(),
          create: vi.fn().mockImplementation(() => createSpriteMock()),
          clear: vi.fn(),
          getChildren: vi.fn().mockReturnValue([])
        })
      }
      load = {
        image: vi.fn(),
        audio: vi.fn(),
        spritesheet: vi.fn(),
        plugin: vi.fn(),
        on: vi.fn()
      }
      input = {
        keyboard: {
          on: vi.fn(),
          addKey: vi.fn().mockReturnValue({
            on: vi.fn(),
            isDown: false
          }),
          createCursorKeys: vi.fn().mockReturnValue({
            up: { isDown: false },
            down: { isDown: false },
            left: { isDown: false },
            right: { isDown: false },
            space: { isDown: false }
          }),
          addKeys: vi.fn().mockReturnValue({
            w: { isDown: false },
            a: { isDown: false },
            s: { isDown: false },
            d: { isDown: false }
          })
        },
        on: vi.fn(),
        once: vi.fn(),
        addPointer: vi.fn(),
        gamepad: {
          once: vi.fn()
        }
      }
      sound = {
        add: vi.fn().mockReturnValue({
          play: vi.fn(),
          stop: vi.fn()
        }),
        stopAll: vi.fn()
      }
      tweens = {
        add: vi.fn().mockReturnValue({
          stop: vi.fn()
        })
      }
      time = {
        addEvent: vi.fn().mockReturnValue({
          destroy: vi.fn()
        }),
        delayedCall: vi.fn().mockImplementation(() => {
          // Don't auto-execute callbacks to avoid cascade
          return { destroy: vi.fn() }
        }),
        now: 0
      }
      scale = {
        isFullscreen: false,
        startFullscreen: vi.fn(),
        stopFullscreen: vi.fn()
      }
      anims = {
        create: vi.fn(),
        play: vi.fn(),
        generateFrameNames: vi.fn()
      }
      textures = {
        exists: vi.fn().mockReturnValue(true),
        addCanvas: vi.fn()
      }
      make = {
        graphics: vi.fn().mockImplementation(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillEllipse: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          fill: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          generateTexture: vi.fn(),
          destroy: vi.fn()
        }))
      }
      physics = {
        add: {
          sprite: vi.fn().mockImplementation(() => createSpriteMock()),
          group: vi.fn().mockReturnValue({
            add: vi.fn(),
            create: vi.fn().mockImplementation(() => createSpriteMock()),
            clear: vi.fn(),
            getChildren: vi.fn().mockReturnValue([]),
            countActive: vi.fn().mockReturnValue(0)
          }),
          staticGroup: vi.fn().mockReturnValue({
            add: vi.fn(),
            create: vi.fn().mockReturnValue({
              setOrigin: vi.fn().mockReturnThis(),
              setScale: vi.fn().mockReturnThis(),
              setDepth: vi.fn().mockReturnThis(),
              refreshBody: vi.fn()
            }),
            clear: vi.fn(),
            getChildren: vi.fn().mockReturnValue([])
          }),
          collider: vi.fn(),
          overlap: vi.fn()
        },
        world: {
          setBounds: vi.fn(),
          gravity: { y: 0 }
        }
      }
      scene = {
        start: vi.fn(),
        restart: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        settings: { data: {} }
      }
      registry = {
        set: vi.fn(),
        get: vi.fn()
      }
      game = {
        device: {
          os: { desktop: true }
        },
        scale: {
          isFullscreen: false,
          startFullscreen: vi.fn(),
          stopFullscreen: vi.fn()
        }
      }
    },
    GameObjects: {
      Sprite: class {},
      Text: class {},
      Graphics: class {},
      Image: class {},
      Container: class {},
      Group: class {}
    },
    Physics: {
      Arcade: {
        Sprite: class {},
        Body: class {},
        Group: class {},
        StaticGroup: class {}
      }
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          W: 87,
          A: 65,
          S: 83,
          D: 68,
          UP: 38,
          DOWN: 40,
          LEFT: 37,
          RIGHT: 39,
          SPACE: 32,
          ESC: 27,
          Q: 81,
          E: 69,
          F: 70,
          G: 71,
          P: 80
        }
      }
    },
    Math: {
      Between: vi.fn().mockImplementation((min, max) => Math.floor(Math.random() * (max - min + 1)) + min),
      Clamp: vi.fn().mockImplementation((value, min, max) => Math.min(Math.max(value, min), max)),
      Distance: {
        Between: vi.fn().mockReturnValue(100)
      },
      FloatBetween: vi.fn().mockImplementation((min, max) => Math.random() * (max - min) + min)
    },
    Display: {
      Color: {
        IntegerToColor: vi.fn().mockReturnValue({ color: 0xffffff })
      }
    },
    Geom: {
      Rectangle: class {
        contains() { return false }
      }
    }
  }
  return { default: Phaser, ...Phaser }
})

// Mock SoundManager
vi.mock('../utils/SoundManager', () => ({
  SoundManager: class {
    static getInstance() { return new this() }
    playSound() {}
    stopSound() {}
    playMusic() {}
    stopMusic() {}
  }
}))

// Mock MusicManager
vi.mock('../utils/MusicManager', () => ({
  MusicManager: class {
    static getInstance() { return new this() }
    playGameMusic() {}
    stopGameMusic() {}
  }
}))

// Mock WorldGenerator
vi.mock('../utils/WorldGenerator', () => ({
  WorldGenerator: class {
    generateWorld() { return 1000 }
    generateChunk() {}
    getSeed() { return 12345 }
  }
}))

// Mock ControlManager
vi.mock('../utils/ControlManager', () => ({
  ControlManager: class {
    setupControls() {}
    update() {}
    getMovement() { return { left: false, right: false, jump: false, shoot: false } }
  }
}))

// Mock AIPlayer
vi.mock('../utils/AIPlayer', () => ({
  AIPlayer: class {
    update() {}
  }
}))

// Mock MLAIPlayer
vi.mock('../utils/MLAIPlayer', () => ({
  MLAIPlayer: class {
    update() {}
    getDecision() { return { moveLeft: false, moveRight: false, jump: false, shoot: false } }
  }
}))

// Mock DQNAgent
vi.mock('../utils/DQNAgent', () => ({
  DQNAgent: class {
    getAction() { return 0 }
    remember() {}
    replay() {}
  }
}))

// Mock OnlinePlayerManager
vi.mock('../utils/OnlinePlayerManager', () => ({
  OnlinePlayerManager: class {
    update() {}
  }
}))

// Mock OnlineCoopService
vi.mock('../services/OnlineCoopService', () => ({
  OnlineCoopService: {
    getInstance: () => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendGameState: vi.fn(),
      onGameStateReceived: vi.fn()
    })
  }
}))

// Mock VirtualGamepad
vi.mock('../utils/VirtualGamepad', () => ({
  VirtualGamepad: class {
    create() {}
    update() {}
    setVisible() {}
    destroy() {}
  }
}))

// Mock UIManager
vi.mock('../managers/UIManager', () => ({
  UIManager: class {
    create() {}
    update() {}
    updateScore() {}
    updateLives() {}
    updateHealth() {}
    updateCoins() {}
    showLevelComplete() {}
    showGameOver() {}
  }
}))

// Import GameScene AFTER mocks
import GameScene from '../scenes/GameScene'

describe('GameScene', () => {
  let scene: GameScene

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock global AudioContext for tests
    global.AudioContext = vi.fn().mockImplementation(() => ({
      createGain: vi.fn().mockReturnValue({
        connect: vi.fn(),
        gain: { value: 1 }
      }),
      createOscillator: vi.fn().mockReturnValue({
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 440 }
      }),
      destination: {},
      close: vi.fn()
    })) as any
    
    // Instantiate scene
    scene = new GameScene()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(scene).toBeDefined()
    expect(scene).toBeInstanceOf(GameScene)
  })

  describe('init', () => {
    it('should initialize with default values', () => {
      scene.init({})
      expect(scene.isCoopMode).toBe(false)
      expect(scene.isOnlineMode).toBe(false)
    })

    it('should handle co-op mode', () => {
      scene.init({ mode: 'coop' })
      expect(scene.isCoopMode).toBe(true)
      expect(scene.isOnlineMode).toBe(false)
    })

    it('should handle online co-op mode', () => {
      scene.init({ mode: 'online_coop', playerNumber: 1, playerId: 'test-player' })
      expect(scene.isOnlineMode).toBe(true)
      expect(scene.isCoopMode).toBe(false)
    })

    it('should handle loaded game with level and score', () => {
      scene.init({ isLoadedGame: true, level: 5, score: 1000 })
      expect(scene.currentLevel).toBe(5)
    })

    it('should handle endless mode from loaded game', () => {
      scene.init({ isLoadedGame: true, level: 1, gameMode: 'endless' })
      expect(scene.gameMode).toBe('endless')
    })

    it('should handle levels mode', () => {
      scene.init({ isLoadedGame: true, level: 1, gameMode: 'levels' })
      expect(scene.gameMode).toBe('levels')
    })
  })

  describe('preload', () => {
    it('should setup load error handler', () => {
      scene.preload()
      expect(scene.load.on).toHaveBeenCalledWith('loaderror', expect.any(Function))
    })
  })

  describe('scene properties', () => {
    it('should have default score of 0', () => {
      expect(scene.score).toBe(0)
    })

    it('should have default level of 1', () => {
      expect(scene.currentLevel).toBe(1)
    })

    it('should have default coinCount of 0', () => {
      expect(scene.coinCount).toBe(0)
    })

    it('should have default enemiesDefeated of 0', () => {
      expect(scene.enemiesDefeated).toBe(0)
    })
  })

  describe('game mode', () => {
    it('should default to levels mode', () => {
      expect(scene.gameMode).toBe('levels')
    })

    it('should be able to set endless mode via dqnTraining', () => {
      scene.init({ dqnTraining: true, gameMode: 'endless' })
      expect(scene.gameMode).toBe('endless')
    })
  })

  describe('player state', () => {
    it('should initially have no player', () => {
      expect(scene.player).toBeUndefined()
    })

    it('should initially have no player2 in non-coop mode', () => {
      expect(scene.player2).toBeUndefined()
    })
  })

  describe('multiplayer modes', () => {
    it('should default to non-coop mode', () => {
      expect(scene.isCoopMode).toBe(false)
    })

    it('should default to non-online mode', () => {
      expect(scene.isOnlineMode).toBe(false)
    })

    it('should set coop mode when initialized with coop', () => {
      scene.init({ mode: 'coop' })
      expect(scene.isCoopMode).toBe(true)
    })

    it('should set online mode when initialized with online_coop', () => {
      scene.init({ mode: 'online_coop', playerNumber: 1, playerId: 'test' })
      expect(scene.isOnlineMode).toBe(true)
    })
  })

  describe('helper methods existence', () => {
    it('should have spawnRandomEnemy method', () => {
      expect(typeof (scene as any).spawnRandomEnemy).toBe('function')
    })

    it('should have collectCoin method', () => {
      expect(typeof (scene as any).collectCoin).toBe('function')
    })
  })

  describe('seeded random number generator', () => {
    it('should generate deterministic random numbers', () => {
      ;(scene as any).onlineRngState = 12345
      const result1 = (scene as any).onlineSeededRandom()
      
      ;(scene as any).onlineRngState = 12345
      const result2 = (scene as any).onlineSeededRandom()
      
      expect(result1).toBe(result2)
    })

    it('should return values between 0 and 1', () => {
      ;(scene as any).onlineRngState = 99999
      for (let i = 0; i < 50; i++) {
        const result = (scene as any).onlineSeededRandom()
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(1)
      }
    })

    it('should generate values in range with onlineSeededBetween', () => {
      ;(scene as any).onlineRngState = 54321
      for (let i = 0; i < 50; i++) {
        const result = (scene as any).onlineSeededBetween(10, 20)
        expect(result).toBeGreaterThanOrEqual(10)
        expect(result).toBeLessThanOrEqual(20)
      }
    })

    it('should generate deterministic results with onlineSeededBetween', () => {
      ;(scene as any).onlineRngState = 11111
      const result1 = (scene as any).onlineSeededBetween(1, 100)
      
      ;(scene as any).onlineRngState = 11111
      const result2 = (scene as any).onlineSeededBetween(1, 100)
      
      expect(result1).toBe(result2)
    })
  })

  describe('health and lives system', () => {
    it('should start with max health of 100', () => {
      expect((scene as any).maxHealth).toBe(100)
      expect((scene as any).playerHealth).toBe(100)
    })

    it('should start with 3 lives', () => {
      expect(scene.playerLives).toBe(3)
    })

    it('should carry over health from loaded game data', () => {
      scene.init({ isLoadedGame: true, level: 1, health: 50 })
      expect((scene as any).initHealth).toBe(50)
    })

    it('should carry over lives from init data', () => {
      scene.init({ lives: 1 })
      expect((scene as any).initLives).toBe(1)
    })
  })

  describe('coin management', () => {
    it('should carry over coins from init data', () => {
      scene.init({ coins: 250 })
      expect((scene as any).initCoins).toBe(250)
    })
  })

  describe('power-up state', () => {
    it('should initialize hasSpeedBoost to false', () => {
      expect((scene as any).hasSpeedBoost).toBe(false)
    })

    it('should initialize hasShield to false', () => {
      expect((scene as any).hasShield).toBe(false)
    })
  })

  describe('jump mechanics state', () => {
    it('should initialize canDoubleJump to true', () => {
      expect((scene as any).canDoubleJump).toBe(true)
    })

    it('should initialize hasDoubleJumped to false', () => {
      expect((scene as any).hasDoubleJumped).toBe(false)
    })

    it('should initialize isStomping to false', () => {
      expect((scene as any).isStomping).toBe(false)
    })
  })

  describe('level progression', () => {
    it('should set levelLength to 10000', () => {
      expect((scene as any).levelLength).toBe(10000)
    })

    it('should handle level from loaded game data', () => {
      scene.init({ isLoadedGame: true, level: 5 })
      expect(scene.currentLevel).toBe(5)
    })
  })

  describe('checkpoint system', () => {
    it('should initialize checkpoints as empty array', () => {
      expect((scene as any).checkpoints).toEqual([])
    })

    it('should initialize lastCheckpointX to 0', () => {
      expect((scene as any).lastCheckpointX).toBe(0)
    })

    it('should initialize currentCheckpoint to 0', () => {
      expect((scene as any).currentCheckpoint).toBe(0)
    })

    it('should set checkpointInterval to 2000', () => {
      expect((scene as any).checkpointInterval).toBe(2000)
    })
  })

  describe('world generation state', () => {
    it('should initialize worldGenerationX to 0', () => {
      expect((scene as any).worldGenerationX).toBe(0)
    })

    it('should initialize spikePositions as empty array', () => {
      expect((scene as any).spikePositions).toEqual([])
    })

    it('should track farthest player X position', () => {
      expect((scene as any).farthestPlayerX).toBe(0)
    })
  })

  describe('boss state', () => {
    it('should initialize bossActive to false', () => {
      expect((scene as any).bossActive).toBe(false)
    })

    it('should initialize defeatedBossLevels as empty Set', () => {
      expect((scene as any).defeatedBossLevels).toBeInstanceOf(Set)
    })
  })

  describe('equipment state', () => {
    it('should initialize equippedSkin', () => {
      expect((scene as any).equippedSkin).toBe('alienBeige')
    })

    it('should initialize equippedWeapon', () => {
      expect((scene as any).equippedWeapon).toBe('raygun')
    })
  })

  describe('debug mode', () => {
    it('should initialize debugMode to false', () => {
      expect((scene as any).debugMode).toBe(false)
    })
  })

  describe('AI mode state', () => {
    it('should initialize aiEnabled to false', () => {
      expect((scene as any).aiEnabled).toBe(false)
    })

    it('should initialize mlAIEnabled to false', () => {
      expect((scene as any).mlAIEnabled).toBe(false)
    })

    it('should initialize mlAIDecision object', () => {
      expect((scene as any).mlAIDecision).toEqual({
        moveLeft: false,
        moveRight: false,
        jump: false,
        shoot: false
      })
    })
  })

  describe('DQN training state', () => {
    it('should initialize dqnTraining to false', () => {
      expect((scene as any).dqnTraining).toBe(false)
    })

    it('should initialize dqnStepCount to 0', () => {
      expect((scene as any).dqnStepCount).toBe(0)
    })

    it('should initialize dqnEpisodeCount to 0', () => {
      expect((scene as any).dqnEpisodeCount).toBe(0)
    })

    it('should initialize dqnCurrentReward to 0', () => {
      expect((scene as any).dqnCurrentReward).toBe(0)
    })

    it('should initialize dqnAutoRestart to true', () => {
      expect((scene as any).dqnAutoRestart).toBe(true)
    })

    it('should initialize dqnSpeedMultiplier to 1', () => {
      expect((scene as any).dqnSpeedMultiplier).toBe(1)
    })

    it('should enable DQN training through init', () => {
      scene.init({ dqnTraining: true, gameMode: 'endless', level: 1 })
      expect((scene as any).dqnTraining).toBe(true)
    })
  })

  describe('online mode state', () => {
    it('should initialize remoteEnemies as empty Map', () => {
      expect((scene as any).remoteEnemies).toBeInstanceOf(Map)
      expect((scene as any).remoteEnemies.size).toBe(0)
    })

    it('should initialize remoteCoins as empty Map', () => {
      expect((scene as any).remoteCoins).toBeInstanceOf(Map)
      expect((scene as any).remoteCoins.size).toBe(0)
    })

    it('should initialize isOnlineHost to false', () => {
      expect((scene as any).isOnlineHost).toBe(false)
    })

    it('should initialize respawnEnemyCounter to 0', () => {
      expect((scene as any).respawnEnemyCounter).toBe(0)
    })

    it('should initialize coinDropCounter to 0', () => {
      expect((scene as any).coinDropCounter).toBe(0)
    })
  })

  describe('recording state', () => {
    it('should initialize isRecordingForDQN to false', () => {
      expect((scene as any).isRecordingForDQN).toBe(false)
    })

    it('should initialize recordedDemonstrations as empty array', () => {
      expect((scene as any).recordedDemonstrations).toEqual([])
    })

    it('should initialize recordingFrameCount to 0', () => {
      expect((scene as any).recordingFrameCount).toBe(0)
    })

    it('should resume recording state if isRecording is true', () => {
      scene.init({ isRecording: true })
      expect((scene as any).isRecordingForDQN).toBe(true)
    })
  })

  describe('shooting state', () => {
    it('should initialize lastShotTime to 0', () => {
      expect((scene as any).lastShotTime).toBe(0)
    })
  })

  describe('player death state', () => {
    it('should initialize playerIsDead to false', () => {
      expect((scene as any).playerIsDead).toBe(false)
    })
  })

  describe('shown tips tracking', () => {
    it('should initialize shownTips as empty Set', () => {
      expect((scene as any).shownTips).toBeInstanceOf(Set)
      expect((scene as any).shownTips.size).toBe(0)
    })
  })

  describe('level complete state', () => {
    it('should initialize levelCompleteShown to false', () => {
      expect((scene as any).levelCompleteShown).toBe(false)
    })
  })

  describe('wasOnGround tracking', () => {
    it('should initialize wasOnGround to false', () => {
      expect((scene as any).wasOnGround).toBe(false)
    })
  })

  describe('mode transitions', () => {
    it('should transition from single player to co-op mode', () => {
      expect(scene.isCoopMode).toBe(false)
      scene.init({ mode: 'coop' })
      expect(scene.isCoopMode).toBe(true)
    })

    it('should transition from single player to online mode', () => {
      expect(scene.isOnlineMode).toBe(false)
      scene.init({ 
        mode: 'online_coop',
        gameState: { seed: 123, players: {} },
        playerNumber: 1,
        playerId: 'test'
      })
      expect(scene.isOnlineMode).toBe(true)
    })

    it('should not enable both co-op and online mode simultaneously', () => {
      scene.init({ mode: 'online_coop', gameState: { seed: 123, players: {} } })
      expect(scene.isOnlineMode).toBe(true)
      expect(scene.isCoopMode).toBe(false)
    })
  })

  describe('level data initialization', () => {
    it('should properly initialize for level 1', () => {
      scene.init({ level: 1, gameMode: 'levels' })
      expect(scene.currentLevel).toBe(1)
      expect(scene.gameMode).toBe('levels')
    })

    it('should carry over state between levels', () => {
      scene.init({
        isLoadedGame: true,
        level: 3,
        lives: 2,
        score: 15000,
        coins: 75,
        gameMode: 'levels'
      })
      expect(scene.currentLevel).toBe(3)
      expect((scene as any).initLives).toBe(2)
      expect((scene as any).initScore).toBe(15000)
      expect((scene as any).initCoins).toBe(75)
    })
  })

  describe('weapon initialization', () => {
    it('should carry over weapon from loaded game data', () => {
      scene.init({ isLoadedGame: true, level: 1, weapon: 'laserGun' })
      expect((scene as any).initWeapon).toBe('laserGun')
    })

    it('should handle loaded game with weapon', () => {
      scene.init({
        isLoadedGame: true,
        level: 3,
        weapon: 'sword'
      })
      expect((scene as any).initWeapon).toBe('sword')
    })
  })

  describe('spawn position', () => {
    it('should have default player spawn X position', () => {
      expect((scene as any).playerSpawnX).toBe(400)
    })

    it('should have default player spawn Y position', () => {
      expect((scene as any).playerSpawnY).toBe(550)
    })
  })
})


