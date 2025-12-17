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
  play: vi.fn().mockReturnThis(),
  setData: vi.fn().mockReturnThis(),
  getData: vi.fn().mockImplementation((key: string) => {
    const data: any = { health: 100, lastHitTime: 0, ...options.data }
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
  setTexture: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
  active: true,
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
          strokeRect: vi.fn().mockReturnThis(),
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
          setPosition: vi.fn().mockReturnThis(),
          start: vi.fn().mockReturnThis(),
          stop: vi.fn().mockReturnThis(),
          explode: vi.fn(),
          emitParticleAt: vi.fn(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        group: vi.fn().mockReturnValue({
          add: vi.fn(),
          create: vi.fn().mockImplementation(() => createSpriteMock()),
          clear: vi.fn(),
          getChildren: vi.fn().mockReturnValue([]),
          getLength: vi.fn().mockReturnValue(0)
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
        activePointer: { 
          x: 500, 
          y: 300,
          isDown: false,
          rightButtonDown: vi.fn().mockReturnValue(false)
        },
        keyboard: {
          on: vi.fn(),
          once: vi.fn(),
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
        gamepad: { once: vi.fn(), on: vi.fn() }
      }
      sound = {
        add: vi.fn().mockReturnValue({
          play: vi.fn(),
          stop: vi.fn()
        }),
        stopAll: vi.fn()
      }
      tweens = {
        add: vi.fn().mockReturnValue({ stop: vi.fn() })
      }
      time = {
        addEvent: vi.fn().mockReturnValue({ destroy: vi.fn(), remove: vi.fn() }),
        delayedCall: vi.fn().mockImplementation(() => ({ destroy: vi.fn() })),
        now: 1000
      }
      scale = {
        isFullscreen: false,
        startFullscreen: vi.fn(),
        stopFullscreen: vi.fn()
      }
      anims = {
        create: vi.fn(),
        play: vi.fn(),
        generateFrameNames: vi.fn(),
        exists: vi.fn().mockReturnValue(true)
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
          strokePath: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          arc: vi.fn().mockReturnThis(),
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
            countActive: vi.fn().mockReturnValue(0),
            getLength: vi.fn().mockReturnValue(0),
            children: { entries: [] }
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
            getChildren: vi.fn().mockReturnValue([]),
            getLength: vi.fn().mockReturnValue(0)
          }),
          collider: vi.fn().mockReturnValue({ active: true }),
          overlap: vi.fn().mockReturnValue({ active: true })
        },
        world: {
          setBounds: vi.fn(),
          gravity: { y: 1000 }
        },
        resume: vi.fn(),
        pause: vi.fn()
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
        device: { os: { desktop: true } },
        scale: {
          isFullscreen: false,
          startFullscreen: vi.fn(),
          stopFullscreen: vi.fn()
        },
        loop: { delta: 16 }
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
          W: 87, A: 65, S: 83, D: 68,
          UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
          SPACE: 32, ESC: 27, Q: 81, E: 69, F: 70, G: 71, P: 80,
          T: 84, I: 73
        },
        JustDown: vi.fn().mockReturnValue(false)
      }
    },
    Math: {
      Between: vi.fn().mockImplementation((min, max) => Math.floor(Math.random() * (max - min + 1)) + min),
      Clamp: vi.fn().mockImplementation((value, min, max) => Math.min(Math.max(value, min), max)),
      Distance: {
        Between: vi.fn().mockReturnValue(100)
      },
      FloatBetween: vi.fn().mockImplementation((min, max) => Math.random() * (max - min) + min),
      Angle: {
        Between: vi.fn().mockReturnValue(0)
      },
      DegToRad: vi.fn().mockImplementation((deg) => deg * Math.PI / 180)
    },
    Display: {
      Color: {
        IntegerToColor: vi.fn().mockReturnValue({ color: 0xffffff })
      }
    },
    Geom: {
      Rectangle: class { contains() { return false } },
      Circle: class { 
        constructor(public x = 0, public y = 0, public radius = 0) {}
        contains() { return false } 
      }
    }
  }
  return { default: Phaser, ...Phaser }
})

// Mock dependencies
vi.mock('../services/api', () => ({
  GameAPI: {
    getInstance: () => ({ submitScore: vi.fn() })
  }
}))

vi.mock('../utils/AudioManager', () => ({
  AudioManager: class {
    playJumpSound = vi.fn()
    playCoinSound = vi.fn()
    playHitSound = vi.fn()
    playShootSound = vi.fn()
    playBossAttackSound = vi.fn()
    playDeathSound = vi.fn()
    playPowerUpSound = vi.fn()
    playDamageSound = vi.fn()
  }
}))

