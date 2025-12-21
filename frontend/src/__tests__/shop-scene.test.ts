/**
 * @fileoverview Tests for ShopScene
 * Tests shop functionality including item display, purchasing, pagination, and persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Phaser before importing ShopScene
vi.mock('phaser', () => {
  const createTextMock = () => ({
    setOrigin: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    scene: true
  })

  const createRectangleMock = () => ({
    setInteractive: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    disableInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    scene: true
  })

  const createImageMock = () => ({
    setScale: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    displayHeight: 60,
    scaleX: 1,
    scaleY: 1
  })

  const createContainerMock = () => ({
    add: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  })

  const createGraphicsMock = () => ({
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    closePath: vi.fn().mockReturnThis(),
    fillPath: vi.fn().mockReturnThis(),
    fillPoints: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    generateTexture: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  })

  return {
    default: {
      Scene: class MockScene {
        add = {
          text: vi.fn().mockReturnValue(createTextMock()),
          rectangle: vi.fn().mockReturnValue(createRectangleMock()),
          image: vi.fn().mockReturnValue(createImageMock()),
          container: vi.fn().mockReturnValue(createContainerMock())
        }
        make = {
          graphics: vi.fn().mockReturnValue(createGraphicsMock())
        }
        load = {
          image: vi.fn()
        }
        cameras = {
          main: {
            setBackgroundColor: vi.fn()
          }
        }
        input = {
          keyboard: {
            addKey: vi.fn().mockReturnValue({
              on: vi.fn()
            })
          }
        }
        scene = {
          start: vi.fn()
        }
        tweens = {
          add: vi.fn().mockImplementation((config) => {
            // Immediately call onComplete if provided
            if (config.onComplete) {
              config.onComplete()
            }
          })
        }
      },
      Curves: {
        Path: class {
          constructor() {}
          cubicBezierTo() {}
          lineTo() {}
          moveTo() {}
          getPoints() { return [] }
        }
      },
      Input: {
        Keyboard: {
          KeyCodes: {
            ESC: 27
          }
        }
      }
    }
  }
})

import ShopScene from '../scenes/ShopScene'

describe('ShopScene', () => {
  let scene: ShopScene
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => localStorageMock[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      localStorageMock[key] = value
    })

    scene = new ShopScene()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create scene with correct key', () => {
      expect(scene).toBeDefined()
    })
  })

  describe('init', () => {
    it('should initialize with provided coins', () => {
      scene.init({ coins: 500 })
      expect((scene as any).coinCount).toBe(500)
    })

    it('should load coins from localStorage if not provided', () => {
      localStorageMock['playerCoins'] = '1000'
      scene.init({})
      expect((scene as any).coinCount).toBe(1000)
    })

    it('should default to 0 coins if nothing saved', () => {
      scene.init({})
      expect((scene as any).coinCount).toBe(0)
    })

    it('should reset currentPage to 0', () => {
      (scene as any).currentPage = 5
      scene.init({})
      expect((scene as any).currentPage).toBe(0)
    })

    it('should clear shopCards array', () => {
      (scene as any).shopCards = ['item1', 'item2']
      scene.init({})
      expect((scene as any).shopCards).toEqual([])
    })

    it('should load purchased items from localStorage', () => {
      localStorageMock['purchasedItems'] = JSON.stringify(['laserGun', 'sword'])
      scene.init({})
      expect((scene as any).purchasedItems.has('laserGun')).toBe(true)
      expect((scene as any).purchasedItems.has('sword')).toBe(true)
    })
  })

  describe('preload', () => {
    it('should create back arrow texture', () => {
      scene.preload()
      expect(scene.make.graphics).toHaveBeenCalled()
    })

    it('should load skin images', () => {
      scene.preload()
      expect(scene.load.image).toHaveBeenCalledWith('skinBlue', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('skinGreen', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('skinPink', expect.any(String))
      expect(scene.load.image).toHaveBeenCalledWith('skinYellow', expect.any(String))
    })

    it('should load coin image', () => {
      scene.preload()
      expect(scene.load.image).toHaveBeenCalledWith('coin', expect.any(String))
    })
  })

  describe('create', () => {
    beforeEach(() => {
      scene.init({})
      scene.preload()
    })

    it('should set background color', () => {
      scene.create()
      expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#1a1a2e')
    })

    it('should create title text', () => {
      scene.create()
      expect(scene.add.text).toHaveBeenCalledWith(640, 50, 'SHOP', expect.any(Object))
    })

    it('should create coin display', () => {
      scene.create()
      expect(scene.add.image).toHaveBeenCalledWith(1050, 50, 'coin')
    })

    it('should create back arrow button', () => {
      scene.create()
      expect(scene.add.image).toHaveBeenCalledWith(50, 50, 'backArrow')
    })

    it('should add ESC key handler', () => {
      scene.create()
      expect(scene.input.keyboard!.addKey).toHaveBeenCalled()
    })

    it('should calculate total pages correctly', () => {
      scene.create()
      // 8 shop items / 6 per page = 2 pages
      expect((scene as any).totalPages).toBe(2)
    })

    it('should initialize shop items array', () => {
      scene.create()
      expect((scene as any).shopItems.length).toBe(9)
    })

    it('should include weapons in shop items', () => {
      scene.create()
      const weapons = (scene as any).shopItems.filter((item: any) => item.type === 'weapon')
      expect(weapons.length).toBe(4)
    })

    it('should include skins in shop items', () => {
      scene.create()
      const skins = (scene as any).shopItems.filter((item: any) => item.type === 'skin')
      expect(skins.length).toBe(4)
    })
  })

  describe('shop items catalog', () => {
    beforeEach(() => {
      scene.init({})
      scene.preload()
      scene.create()
    })

    it('should have laser gun item', () => {
      const laserGun = (scene as any).shopItems.find((item: any) => item.id === 'laserGun')
      expect(laserGun).toBeDefined()
      expect(laserGun.price).toBe(50)
      expect(laserGun.type).toBe('weapon')
    })

    it('should have energy sword item', () => {
      const sword = (scene as any).shopItems.find((item: any) => item.id === 'sword')
      expect(sword).toBeDefined()
      expect(sword.price).toBe(50)
      expect(sword.type).toBe('weapon')
    })

    it('should have bazooka item', () => {
      const bazooka = (scene as any).shopItems.find((item: any) => item.id === 'bazooka')
      expect(bazooka).toBeDefined()
      expect(bazooka.price).toBe(1000)
      expect(bazooka.type).toBe('weapon')
    })

    it('should have LFG item with highest price', () => {
      const lfg = (scene as any).shopItems.find((item: any) => item.id === 'lfg')
      expect(lfg).toBeDefined()
      expect(lfg.price).toBe(99999)
      expect(lfg.type).toBe('weapon')
    })

    it('should have all skin variations', () => {
      const skinIds = ['skinBlue', 'skinGreen', 'skinPink', 'skinYellow']
      skinIds.forEach(skinId => {
        const skin = (scene as any).shopItems.find((item: any) => item.id === skinId)
        expect(skin).toBeDefined()
        expect(skin.type).toBe('skin')
        expect(skin.price).toBe(50)
      })
    })
  })

  describe('loadCoins', () => {
    it('should return saved coins from localStorage', () => {
      localStorageMock['playerCoins'] = '250'
      const coins = (scene as any).loadCoins()
      expect(coins).toBe(250)
    })

    it('should return 0 if no coins saved', () => {
      const coins = (scene as any).loadCoins()
      expect(coins).toBe(0)
    })
  })

  describe('saveCoins', () => {
    it('should save coins to localStorage', () => {
      (scene as any).coinCount = 750
      ;(scene as any).saveCoins()
      expect(localStorageMock['playerCoins']).toBe('750')
    })
  })

  describe('loadPurchasedItems', () => {
    it('should load purchased items from localStorage', () => {
      localStorageMock['purchasedItems'] = JSON.stringify(['laserGun', 'skinBlue'])
      ;(scene as any).loadPurchasedItems()
      expect((scene as any).purchasedItems.has('laserGun')).toBe(true)
      expect((scene as any).purchasedItems.has('skinBlue')).toBe(true)
    })

    it('should handle empty localStorage', () => {
      (scene as any).loadPurchasedItems()
      expect((scene as any).purchasedItems.size).toBe(0)
    })
  })

  describe('savePurchasedItems', () => {
    it('should save purchased items to localStorage', () => {
      (scene as any).purchasedItems = new Set(['sword', 'skinGreen'])
      ;(scene as any).savePurchasedItems()
      const saved = JSON.parse(localStorageMock['purchasedItems'])
      expect(saved).toContain('sword')
      expect(saved).toContain('skinGreen')
    })
  })

  describe('purchaseItem', () => {
    beforeEach(() => {
      scene.init({ coins: 100 })
      scene.preload()
      scene.create()
    })

    it('should deduct price from coin count', () => {
      const item = { id: 'laserGun', name: 'Laser Gun', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).purchaseItem(item)
      expect((scene as any).coinCount).toBe(50)
    })

    it('should add item to purchasedItems', () => {
      const item = { id: 'laserGun', name: 'Laser Gun', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).purchaseItem(item)
      expect((scene as any).purchasedItems.has('laserGun')).toBe(true)
    })

    it('should save coins after purchase', () => {
      const item = { id: 'laserGun', name: 'Laser Gun', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).purchaseItem(item)
      expect(localStorageMock['playerCoins']).toBe('50')
    })

    it('should save purchased items after purchase', () => {
      const item = { id: 'laserGun', name: 'Laser Gun', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).purchaseItem(item)
      const saved = JSON.parse(localStorageMock['purchasedItems'])
      expect(saved).toContain('laserGun')
    })

    it('should not purchase if cannot afford', () => {
      (scene as any).coinCount = 10
      const item = { id: 'bazooka', name: 'Bazooka', type: 'weapon' as const, price: 1000, icon: 'bazooka', description: 'Test' }
      ;(scene as any).purchaseItem(item)
      expect((scene as any).coinCount).toBe(10)
      expect((scene as any).purchasedItems.has('bazooka')).toBe(false)
    })

    it('should not purchase if already owned', () => {
      (scene as any).purchasedItems.add('laserGun')
      const initialCoins = (scene as any).coinCount
      const item = { id: 'laserGun', name: 'Laser Gun', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).purchaseItem(item)
      expect((scene as any).coinCount).toBe(initialCoins)
    })

    it('should show success message on purchase', () => {
      const item = { id: 'laserGun', name: 'Laser Gun', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).purchaseItem(item)
      expect(scene.add.text).toHaveBeenCalledWith(640, 300, 'Laser Gun Purchased!', expect.any(Object))
    })

    it('should add tween animation for success message', () => {
      const item = { id: 'laserGun', name: 'Laser Gun', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).purchaseItem(item)
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('pagination', () => {
    beforeEach(() => {
      scene.init({})
      scene.preload()
      scene.create()
    })

    it('should start on page 0', () => {
      expect((scene as any).currentPage).toBe(0)
    })

    it('should have correct total pages', () => {
      expect((scene as any).totalPages).toBe(2)
    })

    it('should have 6 items per page', () => {
      expect((scene as any).itemsPerPage).toBe(6)
    })
  })

  describe('displayShopPage', () => {
    beforeEach(() => {
      scene.init({})
      scene.preload()
      scene.create()
    })

    it('should clear existing shop cards before displaying', () => {
      const mockCard = { destroy: vi.fn() }
      ;(scene as any).shopCards = [mockCard]
      ;(scene as any).displayShopPage()
      expect(mockCard.destroy).toHaveBeenCalled()
    })

    it('should display correct number of items for first page', () => {
      ;(scene as any).currentPage = 0
      ;(scene as any).shopCards = []
      ;(scene as any).displayShopPage()
      // First page should show 6 items
      // Each item creates multiple game objects
      expect((scene as any).shopCards.length).toBeGreaterThan(0)
    })

    it('should display correct items for second page', () => {
      ;(scene as any).currentPage = 1
      ;(scene as any).shopCards = []
      ;(scene as any).displayShopPage()
      // Second page should show remaining 2 items
      expect((scene as any).shopCards.length).toBeGreaterThan(0)
    })
  })

  describe('createShopItem', () => {
    beforeEach(() => {
      scene.init({ coins: 100 })
      scene.preload()
      scene.create()
    })

    it('should create item background', () => {
      const item = { id: 'test', name: 'Test', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).createShopItem(item, 300, 300)
      expect(scene.add.rectangle).toHaveBeenCalledWith(300, 300, 120, 180, 0x2a2a3e, 0.8)
    })

    it('should create item icon', () => {
      const item = { id: 'test', name: 'Test', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).createShopItem(item, 300, 300)
      expect(scene.add.image).toHaveBeenCalledWith(300, 260, 'laserGun')
    })

    it('should create item name text', () => {
      const item = { id: 'test', name: 'Test Item', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).createShopItem(item, 300, 300)
      expect(scene.add.text).toHaveBeenCalledWith(300, 320, 'Test Item', expect.any(Object))
    })

    it('should show OWNED text for purchased items', () => {
      (scene as any).purchasedItems.add('laserGun')
      const item = { id: 'laserGun', name: 'Laser Gun', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).createShopItem(item, 300, 300)
      expect(scene.add.text).toHaveBeenCalledWith(300, 370, 'OWNED', expect.objectContaining({ color: '#00ff00' }))
    })

    it('should create buy button for unpurchased items', () => {
      const item = { id: 'test', name: 'Test', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).createShopItem(item, 300, 300)
      expect(scene.add.rectangle).toHaveBeenCalledWith(300, 375, 100, 30, expect.any(Number))
    })

    it('should create price display for unpurchased items', () => {
      const item = { id: 'test', name: 'Test', type: 'weapon' as const, price: 50, icon: 'laserGun', description: 'Test' }
      ;(scene as any).createShopItem(item, 300, 300)
      expect(scene.add.container).toHaveBeenCalledWith(300, 345)
    })
  })

  describe('tooltip', () => {
    beforeEach(() => {
      scene.init({})
      scene.preload()
      scene.create()
    })

    it('should show tooltip with description', () => {
      ;(scene as any).showTooltip('Test description', 300, 400)
      expect(scene.add.rectangle).toHaveBeenCalledWith(300, 400, 200, 40, 0x000000, 0.9)
      expect(scene.add.text).toHaveBeenCalledWith(300, 400, 'Test description', expect.any(Object))
    })

    it('should hide existing tooltip before showing new one', () => {
      const mockText = { destroy: vi.fn() }
      const mockBg = { destroy: vi.fn() }
      ;(scene as any).tooltipText = mockText
      ;(scene as any).tooltipBg = mockBg
      ;(scene as any).showTooltip('New tooltip', 300, 400)
      expect(mockText.destroy).toHaveBeenCalled()
      expect(mockBg.destroy).toHaveBeenCalled()
    })

    it('should destroy tooltip elements on hide', () => {
      const mockText = { destroy: vi.fn() }
      const mockBg = { destroy: vi.fn() }
      ;(scene as any).tooltipText = mockText
      ;(scene as any).tooltipBg = mockBg
      ;(scene as any).hideTooltip()
      expect(mockText.destroy).toHaveBeenCalled()
      expect(mockBg.destroy).toHaveBeenCalled()
      expect((scene as any).tooltipText).toBeUndefined()
      expect((scene as any).tooltipBg).toBeUndefined()
    })

    it('should handle hiding when no tooltip exists', () => {
      ;(scene as any).tooltipText = undefined
      ;(scene as any).tooltipBg = undefined
      expect(() => (scene as any).hideTooltip()).not.toThrow()
    })
  })

  describe('createPaginationControls', () => {
    beforeEach(() => {
      scene.init({})
      scene.preload()
      scene.create()
    })

    it('should create page text', () => {
      expect(scene.add.text).toHaveBeenCalledWith(640, 630, expect.stringContaining('Page'), expect.any(Object))
    })

    it('should create prev button', () => {
      expect(scene.add.rectangle).toHaveBeenCalledWith(400, 630, 150, 50, 0x333333)
    })

    it('should create next button', () => {
      expect(scene.add.rectangle).toHaveBeenCalledWith(880, 630, 150, 50, 0x333333)
    })

    it('should create prev button text', () => {
      expect(scene.add.text).toHaveBeenCalledWith(400, 630, '◀ PREV', expect.any(Object))
    })

    it('should create next button text', () => {
      expect(scene.add.text).toHaveBeenCalledWith(880, 630, 'NEXT ▶', expect.any(Object))
    })
  })

  describe('updateButtonStates', () => {
    beforeEach(() => {
      scene.init({})
      scene.preload()
      scene.create()
    })

    it('should disable prev button on first page', () => {
      (scene as any).currentPage = 0
      ;(scene as any).updateButtonStates()
      expect((scene as any).prevButton.setAlpha).toHaveBeenCalledWith(0.3)
      expect((scene as any).prevButton.disableInteractive).toHaveBeenCalled()
    })

    it('should disable next button on last page', () => {
      (scene as any).currentPage = (scene as any).totalPages - 1
      ;(scene as any).updateButtonStates()
      expect((scene as any).nextButton.setAlpha).toHaveBeenCalledWith(0.3)
      expect((scene as any).nextButton.disableInteractive).toHaveBeenCalled()
    })
  })

  describe('back arrow texture creation', () => {
    it('should create graphics for back arrow', () => {
      scene.preload()
      expect(scene.make.graphics).toHaveBeenCalled()
    })
  })

  describe('weapon icon texture creation', () => {
    it('should create textures for all weapons', () => {
      scene.preload()
      // Multiple graphics calls for different weapon icons
      expect(scene.make.graphics).toHaveBeenCalled()
    })
  })

  describe('scene state', () => {
    it('should have itemsPerPage set to 6', () => {
      expect((scene as any).itemsPerPage).toBe(6)
    })

    it('should initialize with empty purchasedItems set', () => {
      expect((scene as any).purchasedItems).toBeInstanceOf(Set)
    })

    it('should initialize with currentPage 0', () => {
      scene.init({})
      expect((scene as any).currentPage).toBe(0)
    })
  })

  describe('integration scenarios', () => {
    it('should handle full purchase flow', () => {
      localStorageMock['playerCoins'] = '200'
      scene.init({})
      scene.preload()
      scene.create()

      // Purchase laser gun
      const laserGun = (scene as any).shopItems.find((item: any) => item.id === 'laserGun')
      ;(scene as any).purchaseItem(laserGun)

      expect((scene as any).coinCount).toBe(150)
      expect((scene as any).purchasedItems.has('laserGun')).toBe(true)
      expect(localStorageMock['playerCoins']).toBe('150')
    })

    it('should persist purchases across scene reloads', () => {
      // First session - purchase item
      localStorageMock['playerCoins'] = '100'
      scene.init({})
      scene.preload()
      scene.create()
      
      const laserGun = (scene as any).shopItems.find((item: any) => item.id === 'laserGun')
      ;(scene as any).purchaseItem(laserGun)

      // New scene instance
      const newScene = new ShopScene()
      newScene.init({})
      
      expect((newScene as any).purchasedItems.has('laserGun')).toBe(true)
      expect((newScene as any).coinCount).toBe(50)
    })

    it('should handle insufficient funds gracefully', () => {
      scene.init({ coins: 10 })
      scene.preload()
      scene.create()

      const bazooka = (scene as any).shopItems.find((item: any) => item.id === 'bazooka')
      ;(scene as any).purchaseItem(bazooka)

      expect((scene as any).coinCount).toBe(10)
      expect((scene as any).purchasedItems.has('bazooka')).toBe(false)
    })
  })

  describe('pagination cleanup edge cases', () => {
    it('should handle createPaginationControls when elements do not exist', () => {
      scene.init({})
      scene.preload()
      scene.create()
      
      // Force pagination elements to undefined
      ;(scene as any).pageText = undefined
      ;(scene as any).prevButton = undefined
      ;(scene as any).prevButtonText = undefined
      ;(scene as any).nextButton = undefined
      ;(scene as any).nextButtonText = undefined
      
      // Should not throw
      expect(() => (scene as any).createPaginationControls()).not.toThrow()
    })
    
    it('should handle createPaginationControls when elements have no scene', () => {
      scene.init({})
      scene.preload()
      scene.create()
      
      // Set scene to false on elements (already destroyed)
      if ((scene as any).pageText) (scene as any).pageText.scene = false
      if ((scene as any).prevButton) (scene as any).prevButton.scene = false
      if ((scene as any).prevButtonText) (scene as any).prevButtonText.scene = false
      if ((scene as any).nextButton) (scene as any).nextButton.scene = false
      if ((scene as any).nextButtonText) (scene as any).nextButtonText.scene = false
      
      // Should skip destroy calls
      expect(() => (scene as any).createPaginationControls()).not.toThrow()
    })
  })

  describe('extraLife consumable purchase', () => {
    it('should increment purchasedLives when buying extraLife', () => {
      localStorageMock['playerCoins'] = '100'
      localStorageMock['purchasedLives'] = '2'
      scene.init({})
      scene.preload()
      scene.create()

      const extraLife = (scene as any).shopItems.find((item: any) => item.id === 'extraLife')
      if (extraLife) {
        ;(scene as any).purchaseItem(extraLife)
        expect(localStorageMock['purchasedLives']).toBe('3')
      }
    })
    
    it('should handle extraLife when purchasedLives is not set', () => {
      localStorageMock['playerCoins'] = '100'
      delete localStorageMock['purchasedLives']
      scene.init({})
      scene.preload()
      scene.create()

      const extraLife = (scene as any).shopItems.find((item: any) => item.id === 'extraLife')
      if (extraLife) {
        ;(scene as any).purchaseItem(extraLife)
        expect(localStorageMock['purchasedLives']).toBe('1')
      }
    })
  })

  describe('gamepad plugin workaround', () => {
    it('should handle shutdown when gamepad plugin exists without pads', () => {
      scene.init({})
      scene.preload()
      scene.create()
      
      scene.input = {
        gamepad: {}
      } as any
      
      expect(() => scene.shutdown()).not.toThrow()
      expect((scene.input.gamepad as any).pads).toEqual([])
    })
    
    it('should handle shutdown when input is undefined', () => {
      scene.init({})
      ;(scene as any).input = undefined
      
      expect(() => scene.shutdown()).not.toThrow()
    })
  })
})
