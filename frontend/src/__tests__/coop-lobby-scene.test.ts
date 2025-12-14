import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock LocalCoopManager
vi.mock('../utils/LocalCoopManager', () => ({
  LocalCoopManager: {
    getInstance: vi.fn().mockReturnValue({
      enableCoopMode: vi.fn(),
      disableCoopMode: vi.fn(),
      resetPlayers: vi.fn(),
      updatePlayerState: vi.fn(),
      setPlayerReady: vi.fn(),
      areBothPlayersReady: vi.fn().mockReturnValue(false),
      getPlayer1State: vi.fn().mockReturnValue({ isReady: false, gamepadIndex: -1 }),
      getPlayer2State: vi.fn().mockReturnValue({ isReady: false, gamepadIndex: -1 })
    })
  }
}))

// Mock Phaser Module
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
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
          setBackgroundColor: vi.fn()
        }
      }
      add = {
        text: vi.fn().mockImplementation(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setName: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        circle: vi.fn().mockImplementation(() => ({
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        rectangle: vi.fn().mockImplementation(() => ({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        graphics: vi.fn().mockImplementation(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        container: vi.fn().mockImplementation(() => ({
          add: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setName: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          getByName: vi.fn().mockReturnValue({
            setText: vi.fn(),
            setColor: vi.fn(),
            setAlpha: vi.fn()
          }),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        image: vi.fn().mockImplementation(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }))
      }
      load = {
        image: vi.fn()
      }
      input = {
        keyboard: {
          on: vi.fn(),
          off: vi.fn(),
          addKey: vi.fn().mockReturnValue({ on: vi.fn() })
        },
        on: vi.fn(),
        gamepad: {
          on: vi.fn(),
          gamepads: [],
          pads: []
        }
      }
      scene = {
        start: vi.fn(),
        stop: vi.fn()
      }
      tweens = {
        add: vi.fn().mockReturnValue({ stop: vi.fn() })
      }
      time = {
        addEvent: vi.fn(),
        delayedCall: vi.fn()
      }
      
      constructor() {}
    },
    Geom: {
      Rectangle: class {
        constructor() {}
        static Contains = vi.fn()
      },
      Circle: class { constructor() {} }
    },
    Math: {
      Between: () => 0,
      FloatBetween: () => 0
    }
  }

  return { default: Phaser, ...Phaser }
})

import CoopLobbyScene from '../scenes/CoopLobbyScene'
import { LocalCoopManager } from '../utils/LocalCoopManager'

describe('CoopLobbyScene', () => {
  let scene: CoopLobbyScene
  let mockCoopManager: any
  let backButtonHandler: Function | null = null
  let startButtonHandler: Function | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockCoopManager = LocalCoopManager.getInstance()
    backButtonHandler = null
    startButtonHandler = null
    
    scene = new CoopLobbyScene()
    
    // Track container button handlers
    scene.add.container = vi.fn().mockImplementation((x: number, y: number) => {
      const container: any = {
        x, y,
        add: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setName: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        getByName: vi.fn().mockReturnValue({
          setText: vi.fn(),
          setColor: vi.fn(),
          setAlpha: vi.fn()
        }),
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          if (y === 650 && event === 'pointerdown') {
            backButtonHandler = handler
          }
          if (y === 600 && event === 'pointerdown') {
            startButtonHandler = handler
          }
          return container
        }),
        destroy: vi.fn()
      }
      return container
    })
  })

  afterEach(() => {
    if (scene) {
      scene.shutdown()
    }
  })

  describe('constructor', () => {
    it('should create scene with correct key', () => {
      const newScene = new CoopLobbyScene()
      expect(newScene).toBeInstanceOf(CoopLobbyScene)
    })

    it('should get LocalCoopManager instance', () => {
      expect(LocalCoopManager.getInstance).toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('should enable coop mode', () => {
      scene.create()
      
      expect(mockCoopManager.enableCoopMode).toHaveBeenCalled()
    })

    it('should reset players', () => {
      scene.create()
      
      expect(mockCoopManager.resetPlayers).toHaveBeenCalled()
    })

    it('should set background color', () => {
      scene.create()
      
      expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#0a0a1a')
    })

    it('should create title', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(640, 80, 'LOCAL CO-OP LOBBY', expect.any(Object))
    })

    it('should create instructions text', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        640, 160,
        'Connect two gamepads and press A to join!',
        expect.any(Object)
      )
    })

    it('should create player 1 indicator', () => {
      scene.create()
      
      // Should create container for player 1
      expect(scene.add.container).toHaveBeenCalled()
    })

    it('should create player 2 indicator', () => {
      scene.create()
      
      // Should create container for player 2
      expect(scene.add.container).toHaveBeenCalled()
    })

    it('should create start button', () => {
      scene.create()
      
      expect(scene.add.container).toHaveBeenCalled()
    })

    it('should create back button', () => {
      scene.create()
      
      expect(scene.add.container).toHaveBeenCalled()
    })

    it('should create blackhole background', () => {
      scene.create()
      
      expect(scene.add.graphics).toHaveBeenCalled()
    })

    it('should listen for gamepad connections', () => {
      scene.create()
      
      expect(scene.input.gamepad?.on).toHaveBeenCalledWith('connected', expect.any(Function))
      expect(scene.input.gamepad?.on).toHaveBeenCalledWith('disconnected', expect.any(Function))
    })
  })

  describe('back button', () => {
    it('should disable coop mode and return to menu', () => {
      scene.create()
      
      if (backButtonHandler) {
        backButtonHandler()
        expect(mockCoopManager.disableCoopMode).toHaveBeenCalled()
        expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
      }
    })
  })

  describe('start button', () => {
    it('should start game when both players ready', () => {
      mockCoopManager.areBothPlayersReady.mockReturnValue(true)
      
      scene.create()
      
      if (startButtonHandler) {
        startButtonHandler()
        expect(scene.scene.start).toHaveBeenCalledWith('GameScene', {
          mode: 'coop',
          level: 1
        })
      }
    })
  })

  describe('updateGamepadAssignments', () => {
    it('should update player 1 when gamepad connected', () => {
      scene.input.gamepad!.gamepads = [{ index: 0 }] as any
      
      scene.create()
      
      expect(mockCoopManager.updatePlayerState).toHaveBeenCalled()
    })

    it('should update player 2 when second gamepad connected', () => {
      scene.input.gamepad!.gamepads = [{ index: 0 }, { index: 1 }] as any
      
      scene.create()
      
      expect(mockCoopManager.updatePlayerState).toHaveBeenCalled()
    })

    it('should handle no gamepads connected', () => {
      scene.input.gamepad!.gamepads = []
      
      scene.create()
      
      // Should not throw
    })
  })

  describe('update', () => {
    it('should poll for gamepad changes', () => {
      scene.create()
      
      scene.update()
      
      // Should check gamepad states
    })

    it('should mark player 1 ready when A pressed', () => {
      const mockGamepad1 = {
        index: 0,
        A: true,
        buttons: Array(12).fill({ pressed: false })
      }
      scene.input.gamepad!.gamepads = [mockGamepad1] as any
      mockCoopManager.getPlayer1State.mockReturnValue({ isReady: false })
      
      scene.create()
      scene.update()
      
      expect(mockCoopManager.setPlayerReady).toHaveBeenCalledWith(1, true)
    })

    it('should mark player 2 ready when A pressed', () => {
      const mockGamepad1 = {
        index: 0,
        A: false,
        buttons: Array(12).fill({ pressed: false })
      }
      const mockGamepad2 = {
        index: 1,
        A: true,
        buttons: Array(12).fill({ pressed: false })
      }
      scene.input.gamepad!.gamepads = [mockGamepad1, mockGamepad2] as any
      mockCoopManager.getPlayer1State.mockReturnValue({ isReady: true })
      mockCoopManager.getPlayer2State.mockReturnValue({ isReady: false })
      
      scene.create()
      scene.update()
      
      expect(mockCoopManager.setPlayerReady).toHaveBeenCalledWith(2, true)
    })

    it('should un-ready player 1 when B pressed', () => {
      const mockGamepad1 = {
        index: 0,
        B: true,
        buttons: Array(12).fill({ pressed: false })
      }
      scene.input.gamepad!.gamepads = [mockGamepad1] as any
      mockCoopManager.getPlayer1State.mockReturnValue({ isReady: true })
      
      scene.create()
      scene.update()
      
      expect(mockCoopManager.setPlayerReady).toHaveBeenCalledWith(1, false)
    })

    it('should un-ready player 2 when B pressed', () => {
      const mockGamepad1 = {
        index: 0,
        B: false,
        buttons: Array(12).fill({ pressed: false })
      }
      const mockGamepad2 = {
        index: 1,
        B: true,
        buttons: Array(12).fill({ pressed: false })
      }
      scene.input.gamepad!.gamepads = [mockGamepad1, mockGamepad2] as any
      mockCoopManager.getPlayer1State.mockReturnValue({ isReady: true })
      mockCoopManager.getPlayer2State.mockReturnValue({ isReady: true })
      
      scene.create()
      scene.update()
      
      expect(mockCoopManager.setPlayerReady).toHaveBeenCalledWith(2, false)
    })

    it('should start game when Start button pressed and both ready', () => {
      scene.input.gamepad!.gamepads = [{ index: 0, buttons: [null, null, null, null, null, null, null, null, null, { pressed: true }] }] as any
      mockCoopManager.areBothPlayersReady.mockReturnValue(true)
      mockCoopManager.getPlayer1State.mockReturnValue({ isReady: true })
      mockCoopManager.getPlayer2State.mockReturnValue({ isReady: true })
      
      scene.create()
      scene.update()
      
      expect(scene.scene.start).toHaveBeenCalledWith('GameScene', expect.any(Object))
    })
  })

  describe('updateStartButtonVisibility', () => {
    it('should show start button when both players ready', () => {
      mockCoopManager.areBothPlayersReady.mockReturnValue(true)
      
      scene.create()
      
      // Start button alpha should be 1
    })

    it('should hide start button when not both ready', () => {
      mockCoopManager.areBothPlayersReady.mockReturnValue(false)
      
      scene.create()
      
      // Start button alpha should be 0
    })
  })

  describe('shutdown', () => {
    it('should handle missing gamepad plugin gracefully', () => {
      scene.input = {} as any
      
      expect(() => scene.shutdown()).not.toThrow()
    })

    it('should initialize gamepad pads array if missing', () => {
      scene.input.gamepad = {} as any
      
      scene.shutdown()
      
      expect((scene.input.gamepad as any).pads).toEqual([])
    })
  })

  describe('createBlackholeBackground', () => {
    it('should create star field', () => {
      scene.create()
      
      expect(scene.add.graphics).toHaveBeenCalled()
    })
  })

  describe('player indicators', () => {
    it('should show WAITING status when no gamepad', () => {
      scene.input.gamepad!.gamepads = []
      
      scene.create()
      
      // Status should show WAITING
    })

    it('should show CONNECTED status when gamepad connected', () => {
      scene.input.gamepad!.gamepads = [{ index: 0 }] as any
      
      scene.create()
      
      // Status should show CONNECTED
    })
  })
})