vi.mock('../utils/MusicManager', () => ({
  MusicManager: class {
    playGameMusic = vi.fn()
    stopGameMusic = vi.fn()
  }
}))

vi.mock('../utils/WorldGenerator', () => ({
  WorldGenerator: vi.fn(() => ({
    generateWorld: vi.fn().mockReturnValue(1000),
    generateChunk: vi.fn(),
    getSeed: vi.fn().mockReturnValue(12345),
    resetRngForChunk: vi.fn()
  }))
}))

vi.mock('../utils/ControlManager', () => ({
  ControlManager: {
    getControlSettings: () => ({
      inputMethod: 'keyboard',
      gamepadMapping: { shoot: 7, moveLeftStick: true, moveDpad: true, aimRightStick: true }
    })
  }
}))

vi.mock('../utils/AIPlayer', () => ({
  AIPlayer: class {
    update = vi.fn()
    getDecision = vi.fn().mockReturnValue({ moveLeft: false, moveRight: false, jump: false, shoot: false })
  }
}))

vi.mock('../utils/MLAIPlayer', () => ({
  MLAIPlayer: class {
    update = vi.fn()
    getDecision = vi.fn().mockReturnValue({ moveLeft: false, moveRight: false, jump: false, shoot: false })
  }
}))

vi.mock('../utils/DQNAgent', () => ({
  DQNAgent: class {
    selectAction = vi.fn().mockReturnValue(0)
    remember = vi.fn()
    train = vi.fn()
    resetEpisode = vi.fn()
    importDemonstrations = vi.fn().mockResolvedValue(10)
    saveModel = vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../utils/OnlinePlayerManager', () => ({
  OnlinePlayerManager: class {
    update = vi.fn()
    initializePlayers = vi.fn()
    setEntityCallbacks = vi.fn()
    updateLocalState = vi.fn()
    getCameraFocusPoint = vi.fn().mockReturnValue({ x: 640, y: 360 })
    areBothPlayersOutOfLives = vi.fn().mockReturnValue(false)
    isLocalPlayerOutOfLives = vi.fn().mockReturnValue(false)
    getFurthestPlayerX = vi.fn().mockReturnValue(500)
    getLocalSprite = vi.fn().mockReturnValue(null)
    getRemoteSprite = vi.fn().mockReturnValue(null)
    getPlayerByNumber = vi.fn().mockReturnValue(null)
    reportEnemySpawn = vi.fn()
    reportCoinSpawn = vi.fn()
    reportEnemyDestroy = vi.fn()
    reportCoinCollect = vi.fn()
    trackLocalEnemy = vi.fn()
    trackLocalCoin = vi.fn()
    reportPowerUpSpawn = vi.fn()
    trackLocalPowerUp = vi.fn()
    reportBossSpawn = vi.fn()
    trackLocalBoss = vi.fn()
  }
}))

vi.mock('../services/OnlineCoopService', () => ({
  OnlineCoopService: {
    getInstance: () => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendGameState: vi.fn(),
      onGameStateReceived: vi.fn(),
      playerNumber: 1
    })
  }
}))

vi.mock('../utils/VirtualGamepad', () => ({
  VirtualGamepad: class {
    create = vi.fn()
    update = vi.fn()
    setVisible = vi.fn()
    destroy = vi.fn()
    getShoot = vi.fn().mockReturnValue(false)
  }
}))

vi.mock('../managers/UIManager', () => ({
  UIManager: class {
    chatInputActive = false
    create = vi.fn()
    createUI = vi.fn()
    update = vi.fn()
    updateScore = vi.fn()
    updateLives = vi.fn()
    updateHealth = vi.fn()
    updateHealthBar = vi.fn()
    updateCoins = vi.fn()
    updateBossIndicator = vi.fn()
    updateBossHealthBar = vi.fn()
    updateReloadBar = vi.fn()
    updateDebugUI = vi.fn()
    updatePlayer2Health = vi.fn()
    updatePlayer2Lives = vi.fn()
    updatePlayer2Coins = vi.fn()
    updatePlayer2Score = vi.fn()
    showLevelComplete = vi.fn()
    showGameOver = vi.fn()
    showOnlineGameOver = vi.fn()
    showTip = vi.fn()
    showBossName = vi.fn()
    showQuitConfirmation = vi.fn()
    hideBossHealthBar = vi.fn()
    toggleDebugMode = vi.fn()
    openInGameChat = vi.fn()
  }
}))

