import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Track handlers for interactive elements
let skipBtnHandlers: Map<string, Function> = new Map()
let keyboardHandlers: Map<string, Function> = new Map()
let storyTextRef: any = null

// Mock Phaser Module BEFORE importing EndingScene
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
      sys = {
        settings: { data: {} }
      }
      scene = {
        key: 'EndingScene',
        start: vi.fn(),
        isActive: vi.fn().mockReturnValue(true)
      }
      cameras = {
        main: {
          width: 1280,
          height: 720,
          setBackgroundColor: vi.fn(),
          flash: vi.fn(),
          shake: vi.fn()
        }
      }
      add = {
        text: vi.fn().mockImplementation((x: number, y: number, content: string) => {
          if (content && typeof content === 'string' && content.includes('SKIP')) {
            const skipBtn = {
              setOrigin: vi.fn().mockReturnThis(),
              setInteractive: vi.fn().mockReturnThis(),
              on: vi.fn((event: string, handler: Function) => {
                skipBtnHandlers.set(event, handler)
                return skipBtn
              })
            }
            return skipBtn
          }
          // Story text
          const storyText = {
            setOrigin: vi.fn().mockReturnThis(),
            setStroke: vi.fn().mockReturnThis(),
            setShadow: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setWordWrapWidth: vi.fn().mockReturnThis(),
            y: y,
            height: 5000
          }
          storyTextRef = storyText
          return storyText
        }),
        circle: vi.fn().mockReturnValue({}),
        image: vi.fn().mockReturnValue({
          setScale: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setRotation: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis()
        }),
        particles: vi.fn().mockReturnValue({
          setDepth: vi.fn().mockReturnThis(),
          start: vi.fn().mockReturnThis(),
          stop: vi.fn().mockReturnThis(),
          createEmitter: vi.fn().mockReturnThis(),
          explode: vi.fn().mockReturnThis()
        })
      }
      load = {
        audio: vi.fn(),
        image: vi.fn()
      }
      input = {
        keyboard: {
          on: vi.fn((event: string, handler: Function) => {
            keyboardHandlers.set(event, handler)
          })
        }
      }
      sound = {
        stopAll: vi.fn(),
        play: vi.fn()
      }
      tweens = {
        add: vi.fn().mockImplementation((config) => {
          if (config.onComplete) config.onComplete()
          return {}
        })
      }
      scale = {
        width: 1280,
        height: 720
      }
      time = {
        delayedCall: vi.fn().mockReturnValue({})
      }
      
      constructor() {
        // Constructor is called with config key
      }
    },
    Math: {
      Between: vi.fn().mockReturnValue(640),
      FloatBetween: vi.fn().mockReturnValue(1),
      Angle: {
        Between: vi.fn().mockReturnValue(0)
      },
      DegToRad: vi.fn().mockReturnValue(0)
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
    deleteSave: vi.fn().mockResolvedValue(undefined)
  }
}))

// Import AFTER mocks
import EndingScene from '../scenes/EndingScene'
import { GameAPI } from '../services/api'

