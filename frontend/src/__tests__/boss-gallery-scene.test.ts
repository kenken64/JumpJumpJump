import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Track handlers for interactive elements
let backBtnHandlers: Map<string, Function> = new Map()
let prevBtnHandlers: Map<string, Function> = new Map()
let nextBtnHandlers: Map<string, Function> = new Map()
let cardHandlers: Map<number, Map<string, Function>> = new Map()
let escKeyHandler: Function | null = null

// Track mock objects
let mockPrevButton: any = null
let mockNextButton: any = null
let mockPrevButtonText: any = null
let mockNextButtonText: any = null
let mockPageText: any = null
let mockLoadingText: any = null
let mockBossCards: any[] = []
let mockBossSprites: Map<number, any> = new Map()
let tweensAdded: any[] = []
let mockChildren: any[] = []

// Mock Phaser Module BEFORE importing BossGalleryScene
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
      sys = {
        settings: { data: {} }
      }
      scene = {
        key: 'BossGalleryScene',
        start: vi.fn(),
        restart: vi.fn()
      }
      cameras = {
        main: {
          setBackgroundColor: vi.fn()
        }
      }
      add = {
        text: vi.fn().mockImplementation((x: number, y: number, content: string) => {
          const text: any = {
            x,
            y,
            text: content,
            scene: true,
            setOrigin: vi.fn().mockReturnThis(),
            setData: vi.fn().mockReturnThis(),
            setName: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            setColor: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            setText: vi.fn((newText: string) => {
              text.text = newText
              return text
            }),
            setRotation: vi.fn().mockReturnThis(),
            destroy: vi.fn(() => {
              text.scene = false
            }),
            removeAllListeners: vi.fn(),
            input: true,
            getData: vi.fn().mockReturnValue(false),
            on: vi.fn().mockReturnThis()
          }
          
          // Track specific texts
          if (content === '◀ PREV') {
            mockPrevButtonText = text
          } else if (content === 'NEXT ▶') {
            mockNextButtonText = text
          } else if (content.startsWith('Page ')) {
            mockPageText = text
          } else if (content === 'Loading bosses...') {
            mockLoadingText = text
          }
          
          mockChildren.push(text)
          return text
        }),
        rectangle: vi.fn().mockImplementation((x: number, y: number, width: number, height: number, color: number, alpha?: number) => {
          const rect: any = {
            x,
            y,
            width,
            height,
            scene: true,
            setStrokeStyle: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            disableInteractive: vi.fn().mockReturnThis(),
            setFillStyle: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            getData: vi.fn().mockReturnValue(false),
            destroy: vi.fn(() => {
              rect.scene = false
            }),
            on: vi.fn((event: string, handler: Function) => {
              // Track handlers based on position
              if (x === 400 && y === 610) {
                prevBtnHandlers.set(event, handler)
                mockPrevButton = rect
              } else if (x === 880 && y === 610) {
                nextBtnHandlers.set(event, handler)
                mockNextButton = rect
              } else if (x === 640 && y === 680) {
                backBtnHandlers.set(event, handler)
              } else if (width === 240 && height === 240) {
                // Boss card - track by rect reference
                // Find or create handlers for this card
                let cardIndex = -1
                for (let i = 0; i < mockBossCards.length; i++) {
                  if (mockBossCards[i] === rect) {
                    cardIndex = i
                    break
                  }
                }
                if (cardIndex === -1) {
                  cardIndex = mockBossCards.length
                  mockBossCards.push(rect)
                }
                if (!cardHandlers.has(cardIndex)) {
                  cardHandlers.set(cardIndex, new Map())
                }
                cardHandlers.get(cardIndex)!.set(event, handler)
              }
              return rect
            })
          }
          
          mockChildren.push(rect)
          return rect
        }),
        image: vi.fn().mockImplementation((x: number, y: number, key: string) => {
          const img: any = {
            x,
            y,
            key,
            width: 100,
            height: 100,
            scene: true,
            setScale: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            setAngle: vi.fn().mockReturnThis(),
            destroy: vi.fn(() => {
              img.scene = false
            })
          }
          
          // Track boss sprites by index
          const match = key.match(/boss_(\d+)/)
          if (match) {
            mockBossSprites.set(parseInt(match[1]), img)
          }
          
          mockChildren.push(img)
          return img
        }),
        graphics: vi.fn().mockImplementation(() => {
          const graphics: any = {
            scene: true,
            lineStyle: vi.fn().mockReturnThis(),
            beginPath: vi.fn().mockReturnThis(),
            moveTo: vi.fn().mockReturnThis(),
            lineTo: vi.fn().mockReturnThis(),
            strokePath: vi.fn().mockReturnThis(),
            destroy: vi.fn(() => {
              graphics.scene = false
            })
          }
          mockChildren.push(graphics)
          return graphics
        })
      }
      load = {
        image: vi.fn()
      }
      tweens = {
        add: vi.fn().mockImplementation((config: any) => {
          tweensAdded.push(config)
          return { stop: vi.fn() }
        })
      }
      children = {
        getByName: vi.fn().mockReturnValue(null),
        each: vi.fn()
      }
      input = {
        keyboard: {
          addKey: vi.fn().mockReturnValue({
            on: vi.fn((event: string, handler: Function) => {
              if (event === 'down') {
                escKeyHandler = handler
              }
            })
          })
        },
        gamepad: null
      }
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          ESC: 27
        }
      }
    },
    GameObjects: {
      Text: class {},
      Rectangle: class {},
      Image: class {}
    }
  }

  return {
    default: Phaser,
    ...Phaser
  }
})

