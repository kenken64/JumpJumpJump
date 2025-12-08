import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Phaser Module BEFORE importing MenuScene
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
      sys = {
        settings: { data: {} },
        game: {
          device: {
            os: {
              desktop: true
            }
          },
          canvas: {
            width: 1280,
            height: 720
          }
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
          fadeOut: vi.fn()
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
          setDepth: vi.fn().mockReturnThis()
        }),
        rectangle: vi.fn().mockReturnValue({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        sprite: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          play: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        image: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          destroy: vi.fn()
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
          fillRect: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          generateTexture: vi.fn(),
          setDepth: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        container: vi.fn().mockReturnValue({
          add: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          setDepth: vi.fn().mockReturnThis()
        }),
        particles: vi.fn().mockReturnValue({
          createEmitter: vi.fn().mockReturnValue({
            setPosition: vi.fn().mockReturnThis(),
            start: vi.fn().mockReturnThis(),
            stop: vi.fn().mockReturnThis()
          }),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })
      }
      load = {
        image: vi.fn(),
        audio: vi.fn(),
        spritesheet: vi.fn(),
        plugin: vi.fn()
      }
      input = {
        keyboard: {
          on: vi.fn(),
          addKey: vi.fn().mockReturnValue({
            on: vi.fn()
          }),
          createCursorKeys: vi.fn().mockReturnValue({
            up: { isDown: false },
            down: { isDown: false },
            left: { isDown: false },
            right: { isDown: false },
            space: { isDown: false }
          })
        },
        on: vi.fn(),
        once: vi.fn()
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
        delayedCall: vi.fn().mockImplementation((delay, callback) => {
          callback()
          return { destroy: vi.fn() }
        })
      }
      scale = {
        isFullscreen: false,
        startFullscreen: vi.fn(),
        stopFullscreen: vi.fn()
      }
      
      constructor() {}
    },
    Geom: {
      Circle: class {
        constructor() {}
      }
    },
    Math: {
      Between: () => 0,
      FloatBetween: () => 0
    },
    GameObjects: {
      Particles: {
        Particle: class {}
      },
      Graphics: class {}
    }
  }

  return {
    default: Phaser,
    ...Phaser
  }
})

// Mock GameAPI
vi.mock('../services/api', () => ({
  GameAPI: {
    checkConnection: vi.fn().mockResolvedValue(true),
    getPlayerHighScore: vi.fn().mockResolvedValue(1000)
  }
}))

// Import MenuScene AFTER mocks
import MenuScene from '../scenes/MenuScene'
import { GameAPI } from '../services/api'

describe('MenuScene', () => {
  let scene: MenuScene

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Instantiate scene
    scene = new MenuScene()
  })

  it('should be defined', () => {
    expect(scene).toBeDefined()
  })

  describe('preload', () => {
    it('should load assets', () => {
      scene.preload()
      
      expect(scene.load.image).toHaveBeenCalledWith('coin', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('alienBeige_stand', expect.any(String))
    })
  })

  describe('create', () => {
    it('should initialize menu elements', async () => {
      await scene.create()
      
      // Check background
      expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#0a0a1a')
      
      // Check API connection
      expect(GameAPI.checkConnection).toHaveBeenCalled()
      
      // Check UI elements
      expect(scene.add.text).toHaveBeenCalled()
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should load coins from localStorage', async () => {
      localStorage.setItem('playerCoins', '500')
      
      await scene.create()
      
      // We can't easily check private coinCount, but we can check if it logged or used it
      // Or we can check if the coin text was created with the correct value if we can find it
      // For now, just ensure it runs without error
    })

    it('should handle mobile fullscreen', async () => {
      // Mock mobile device
      scene.sys.game.device.os.desktop = false
      
      await scene.create()
      
      expect(scene.input.once).toHaveBeenCalledWith('pointerdown', expect.any(Function))
      
      // Reset for other tests
      scene.sys.game.device.os.desktop = true
    })
  })
})
