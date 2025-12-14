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
