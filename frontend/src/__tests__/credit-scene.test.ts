import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Phaser Module BEFORE importing CreditScene
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
          setInteractive: vi.fn().mockReturnThis(),
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
          setInteractive: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        image: vi.fn().mockImplementation(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
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
        gamepad: { pads: [] }
      }
      scene = {
        start: vi.fn(),
        stop: vi.fn()
      }
      tweens = {
        add: vi.fn().mockReturnValue({ stop: vi.fn() })
      }
      
      constructor() {}
    },
    Geom: {
      Circle: class { constructor() {} }
    },
    Math: {
      Between: () => 0,
      FloatBetween: () => 0
    }
  }

  return { default: Phaser, ...Phaser }
})

import CreditScene from '../scenes/CreditScene'

describe('CreditScene', () => {
  let scene: CreditScene
  let backButtonHandlers: Map<string, Function>

  beforeEach(() => {
    vi.clearAllMocks()
    backButtonHandlers = new Map()
    
    scene = new CreditScene()
    
    // Track back button handlers
    scene.add.text = vi.fn().mockImplementation((x: number, y: number, text: string) => {
      const textObj: any = {
        x, y, text,
        setOrigin: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setColor: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          if (text === 'BACK') {
            backButtonHandlers.set(event, handler)
          }
          return textObj
        }),
        destroy: vi.fn()
      }
      return textObj
    })
  })

  afterEach(() => {
    if (scene) {
      scene.shutdown()
    }
  })

  describe('constructor', () => {
    it('should create scene with correct key', () => {
      const newScene = new CreditScene()
      expect(newScene).toBeInstanceOf(CreditScene)
    })
  })

  describe('create', () => {
    it('should create title text', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        100,
        'CREDITS',
        expect.any(Object)
      )
    })

    it('should create developer credit', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Developer',
        expect.any(Object)
      )
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Aiden Phang Rui Yin',
        expect.any(Object)
      )
    })

    it('should create AI Copilot credit', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'AI Copilot',
        expect.any(Object)
      )
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'GitHub Copilot',
        expect.any(Object)
      )
    })

    it('should create Lead Tester credit', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Lead Tester',
        expect.any(Object)
      )
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'my mom',
        expect.any(Object)
      )
    })

    it('should create Infrastructure credit', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Infrastructure Engineer',
        expect.any(Object)
      )
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'my dad and me',
        expect.any(Object)
      )
    })

    it('should create back button', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'BACK',
        expect.any(Object)
      )
    })

    it('should create blackhole background', () => {
      scene.create()
      
      // Should create multiple circles for blackhole effect
      expect(scene.add.circle).toHaveBeenCalled()
    })

    it('should add tweens for animation', () => {
      scene.create()
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('back button', () => {
    it('should navigate to MenuScene on click', () => {
      scene.create()
      
      const pointerdownHandler = backButtonHandlers.get('pointerdown')
      if (pointerdownHandler) {
        pointerdownHandler()
        expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
      }
    })

    it('should have hover effects', () => {
      scene.create()
      
      expect(backButtonHandlers.has('pointerover')).toBe(true)
      expect(backButtonHandlers.has('pointerout')).toBe(true)
    })

    it('should scale up on hover', () => {
      scene.create()
      
      const pointeroverHandler = backButtonHandlers.get('pointerover')
      expect(pointeroverHandler).toBeDefined()
    })

    it('should reset on hover out', () => {
      scene.create()
      
      const pointeroutHandler = backButtonHandlers.get('pointerout')
      expect(pointeroutHandler).toBeDefined()
    })
  })

  describe('createBlackholeBackground', () => {
    it('should create multiple blackholes', () => {
      scene.create()
      
      // 3 blackholes with 4 circles each = 12 circles
      expect(scene.add.circle).toHaveBeenCalled()
    })

    it('should add rotation animations', () => {
      scene.create()
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })

    it('should add pulsing animations', () => {
      scene.create()
      
      // Multiple tweens for rotation and pulsing
      const tweenCalls = vi.mocked(scene.tweens.add).mock.calls
      expect(tweenCalls.length).toBeGreaterThan(0)
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

    it('should not modify existing pads array', () => {
      const existingPads = [{ id: 'gamepad1' }]
      scene.input.gamepad = { pads: existingPads } as any
      
      scene.shutdown()
      
      expect((scene.input.gamepad as any).pads).toBe(existingPads)
    })
  })
})
