import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create comprehensive sprite mock factory
const createSpriteMock = () => ({
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
    setAllowGravity: vi.fn().mockReturnThis(),
    setImmovable: vi.fn().mockReturnThis(),
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
          getWorldPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
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
          setRotation: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis()
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
          x: 0, 
          y: 0,
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
        gamepad: {
          once: vi.fn(),
          on: vi.fn()
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
          strokePath: vi.fn().mockReturnThis(),
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
            children: { entries: [] },
            countActive: vi.fn().mockReturnValue(0),
            getLength: vi.fn().mockReturnValue(0)
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
          collider: vi.fn().mockReturnValue({ active: true }),
          overlap: vi.fn().mockReturnValue({ active: true })
        },
        world: {
          setBounds: vi.fn(),
          gravity: { y: 0 }
        },
        pause: vi.fn(),
        resume: vi.fn()
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
        JustDown: vi.fn().mockReturnValue(false),
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
      Angle: {
        Between: vi.fn().mockReturnValue(0)
      },
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
      },
      Circle: class {
        constructor(x, y, radius) {}
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
  WorldGenerator: vi.fn(() => ({
    generateWorld: vi.fn().mockReturnValue(1000),
    getSeed: vi.fn().mockReturnValue(12345),
    resetRngForChunk: vi.fn(),
    generateChunk: vi.fn()
  }))
}))

// Mock ControlManager
vi.mock('../utils/ControlManager', () => ({
  ControlManager: {
    getControlSettings: () => ({
      inputMethod: 'keyboard',
      gamepadMapping: {
        shoot: 7,
        moveLeftStick: true,
        moveDpad: true,
        aimRightStick: true
      }
    })
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
    chatInputActive = false
    create() {}
    createUI() {}
    update() {}
    updateScore() {}
    updateLives() {}
    updateHealth() {}
    updateHealthBar() {}
    updateCoins() {}
    updateBossIndicator() {}
    updateBossHealthBar() {}
    updateReloadBar() {}
    updateDebugUI() {}
    updatePlayer2Health() {}
    updatePlayer2Lives() {}
    updatePlayer2Coins() {}
    updatePlayer2Score() {}
    showLevelComplete() {}
    showGameOver() {}
    showOnlineGameOver() {}
    showTip() {}
    showBossName() {}
    showQuitConfirmation() {}
    hideBossHealthBar() {}
    toggleDebugMode() {}
    openInGameChat() {}
  }
}))

// Import GameScene AFTER mocks
import GameScene from '../scenes/GameScene'

describe('GameScene Gameplay', () => {
  let scene: GameScene

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock global AudioContext for tests
    global.AudioContext = vi.fn().mockImplementation(() => ({
      createGain: vi.fn().mockReturnValue({
        connect: vi.fn(),
        gain: { 
          value: 1,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn()
        }
      }),
      createOscillator: vi.fn().mockReturnValue({
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { 
          value: 440,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        type: 'sine'
      }),
      destination: {},
      close: vi.fn(),
      currentTime: 0
    })) as any
    
    // Instantiate scene
    scene = new GameScene()
    scene.init({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('create', () => {
    it('should create player and game objects', () => {
      scene.create()
      
      expect(scene.player).toBeDefined()
      expect(scene.physics.add.sprite).toHaveBeenCalled()
      expect(scene.cameras.main.startFollow).toHaveBeenCalled()
    })

    it('should setup collisions', () => {
      scene.create()
      
      expect(scene.physics.add.collider).toHaveBeenCalled()
      expect(scene.physics.add.overlap).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    beforeEach(() => {
      scene.create()
      scene['isGeneratingWorld'] = false
      // Reset mocks after create to clear initialization calls
      vi.clearAllMocks()
    })

    it('should update player movement', () => {
      // Mock cursor keys
      scene['cursors'].left.isDown = true
      
      scene.update(0, 16)
      
      expect(scene.player.setVelocityX).toHaveBeenCalledWith(expect.any(Number))
    })

    it('should handle jumping', async () => {
      // Mock player on ground
      scene.player.body.touching.down = true
      scene.player.body.blocked.down = true
      
      // Mock JustDown to return true for jump key
      const Phaser = await import('phaser')
      ;(Phaser.Input.Keyboard.JustDown as ReturnType<typeof vi.fn>).mockReturnValue(true)
      
      scene.update(0, 16)
      
      expect(scene.player.setVelocityY).toHaveBeenCalledWith(expect.any(Number))
    })
  })
})