// Import GameScene AFTER mocks
import GameScene from '../scenes/GameScene'

describe('GameScene - Extended Coverage', () => {
  let scene: GameScene

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    global.AudioContext = vi.fn().mockImplementation(() => ({
      createGain: vi.fn().mockReturnValue({
        connect: vi.fn(),
        gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
      }),
      createOscillator: vi.fn().mockReturnValue({
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 440, setValueAtTime: vi.fn() },
        type: 'sine'
      }),
      destination: {},
      close: vi.fn(),
      currentTime: 0,
      state: 'running',
      resume: vi.fn()
    })) as any
    
    scene = new GameScene()
    scene.init({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('compressDQNState', () => {
    it('should compress DQN state data correctly', () => {
      scene.create()
      
      const state = {
        playerX: 100.5,
        playerY: 200.7,
        velocityX: 150.25,
        velocityY: -300.75,
        onGround: true,
        nearestPlatformDistance: 150,
        nearestPlatformHeight: 50,
        nearestEnemyDistance: 400,
        nearestSpikeDistance: 500,
        hasGroundAhead: true,
        gapAhead: false,
        bossActive: false,
        bossDistance: 0,
        bossHealth: 0,
        nearestCoinDistance: 100,
        nearestCoinX: 200,
        nearestCoinY: 150,
        nearestPowerUpDistance: 300,
        nearestPowerUpX: 400,
        nearestPowerUpY: 250
      }
      
      const compressed = (scene as any).compressDQNState(state)
      
      expect(compressed.px).toBe(101) // Rounded
      expect(compressed.py).toBe(201)
      expect(compressed.og).toBe(1) // Boolean to number
      expect(compressed.ba).toBe(0) // Boss not active
    })
  })

  describe('decompressState', () => {
    it('should decompress state data correctly', () => {
      scene.create()
      
      const compressed = {
        px: 100,
        py: 200,
        vx: 15,
        vy: -30,
        og: 1,
        np: 150,
        npy: 250,
        ne: 400,
        ney: 300,
        ns: 500,
        ba: 0,
        bd: 0,
        bh: 0
      }
      
      const decompressed = (scene as any).decompressState(compressed)
      
      expect(decompressed.playerX).toBe(100)
      expect(decompressed.playerY).toBe(200)
      expect(decompressed.onGround).toBe(true)
      expect(decompressed.bossActive).toBe(false)
    })
  })

  describe('damagePlayer', () => {
    beforeEach(() => {
      scene.create()
      ;(scene as any).playerIsDead = false
      ;(scene as any).playerHealth = 100
      ;(scene as any).hasShield = false
      ;(scene as any).shieldSprite = null
      scene.time.now = 5000 // Set time high enough to pass invincibility check
      scene.player.setData = vi.fn()
      scene.player.getData = vi.fn().mockReturnValue(0) // Last hit time was 0
    })

    it('should reduce player health on damage', () => {
      ;(scene as any).damagePlayer(20)
      
      expect((scene as any).playerHealth).toBe(80)
    })

    it('should not damage player if shield is active', () => {
      ;(scene as any).hasShield = true
      
      ;(scene as any).damagePlayer(20)
      
      expect((scene as any).playerHealth).toBe(100)
      expect((scene as any).hasShield).toBe(false) // Shield gets broken
    })

    it('should not damage player if in debug mode', () => {
      ;(scene as any).debugMode = true
      
      ;(scene as any).damagePlayer(20)
      
      expect((scene as any).playerHealth).toBe(100)
    })

    it('should trigger player death when health reaches 0', () => {
      ;(scene as any).playerHealth = 20
      
      ;(scene as any).damagePlayer(30)
      
      expect((scene as any).playerHealth).toBeLessThanOrEqual(0)
    })
  })

  describe('checkLevelComplete', () => {
    beforeEach(() => {
      scene.create()
      ;(scene as any).levelEndMarker = { x: 10000 }
      ;(scene as any).levelLength = 10000
      ;(scene as any).levelCompleteShown = false
      ;(scene as any).bossActive = false
    })

    it('should not trigger if level end marker does not exist', () => {
      ;(scene as any).levelEndMarker = null
      
      ;(scene as any).checkLevelComplete()
      
      expect(scene.uiManager.showLevelComplete).not.toHaveBeenCalled()
    })

    it('should not trigger if already shown', () => {
      ;(scene as any).levelCompleteShown = true
      scene.player.x = 10001
      
      ;(scene as any).checkLevelComplete()
      
      expect(scene.uiManager.showLevelComplete).not.toHaveBeenCalled()
    })

    it('should push player back if boss is still active', () => {
      ;(scene as any).bossActive = true
      ;(scene as any).boss = { active: true }
      scene.player.x = 10001
      
      ;(scene as any).checkLevelComplete()
      
      expect(scene.player.x).toBe(9900)
      expect(scene.uiManager.showLevelComplete).not.toHaveBeenCalled()
    })

    it('should show level complete when player reaches end', () => {
      scene.player.x = 10001
      
      ;(scene as any).checkLevelComplete()
      
      expect((scene as any).levelCompleteShown).toBe(true)
      expect(scene.uiManager.showLevelComplete).toHaveBeenCalled()
    })

    it('should transition to ending scene on level 110+', () => {
      scene.currentLevel = 110
      scene.player.x = 10001
      
      ;(scene as any).checkLevelComplete()
      
      expect(scene.scene.start).toHaveBeenCalledWith('EndingScene')
    })
  })

  describe('handleStompMechanic', () => {
    beforeEach(() => {
      scene.create()
      ;(scene as any).isStomping = true
      // Ensure player body exists with touching.down = true
      scene.player.body = {
        ...scene.player.body,
        touching: { down: true, up: false, left: false, right: false },
        blocked: { down: true, up: false, left: false, right: false }
      }
      // Mock blockFragments
      ;(scene as any).blockFragments = {
        create: vi.fn().mockReturnValue({
          setScale: vi.fn().mockReturnThis(),
          setVelocity: vi.fn().mockReturnThis(),
          setAngularVelocity: vi.fn().mockReturnThis(),
          setBounce: vi.fn().mockReturnThis(),
          setCollideWorldBounds: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })
      }
    })

    it('should stop stomping when player lands', () => {
      ;(scene as any).handleStompMechanic()
      
      expect((scene as any).isStomping).toBe(false)
    })

    it('should create screen shake on stomp landing', () => {
      ;(scene as any).handleStompMechanic()
      
      expect(scene.cameras.main.shake).toHaveBeenCalled()
    })
  })

  describe('findNearestAutoAimTarget', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should return null when no enemies in range', () => {
      ;(scene as any).enemies = { getChildren: vi.fn().mockReturnValue([]) }
      ;(scene as any).bossActive = false
      
      const target = (scene as any).findNearestAutoAimTarget()
      
      expect(target).toBeNull()
    })

    it('should return null when boss is inactive', () => {
      ;(scene as any).enemies = { getChildren: vi.fn().mockReturnValue([]) }
      ;(scene as any).bossActive = false
      ;(scene as any).boss = null
      
      const target = (scene as any).findNearestAutoAimTarget()
      
      expect(target).toBeNull()
    })
  })

  describe('showRecordingStatus', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should create recording status text', () => {
      ;(scene as any).showRecordingStatus()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.stringContaining('RECORDING'),
        expect.any(Object)
      )
    })
  })

  describe('hideRecordingStatus', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should hide recording status text if it exists', () => {
      const mockText = { active: true, setVisible: vi.fn() }
      ;(scene as any).recordingStatusText = mockText
      
      ;(scene as any).hideRecordingStatus()
      
      expect(mockText.setVisible).toHaveBeenCalledWith(false)
    })

    it('should not throw if text does not exist', () => {
      ;(scene as any).recordingStatusText = undefined
      
      expect(() => (scene as any).hideRecordingStatus()).not.toThrow()
    })
  })

  describe('extractDQNState', () => {
    beforeEach(() => {
      scene.create()
      scene.player.x = 500
      scene.player.y = 400
      scene.player.body.velocity = { x: 100, y: -50 }
      ;(scene as any).enemies = { getChildren: vi.fn().mockReturnValue([]) }
      ;(scene as any).spikes = { getChildren: vi.fn().mockReturnValue([]) }
    })

    it('should extract player state for DQN', () => {
      const state = (scene as any).extractDQNState()
      
      expect(state).toBeDefined()
      expect(state.playerX).toBeDefined()
      expect(state.playerY).toBeDefined()
    })
  })

  describe('DQN training mode', () => {
    beforeEach(() => {
      scene.init({ dqnTraining: true, gameMode: 'endless', level: 1 })
      scene.create()
    })

    it('should enable DQN training mode', () => {
      expect((scene as any).dqnTraining).toBe(true)
    })

    it('should initialize DQN step counter to 0', () => {
      expect((scene as any).dqnStepCount).toBe(0)
    })
  })

  describe('online mode initialization', () => {
    it('should setup online mode with game state', () => {
      scene.init({
        mode: 'online_coop',
        gameState: { seed: 12345, players: { 'p1': { skin: 'alienGreen' } } },
        playerId: 'p1',
        playerNumber: 1
      })
      scene.create()
      
      expect(scene.isOnlineMode).toBe(true)
      expect((scene as any).onlinePlayerManager).toBeDefined()
    })

    it('should set isOnlineHost for player 1', () => {
      scene.init({
        mode: 'online_coop',
        gameState: { seed: 12345, players: {} },
        playerId: 'p1',
        playerNumber: 1
      })
      scene.create()
      
      expect((scene as any).isOnlineHost).toBe(true)
    })

    it('should initialize online player number from init data', () => {
      scene.init({
        mode: 'online_coop',
        gameState: { seed: 12345, players: {} },
        playerId: 'p2',
        playerNumber: 2
      })
      
      // Check that the playerNumber was stored (before create() is called)
      expect((scene as any).onlinePlayerNumber).toBe(2)
    })
  })

  describe('world generation', () => {
    beforeEach(() => {
      scene.init({ gameMode: 'levels', level: 1 })
      scene.create()
    })

    it('should track world generation X position', () => {
      expect((scene as any).worldGenerationX).toBeDefined()
    })

    it('should reset world generation X on create', () => {
      // World generation starts at 0 and progresses
      expect((scene as any).worldGenerationX).toBeGreaterThanOrEqual(0)
    })
  })

  describe('player spawn state', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should give player spawn invincibility', () => {
      expect((scene as any).hasShield).toBe(true)
    })

    it('should create shield sprite', () => {
      expect((scene as any).shieldSprite).toBeDefined()
    })
  })

  describe('coin count persistence', () => {
    it('should load coins from localStorage in single player', () => {
      localStorage.setItem('playerCoins', '500')
      
      scene.init({})
      scene.create()
      
      expect(scene.coinCount).toBe(500)
    })

    it('should start with 0 coins in online mode', () => {
      scene.init({
        mode: 'online_coop',
        gameState: { seed: 12345, players: {} },
        playerId: 'p1',
        playerNumber: 1
      })
      scene.create()
      
      expect(scene.coinCount).toBe(0)
    })
  })

  describe('equipped items', () => {
    it('should load equipped weapon from localStorage', () => {
      localStorage.setItem('equippedWeapon', 'laserGun')
      
      scene.init({})
      scene.create()
      
      expect((scene as any).equippedWeapon).toBe('laserGun')
    })

    it('should default to raygun if no weapon saved', () => {
      scene.init({})
      scene.create()
      
      expect((scene as any).equippedWeapon).toBe('raygun')
    })

    it('should use green skin in coop mode', () => {
      scene.init({ mode: 'coop' })
      scene.create()
      
      expect((scene as any).equippedSkin).toBe('alienGreen')
    })
  })

  describe('purchased lives', () => {
    it('should add purchased lives from localStorage', () => {
      localStorage.setItem('purchasedLives', '2')
      
      scene.init({})
      scene.create()
      
      expect(scene.playerLives).toBe(5) // 3 default + 2 purchased
    })

    it('should clear purchased lives after adding', () => {
      localStorage.setItem('purchasedLives', '2')
      
      scene.init({})
      scene.create()
      
      expect(localStorage.getItem('purchasedLives')).toBe('0')
    })
  })

  describe('boss state tracking', () => {
    it('should load defeated boss levels from localStorage', () => {
      localStorage.setItem('defeatedBossLevels', JSON.stringify([5, 10, 15]))
      
      scene.init({})
      scene.create()
      
      expect((scene as any).defeatedBossLevels.has(5)).toBe(true)
      expect((scene as any).defeatedBossLevels.has(10)).toBe(true)
    })
  })

  describe('co-op mode', () => {
    beforeEach(() => {
      scene.init({ mode: 'coop' })
      scene.create()
    })

    it('should create player 2 in coop mode', () => {
      expect(scene.isCoopMode).toBe(true)
      expect((scene as any).player2).toBeDefined()
    })

    it('should create player 2 gun in coop mode', () => {
      expect((scene as any).gun2).toBeDefined()
    })

    it('should create player 2 bullets group in coop mode', () => {
      expect((scene as any).bullets2).toBeDefined()
    })
  })
})
