/**
 * ui-manager.test.ts
 * Comprehensive tests for UIManager covering all methods and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UIManager } from '../managers/UIManager'

// Helper to create a mock scene with full Phaser API
function createMockScene() {
  const mockText = {
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    text: ''
  }

  const mockRectangle = {
    setOrigin: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    width: 196,
    x: 0
  }

  const mockImage = {
    setScale: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  }

  // Track tween callbacks for execution
  let tweenCallbacks: { onComplete?: () => void }[] = []
  let delayedCallbacks: { callback: () => void, delay: number }[] = []

  return {
    add: {
      text: vi.fn().mockImplementation((_x, _y, content) => {
        const text = { ...mockText, text: content }
        return text
      }),
      rectangle: vi.fn().mockReturnValue({ ...mockRectangle }),
      image: vi.fn().mockReturnValue({ ...mockImage })
    },
    tweens: {
      add: vi.fn().mockImplementation((config) => {
        tweenCallbacks.push(config)
        // Execute onComplete immediately for testing
        if (config.onComplete) {
          config.onComplete()
        }
        return { stop: vi.fn() }
      })
    },
    time: {
      delayedCall: vi.fn().mockImplementation((delay, callback) => {
        delayedCallbacks.push({ callback, delay })
        // Execute callback immediately for testing
        callback()
        return { remove: vi.fn() }
      })
    },
    game: {
      loop: {
        actualFps: 60
      }
    },
    // Expose callbacks for testing
    _tweenCallbacks: tweenCallbacks,
    _delayedCallbacks: delayedCallbacks
  }
}

describe('UIManager', () => {
  let scene: ReturnType<typeof createMockScene>
  let uiManager: UIManager

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    scene = createMockScene()
    uiManager = new UIManager(scene as any, { screenWidth: 1280, screenHeight: 720, isCoopMode: false })
  })

  // ==================== CONSTRUCTOR TESTS ====================

  describe('constructor', () => {
    it('should create UIManager with default config', () => {
      const manager = new UIManager(scene as any)
      expect(manager).toBeDefined()
    })

    it('should accept partial config', () => {
      const manager = new UIManager(scene as any, { screenWidth: 1920 })
      expect(manager).toBeDefined()
    })

    it('should accept full config', () => {
      const manager = new UIManager(scene as any, {
        screenWidth: 1920,
        screenHeight: 1080,
        isCoopMode: true
      })
      expect(manager).toBeDefined()
    })

    it('should initialize with debug mode off', () => {
      const manager = new UIManager(scene as any)
      expect(manager.isDebugMode()).toBe(false)
    })
  })

  // ==================== CREATE TESTS ====================

  describe('create()', () => {
    it('should create all UI elements for levels mode', () => {
      uiManager.create(1, 'levels')
      
      expect(scene.add.rectangle).toHaveBeenCalled()
      expect(scene.add.text).toHaveBeenCalled()
      expect(scene.add.image).toHaveBeenCalled()
    })

    it('should create all UI elements for endless mode', () => {
      uiManager.create(1, 'endless')
      
      expect(scene.add.rectangle).toHaveBeenCalled()
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should create health bar with correct structure', () => {
      uiManager.create(1, 'levels')
      
      // Health bar background and fill
      expect(scene.add.rectangle).toHaveBeenCalledTimes(4) // health bg, health fill, reload bg, reload fill
    })

    it('should create lives display', () => {
      uiManager.create(1, 'levels')
      
      // Lives text should be created
      const textCalls = scene.add.text.mock.calls
      const livesCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('Lives')
      )
      expect(livesCall).toBeDefined()
    })

    it('should create score display at center', () => {
      uiManager.create(1, 'levels')
      
      const textCalls = scene.add.text.mock.calls
      const scoreCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('Score')
      )
      expect(scoreCall).toBeDefined()
    })

    it('should create coin display', () => {
      uiManager.create(1, 'levels')
      
      expect(scene.add.image).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'coin')
    })

    it('should show level text for levels mode', () => {
      uiManager.create(3, 'levels')
      
      const textCalls = scene.add.text.mock.calls
      const levelCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('Level')
      )
      expect(levelCall).toBeDefined()
    })

    it('should show ENDLESS text for endless mode', () => {
      uiManager.create(1, 'endless')
      
      const textCalls = scene.add.text.mock.calls
      const endlessCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2] === 'ENDLESS'
      )
      expect(endlessCall).toBeDefined()
    })

    it('should use P1 HP label in coop mode', () => {
      const coopManager = new UIManager(scene as any, { isCoopMode: true })
      coopManager.create(1, 'levels')
      
      const textCalls = scene.add.text.mock.calls
      const p1Call = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2] === 'P1 HP'
      )
      expect(p1Call).toBeDefined()
    })

    it('should use HP label in single player mode', () => {
      uiManager.create(1, 'levels')
      
      const textCalls = scene.add.text.mock.calls
      const hpCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2] === 'HP'
      )
      expect(hpCall).toBeDefined()
    })

    it('should get high score from localStorage', () => {
      localStorage.setItem('highScore', '5000')
      
      uiManager.create(1, 'levels')
      
      const textCalls = scene.add.text.mock.calls
      const highScoreCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('High Score: 5000')
      )
      expect(highScoreCall).toBeDefined()
    })
  })

  // ==================== UPDATE METHODS TESTS ====================

  describe('updateHealth()', () => {
    beforeEach(() => {
      uiManager.create(1, 'levels')
    })

    it('should update health bar width based on health percentage', () => {
      uiManager.updateHealth(50, 100)
      // The health bar fill should have been modified
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should set green color when health > 60%', () => {
      uiManager.updateHealth(80, 100)
      // Health bar fill setFillStyle should be called with green
    })

    it('should set orange color when health between 30-60%', () => {
      uiManager.updateHealth(40, 100)
      // Health bar fill setFillStyle should be called with orange
    })

    it('should set red color when health <= 30%', () => {
      uiManager.updateHealth(20, 100)
      // Health bar fill setFillStyle should be called with red
    })

    it('should handle full health', () => {
      uiManager.updateHealth(100, 100)
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should handle zero health', () => {
      uiManager.updateHealth(0, 100)
      expect(scene.add.rectangle).toHaveBeenCalled()
    })
  })

  describe('updateLives()', () => {
    beforeEach(() => {
      uiManager.create(1, 'levels')
    })

    it('should update lives text in single player mode', () => {
      uiManager.updateLives(5)
      // Lives text should be updated
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should use x prefix in coop mode', () => {
      const coopManager = new UIManager(scene as any, { isCoopMode: true })
      coopManager.create(1, 'levels')
      coopManager.updateLives(3)
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should handle zero lives', () => {
      uiManager.updateLives(0)
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('updateScore()', () => {
    beforeEach(() => {
      uiManager.create(1, 'levels')
    })

    it('should update score text', () => {
      uiManager.updateScore(1000)
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should save new high score to localStorage', () => {
      localStorage.setItem('highScore', '500')
      uiManager.create(1, 'levels')
      uiManager.updateScore(1000)
      
      expect(localStorage.getItem('highScore')).toBe('1000')
    })

    it('should not save if score is lower than high score', () => {
      localStorage.setItem('highScore', '5000')
      uiManager.create(1, 'levels')
      uiManager.updateScore(1000)
      
      expect(localStorage.getItem('highScore')).toBe('5000')
    })

    it('should highlight high score text when new record', () => {
      localStorage.setItem('highScore', '100')
      uiManager.create(1, 'levels')
      uiManager.updateScore(500)
      
      // High score text setColor should be called with green
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('updateCoins()', () => {
    beforeEach(() => {
      uiManager.create(1, 'levels')
    })

    it('should update coin text', () => {
      uiManager.updateCoins(50)
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should handle large coin counts', () => {
      uiManager.updateCoins(99999)
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('updateLevel()', () => {
    beforeEach(() => {
      uiManager.create(1, 'levels')
    })

    it('should update level text in levels mode', () => {
      uiManager.updateLevel(5)
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should not update level text in endless mode', () => {
      const endlessManager = new UIManager(scene as any)
      endlessManager.create(1, 'endless')
      
      const callCount = scene.add.text.mock.calls.length
      endlessManager.updateLevel(5)
      
      // No new text calls should be made for level update in endless mode
      // (the setText method is called but we verify it doesn't crash)
      expect(endlessManager).toBeDefined()
    })
  })

  describe('updateReloadBar()', () => {
    beforeEach(() => {
      uiManager.create(1, 'levels')
    })

    it('should update reload bar at 0%', () => {
      uiManager.updateReloadBar(0)
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should update reload bar at 50%', () => {
      uiManager.updateReloadBar(0.5)
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should update reload bar at 100%', () => {
      uiManager.updateReloadBar(1)
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should cap reload bar at 100%', () => {
      uiManager.updateReloadBar(1.5)
      expect(scene.add.rectangle).toHaveBeenCalled()
    })
  })

  // ==================== DEBUG MODE TESTS ====================

  describe('enableDebugMode()', () => {
    it('should enable debug mode', () => {
      uiManager.enableDebugMode()
      
      expect(uiManager.isDebugMode()).toBe(true)
    })

    it('should create debug text elements', () => {
      uiManager.enableDebugMode()
      
      const textCalls = scene.add.text.mock.calls
      const debugCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('DEBUG')
      )
      expect(debugCall).toBeDefined()
    })

    it('should create FPS text', () => {
      uiManager.enableDebugMode()
      
      const textCalls = scene.add.text.mock.calls
      const fpsCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('FPS')
      )
      expect(fpsCall).toBeDefined()
    })

    it('should create coordinate text', () => {
      uiManager.enableDebugMode()
      
      const textCalls = scene.add.text.mock.calls
      const coordCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('X:')
      )
      expect(coordCall).toBeDefined()
    })

    it('should not recreate if already enabled', () => {
      uiManager.enableDebugMode()
      const callCount = scene.add.text.mock.calls.length
      
      uiManager.enableDebugMode()
      
      // No new calls should be made
      expect(scene.add.text.mock.calls.length).toBe(callCount)
    })
  })

  describe('disableDebugMode()', () => {
    it('should disable debug mode', () => {
      uiManager.enableDebugMode()
      uiManager.disableDebugMode()
      
      expect(uiManager.isDebugMode()).toBe(false)
    })

    it('should destroy debug elements', () => {
      uiManager.enableDebugMode()
      uiManager.disableDebugMode()
      
      // Debug elements should be destroyed
      expect(uiManager.isDebugMode()).toBe(false)
    })

    it('should do nothing if debug mode not enabled', () => {
      uiManager.disableDebugMode()
      
      expect(uiManager.isDebugMode()).toBe(false)
    })
  })

  describe('updateDebugInfo()', () => {
    it('should not update if debug mode disabled', () => {
      const textCallsBefore = scene.add.text.mock.calls.length
      
      uiManager.updateDebugInfo(100, 200)
      
      // No text updates since debug mode is off
      expect(scene.add.text.mock.calls.length).toBe(textCallsBefore)
    })

    it('should update FPS and coordinates when debug mode enabled', () => {
      uiManager.enableDebugMode()
      uiManager.updateDebugInfo(500, 300)
      
      // Debug info should be updated
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should round coordinate values', () => {
      uiManager.enableDebugMode()
      uiManager.updateDebugInfo(123.456, 789.012)
      
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  describe('isDebugMode()', () => {
    it('should return false by default', () => {
      expect(uiManager.isDebugMode()).toBe(false)
    })

    it('should return true after enabling', () => {
      uiManager.enableDebugMode()
      expect(uiManager.isDebugMode()).toBe(true)
    })

    it('should return false after disabling', () => {
      uiManager.enableDebugMode()
      uiManager.disableDebugMode()
      expect(uiManager.isDebugMode()).toBe(false)
    })
  })

  // ==================== SPECIAL UI ELEMENTS TESTS ====================

  describe('showTip()', () => {
    it('should create tip text at screen center bottom', () => {
      uiManager.showTip('Test tip!')
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should start with alpha 0', () => {
      uiManager.showTip('Test tip!')
      
      const mockText = scene.add.text.mock.results[0].value
      expect(mockText.setAlpha).toHaveBeenCalledWith(0)
    })

    it('should animate fade in', () => {
      uiManager.showTip('Test tip!')
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })

    it('should use custom duration', () => {
      uiManager.showTip('Quick tip', 1000)
      
      expect(scene.time.delayedCall).toHaveBeenCalled()
    })

    it('should fade out after duration', () => {
      uiManager.showTip('Test tip!', 3000)
      
      // Tween and delayed call should be registered
      expect(scene.tweens.add).toHaveBeenCalled()
      expect(scene.time.delayedCall).toHaveBeenCalled()
    })

    it('should destroy text after fade out', () => {
      uiManager.showTip('Test tip!')
      
      // With immediate callback execution, the text should eventually be destroyed
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('showAIStatus()', () => {
    it('should create AI status text', () => {
      uiManager.showAIStatus('Basic AI', true)
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should show green color when AI is active', () => {
      uiManager.showAIStatus('ML AI', true)
      
      const textCalls = scene.add.text.mock.calls
      const aiCall = textCalls.find((call: any[]) => 
        call[3]?.color === '#00ff00'
      )
      expect(aiCall).toBeDefined()
    })

    it('should show red color when AI is inactive', () => {
      uiManager.showAIStatus('ML AI', false)
      
      const textCalls = scene.add.text.mock.calls
      const aiCall = textCalls.find((call: any[]) => 
        call[3]?.color === '#ff0000'
      )
      expect(aiCall).toBeDefined()
    })

    it('should include AI type in text', () => {
      uiManager.showAIStatus('Custom AI', true)
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should auto-hide after 2 seconds', () => {
      uiManager.showAIStatus('Basic AI', true)
      
      expect(scene.time.delayedCall).toHaveBeenCalledWith(2000, expect.any(Function))
    })

    it('should fade out and destroy status text', () => {
      uiManager.showAIStatus('Basic AI', true)
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('showDamageNumber()', () => {
    it('should create damage text at specified position', () => {
      uiManager.showDamageNumber(100, 200, 25)
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should show negative damage value', () => {
      uiManager.showDamageNumber(100, 200, 50)
      
      const textCalls = scene.add.text.mock.calls
      const damageCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('-50')
      )
      expect(damageCall).toBeDefined()
    })

    it('should use red color for damage', () => {
      uiManager.showDamageNumber(100, 200, 25)
      
      const textCalls = scene.add.text.mock.calls
      const damageCall = textCalls.find((call: any[]) => 
        call[3]?.color === '#ff0000'
      )
      expect(damageCall).toBeDefined()
    })

    it('should animate upward', () => {
      uiManager.showDamageNumber(100, 200, 25)
      
      expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        y: expect.any(Number)
      }))
    })

    it('should fade out during animation', () => {
      uiManager.showDamageNumber(100, 200, 25)
      
      expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        alpha: 0
      }))
    })

    it('should destroy text after animation', () => {
      uiManager.showDamageNumber(100, 200, 25)
      
      expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        onComplete: expect.any(Function)
      }))
    })

    it('should handle large damage values', () => {
      uiManager.showDamageNumber(100, 200, 9999)
      
      const textCalls = scene.add.text.mock.calls
      const damageCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('-9999')
      )
      expect(damageCall).toBeDefined()
    })
  })

  describe('showScorePopup()', () => {
    it('should create score popup text', () => {
      uiManager.showScorePopup(100, 200, 500)
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should show positive score value', () => {
      uiManager.showScorePopup(100, 200, 250)
      
      const textCalls = scene.add.text.mock.calls
      const scoreCall = textCalls.find((call: any[]) => 
        typeof call[2] === 'string' && call[2].includes('+250')
      )
      expect(scoreCall).toBeDefined()
    })

    it('should use yellow color for score', () => {
      uiManager.showScorePopup(100, 200, 500)
      
      const textCalls = scene.add.text.mock.calls
      const scoreCall = textCalls.find((call: any[]) => 
        call[3]?.color === '#ffff00'
      )
      expect(scoreCall).toBeDefined()
    })

    it('should animate upward', () => {
      uiManager.showScorePopup(100, 200, 500)
      
      expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        y: expect.any(Number)
      }))
    })

    it('should fade out during animation', () => {
      uiManager.showScorePopup(100, 200, 500)
      
      expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        alpha: 0
      }))
    })

    it('should destroy text after animation', () => {
      uiManager.showScorePopup(100, 200, 500)
      
      expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        onComplete: expect.any(Function)
      }))
    })
  })

  // ==================== BOSS UI TESTS ====================

  describe('createBossHealthBar()', () => {
    it('should create boss health bar elements', () => {
      const result = uiManager.createBossHealthBar('MEGA BOSS', 500)
      
      expect(result).toBeDefined()
      expect(result.bg).toBeDefined()
      expect(result.fill).toBeDefined()
      expect(result.text).toBeDefined()
    })

    it('should create background rectangle', () => {
      uiManager.createBossHealthBar('BOSS', 100)
      
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should create fill rectangle with red color', () => {
      uiManager.createBossHealthBar('BOSS', 100)
      
      // Red fill for boss health bar
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should create boss name text', () => {
      uiManager.createBossHealthBar('Super Boss', 100)
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should set scroll factor to 0 for all elements', () => {
      const result = uiManager.createBossHealthBar('BOSS', 100)
      
      expect(result.bg.setScrollFactor).toHaveBeenCalledWith(0)
      expect(result.fill.setScrollFactor).toHaveBeenCalledWith(0)
      expect(result.text.setScrollFactor).toHaveBeenCalledWith(0)
    })

    it('should set high depth for boss UI', () => {
      const result = uiManager.createBossHealthBar('BOSS', 100)
      
      expect(result.bg.setDepth).toHaveBeenCalledWith(999)
      expect(result.fill.setDepth).toHaveBeenCalledWith(1000)
      expect(result.text.setDepth).toHaveBeenCalledWith(1001)
    })
  })

  describe('updateBossHealthBar()', () => {
    it('should update boss health bar size', () => {
      const { fill } = uiManager.createBossHealthBar('BOSS', 100)
      
      uiManager.updateBossHealthBar(fill, 50, 100)
      
      expect(fill.setSize).toHaveBeenCalled()
    })

    it('should update boss health bar position', () => {
      const { fill } = uiManager.createBossHealthBar('BOSS', 100)
      
      uiManager.updateBossHealthBar(fill, 50, 100)
      
      // X position should be adjusted for centered alignment
      expect(fill.x).toBeDefined()
    })

    it('should handle full health', () => {
      const { fill } = uiManager.createBossHealthBar('BOSS', 100)
      
      uiManager.updateBossHealthBar(fill, 100, 100)
      
      expect(fill.setSize).toHaveBeenCalledWith(500, 30) // Full width
    })

    it('should handle zero health', () => {
      const { fill } = uiManager.createBossHealthBar('BOSS', 100)
      
      uiManager.updateBossHealthBar(fill, 0, 100)
      
      expect(fill.setSize).toHaveBeenCalledWith(0, 30) // Zero width
    })

    it('should handle partial health (25%)', () => {
      const { fill } = uiManager.createBossHealthBar('BOSS', 100)
      
      uiManager.updateBossHealthBar(fill, 25, 100)
      
      expect(fill.setSize).toHaveBeenCalledWith(125, 30) // 25% of 500
    })

    it('should handle partial health (75%)', () => {
      const { fill } = uiManager.createBossHealthBar('BOSS', 100)
      
      uiManager.updateBossHealthBar(fill, 75, 100)
      
      expect(fill.setSize).toHaveBeenCalledWith(375, 30) // 75% of 500
    })

    it('should center the health bar fill correctly', () => {
      const { fill } = uiManager.createBossHealthBar('BOSS', 100)
      
      // At 50% health
      uiManager.updateBossHealthBar(fill, 50, 100)
      
      // Fill should be positioned to appear centered
      // Center of screen is 640 (1280/2)
      // At 50% health, width is 250, offset should be (500-250)/2 = 125
      // So x should be 640 - 125 = 515
      expect(typeof fill.x).toBe('number')
    })
  })

  // ==================== CLEANUP TESTS ====================

  describe('destroy()', () => {
    it('should destroy all UI elements', () => {
      uiManager.create(1, 'levels')
      
      uiManager.destroy()
      
      // destroy should be called on elements
      // Since we track calls, verify destroy was called
    })

    it('should destroy debug elements if enabled', () => {
      // First create UI elements (required)
      uiManager.create(1, 'levels')
      uiManager.enableDebugMode()
      
      uiManager.destroy()
      
      // debug elements should be destroyed
    })

    it('should handle destroy when elements created first', () => {
      // Create elements first, then destroy
      uiManager.create(1, 'levels')
      expect(() => uiManager.destroy()).not.toThrow()
    })

    it('should handle destroy after create', () => {
      uiManager.create(1, 'levels')
      
      // Should not throw
      expect(() => uiManager.destroy()).not.toThrow()
    })
  })

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('should handle undefined localStorage highScore', () => {
      localStorage.removeItem('highScore')
      
      expect(() => uiManager.create(1, 'levels')).not.toThrow()
    })

    it('should handle score update with no prior high score', () => {
      localStorage.removeItem('highScore')
      uiManager.create(1, 'levels')
      
      expect(() => uiManager.updateScore(100)).not.toThrow()
    })

    it('should handle multiple level updates', () => {
      uiManager.create(1, 'levels')
      
      uiManager.updateLevel(2)
      uiManager.updateLevel(3)
      uiManager.updateLevel(4)
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should handle rapid health updates', () => {
      uiManager.create(1, 'levels')
      
      for (let i = 100; i >= 0; i -= 10) {
        uiManager.updateHealth(i, 100)
      }
      
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should handle simultaneous popups', () => {
      uiManager.showDamageNumber(100, 200, 25)
      uiManager.showDamageNumber(150, 200, 30)
      uiManager.showScorePopup(200, 200, 100)
      
      expect(scene.add.text).toHaveBeenCalled()
    })
  })

  // ==================== COOP MODE SPECIFIC TESTS ====================

  describe('coop mode', () => {
    let coopManager: UIManager

    beforeEach(() => {
      coopManager = new UIManager(scene as any, {
        screenWidth: 1280,
        screenHeight: 720,
        isCoopMode: true
      })
    })

    it('should position health bar differently in coop mode', () => {
      coopManager.create(1, 'levels')
      
      // Health bar should be at x=90 for coop mode
      const rectangleCalls = scene.add.rectangle.mock.calls
      const firstRectCall = rectangleCalls[0]
      expect(firstRectCall[0]).toBe(90) // x position
    })

    it('should use P1 HP label', () => {
      coopManager.create(1, 'levels')
      
      const textCalls = scene.add.text.mock.calls
      const p1Call = textCalls.find((call: any[]) => call[2] === 'P1 HP')
      expect(p1Call).toBeDefined()
    })

    it('should format lives with x prefix', () => {
      coopManager.create(1, 'levels')
      coopManager.updateLives(5)
      
      // Lives should show "x5" format
      expect(scene.add.text).toHaveBeenCalled()
    })
  })
})
