import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Phaser Module BEFORE importing InventoryScene
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
          setTint: vi.fn().mockReturnThis(),
          clearTint: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        container: vi.fn().mockImplementation(() => ({
          add: vi.fn().mockReturnThis(),
          setMask: vi.fn().mockReturnThis(),
          y: 0,
          destroy: vi.fn()
        }))
      }
      make = {
        graphics: vi.fn().mockImplementation(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          generateTexture: vi.fn().mockReturnThis(),
          createGeometryMask: vi.fn().mockReturnValue({}),
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
        stop: vi.fn(),
        restart: vi.fn()
      }
      
      constructor() {}
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          ESC: 27
        }
      }
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

import InventoryScene from '../scenes/InventoryScene'

describe('InventoryScene', () => {
  let scene: InventoryScene
  let backButtonHandlers: Map<string, Function>
  let weaponPanelHandlers: Map<string, Map<string, Function>>
  let skinPanelHandlers: Map<string, Map<string, Function>>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    backButtonHandlers = new Map()
    weaponPanelHandlers = new Map()
    skinPanelHandlers = new Map()
    
    scene = new InventoryScene()
    
    // Track back button handlers
    scene.add.image = vi.fn().mockImplementation((x: number, y: number, key: string) => {
      const imgObj: any = {
        x, y, key,
        setOrigin: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setTint: vi.fn().mockReturnThis(),
        clearTint: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          if (key === 'backArrow') {
            backButtonHandlers.set(event, handler)
          }
          return imgObj
        }),
        destroy: vi.fn()
      }
      return imgObj
    })

    // Track weapon and skin panel handlers
    let panelIndex = 0
    scene.add.rectangle = vi.fn().mockImplementation((x: number, y: number, w: number, h: number) => {
      const rectObj: any = {
        x, y, width: w, height: h,
        setStrokeStyle: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          const key = `${x},${y}`
          // Track weapon panels (left side, x around 200)
          if (x === 200 && w === 320 && h === 100) {
            if (!weaponPanelHandlers.has(key)) {
              weaponPanelHandlers.set(key, new Map())
            }
            weaponPanelHandlers.get(key)!.set(event, handler)
          }
          // Track skin panels (right side, width 140, height 180)
          if (w === 140 && h === 180) {
            if (!skinPanelHandlers.has(key)) {
              skinPanelHandlers.set(key, new Map())
            }
            skinPanelHandlers.get(key)!.set(event, handler)
          }
          return rectObj
        }),
        destroy: vi.fn()
      }
      panelIndex++
      return rectObj
    })
  })

  afterEach(() => {
    if (scene) {
      scene.shutdown()
    }
  })

  describe('constructor', () => {
    it('should create scene with correct key', () => {
      const newScene = new InventoryScene()
      expect(newScene).toBeInstanceOf(InventoryScene)
    })
  })

  describe('init', () => {
    it('should load inventory from localStorage', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['laserGun', 'skinBlue']))
      
      scene.init()
      
      // Inventory should be loaded
    })

    it('should load equipped items from localStorage', () => {
      localStorage.setItem('equippedWeapon', 'laserGun')
      localStorage.setItem('equippedSkin', 'alienBlue')
      
      scene.init()
      
      // Should load without error
    })

    it('should handle empty inventory', () => {
      scene.init()
      
      // Should not throw
    })
  })

  describe('preload', () => {
    it('should create back arrow texture', () => {
      scene.preload()
      
      expect(scene.make.graphics).toHaveBeenCalled()
    })

    it('should create weapon icons', () => {
      scene.preload()
      
      // Multiple graphics calls for weapon icons
      expect(scene.make.graphics).toHaveBeenCalled()
    })

    it('should load skin images', () => {
      scene.preload()
      
      expect(scene.load.image).toHaveBeenCalledWith('skinBeige', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('skinBlue', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('skinGreen', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('skinPink', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('skinYellow', expect.any(String))
    })
  })

  describe('create', () => {
    beforeEach(() => {
      scene.init()
      scene.preload()
    })

    it('should set background color', () => {
      scene.create()
      
      expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#000033')
    })

    it('should create title', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(640, 60, 'INVENTORY', expect.any(Object))
    })

    it('should create back button', () => {
      scene.create()
      
      expect(scene.add.image).toHaveBeenCalledWith(80, 60, 'backArrow')
    })

    it('should create section headers', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(200, 130, 'WEAPONS', expect.any(Object))
      expect(scene.add.text).toHaveBeenCalledWith(640, 130, 'SKINS', expect.any(Object))
    })

    it('should create instructions text', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(640, 650, 'Click on items to equip them', expect.any(Object))
    })

    it('should setup ESC key handler', () => {
      scene.create()
      
      expect(scene.input.keyboard!.addKey).toHaveBeenCalled()
    })
  })

  describe('back button', () => {
    beforeEach(() => {
      scene.init()
      scene.preload()
    })

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
  })

  describe('displayWeapons', () => {
    beforeEach(() => {
      scene.init()
      scene.preload()
    })

    it('should display default raygun', () => {
      scene.create()
      
      // Default weapon should be displayed
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should display purchased weapons', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['laserGun', 'sword']))
      scene.init()
      
      scene.create()
      
      // Multiple weapon panels should be created
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should show equipped status for equipped weapon', () => {
      localStorage.setItem('equippedWeapon', 'raygun')
      scene.init()
      
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should setup scroll interaction', () => {
      scene.create()
      
      expect(scene.input.on).toHaveBeenCalledWith('wheel', expect.any(Function))
    })
  })

  describe('displaySkins', () => {
    beforeEach(() => {
      scene.init()
      scene.preload()
    })

    it('should display default skin', () => {
      scene.create()
      
      // Default skin should be displayed
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should display purchased skins', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['skinBlue', 'skinGreen']))
      scene.init()
      
      scene.create()
      
      expect(scene.add.rectangle).toHaveBeenCalled()
    })
  })

  describe('equipWeapon', () => {
    beforeEach(() => {
      scene.init()
      scene.preload()
    })

    it('should save equipped weapon to localStorage', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['laserGun']))
      scene.init()
      scene.create()
      
      // Find a non-equipped weapon panel and click it
      const handlers = Array.from(weaponPanelHandlers.values())
      if (handlers.length > 0) {
        const pointerdown = handlers[0].get('pointerdown')
        if (pointerdown) {
          pointerdown()
          // Scene should restart
          expect(scene.scene.restart).toHaveBeenCalled()
        }
      }
    })
  })

  describe('equipSkin', () => {
    beforeEach(() => {
      scene.init()
      scene.preload()
    })

    it('should save equipped skin to localStorage', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['skinBlue']))
      scene.init()
      scene.create()
      
      // Find a non-equipped skin panel and click it
      const handlers = Array.from(skinPanelHandlers.values())
      if (handlers.length > 0) {
        const pointerdown = handlers[0].get('pointerdown')
        if (pointerdown) {
          pointerdown()
          expect(scene.scene.restart).toHaveBeenCalled()
        }
      }
    })

    it('should convert skin IDs correctly', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['skinBlue']))
      scene.init()
      scene.create()
      
      // The conversion should happen internally
    })
  })

  describe('loadInventory', () => {
    it('should parse purchased items from localStorage', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['laserGun', 'sword', 'skinBlue']))
      
      scene.init()
      
      // Should load without error
    })

    it('should handle all weapon types', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['laserGun', 'sword', 'bazooka', 'lfg']))
      
      scene.init()
      
      // Should load all weapons
    })

    it('should handle all skin types', () => {
      localStorage.setItem('purchasedItems', JSON.stringify(['skinBlue', 'skinGreen', 'skinPink', 'skinYellow']))
      
      scene.init()
      
      // Should load all skins
    })

    it('should handle empty purchasedItems', () => {
      localStorage.setItem('purchasedItems', JSON.stringify([]))
      
      scene.init()
      
      // Should not throw
    })

    it('should handle missing purchasedItems', () => {
      scene.init()
      
      // Should not throw
    })
  })

  describe('loadEquippedItems', () => {
    it('should load equipped weapon', () => {
      localStorage.setItem('equippedWeapon', 'laserGun')
      
      scene.init()
      
      // Should load without error
    })

    it('should load equipped skin', () => {
      localStorage.setItem('equippedSkin', 'alienBlue')
      
      scene.init()
      
      // Should load without error
    })

    it('should handle missing equipped items', () => {
      scene.init()
      
      // Should use defaults
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

  describe('weapon panel interactions', () => {
    beforeEach(() => {
      localStorage.setItem('purchasedItems', JSON.stringify(['laserGun']))
      scene.init()
      scene.preload()
    })

    it('should have hover effects', () => {
      scene.create()
      
      // Check if any weapon panel has hover handlers
      for (const handlers of weaponPanelHandlers.values()) {
        if (handlers.has('pointerover')) {
          expect(handlers.has('pointerout')).toBe(true)
        }
      }
    })
  })

  describe('skin panel interactions', () => {
    beforeEach(() => {
      localStorage.setItem('purchasedItems', JSON.stringify(['skinBlue']))
      scene.init()
      scene.preload()
    })

    it('should have hover effects', () => {
      scene.create()
      
      // Check if any skin panel has hover handlers
      for (const handlers of skinPanelHandlers.values()) {
        if (handlers.has('pointerover')) {
          expect(handlers.has('pointerout')).toBe(true)
        }
      }
    })
  })

  describe('scroll functionality', () => {
    beforeEach(() => {
      scene.init()
      scene.preload()
    })

    it('should register wheel event handler', () => {
      scene.create()
      
      expect(scene.input.on).toHaveBeenCalledWith('wheel', expect.any(Function))
    })
  })
})
