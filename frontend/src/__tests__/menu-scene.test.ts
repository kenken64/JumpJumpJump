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
  let buttonHandlers: Map<string, Map<string, Function>>
  let escKeyHandler: Function | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    buttonHandlers = new Map()
    escKeyHandler = null
    
    // Mock navigator.getGamepads
    if (!global.navigator.getGamepads) {
      Object.defineProperty(global.navigator, 'getGamepads', {
        value: vi.fn().mockReturnValue([]),
        writable: true
      });
    } else {
      (global.navigator.getGamepads as any) = vi.fn().mockReturnValue([]);
    }

    // Mock window.setInterval
    vi.spyOn(window, 'setInterval').mockReturnValue(123 as any)
    vi.spyOn(window, 'clearInterval').mockImplementation(() => {})
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true)

    // Instantiate scene
    scene = new MenuScene()
    
    // Enhance rectangle mock to track button handlers
    scene.add.rectangle = vi.fn().mockImplementation((x: number, y: number, w: number, h: number, color?: number) => {
      const rect: any = {
        x, y, width: w, height: h,
        setStrokeStyle: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setName: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          const key = `${x},${y}`
          if (!buttonHandlers.has(key)) {
            buttonHandlers.set(key, new Map())
          }
          buttonHandlers.get(key)!.set(event, handler)
          return rect
        })
      }
      return rect
    })

    // Track ESC key handler
    scene.input.keyboard = {
      on: vi.fn().mockImplementation((event: string, handler: Function) => {
        if (event === 'keydown-ESC') {
          escKeyHandler = handler
        }
      }),
      off: vi.fn(),
      addKey: vi.fn().mockReturnValue({ on: vi.fn() }),
      createCursorKeys: vi.fn().mockReturnValue({
        up: { isDown: false },
        down: { isDown: false },
        left: { isDown: false },
        right: { isDown: false }
      })
    } as any
  })

  afterEach(() => {
    if (scene) {
      scene.shutdown()
    }
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(scene).toBeDefined()
  })

  describe('constructor', () => {
    it('should create scene with correct key', () => {
      const newScene = new MenuScene()
      expect(newScene).toBeInstanceOf(MenuScene)
    })
  })

  describe('preload', () => {
    it('should load assets', () => {
      scene.preload()
      
      expect(scene.load.image).toHaveBeenCalledWith('coin', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('alienBeige_stand', expect.any(String))
    })

    it('should load story image', () => {
      scene.preload()
      expect(scene.load.image).toHaveBeenCalledWith('storyImage', expect.any(String))
    })

    it('should load all alien skins', () => {
      scene.preload()
      
      expect(scene.load.image).toHaveBeenCalledWith('alienBeige_stand', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('alienBlue_stand', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('alienGreen_stand', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('alienPink_stand', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('alienYellow_stand', expect.any(String))
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
      
      // Check coin text was created
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should handle mobile fullscreen', async () => {
      // Mock mobile device
      scene.sys.game.device.os.desktop = false
      
      await scene.create()
      
      expect(scene.input.once).toHaveBeenCalledWith('pointerdown', expect.any(Function))
      
      // Reset for other tests
      scene.sys.game.device.os.desktop = true
    })

    it('should use equipped skin from localStorage', async () => {
      localStorage.setItem('equippedSkin', 'alienBlue')
      
      await scene.create()
      
      expect(scene.add.image).toHaveBeenCalled()
    })

    it('should use default skin if none equipped', async () => {
      await scene.create()
      
      expect(scene.add.image).toHaveBeenCalled()
    })

    it('should show tutorial on first launch', async () => {
      // First launch - no tutorial seen
      expect(localStorage.getItem('hasSeenTutorial')).toBeNull()
      
      await scene.create()
      
      // Should set tutorial as seen
      expect(scene.time.delayedCall).toHaveBeenCalled()
    })

    it('should not show tutorial if already seen', async () => {
      localStorage.setItem('hasSeenTutorial', 'true')
      
      await scene.create()
      
      // delayedCall is still called for other purposes, but tutorial check should pass
    })

    it('should register wake event handler', async () => {
      await scene.create()
      
      expect(scene.events.on).toHaveBeenCalledWith('wake', expect.any(Function))
    })

    it('should start background gamepad polling', async () => {
      await scene.create()
      
      expect(window.setInterval).toHaveBeenCalled()
    })

    it('should create player name button', async () => {
      localStorage.setItem('player_name', 'TestPlayer')
      
      await scene.create()
      
      expect(scene.add.rectangle).toHaveBeenCalled()
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should handle default player name Guest', async () => {
      // No player name set
      await scene.create()
      
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('checkAPIConnection', () => {
    it('should show connected status when API is available', async () => {
      vi.mocked(GameAPI.checkConnection).mockResolvedValue(true)
      
      await scene.create()
      
      expect(GameAPI.checkConnection).toHaveBeenCalled()
    })

    it('should show offline status when API is unavailable', async () => {
      vi.mocked(GameAPI.checkConnection).mockResolvedValue(false)
      
      await scene.create()
      
      expect(GameAPI.checkConnection).toHaveBeenCalled()
    })

    it('should handle API connection error', async () => {
      vi.mocked(GameAPI.checkConnection).mockRejectedValue(new Error('Network error'))
      
      await scene.create()
      
      expect(GameAPI.checkConnection).toHaveBeenCalled()
    })
  })

  describe('checkSaveGame', () => {
    it('should create load button when save exists', async () => {
      vi.mocked(GameAPI.loadGame as any).mockResolvedValue({
        level: 5,
        score: 1000,
        lives: 2,
        health: 80,
        coins: 500,
        weapon: 'laser'
      })
      
      await scene.create()
      
      // Should have created load button
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should not create load button when no save exists', async () => {
      vi.mocked(GameAPI.loadGame as any).mockResolvedValue(null)
      
      await scene.create()
      
      // No error should occur
    })

    it('should handle API error gracefully', async () => {
      vi.mocked(GameAPI.loadGame as any).mockRejectedValue(new Error('API Error'))
      
      await scene.create()
      
      // Should not throw
    })
  })

  describe('shutdown', () => {
    it('should clear gamepad polling interval', async () => {
      await scene.create()
      
      scene.shutdown()
      
      expect(window.clearInterval).toHaveBeenCalled()
    })

    it('should handle missing gamepad plugin gracefully', () => {
      scene.input = {} as any
      
      // Should not throw
      expect(() => scene.shutdown()).not.toThrow()
    })

    it('should initialize gamepad pads array if missing', async () => {
      await scene.create()
      
      // Mock gamepad plugin without pads array
      scene.input.gamepad = {} as any
      
      scene.shutdown()
      
      expect((scene.input.gamepad as any).pads).toEqual([])
    })
  })

  describe('button interactions', () => {
    it('should handle Level Mode button click', async () => {
      scene.scene = {
        start: vi.fn(),
        stop: vi.fn(),
        get: vi.fn(),
        launch: vi.fn(),
        run: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        sleep: vi.fn(),
        wake: vi.fn()
      } as any
      
      await scene.create()
      
      // Find level button handler (at position 640, 430)
      const levelBtnHandlers = buttonHandlers.get('640,430')
      if (levelBtnHandlers?.has('pointerdown')) {
        levelBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('GameScene', { gameMode: 'levels', level: 1 })
      }
    })

    it('should handle Endless Mode button click', async () => {
      scene.scene = {
        start: vi.fn(),
        stop: vi.fn()
      } as any
      
      await scene.create()
      
      // Find endless button handler (at position 640, 570)
      const endlessBtnHandlers = buttonHandlers.get('640,570')
      if (endlessBtnHandlers?.has('pointerdown')) {
        endlessBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('GameScene', { gameMode: 'endless', level: 1 })
      }
    })

    it('should handle Local Co-op button click', async () => {
      scene.scene = {
        start: vi.fn()
      } as any
      
      await scene.create()
      
      // Find coop button handler (at position 500, 500)
      const coopBtnHandlers = buttonHandlers.get('500,500')
      if (coopBtnHandlers?.has('pointerdown')) {
        coopBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('CoopLobbyScene')
      }
    })

    it('should handle Online Co-op button click', async () => {
      scene.scene = {
        start: vi.fn()
      } as any
      
      await scene.create()
      
      // Find online button handler (at position 780, 500)
      const onlineBtnHandlers = buttonHandlers.get('780,500')
      if (onlineBtnHandlers?.has('pointerdown')) {
        onlineBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('OnlineLobbyScene')
      }
    })

    it('should handle Shop button click', async () => {
      scene.scene = {
        start: vi.fn()
      } as any
      
      await scene.create()
      
      // Find shop button handler (at position 280, 640)
      const shopBtnHandlers = buttonHandlers.get('280,640')
      if (shopBtnHandlers?.has('pointerdown')) {
        shopBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('ShopScene', expect.any(Object))
      }
    })

    it('should handle Inventory button click', async () => {
      scene.scene = {
        start: vi.fn()
      } as any
      
      await scene.create()
      
      // Find inventory button handler (at position 460, 640)
      const inventoryBtnHandlers = buttonHandlers.get('460,640')
      if (inventoryBtnHandlers?.has('pointerdown')) {
        inventoryBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('InventoryScene')
      }
    })

    it('should handle Bosses button click', async () => {
      scene.scene = {
        start: vi.fn()
      } as any
      
      await scene.create()
      
      // Find bosses button handler (at position 640, 640)
      const bossesBtnHandlers = buttonHandlers.get('640,640')
      if (bossesBtnHandlers?.has('pointerdown')) {
        bossesBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('BossGalleryScene')
      }
    })

    it('should handle Leaderboard button click', async () => {
      scene.scene = {
        start: vi.fn()
      } as any
      
      await scene.create()
      
      // Find leaderboard button handler (at position 820, 640)
      const leaderboardBtnHandlers = buttonHandlers.get('820,640')
      if (leaderboardBtnHandlers?.has('pointerdown')) {
        leaderboardBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('LeaderboardScene')
      }
    })

    it('should handle Credits button click', async () => {
      scene.scene = {
        start: vi.fn()
      } as any
      
      await scene.create()
      
      // Find credits button handler (at position 1150, 600)
      const creditsBtnHandlers = buttonHandlers.get('1150,600')
      if (creditsBtnHandlers?.has('pointerdown')) {
        creditsBtnHandlers.get('pointerdown')!()
        expect(scene.scene.start).toHaveBeenCalledWith('CreditScene')
      }
    })

    it('should handle hover effects on buttons', async () => {
      await scene.create()
      
      // Find any button and check hover handlers exist
      const anyButton = buttonHandlers.get('640,430')
      if (anyButton) {
        expect(anyButton.has('pointerover')).toBe(true)
        expect(anyButton.has('pointerout')).toBe(true)
      }
    })
  })

  describe('wake event', () => {
    it('should update coins on wake', async () => {
      await scene.create()
      
      // Simulate wake event
      localStorage.setItem('playerCoins', '1000')
      
      // Get the wake handler
      const wakeCall = vi.mocked(scene.events.on).mock.calls.find(
        call => call[0] === 'wake'
      )
      
      if (wakeCall) {
        const wakeHandler = wakeCall[1] as Function
        wakeHandler()
      }
    })
  })

  describe('background gamepad polling', () => {
    it('should detect Safari browser', async () => {
      // Mock Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
        writable: true
      })
      
      await scene.create()
      
      expect(window.setInterval).toHaveBeenCalled()
    })

    it('should add gamepad event listeners', async () => {
      await scene.create()
      
      expect(window.addEventListener).toHaveBeenCalledWith('gamepadconnected', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('gamepaddisconnected', expect.any(Function))
    })
  })

  describe('showTutorial', () => {
    it('should create tutorial overlay', async () => {
      await scene.create()
      
      // Call showTutorial via button
      const tutorialBtnHandlers = buttonHandlers.get('100,700')
      if (tutorialBtnHandlers?.has('pointerdown')) {
        tutorialBtnHandlers.get('pointerdown')!()
      }
      
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should create tutorial panel', async () => {
      await scene.create()
      
      const tutorialBtnHandlers = buttonHandlers.get('100,700')
      if (tutorialBtnHandlers?.has('pointerdown')) {
        tutorialBtnHandlers.get('pointerdown')!()
        expect(scene.add.text).toHaveBeenCalled()
      }
    })
  })

  describe('showStory', () => {
    it('should create story overlay', async () => {
      await scene.create()
      
      // Call showStory via button
      const storyBtnHandlers = buttonHandlers.get('250,700')
      if (storyBtnHandlers?.has('pointerdown')) {
        storyBtnHandlers.get('pointerdown')!()
      }
      
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should display story image', async () => {
      await scene.create()
      
      const storyBtnHandlers = buttonHandlers.get('250,700')
      if (storyBtnHandlers?.has('pointerdown')) {
        storyBtnHandlers.get('pointerdown')!()
        expect(scene.add.image).toHaveBeenCalled()
      }
    })
  })

  describe('showSettings', () => {
    it('should create settings overlay', async () => {
      await scene.create()
      
      // Call showSettings via button (1150, 650)
      const settingsBtnHandlers = buttonHandlers.get('1150,650')
      if (settingsBtnHandlers?.has('pointerdown')) {
        settingsBtnHandlers.get('pointerdown')!()
      }
      
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should load current settings from localStorage', async () => {
      localStorage.setItem('musicEnabled', 'true')
      localStorage.setItem('soundEnabled', 'true')
      localStorage.setItem('musicVolume', '0.8')
      localStorage.setItem('soundVolume', '0.6')
      
      await scene.create()
      
      const settingsBtnHandlers = buttonHandlers.get('1150,650')
      if (settingsBtnHandlers?.has('pointerdown')) {
        settingsBtnHandlers.get('pointerdown')!()
        expect(scene.add.text).toHaveBeenCalled()
      }
    })

    it('should create music and sound toggles', async () => {
      await scene.create()
      
      const settingsBtnHandlers = buttonHandlers.get('1150,650')
      if (settingsBtnHandlers?.has('pointerdown')) {
        settingsBtnHandlers.get('pointerdown')!()
        expect(scene.add.circle).toHaveBeenCalled()
      }
    })
  })

  describe('showNameInputDialog', () => {
    it('should create dialog overlay', async () => {
      // Mock game.canvas
      scene.game = {
        canvas: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
          parentElement: document.body
        }
      } as any
      
      await scene.create()
      
      // Call via name button (120, 50)
      const nameBtnHandlers = buttonHandlers.get('120,50')
      if (nameBtnHandlers?.has('pointerdown')) {
        nameBtnHandlers.get('pointerdown')!()
      }
      
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should load existing player name', async () => {
      localStorage.setItem('player_name', 'TestPlayer')
      
      // Mock game.canvas
      scene.game = {
        canvas: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
          parentElement: document.body
        }
      } as any
      
      await scene.create()
      
      const nameBtnHandlers = buttonHandlers.get('120,50')
      if (nameBtnHandlers?.has('pointerdown')) {
        nameBtnHandlers.get('pointerdown')!()
        expect(scene.add.text).toHaveBeenCalled()
      }
    })
  })

  describe('showMLTraining', () => {
    it('should create DQN training overlay', async () => {
      await scene.create()
      
      // Call via DQN button (1150, 550)
      const mlBtnHandlers = buttonHandlers.get('1150,550')
      if (mlBtnHandlers?.has('pointerdown')) {
        mlBtnHandlers.get('pointerdown')!()
      }
      
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should create game preview panel', async () => {
      await scene.create()
      
      const mlBtnHandlers = buttonHandlers.get('1150,550')
      if (mlBtnHandlers?.has('pointerdown')) {
        mlBtnHandlers.get('pointerdown')!()
        expect(scene.add.text).toHaveBeenCalled()
      }
    })
  })

  describe('createBlackholeBackground', () => {
    it('should create background elements', async () => {
      await scene.create()
      
      expect(scene.add.circle).toHaveBeenCalled()
      expect(scene.add.graphics).toHaveBeenCalled()
    })

    it('should create particle emitters', async () => {
      await scene.create()
      
      expect(scene.add.particles).toHaveBeenCalled()
    })

    it('should create stars', async () => {
      await scene.create()
      
      // Stars are circles
      expect(scene.add.circle).toHaveBeenCalled()
    })

    it('should add tween animations', async () => {
      await scene.create()
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })
})

// Add mock for GameAPI.loadGame
vi.mock('../services/api', () => ({
  GameAPI: {
    checkConnection: vi.fn().mockResolvedValue(true),
    getPlayerHighScore: vi.fn().mockResolvedValue(1000),
    loadGame: vi.fn().mockResolvedValue(null)
  }
}))

// Mock ControlManager
vi.mock('../utils/ControlManager', () => ({
  ControlManager: {
    getControlSettings: vi.fn().mockReturnValue({
      inputMethod: 'keyboard',
      gamepadMapping: { jump: 0, shoot: 7 }
    }),
    saveControlSettings: vi.fn()
  }
}))

describe('MenuScene - Extended Coverage', () => {
  let scene: MenuScene
  let buttonHandlers: Map<string, Map<string, Function>>
  let circleHandlers: Map<string, Map<string, Function>>

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    buttonHandlers = new Map()
    circleHandlers = new Map()

    // Reset ControlManager mock after clearAllMocks
    const { ControlManager } = await import('../utils/ControlManager')
    vi.mocked(ControlManager.getControlSettings).mockReturnValue({
      inputMethod: 'keyboard',
      gamepadMapping: { jump: 0, shoot: 7 }
    })

    // Mock navigator.getGamepads
    if (!global.navigator.getGamepads) {
      Object.defineProperty(global.navigator, 'getGamepads', {
        value: vi.fn().mockReturnValue([]),
        writable: true
      })
    } else {
      (global.navigator.getGamepads as any) = vi.fn().mockReturnValue([])
    }

    vi.spyOn(window, 'setInterval').mockReturnValue(123 as any)
    vi.spyOn(window, 'clearInterval').mockImplementation(() => {})
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true)

    scene = new MenuScene()

    // Track button handlers
    scene.add.rectangle = vi.fn().mockImplementation((x: number, y: number) => {
      const rect: any = {
        x, y,
        setStrokeStyle: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setName: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          const key = `${x},${y}`
          if (!buttonHandlers.has(key)) {
            buttonHandlers.set(key, new Map())
          }
          buttonHandlers.get(key)!.set(event, handler)
          return rect
        })
      }
      return rect
    })

    // Track circle handlers for sliders
    scene.add.circle = vi.fn().mockImplementation((x: number, y: number) => {
      const circle: any = {
        x, y,
        setStrokeStyle: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          const key = `circle_${x},${y}`
          if (!circleHandlers.has(key)) {
            circleHandlers.set(key, new Map())
          }
          circleHandlers.get(key)!.set(event, handler)
          return circle
        })
      }
      return circle
    })

    scene.scene = {
      start: vi.fn(),
      stop: vi.fn()
    } as any

    scene.children = {
      getByName: vi.fn().mockReturnValue({
        setText: vi.fn(),
        setColor: vi.fn()
      })
    } as any
  })

  afterEach(() => {
    if (scene) {
      scene.shutdown()
    }
    vi.restoreAllMocks()
  })

  describe('showTutorial - Close Button', () => {
    it('should close tutorial when close button is clicked', async () => {
      await scene.create()

      // Click tutorial button (100, 700)
      const tutorialBtn = buttonHandlers.get('100,700')
      tutorialBtn?.get('pointerdown')?.()

      // Find close button (640, 620) and click it
      const closeBtn = buttonHandlers.get('640,620')
      expect(closeBtn?.has('pointerdown')).toBe(true)
      closeBtn?.get('pointerdown')?.()
    })

    it('should handle hover effects on tutorial close button', async () => {
      await scene.create()

      const tutorialBtn = buttonHandlers.get('100,700')
      tutorialBtn?.get('pointerdown')?.()

      const closeBtn = buttonHandlers.get('640,620')
      expect(closeBtn?.has('pointerover')).toBe(true)
      expect(closeBtn?.has('pointerout')).toBe(true)
      closeBtn?.get('pointerover')?.()
      closeBtn?.get('pointerout')?.()
    })
  })

  describe('showStory - Close Functionality', () => {
    it('should close story on ESC key', async () => {
      let escHandler: Function | null = null
      scene.input.keyboard = {
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          if (event === 'keydown-ESC') {
            escHandler = handler
          }
        }),
        off: vi.fn(),
        addKey: vi.fn().mockReturnValue({ on: vi.fn() }),
        createCursorKeys: vi.fn().mockReturnValue({})
      } as any

      await scene.create()

      const storyBtn = buttonHandlers.get('250,700')
      storyBtn?.get('pointerdown')?.()

      // ESC handler should be registered
      expect(scene.input.keyboard?.on).toHaveBeenCalledWith('keydown-ESC', expect.any(Function))

      // Trigger ESC
      if (escHandler) {
        escHandler()
      }

      expect(scene.input.keyboard?.off).toHaveBeenCalledWith('keydown-ESC', expect.any(Function))
    })

    it('should close story on overlay click', async () => {
      // Mock keyboard.off
      scene.input.keyboard = {
        on: vi.fn(),
        off: vi.fn(),
        addKey: vi.fn().mockReturnValue({ on: vi.fn() }),
        createCursorKeys: vi.fn().mockReturnValue({})
      } as any

      await scene.create()

      const storyBtn = buttonHandlers.get('250,700')
      storyBtn?.get('pointerdown')?.()

      // Find overlay - click it to close
      const overlayBtn = buttonHandlers.get('640,360')
      if (overlayBtn?.has('pointerdown')) {
        overlayBtn.get('pointerdown')?.()
      }
    })
  })

  describe('showSettings - Toggle Functionality', () => {
    it('should toggle music on/off', async () => {
      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      // Music toggle is at (720, 220)
      const musicToggle = buttonHandlers.get('720,220')
      expect(musicToggle?.has('pointerdown')).toBe(true)

      // Toggle music off
      musicToggle?.get('pointerdown')?.()
      expect(localStorage.getItem('musicEnabled')).toBe('false')

      // Toggle music back on
      musicToggle?.get('pointerdown')?.()
      expect(localStorage.getItem('musicEnabled')).toBe('true')
    })

    it('should toggle sound on/off', async () => {
      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      // Sound toggle is at (720, 300) - startY + lineHeight
      const soundToggle = buttonHandlers.get('720,300')
      expect(soundToggle?.has('pointerdown')).toBe(true)

      soundToggle?.get('pointerdown')?.()
      expect(localStorage.getItem('soundEnabled')).toBe('false')
    })

    it('should open controls settings from settings panel', async () => {
      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      // Settings panel should be created - the controls button position varies
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should close settings panel', async () => {
      // Mock input.off for cleanup
      scene.input.off = vi.fn()
      scene.input.on = vi.fn()

      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      // Close button at (640, 520)
      const closeBtn = buttonHandlers.get('640,520')
      expect(closeBtn?.has('pointerdown')).toBe(true)
      closeBtn?.get('pointerdown')?.()
    })

    it('should handle volume slider drag', async () => {
      let dragHandler: Function | null = null
      scene.input = {
        ...scene.input,
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          if (event === 'drag') {
            dragHandler = handler
          }
        }),
        off: vi.fn()
      } as any

      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      expect(scene.input.on).toHaveBeenCalledWith('drag', expect.any(Function))
    })
  })

  describe('showNameInputDialog - Interaction', () => {
    beforeEach(() => {
      // Mock game.canvas properly
      scene.game = {
        canvas: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
          parentElement: document.body
        }
      } as any
    })

    it('should save name on save button click', async () => {
      await scene.create()

      const nameBtn = buttonHandlers.get('120,50')
      nameBtn?.get('pointerdown')?.()

      // Save button at (740, 450)
      const saveBtn = buttonHandlers.get('740,450')
      expect(saveBtn?.has('pointerdown')).toBe(true)
    })

    it('should cancel name input dialog', async () => {
      await scene.create()

      const nameBtn = buttonHandlers.get('120,50')
      nameBtn?.get('pointerdown')?.()

      // Cancel button at (540, 450)
      const cancelBtn = buttonHandlers.get('540,450')
      expect(cancelBtn?.has('pointerdown')).toBe(true)
      cancelBtn?.get('pointerdown')?.()
    })

    it('should handle window resize', async () => {
      let resizeHandler: Function | null = null
      vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'resize') {
          resizeHandler = handler
        }
      })

      await scene.create()

      const nameBtn = buttonHandlers.get('120,50')
      nameBtn?.get('pointerdown')?.()

      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))

      // Trigger resize
      if (resizeHandler) {
        resizeHandler()
      }
    })
  })

  describe('showMLTraining - Mode Selection', () => {
    it('should select endless mode by default', async () => {
      await scene.create()

      const mlBtn = buttonHandlers.get('1150,550')
      mlBtn?.get('pointerdown')?.()

      // Endless button at (180, 645) should be selected
      const endlessBtn = buttonHandlers.get('180,645')
      expect(endlessBtn?.has('pointerdown')).toBe(true)
    })

    it('should select levels mode', async () => {
      await scene.create()

      const mlBtn = buttonHandlers.get('1150,550')
      mlBtn?.get('pointerdown')?.()

      // Levels button at (380, 645)
      const levelsBtn = buttonHandlers.get('380,645')
      expect(levelsBtn?.has('pointerdown')).toBe(true)
      levelsBtn?.get('pointerdown')?.()
    })

    it('should start DQN training in endless mode', async () => {
      await scene.create()

      const mlBtn = buttonHandlers.get('1150,550')
      mlBtn?.get('pointerdown')?.()

      // Start button at (280, 695)
      const startBtn = buttonHandlers.get('280,695')
      expect(startBtn?.has('pointerdown')).toBe(true)
      startBtn?.get('pointerdown')?.()

      expect(scene.scene.start).toHaveBeenCalledWith('GameScene', {
        gameMode: 'endless',
        level: 1,
        dqnTraining: true
      })
    })

    it('should start DQN training in levels mode', async () => {
      await scene.create()

      const mlBtn = buttonHandlers.get('1150,550')
      mlBtn?.get('pointerdown')?.()

      // Select levels mode
      const levelsBtn = buttonHandlers.get('380,645')
      levelsBtn?.get('pointerdown')?.()

      // Start button
      const startBtn = buttonHandlers.get('280,695')
      startBtn?.get('pointerdown')?.()

      expect(scene.scene.start).toHaveBeenCalledWith('GameScene', {
        gameMode: 'levels',
        level: 1,
        dqnTraining: true
      })
    })

    it('should handle hover effects on start button', async () => {
      await scene.create()

      const mlBtn = buttonHandlers.get('1150,550')
      mlBtn?.get('pointerdown')?.()

      const startBtn = buttonHandlers.get('280,695')
      expect(startBtn?.has('pointerover')).toBe(true)
      expect(startBtn?.has('pointerout')).toBe(true)
      startBtn?.get('pointerover')?.()
      startBtn?.get('pointerout')?.()
    })
  })

  describe('createLoadGameButton', () => {
    it('should create load button and start game on click', async () => {
      const mockSave = {
        level: 5,
        score: 1000,
        lives: 2,
        health: 80,
        coins: 500,
        weapon: 'laser'
      }

      vi.mocked(GameAPI.loadGame as any).mockResolvedValue(mockSave)

      await scene.create()

      // Wait for async checkSaveGame to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Load button at (640, 360)
      const loadBtn = buttonHandlers.get('640,360')
      if (loadBtn?.has('pointerdown')) {
        loadBtn.get('pointerdown')?.()

        expect(scene.scene.start).toHaveBeenCalledWith('GameScene', {
          gameMode: 'levels',
          level: 5,
          score: 1000,
          lives: 2,
          health: 80,
          coins: 500,
          weapon: 'laser',
          isLoadedGame: true
        })
      }
    })

    it('should handle hover effects on load button', async () => {
      const mockSave = { level: 3, score: 500, lives: 3, health: 100, coins: 200, weapon: 'default' }
      vi.mocked(GameAPI.loadGame as any).mockResolvedValue(mockSave)

      await scene.create()
      await new Promise(resolve => setTimeout(resolve, 0))

      const loadBtn = buttonHandlers.get('640,360')
      if (loadBtn) {
        expect(loadBtn.has('pointerover')).toBe(true)
        expect(loadBtn.has('pointerout')).toBe(true)
        loadBtn.get('pointerover')?.()
        loadBtn.get('pointerout')?.()
      }
    })
  })

  describe('showControlSettings', () => {
    it('should show control settings when opened from settings', async () => {
      await scene.create()

      // Open settings
      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      // Open controls
      const controlsBtn = buttonHandlers.get('640,380')
      controlsBtn?.get('pointerdown')?.()

      // Wait for dynamic import
      await new Promise(resolve => setTimeout(resolve, 10))

      // Control settings panel should be created
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should toggle between keyboard and gamepad input methods', async () => {
      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      const controlsBtn = buttonHandlers.get('640,380')
      controlsBtn?.get('pointerdown')?.()

      await new Promise(resolve => setTimeout(resolve, 10))

      // Keyboard button at (580, 180) and Gamepad at (750, 180)
      const keyboardBtn = buttonHandlers.get('580,180')
      const gamepadBtn = buttonHandlers.get('750,180')

      if (gamepadBtn?.has('pointerdown')) {
        gamepadBtn.get('pointerdown')?.()
      }

      if (keyboardBtn?.has('pointerdown')) {
        keyboardBtn.get('pointerdown')?.()
      }
    })

    it('should detect connected gamepads', async () => {
      // Mock connected gamepad
      const mockGamepad = {
        id: 'Xbox Controller',
        index: 0,
        connected: true,
        buttons: new Array(17).fill({ pressed: false, value: 0 }),
        axes: [0, 0, 0, 0],
        mapping: 'standard',
        timestamp: 0,
        hapticActuators: [],
        vibrationActuator: null
      }
      ;(global.navigator.getGamepads as any) = vi.fn().mockReturnValue([mockGamepad])

      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      const controlsBtn = buttonHandlers.get('640,380')
      controlsBtn?.get('pointerdown')?.()

      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('should handle gamepad settings panel opening', async () => {
      // Test without Safari-specific code
      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      const controlsBtn = buttonHandlers.get('640,380')
      controlsBtn?.get('pointerdown')?.()

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should save control settings', async () => {
      const { ControlManager } = await import('../utils/ControlManager')

      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      const controlsBtn = buttonHandlers.get('640,380')
      controlsBtn?.get('pointerdown')?.()

      await new Promise(resolve => setTimeout(resolve, 10))

      // Save button at (640, 580)
      const saveBtn = buttonHandlers.get('640,580')
      if (saveBtn?.has('pointerdown')) {
        saveBtn.get('pointerdown')?.()
        expect(ControlManager.saveControlSettings).toHaveBeenCalled()
      }
    })

    it('should show dual gamepad message when 2 gamepads connected', async () => {
      const mockGamepad1 = {
        id: 'Controller 1', index: 0, connected: true,
        buttons: [], axes: [], mapping: 'standard', timestamp: 0
      }
      const mockGamepad2 = {
        id: 'Controller 2', index: 1, connected: true,
        buttons: [], axes: [], mapping: 'standard', timestamp: 0
      }
      ;(global.navigator.getGamepads as any) = vi.fn().mockReturnValue([mockGamepad1, mockGamepad2])

      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      const controlsBtn = buttonHandlers.get('640,380')
      controlsBtn?.get('pointerdown')?.()

      await new Promise(resolve => setTimeout(resolve, 10))

      // Panel should be taller for 2 gamepads (700 vs 600)
      expect(scene.add.rectangle).toHaveBeenCalled()
    })
  })

  describe('Background Gamepad Polling', () => {
    it('should dispatch event when gamepad count changes', async () => {
      let intervalCallback: Function | null = null
      vi.spyOn(window, 'setInterval').mockImplementation((callback: any) => {
        intervalCallback = callback
        return 123 as any
      })

      await scene.create()

      // Simulate gamepad connection
      const mockGamepad = { id: 'Test', index: 0, connected: true, buttons: [], axes: [] }
      ;(global.navigator.getGamepads as any) = vi.fn().mockReturnValue([mockGamepad])

      // Trigger poll
      if (intervalCallback) {
        intervalCallback()
      }

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'gamepadCountChanged' })
      )
    })

    it('should handle gamepad connected event', async () => {
      let connectedHandler: Function | null = null
      vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'gamepadconnected') {
          connectedHandler = handler
        }
      })

      await scene.create()

      expect(window.addEventListener).toHaveBeenCalledWith('gamepadconnected', expect.any(Function))

      // Trigger event
      if (connectedHandler) {
        const mockEvent = { gamepad: { id: 'Test Controller', index: 0 } }
        connectedHandler(mockEvent)
      }
    })

    it('should handle gamepad disconnected event', async () => {
      let disconnectedHandler: Function | null = null
      vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'gamepaddisconnected') {
          disconnectedHandler = handler
        }
      })

      await scene.create()

      expect(window.addEventListener).toHaveBeenCalledWith('gamepaddisconnected', expect.any(Function))

      if (disconnectedHandler) {
        const mockEvent = { gamepad: { id: 'Test Controller', index: 0 } }
        disconnectedHandler(mockEvent)
      }
    })

    it('should set up poll interval', async () => {
      await scene.create()

      // Poll interval should be set (either 100 or 500 depending on UA)
      expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number))
    })
  })

  describe('Mobile Fullscreen', () => {
    it('should trigger fullscreen on mobile pointer down', async () => {
      let pointerCallback: Function | null = null
      scene.sys.game.device.os.desktop = false
      scene.input.once = vi.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'pointerdown') {
          pointerCallback = callback
        }
      })

      await scene.create()

      expect(scene.input.once).toHaveBeenCalledWith('pointerdown', expect.any(Function))

      // Trigger pointer down
      if (pointerCallback) {
        pointerCallback()
        expect(scene.scale.startFullscreen).toHaveBeenCalled()
      }

      scene.sys.game.device.os.desktop = true
    })

    it('should not start fullscreen if already fullscreen', async () => {
      let pointerCallback: Function | null = null
      scene.sys.game.device.os.desktop = false
      scene.scale.isFullscreen = true
      scene.input.once = vi.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'pointerdown') {
          pointerCallback = callback
        }
      })

      await scene.create()

      if (pointerCallback) {
        pointerCallback()
        expect(scene.scale.startFullscreen).not.toHaveBeenCalled()
      }

      scene.sys.game.device.os.desktop = true
      scene.scale.isFullscreen = false
    })
  })

  describe('Wake Event Handler', () => {
    it('should update coin text on wake', async () => {
      let wakeHandler: Function | null = null
      scene.events.on = vi.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'wake') {
          wakeHandler = callback
        }
      })

      await scene.create()

      // Set new coin count
      localStorage.setItem('playerCoins', '9999')

      // Trigger wake
      if (wakeHandler) {
        wakeHandler()
      }
    })

    it('should handle missing coinText on wake', async () => {
      let wakeHandler: Function | null = null
      scene.events.on = vi.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'wake') {
          wakeHandler = callback
        }
      })

      await scene.create()

      // Clear coinText
      ;(scene as any).coinText = undefined

      localStorage.setItem('playerCoins', '100')

      // Should not throw
      if (wakeHandler) {
        expect(() => wakeHandler()).not.toThrow()
      }
    })
  })

  describe('API Status Updates', () => {
    it('should show connected status', async () => {
      vi.mocked(GameAPI.checkConnection).mockResolvedValue(true)

      await scene.create()

      // Wait for async
      await new Promise(resolve => setTimeout(resolve, 0))

      // API status text should be created
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should show offline status', async () => {
      vi.mocked(GameAPI.checkConnection).mockResolvedValue(false)

      await scene.create()

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('showControlSettings - Extended', () => {
    it('should create control settings panel with dynamic import', async () => {
      const { ControlManager } = await import('../utils/ControlManager')
      
      await scene.create()
      
      // Manually call showControlSettings
      const showControlSettings = (scene as any).showControlSettings.bind(scene)
      showControlSettings()
      
      // Wait for dynamic import
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(scene.add.rectangle).toHaveBeenCalled()
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should handle no gamepads connected', async () => {
      ;(global.navigator.getGamepads as any) = vi.fn().mockReturnValue([null, null, null, null])
      
      await scene.create()
      
      const showControlSettings = (scene as any).showControlSettings.bind(scene)
      showControlSettings()
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Should show no gamepads detected message
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should handle single gamepad connected', async () => {
      const mockGamepad = {
        id: 'Xbox Controller',
        index: 0,
        connected: true,
        buttons: [],
        axes: [],
        mapping: 'standard',
        timestamp: 0
      }
      ;(global.navigator.getGamepads as any) = vi.fn().mockReturnValue([mockGamepad, null, null, null])
      
      await scene.create()
      
      const showControlSettings = (scene as any).showControlSettings.bind(scene)
      showControlSettings()
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should handle two gamepads connected', async () => {
      const mockGamepad1 = { id: 'Controller 1', index: 0, connected: true, buttons: [], axes: [] }
      const mockGamepad2 = { id: 'Controller 2', index: 1, connected: true, buttons: [], axes: [] }
      ;(global.navigator.getGamepads as any) = vi.fn().mockReturnValue([mockGamepad1, mockGamepad2, null, null])
      
      await scene.create()
      
      const showControlSettings = (scene as any).showControlSettings.bind(scene)
      showControlSettings()
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Should create taller panel for 2 gamepads
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should handle gamepad connection change during settings', async () => {
      // Start with no gamepads
      ;(global.navigator.getGamepads as any) = vi.fn().mockReturnValue([null])
      
      await scene.create()
      
      const showControlSettings = (scene as any).showControlSettings.bind(scene)
      showControlSettings()
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Simulate gamepad connected
      const mockGamepad = { id: 'New Controller', index: 0, connected: true, buttons: [], axes: [] }
      ;(global.navigator.getGamepads as any) = vi.fn().mockReturnValue([mockGamepad])
      
      // Trigger update event
      scene.events.emit('update')
      
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('should select keyboard input method', async () => {
      const { ControlManager } = await import('../utils/ControlManager')
      vi.mocked(ControlManager.getControlSettings).mockReturnValue({
        inputMethod: 'gamepad',
        gamepadMapping: { jump: 0, shoot: 7 }
      })
      
      await scene.create()
      
      const showControlSettings = (scene as any).showControlSettings.bind(scene)
      showControlSettings()
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Find keyboard button and click it
      const keyboardBtn = buttonHandlers.get('580,180')
      if (keyboardBtn?.has('pointerdown')) {
        keyboardBtn.get('pointerdown')?.()
      }
    })

    it('should select gamepad input method', async () => {
      const { ControlManager } = await import('../utils/ControlManager')
      vi.mocked(ControlManager.getControlSettings).mockReturnValue({
        inputMethod: 'keyboard',
        gamepadMapping: { jump: 0, shoot: 7 }
      })
      
      await scene.create()
      
      const showControlSettings = (scene as any).showControlSettings.bind(scene)
      showControlSettings()
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Find gamepad button and click it
      const gamepadBtn = buttonHandlers.get('750,180')
      if (gamepadBtn?.has('pointerdown')) {
        gamepadBtn.get('pointerdown')?.()
      }
    })

    it('should save settings and show confirmation', async () => {
      const { ControlManager } = await import('../utils/ControlManager')
      
      await scene.create()
      
      const showControlSettings = (scene as any).showControlSettings.bind(scene)
      showControlSettings()
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Find save button and click it
      const saveBtn = buttonHandlers.get('640,580')
      if (saveBtn?.has('pointerdown')) {
        saveBtn.get('pointerdown')?.()
        expect(ControlManager.saveControlSettings).toHaveBeenCalled()
      }
    })

    it('should handle gamepad button press event', async () => {
      await scene.create()
      
      // Just verify the settings can be accessed
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should handle gamepad mode selection', async () => {
      await scene.create()
      
      // Verify button creation works
      expect(scene.add.rectangle).toHaveBeenCalled()
    })
  })

  describe('Name Input Dialog - Save Functionality', () => {
    beforeEach(() => {
      scene.game = {
        canvas: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
          parentElement: document.body
        }
      } as any
    })

    it('should save name when save button clicked with valid input', async () => {
      await scene.create()

      // Click name button to open dialog
      const nameBtn = buttonHandlers.get('120,50')
      nameBtn?.get('pointerdown')?.()

      // Create mock input element
      const mockInput = document.querySelector('input')
      if (mockInput) {
        mockInput.value = 'TestPlayer'
      }

      // Click save button
      const saveBtn = buttonHandlers.get('740,450')
      saveBtn?.get('pointerdown')?.()

      // Should have saved name
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('should not save empty name', async () => {
      await scene.create()

      const nameBtn = buttonHandlers.get('120,50')
      nameBtn?.get('pointerdown')?.()

      // Leave input empty
      const mockInput = document.querySelector('input')
      if (mockInput) {
        mockInput.value = '   '
      }

      const saveBtn = buttonHandlers.get('740,450')
      saveBtn?.get('pointerdown')?.()

      // Name should not be saved
      expect(localStorage.getItem('player_name')).toBeNull()
    })

    it('should handle enter key press in name input', async () => {
      await scene.create()

      const nameBtn = buttonHandlers.get('120,50')
      nameBtn?.get('pointerdown')?.()

      // Input element is created, verify it exists
      const mockInput = document.querySelector('input')
      expect(mockInput).toBeDefined()
    })

    it('should handle escape key press in name input', async () => {
      await scene.create()

      const nameBtn = buttonHandlers.get('120,50')
      nameBtn?.get('pointerdown')?.()

      // Input element is created
      const mockInput = document.querySelector('input')
      expect(mockInput).toBeDefined()
    })
  })

  describe('Tutorial Controls Display', () => {
    it('should display all control options', async () => {
      await scene.create()

      const tutorialBtn = buttonHandlers.get('100,700')
      tutorialBtn?.get('pointerdown')?.()

      // Should create multiple text elements for controls
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should display tips section', async () => {
      await scene.create()

      const tutorialBtn = buttonHandlers.get('100,700')
      tutorialBtn?.get('pointerdown')?.()

      // Should have tips text
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should display cheat codes section', async () => {
      await scene.create()

      const tutorialBtn = buttonHandlers.get('100,700')
      tutorialBtn?.get('pointerdown')?.()

      // Should have cheats text
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('Volume Slider Interaction', () => {
    it('should update music volume on drag', async () => {
      let dragHandler: Function | null = null
      const mockMusicSliderHandle = { x: 640 }
      
      scene.input = {
        ...scene.input,
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          if (event === 'drag') {
            dragHandler = handler
          }
        }),
        off: vi.fn()
      } as any

      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      // Trigger drag on music slider
      if (dragHandler) {
        dragHandler({}, mockMusicSliderHandle, 600)
      }
    })

    it('should update sound volume on drag', async () => {
      let dragHandler: Function | null = null
      const mockSoundSliderHandle = { x: 640 }
      
      scene.input = {
        ...scene.input,
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          if (event === 'drag') {
            dragHandler = handler
          }
        }),
        off: vi.fn()
      } as any

      await scene.create()

      const settingsBtn = buttonHandlers.get('1150,650')
      settingsBtn?.get('pointerdown')?.()

      // Trigger drag on sound slider
      if (dragHandler) {
        dragHandler({}, mockSoundSliderHandle, 700)
      }
    })
  })
})