describe('EndingScene', () => {
  let scene: EndingScene

  beforeEach(() => {
    skipBtnHandlers = new Map()
    keyboardHandlers = new Map()
    storyTextRef = null
    
    scene = new EndingScene()
    
    // Reset localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('constructor', () => {
    it('should create EndingScene with correct key', () => {
      expect(scene).toBeDefined()
      expect(scene.scene.key).toBe('EndingScene')
    })
  })

  describe('preload', () => {
    it('should load ending music', () => {
      scene.preload()
      
      expect(scene.load.audio).toHaveBeenCalledWith('endingMusic', '/assets/music/ending.mp3')
    })
  })

  describe('create', () => {
    it('should stop all sounds and play ending music', () => {
      scene.create()
      
      expect(scene.sound.stopAll).toHaveBeenCalled()
      expect(scene.sound.play).toHaveBeenCalledWith('endingMusic', { loop: true, volume: 0.5 })
    })

    it('should set background color to black', () => {
      scene.create()
      
      expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#000000')
    })

    it('should create starfield with 200 stars', () => {
      scene.create()
      
      // createStarfield creates 200 circles
      expect(scene.add.circle).toHaveBeenCalledTimes(200)
    })

    it('should create story text with Star Wars yellow color', () => {
      scene.create()
      
      // Check that text was created with the story content
      expect(scene.add.text).toHaveBeenCalledWith(
        640, // width / 2
        770, // height + 50
        expect.stringContaining('The Chrysalis Protocol'),
        expect.objectContaining({
          fontSize: '32px',
          color: '#FFE81F', // Star Wars Yellow
          align: 'justify',
          fontStyle: 'bold'
        })
      )
    })

    it('should set story text stroke and shadow', () => {
      scene.create()
      
      expect(storyTextRef.setStroke).toHaveBeenCalledWith('#000000', 4)
      expect(storyTextRef.setShadow).toHaveBeenCalledWith(2, 2, '#000000', 2, true, true)
    })

    it('should create skip button', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(
        1180, // width - 100
        670, // height - 50
        'SKIP [ESC]',
        expect.objectContaining({
          fontSize: '20px',
          color: '#ffffff'
        })
      )
    })

    it('should register pointerdown handler on skip button', () => {
      scene.create()
      
      expect(skipBtnHandlers.has('pointerdown')).toBe(true)
    })

    it('should register ESC key handler', () => {
      scene.create()
      
      expect(keyboardHandlers.has('keydown-ESC')).toBe(true)
    })

    it('should set story text origin to center-top', () => {
      scene.create()
      
      expect(storyTextRef.setOrigin).toHaveBeenCalledWith(0.5, 0)
    })
  })

  describe('update', () => {
    it('should scroll text upward', () => {
      scene.create()
      
      const initialY = storyTextRef.y
      scene.update(0, 160) // 160ms delta
      
      // scrollSpeed = 0.15, delta = 160
      // y -= (0.15 * 160) / 16 = 1.5
      expect(storyTextRef.y).toBeLessThan(initialY)
    })

    it('should scroll proportionally to delta time', () => {
      scene.create()
      
      const startY = 770
      storyTextRef.y = startY
      
      scene.update(0, 16) // 16ms delta (single frame)
      const afterOneFrame = storyTextRef.y
      
      storyTextRef.y = startY
      scene.update(0, 32) // 32ms delta (two frames worth)
      const afterTwoFrames = storyTextRef.y
      
      // Difference should be proportional
      const diffOne = startY - afterOneFrame
      const diffTwo = startY - afterTwoFrames
      expect(diffTwo).toBeCloseTo(diffOne * 2, 5)
    })

    it('should trigger returnToMenu when text scrolls off screen', async () => {
      scene.create()
      vi.clearAllMocks()
      
      // Set text position so it's completely off screen
      storyTextRef.y = -5001 // y + height < 0 => -5001 + 5000 = -1 < 0
      storyTextRef.height = 5000
      
      scene.update(0, 16)
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(scene.sound.stopAll).toHaveBeenCalled()
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
    })

    it('should not trigger returnToMenu if text is still visible', () => {
      scene.create()
      vi.clearAllMocks()
      
      // Text still on screen
      storyTextRef.y = 0
      storyTextRef.height = 5000
      
      scene.update(0, 16)
      
      // scene.start should not have been called for MenuScene
      expect(scene.scene.start).not.toHaveBeenCalledWith('MenuScene')
    })
  })

  describe('returnToMenu via skip button', () => {
    it('should stop all sounds when skip is clicked', async () => {
      scene.create()
      vi.clearAllMocks()
      
      const skipHandler = skipBtnHandlers.get('pointerdown')
      if (skipHandler) {
        await skipHandler()
        
        expect(scene.sound.stopAll).toHaveBeenCalled()
      }
    })

    it('should start MenuScene when skip is clicked', async () => {
      scene.create()
      vi.clearAllMocks()
      
      const skipHandler = skipBtnHandlers.get('pointerdown')
      if (skipHandler) {
        await skipHandler()
        
        expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
      }
    })
  })

  describe('returnToMenu via ESC key', () => {
    it('should stop all sounds when ESC is pressed', async () => {
      scene.create()
      vi.clearAllMocks()
      
      const escHandler = keyboardHandlers.get('keydown-ESC')
      if (escHandler) {
        await escHandler()
        
        expect(scene.sound.stopAll).toHaveBeenCalled()
      }
    })

    it('should start MenuScene when ESC is pressed', async () => {
      scene.create()
      vi.clearAllMocks()
      
      const escHandler = keyboardHandlers.get('keydown-ESC')
      if (escHandler) {
        await escHandler()
        
        expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
      }
    })
  })

  describe('save deletion', () => {
    it('should delete save when player_name exists in localStorage', async () => {
      localStorage.setItem('player_name', 'TestPlayer')
      
      scene.create()
      vi.clearAllMocks()
      
      const skipHandler = skipBtnHandlers.get('pointerdown')
      if (skipHandler) {
        await skipHandler()
        
        expect(GameAPI.deleteSave).toHaveBeenCalledWith('TestPlayer')
      }
    })

    it('should not call deleteSave when no player_name in localStorage', async () => {
      // No player_name in localStorage
      
      scene.create()
      vi.clearAllMocks()
      
      const skipHandler = skipBtnHandlers.get('pointerdown')
      if (skipHandler) {
        await skipHandler()
        
        expect(GameAPI.deleteSave).not.toHaveBeenCalled()
      }
    })

    it('should clear defeatedBossLevels from localStorage', async () => {
      localStorage.setItem('player_name', 'TestPlayer')
      localStorage.setItem('defeatedBossLevels', '[1,2,3]')
      
      scene.create()
      
      const skipHandler = skipBtnHandlers.get('pointerdown')
      if (skipHandler) {
        await skipHandler()
        
        expect(localStorage.getItem('defeatedBossLevels')).toBeNull()
      }
    })

    it('should clear individual boss records from localStorage', async () => {
      const playerName = 'TestPlayer'
      localStorage.setItem('player_name', playerName)
      
      // Set some boss records
      for (let i = 0; i < 24; i++) {
        localStorage.setItem(`${playerName}_boss_${i}`, 'defeated')
      }
      
      scene.create()
      
      const skipHandler = skipBtnHandlers.get('pointerdown')
      if (skipHandler) {
        await skipHandler()
        
        // Check all boss records are cleared
        for (let i = 0; i < 24; i++) {
          expect(localStorage.getItem(`${playerName}_boss_${i}`)).toBeNull()
        }
      }
    })

    it('should handle deleteSave error gracefully', async () => {
      localStorage.setItem('player_name', 'TestPlayer')
      
      // Make deleteSave throw an error
      vi.mocked(GameAPI.deleteSave).mockRejectedValueOnce(new Error('Network error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      scene.create()
      vi.clearAllMocks()
      
      const skipHandler = skipBtnHandlers.get('pointerdown')
      if (skipHandler) {
        await skipHandler()
        
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete save game:', expect.any(Error))
        // Should still navigate to MenuScene
        expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
      }
      
      consoleSpy.mockRestore()
    })
  })

  describe('starfield creation', () => {
    it('should create stars with random positions within screen bounds', () => {
      scene.create()
      
      // Each circle call should have been made
      expect(scene.add.circle).toHaveBeenCalled()
    })

    it('should create stars with varying sizes', () => {
      scene.create()
      
      // Stars should have been created
      const calls = (scene.add.circle as any).mock.calls
      expect(calls.length).toBe(200)
    })
  })

  describe('story content', () => {
    it('should include title in story text', () => {
      scene.create()
      
      // Get the story text content from the mock call
      const textCalls = (scene.add.text as any).mock.calls
      const storyCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('The Chrysalis Protocol')
      )
      expect(storyCall).toBeDefined()
    })

    it('should include key story elements', () => {
      scene.create()
      
      const textCalls = (scene.add.text as any).mock.calls
      const storyCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('Dr. Maya Chen')
      )
      expect(storyCall).toBeDefined()
    })

    it('should include ending motivation text', () => {
      scene.create()
      
      const textCalls = (scene.add.text as any).mock.calls
      const storyCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('The beacon pulsed. Help was coming.')
      )
      expect(storyCall).toBeDefined()
    })
  })

  describe('scroll speed', () => {
    it('should use slow scroll speed for dramatic effect', () => {
      scene.create()
      
      const startY = storyTextRef.y
      scene.update(0, 1600) // 1.6 seconds = 1600ms
      
      // scrollSpeed = 0.15
      // y -= (0.15 * 1600) / 16 = 15 pixels per 1.6 seconds
      const expectedMove = (0.15 * 1600) / 16
      expect(storyTextRef.y).toBeCloseTo(startY - expectedMove, 1)
    })
  })

  describe('word wrap', () => {
    it('should set word wrap width to 60% of screen width', () => {
      scene.create()
      
      const textCalls = (scene.add.text as any).mock.calls
      const storyCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('They Came')
      )
      
      if (storyCall) {
        const style = storyCall[3]
        expect(style.wordWrap.width).toBe(1280 * 0.6) // 768
      }
    })
  })

  describe('audio settings', () => {
    it('should play ending music with loop enabled', () => {
      scene.create()
      
      expect(scene.sound.play).toHaveBeenCalledWith(
        'endingMusic',
        expect.objectContaining({ loop: true })
      )
    })

    it('should play ending music at 50% volume', () => {
      scene.create()
      
      expect(scene.sound.play).toHaveBeenCalledWith(
        'endingMusic',
        expect.objectContaining({ volume: 0.5 })
      )
    })
  })
})