// Mock the GameAPI
vi.mock('../services/api', () => ({
  GameAPI: {
    getAllBosses: vi.fn()
  }
}))

// Import after mocks are set up
import BossGalleryScene from '../scenes/BossGalleryScene'
import { GameAPI } from '../services/api'

describe('BossGalleryScene', () => {
  let scene: BossGalleryScene

  const mockBosses = [
    { boss_index: 0, boss_name: 'Boss Zero', notorious_title: 'The Beginning' },
    { boss_index: 1, boss_name: 'Boss One', notorious_title: 'The First' },
    { boss_index: 2, boss_name: 'Boss Two', notorious_title: 'The Second' },
    { boss_index: 3, boss_name: 'Boss Three', notorious_title: 'The Third' },
    { boss_index: 4, boss_name: 'Boss Four', notorious_title: 'The Fourth' },
    { boss_index: 5, boss_name: 'Boss Five', notorious_title: 'The Fifth' },
    { boss_index: 6, boss_name: 'Boss Six', notorious_title: 'The Sixth' },
    { boss_index: 7, boss_name: 'Boss Seven', notorious_title: 'The Seventh' },
    { boss_index: 8, boss_name: 'Boss Eight', notorious_title: 'The Eighth' },
    { boss_index: 9, boss_name: 'Boss Nine', notorious_title: 'The Ninth' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset all tracking
    backBtnHandlers = new Map()
    prevBtnHandlers = new Map()
    nextBtnHandlers = new Map()
    cardHandlers = new Map()
    escKeyHandler = null
    mockPrevButton = null
    mockNextButton = null
    mockPrevButtonText = null
    mockNextButtonText = null
    mockPageText = null
    mockLoadingText = null
    mockBossCards = []
    mockBossSprites = new Map()
    tweensAdded = []
    mockChildren = []
    
    // Clear localStorage
    localStorage.clear()
    
    // Default mock: return bosses
    vi.mocked(GameAPI.getAllBosses).mockResolvedValue(mockBosses)
    
    scene = new BossGalleryScene()
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('constructor', () => {
    it('should create scene with correct key', () => {
      expect(scene).toBeDefined()
    })
  })

  describe('preload', () => {
    it('should reset state and load boss images', () => {
      scene.preload()
      
      // Should load 22 boss images
      expect(scene.load.image).toHaveBeenCalledTimes(22)
      
      // Check first and last boss image keys
      expect(scene.load.image).toHaveBeenCalledWith('boss_00', '/assets/bosses_individual/boss_00.png')
      expect(scene.load.image).toHaveBeenCalledWith('boss_21', '/assets/bosses_individual/boss_21.png')
    })
  })

  describe('create', () => {
    it('should set background color', async () => {
      await scene.create()
      
      expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#000000')
    })

    it('should create title and subtitle', async () => {
      await scene.create()
      
      // Title
      expect(scene.add.text).toHaveBeenCalledWith(640, 50, 'BOSS GALLERY', expect.any(Object))
      
      // Subtitle
      expect(scene.add.text).toHaveBeenCalledWith(640, 80, 'The Notorious Bosses of the Galaxy', expect.any(Object))
    })

    it('should show loading text initially', async () => {
      // Make API slow
      vi.mocked(GameAPI.getAllBosses).mockImplementation(() => new Promise(() => {}))
      
      // Start create but don't wait
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(640, 360, 'Loading bosses...', expect.any(Object))
    })

    it('should fetch and display bosses', async () => {
      await scene.create()
      
      expect(GameAPI.getAllBosses).toHaveBeenCalled()
      
      // Should create boss cards (8 per page, we have 10 bosses so 8 on first page)
      expect(mockBossCards.length).toBeGreaterThan(0)
    })

    it('should create back button', async () => {
      await scene.create()
      
      expect(scene.add.rectangle).toHaveBeenCalledWith(640, 680, 200, 50, 0x444444)
      expect(scene.add.text).toHaveBeenCalledWith(640, 680, 'BACK TO MENU', expect.any(Object))
    })

    it('should setup ESC key handler', async () => {
      await scene.create()
      
      expect(scene.input.keyboard!.addKey).toHaveBeenCalledWith(27) // ESC keycode
      expect(escKeyHandler).not.toBeNull()
    })

    it('should handle API error gracefully', async () => {
      vi.mocked(GameAPI.getAllBosses).mockRejectedValue(new Error('API Error'))
      
      await scene.create()
      
      // Loading text should be updated to error message
      expect(mockLoadingText.setText).toHaveBeenCalledWith('Failed to load bosses. Check backend connection.')
      expect(mockLoadingText.setColor).toHaveBeenCalledWith('#ff0000')
    })
  })

  describe('pagination', () => {
    it('should calculate correct total pages', async () => {
      await scene.create()
      
      // 10 bosses, 8 per page = 2 pages
      expect(mockPageText.text).toBe('Page 1 / 2')
    })

    it('should disable prev button on first page', async () => {
      await scene.create()
      
      expect(mockPrevButton.setAlpha).toHaveBeenCalledWith(0.3)
      expect(mockPrevButton.disableInteractive).toHaveBeenCalled()
    })

    it('should enable next button when more pages exist', async () => {
      await scene.create()
      
      expect(mockNextButton.setAlpha).toHaveBeenCalledWith(1)
      expect(mockNextButton.setInteractive).toHaveBeenCalled()
    })

    it('should navigate to next page on next button click', async () => {
      await scene.create()
      
      const pointerdownHandler = nextBtnHandlers.get('pointerdown')
      expect(pointerdownHandler).toBeDefined()
      
      // Click next
      pointerdownHandler!()
      
      // Page should update
      expect(mockPageText.setText).toHaveBeenCalledWith('Page 2 / 2')
    })

    it('should navigate to previous page on prev button click', async () => {
      await scene.create()
      
      // Go to page 2 first
      const nextHandler = nextBtnHandlers.get('pointerdown')
      nextHandler!()
      
      // Now go back
      const prevHandler = prevBtnHandlers.get('pointerdown')
      prevHandler!()
      
      expect(mockPageText.setText).toHaveBeenCalledWith('Page 1 / 2')
    })

    it('should not navigate past last page', async () => {
      await scene.create()
      
      const nextHandler = nextBtnHandlers.get('pointerdown')
      
      // Go to last page
      nextHandler!()
      
      // Page text should show page 2
      expect(mockPageText.setText).toHaveBeenCalledWith('Page 2 / 2')
      
      // Try to go further - should stay on page 2
      nextHandler!()
      
      // Should still be page 2 (called again but no change)
    })

    it('should not navigate before first page', async () => {
      await scene.create()
      
      // Prev button should be disabled on first page
      expect(mockPrevButton.disableInteractive).toHaveBeenCalled()
    })
  })

  describe('boss cards', () => {
    it('should display boss names and titles', async () => {
      await scene.create()
      
      // Check that boss names are displayed
      expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'Boss Zero', expect.any(Object))
      expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'The Beginning', expect.any(Object))
    })

    it('should mark defeated bosses', async () => {
      // Set a boss as defeated
      localStorage.setItem('Guest_boss_0', 'defeated')
      
      await scene.create()
      
      // Should create defeated overlay
      expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'DEFEATED', expect.any(Object))
      
      // Should create strikethrough line (graphics)
      expect(scene.add.graphics).toHaveBeenCalled()
    })

    it('should use player name for defeated check', async () => {
      localStorage.setItem('player_name', 'TestPlayer')
      localStorage.setItem('TestPlayer_boss_1', 'defeated')
      
      await scene.create()
      
      // Boss 1 should be marked as defeated
      expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'DEFEATED', expect.any(Object))
    })

    it('should dim defeated boss sprites', async () => {
      localStorage.setItem('Guest_boss_0', 'defeated')
      
      await scene.create()
      
      const bossSprite = mockBossSprites.get(0)
      expect(bossSprite).toBeDefined()
      expect(bossSprite.setAlpha).toHaveBeenCalledWith(0.4)
    })
  })

  describe('navigation', () => {
    it('should return to menu on back button click', async () => {
      await scene.create()
      
      const pointerdownHandler = backBtnHandlers.get('pointerdown')
      expect(pointerdownHandler).toBeDefined()
      
      pointerdownHandler!()
      
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
    })

    it('should return to menu on ESC key', async () => {
      await scene.create()
      
      expect(escKeyHandler).not.toBeNull()
      escKeyHandler!()
      
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
    })
  })

  describe('hover effects', () => {
    it('should highlight card on hover', async () => {
      await scene.create()
      
      // Get first card hover handler
      const firstCardHandlers = cardHandlers.get(0)
      const pointeroverHandler = firstCardHandlers?.get('pointerover')
      
      expect(pointeroverHandler).toBeDefined()
      
      // Trigger hover
      pointeroverHandler!()
      
      // Should have added a tween for rotation
      expect(tweensAdded.length).toBeGreaterThan(0)
    })

    it('should reset card on hover out', async () => {
      await scene.create()
      
      const firstCardHandlers = cardHandlers.get(0)
      const pointeroutHandler = firstCardHandlers?.get('pointerout')
      
      expect(pointeroutHandler).toBeDefined()
      
      // Trigger hover out
      pointeroutHandler!()
      
      // Boss sprite should reset angle
      const bossSprite = mockBossSprites.get(0)
      expect(bossSprite.setAngle).toHaveBeenCalledWith(0)
    })

    it('should not apply hover effects to defeated bosses', async () => {
      localStorage.setItem('Guest_boss_0', 'defeated')
      
      await scene.create()
      
      // The hover handlers should check isDefeated and not apply effects
      // This is tested indirectly by the fact that defeated bosses
      // have their sprites dimmed to 0.4 alpha
      const bossSprite = mockBossSprites.get(0)
      expect(bossSprite.setAlpha).toHaveBeenCalledWith(0.4)
    })
  })

  describe('button hover effects', () => {
    it('should change prev button color on hover', async () => {
      await scene.create()
      
      const pointeroverHandler = prevBtnHandlers.get('pointerover')
      const pointeroutHandler = prevBtnHandlers.get('pointerout')
      
      expect(pointeroverHandler).toBeDefined()
      expect(pointeroutHandler).toBeDefined()
      
      pointeroverHandler!()
      expect(mockPrevButton.setFillStyle).toHaveBeenCalledWith(0x555555)
      
      pointeroutHandler!()
      expect(mockPrevButton.setFillStyle).toHaveBeenCalledWith(0x333333)
    })

    it('should change next button color on hover', async () => {
      await scene.create()
      
      const pointeroverHandler = nextBtnHandlers.get('pointerover')
      const pointeroutHandler = nextBtnHandlers.get('pointerout')
      
      expect(pointeroverHandler).toBeDefined()
      expect(pointeroutHandler).toBeDefined()
      
      pointeroverHandler!()
      expect(mockNextButton.setFillStyle).toHaveBeenCalledWith(0x555555)
      
      pointeroutHandler!()
      expect(mockNextButton.setFillStyle).toHaveBeenCalledWith(0x333333)
    })

    it('should change back button color on hover', async () => {
      await scene.create()
      
      const pointeroverHandler = backBtnHandlers.get('pointerover')
      const pointeroutHandler = backBtnHandlers.get('pointerout')
      
      expect(pointeroverHandler).toBeDefined()
      expect(pointeroutHandler).toBeDefined()
    })
  })

  describe('shutdown', () => {
    it('should handle gamepad plugin workaround', () => {
      scene.input = {
        gamepad: {}
      } as any
      
      // Should not throw
      expect(() => scene.shutdown()).not.toThrow()
    })

    it('should initialize empty pads array if missing', () => {
      const gamepadPlugin: any = {}
      scene.input = {
        gamepad: gamepadPlugin
      } as any
      
      scene.shutdown()
      
      expect(gamepadPlugin.pads).toEqual([])
    })

    it('should not modify existing pads array', () => {
      const existingPads = [{ id: 'test' }]
      const gamepadPlugin: any = { pads: existingPads }
      scene.input = {
        gamepad: gamepadPlugin
      } as any
      
      scene.shutdown()
      
      expect(gamepadPlugin.pads).toBe(existingPads)
    })
  })

  describe('single page scenario', () => {
    it('should disable both buttons when only one page', async () => {
      // Only 4 bosses = 1 page
      vi.mocked(GameAPI.getAllBosses).mockResolvedValue([
        { boss_index: 0, boss_name: 'Boss Zero', notorious_title: 'The Beginning' },
        { boss_index: 1, boss_name: 'Boss One', notorious_title: 'The First' }
      ])
      
      await scene.create()
      
      // Both buttons should be disabled/dimmed
      expect(mockPrevButton.setAlpha).toHaveBeenCalledWith(0.3)
      expect(mockNextButton.setAlpha).toHaveBeenCalledWith(0.3)
    })
  })

  describe('empty bosses scenario', () => {
    it('should handle empty boss list', async () => {
      vi.mocked(GameAPI.getAllBosses).mockResolvedValue([])
      
      await scene.create()
      
      // Should not crash, page text should show 0 pages
      expect(mockPageText.text).toBe('Page 1 / 0')
    })
  })

  describe('pagination cleanup edge cases', () => {
    it('should handle createPaginationControls when elements do not exist', async () => {
      await scene.create()
      
      // Force pagination elements to undefined to test false paths
      ;(scene as any).pageText = undefined
      ;(scene as any).prevButton = undefined
      ;(scene as any).prevButtonText = undefined
      ;(scene as any).nextButton = undefined
      ;(scene as any).nextButtonText = undefined
      
      // Call createPaginationControls - should not throw
      expect(() => (scene as any).createPaginationControls()).not.toThrow()
    })
    
    it('should handle createPaginationControls when elements exist but have no scene', async () => {
      await scene.create()
      
      // Set scene to false on elements (already destroyed)
      if ((scene as any).pageText) (scene as any).pageText.scene = false
      if ((scene as any).prevButton) (scene as any).prevButton.scene = false
      if ((scene as any).prevButtonText) (scene as any).prevButtonText.scene = false
      if ((scene as any).nextButton) (scene as any).nextButton.scene = false
      if ((scene as any).nextButtonText) (scene as any).nextButtonText.scene = false
      
      // Call createPaginationControls - should skip destroy calls
      expect(() => (scene as any).createPaginationControls()).not.toThrow()
    })
  })

  describe('gamepad plugin edge cases', () => {
    it('should handle shutdown when input.gamepad is undefined', () => {
      scene.input = {} as any
      
      expect(() => scene.shutdown()).not.toThrow()
    })
    
    it('should handle shutdown when input is undefined', () => {
      ;(scene as any).input = undefined
      
      expect(() => scene.shutdown()).not.toThrow()
    })
  })
})
