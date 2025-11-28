/**
 * utils-localcoop.test.ts
 * Tests for the LocalCoopManager utility class
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { LocalCoopManager, PlayerState, CoopSettings } from '../utils/LocalCoopManager'

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Input: {
      Gamepad: {
        Gamepad: class {}
      }
    }
  }
}))

describe('LocalCoopManager', () => {
  let coopManager: LocalCoopManager

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset singleton for each test
    // @ts-ignore - accessing private static for testing
    LocalCoopManager.instance = undefined
    coopManager = LocalCoopManager.getInstance()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = LocalCoopManager.getInstance()
      const instance2 = LocalCoopManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('initial state', () => {
    it('should have coop mode disabled by default', () => {
      expect(coopManager.isCoopEnabled()).toBe(false)
    })

    it('should have default player states', () => {
      const player1 = coopManager.getPlayer1State()
      const player2 = coopManager.getPlayer2State()
      
      expect(player1.playerNumber).toBe(1)
      expect(player2.playerNumber).toBe(2)
    })
  })

  describe('enableCoopMode()', () => {
    it('should enable coop mode', () => {
      coopManager.enableCoopMode()
      
      expect(coopManager.isCoopEnabled()).toBe(true)
    })
  })

  describe('disableCoopMode()', () => {
    it('should disable coop mode', () => {
      coopManager.enableCoopMode()
      coopManager.disableCoopMode()
      
      expect(coopManager.isCoopEnabled()).toBe(false)
    })

    it('should reset player states', () => {
      coopManager.enableCoopMode()
      coopManager.updatePlayerState(1, { health: 50, score: 1000 })
      coopManager.disableCoopMode()
      
      const player1 = coopManager.getPlayer1State()
      expect(player1.health).toBe(100)
      expect(player1.score).toBe(0)
    })
  })

  describe('getSettings()', () => {
    it('should return settings object', () => {
      const settings = coopManager.getSettings()
      
      expect(settings).toBeDefined()
      expect('isCoopMode' in settings).toBe(true)
      expect('player1' in settings).toBe(true)
      expect('player2' in settings).toBe(true)
      expect('sharedLives' in settings).toBe(true)
      expect('friendlyFire' in settings).toBe(true)
      expect('respawnOnPartnerAlive' in settings).toBe(true)
    })
  })

  describe('getPlayer1State()', () => {
    it('should return player 1 state', () => {
      const player1 = coopManager.getPlayer1State()
      
      expect(player1.playerNumber).toBe(1)
      expect(player1.gamepadIndex).toBe(0)
      expect(player1.health).toBe(100)
      expect(player1.lives).toBe(3)
      expect(player1.skin).toBe('alienGreen')
    })
  })

  describe('getPlayer2State()', () => {
    it('should return player 2 state', () => {
      const player2 = coopManager.getPlayer2State()
      
      expect(player2.playerNumber).toBe(2)
      expect(player2.gamepadIndex).toBe(1)
      expect(player2.health).toBe(100)
      expect(player2.lives).toBe(3)
      expect(player2.skin).toBe('alienBlue')
    })
  })

  describe('updatePlayerState()', () => {
    it('should update player 1 state', () => {
      coopManager.updatePlayerState(1, { health: 75, score: 500 })
      
      const player1 = coopManager.getPlayer1State()
      expect(player1.health).toBe(75)
      expect(player1.score).toBe(500)
    })

    it('should update player 2 state', () => {
      coopManager.updatePlayerState(2, { health: 50, lives: 2 })
      
      const player2 = coopManager.getPlayer2State()
      expect(player2.health).toBe(50)
      expect(player2.lives).toBe(2)
    })

    it('should preserve other properties when updating', () => {
      coopManager.updatePlayerState(1, { score: 1000 })
      
      const player1 = coopManager.getPlayer1State()
      expect(player1.health).toBe(100) // Unchanged
      expect(player1.score).toBe(1000) // Updated
    })
  })

  describe('setPlayerReady()', () => {
    it('should set player 1 ready', () => {
      coopManager.setPlayerReady(1, true)
      
      const player1 = coopManager.getPlayer1State()
      expect(player1.isReady).toBe(true)
    })

    it('should set player 2 ready', () => {
      coopManager.setPlayerReady(2, true)
      
      const player2 = coopManager.getPlayer2State()
      expect(player2.isReady).toBe(true)
    })

    it('should set player not ready', () => {
      coopManager.setPlayerReady(1, true)
      coopManager.setPlayerReady(1, false)
      
      const player1 = coopManager.getPlayer1State()
      expect(player1.isReady).toBe(false)
    })
  })

  describe('areBothPlayersReady()', () => {
    it('should return false when no players ready', () => {
      expect(coopManager.areBothPlayersReady()).toBe(false)
    })

    it('should return false when only player 1 ready', () => {
      coopManager.setPlayerReady(1, true)
      
      expect(coopManager.areBothPlayersReady()).toBe(false)
    })

    it('should return false when only player 2 ready', () => {
      coopManager.setPlayerReady(2, true)
      
      expect(coopManager.areBothPlayersReady()).toBe(false)
    })

    it('should return true when both players ready', () => {
      coopManager.setPlayerReady(1, true)
      coopManager.setPlayerReady(2, true)
      
      expect(coopManager.areBothPlayersReady()).toBe(true)
    })
  })

  describe('resetPlayers()', () => {
    it('should reset player states to defaults', () => {
      coopManager.updatePlayerState(1, { health: 25, score: 5000, isAlive: false })
      coopManager.updatePlayerState(2, { health: 50, score: 3000, lives: 1 })
      
      coopManager.resetPlayers()
      
      const player1 = coopManager.getPlayer1State()
      const player2 = coopManager.getPlayer2State()
      
      expect(player1.health).toBe(100)
      expect(player1.score).toBe(0)
      expect(player1.isAlive).toBe(true)
      expect(player2.health).toBe(100)
      expect(player2.score).toBe(0)
      expect(player2.lives).toBe(3)
    })
  })

  describe('isAnyPlayerAlive()', () => {
    it('should return true when both alive', () => {
      expect(coopManager.isAnyPlayerAlive()).toBe(true)
    })

    it('should return true when only player 1 alive', () => {
      coopManager.updatePlayerState(2, { isAlive: false })
      
      expect(coopManager.isAnyPlayerAlive()).toBe(true)
    })

    it('should return true when only player 2 alive', () => {
      coopManager.updatePlayerState(1, { isAlive: false })
      
      expect(coopManager.isAnyPlayerAlive()).toBe(true)
    })

    it('should return false when both dead', () => {
      coopManager.updatePlayerState(1, { isAlive: false })
      coopManager.updatePlayerState(2, { isAlive: false })
      
      expect(coopManager.isAnyPlayerAlive()).toBe(false)
    })
  })

  describe('areBothPlayersDead()', () => {
    it('should return false when both alive', () => {
      expect(coopManager.areBothPlayersDead()).toBe(false)
    })

    it('should return false when player 1 alive', () => {
      coopManager.updatePlayerState(2, { isAlive: false })
      
      expect(coopManager.areBothPlayersDead()).toBe(false)
    })

    it('should return false when player 2 alive', () => {
      coopManager.updatePlayerState(1, { isAlive: false })
      
      expect(coopManager.areBothPlayersDead()).toBe(false)
    })

    it('should return true when both dead', () => {
      coopManager.updatePlayerState(1, { isAlive: false })
      coopManager.updatePlayerState(2, { isAlive: false })
      
      expect(coopManager.areBothPlayersDead()).toBe(true)
    })
  })

  describe('getCombinedScore()', () => {
    it('should return 0 initially', () => {
      expect(coopManager.getCombinedScore()).toBe(0)
    })

    it('should return sum of both player scores', () => {
      coopManager.updatePlayerState(1, { score: 500 })
      coopManager.updatePlayerState(2, { score: 300 })
      
      expect(coopManager.getCombinedScore()).toBe(800)
    })
  })

  describe('getTotalLives()', () => {
    it('should return sum of lives when not shared', () => {
      coopManager.updatePlayerState(1, { lives: 3 })
      coopManager.updatePlayerState(2, { lives: 2 })
      
      expect(coopManager.getTotalLives()).toBe(5)
    })

    it('should return player 1 lives when shared', () => {
      const settings = coopManager.getSettings()
      settings.sharedLives = true
      coopManager.updatePlayerState(1, { lives: 5 })
      coopManager.updatePlayerState(2, { lives: 2 })
      
      expect(coopManager.getTotalLives()).toBe(5)
    })
  })

  describe('detectGamepads()', () => {
    it('should return null gamepads when none connected', () => {
      const mockScene = {
        input: {
          gamepad: {
            gamepads: []
          }
        }
      }
      
      const result = LocalCoopManager.detectGamepads(mockScene as any)
      
      expect(result.player1Gamepad).toBeNull()
      expect(result.player2Gamepad).toBeNull()
    })

    it('should return first gamepad for player 1', () => {
      const mockGamepad1 = { id: 'gamepad1' }
      const mockScene = {
        input: {
          gamepad: {
            gamepads: [mockGamepad1]
          }
        }
      }
      
      const result = LocalCoopManager.detectGamepads(mockScene as any)
      
      expect(result.player1Gamepad).toBe(mockGamepad1)
      expect(result.player2Gamepad).toBeNull()
    })

    it('should return both gamepads when two connected', () => {
      const mockGamepad1 = { id: 'gamepad1' }
      const mockGamepad2 = { id: 'gamepad2' }
      const mockScene = {
        input: {
          gamepad: {
            gamepads: [mockGamepad1, mockGamepad2]
          }
        }
      }
      
      const result = LocalCoopManager.detectGamepads(mockScene as any)
      
      expect(result.player1Gamepad).toBe(mockGamepad1)
      expect(result.player2Gamepad).toBe(mockGamepad2)
    })

    it('should handle undefined gamepad object', () => {
      const mockScene = {
        input: {
          gamepad: undefined
        }
      }
      
      const result = LocalCoopManager.detectGamepads(mockScene as any)
      
      expect(result.player1Gamepad).toBeNull()
      expect(result.player2Gamepad).toBeNull()
    })
  })

  describe('getPlayerInput()', () => {
    it('should return zero input when no gamepad', () => {
      const input = LocalCoopManager.getPlayerInput(null)
      
      expect(input.moveX).toBe(0)
      expect(input.moveY).toBe(0)
      expect(input.jump).toBe(false)
      expect(input.shoot).toBe(false)
      expect(input.aimX).toBe(0)
      expect(input.aimY).toBe(0)
    })

    it('should read left stick for movement', () => {
      const mockGamepad = {
        leftStick: { x: 0.5, y: -0.3 },
        rightStick: { x: 0, y: 0 },
        A: false,
        R2: 0,
        buttons: []
      }
      
      const input = LocalCoopManager.getPlayerInput(mockGamepad as any)
      
      expect(input.moveX).toBe(0.5)
      expect(input.moveY).toBe(-0.3)
    })

    it('should read right stick for aiming', () => {
      const mockGamepad = {
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0.8, y: -0.6 },
        A: false,
        R2: 0,
        buttons: []
      }
      
      const input = LocalCoopManager.getPlayerInput(mockGamepad as any)
      
      expect(input.aimX).toBe(0.8)
      expect(input.aimY).toBe(-0.6)
    })

    it('should read A button for jump', () => {
      const mockGamepad = {
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        A: true,
        R2: 0,
        buttons: []
      }
      
      const input = LocalCoopManager.getPlayerInput(mockGamepad as any)
      
      expect(input.jump).toBe(true)
    })

    it('should read R2 trigger for shoot', () => {
      const mockGamepad = {
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        A: false,
        R2: 0.8, // Pressed past threshold
        buttons: []
      }
      
      const input = LocalCoopManager.getPlayerInput(mockGamepad as any)
      
      expect(input.shoot).toBe(true)
    })

    it('should read RB button for shoot', () => {
      const mockGamepad = {
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        A: false,
        R2: 0,
        buttons: [
          null, null, null, null, null,
          { pressed: true } // Button 5 (RB)
        ]
      }
      
      const input = LocalCoopManager.getPlayerInput(mockGamepad as any)
      
      expect(input.shoot).toBe(true)
    })
  })

  describe('wasButtonJustPressed()', () => {
    it('should return false when no gamepad', () => {
      const result = LocalCoopManager.wasButtonJustPressed(null, 0)
      
      expect(result).toBe(false)
    })

    it('should return false when button not pressed', () => {
      const mockGamepad = {
        buttons: [{ pressed: false, value: 0 }]
      }
      
      const result = LocalCoopManager.wasButtonJustPressed(mockGamepad as any, 0)
      
      expect(result).toBe(false)
    })

    it('should return true when button just pressed', () => {
      const mockGamepad = {
        buttons: [{ pressed: true, value: 1 }]
      }
      
      const result = LocalCoopManager.wasButtonJustPressed(mockGamepad as any, 0)
      
      expect(result).toBe(true)
    })

    it('should return false when button index out of range', () => {
      const mockGamepad = {
        buttons: [{ pressed: true, value: 1 }]
      }
      
      const result = LocalCoopManager.wasButtonJustPressed(mockGamepad as any, 5)
      
      expect(result).toBe(false)
    })
  })

  describe('saveSettings() and loadSettings()', () => {
    it('should save settings to localStorage', () => {
      coopManager.enableCoopMode()
      coopManager.updatePlayerState(1, { score: 1000 })
      
      coopManager.saveSettings()
      
      const saved = localStorage.getItem('coopSettings')
      expect(saved).not.toBeNull()
    })

    it('should load settings from localStorage', () => {
      coopManager.enableCoopMode()
      coopManager.updatePlayerState(1, { score: 1500 })
      coopManager.saveSettings()
      
      // Reset and create new instance
      // @ts-ignore - accessing private static for testing
      LocalCoopManager.instance = undefined
      const newManager = LocalCoopManager.getInstance()
      newManager.loadSettings()
      
      expect(newManager.isCoopEnabled()).toBe(true)
      expect(newManager.getPlayer1State().score).toBe(1500)
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('coopSettings', 'invalid json{{{')
      
      // Reset and create new instance
      // @ts-ignore - accessing private static for testing
      LocalCoopManager.instance = undefined
      const newManager = LocalCoopManager.getInstance()
      newManager.loadSettings()
      
      // Should use defaults
      expect(newManager.isCoopEnabled()).toBe(false)
      expect(newManager.getPlayer1State().health).toBe(100)
    })

    it('should handle missing localStorage data', () => {
      // Reset and create new instance
      // @ts-ignore - accessing private static for testing
      LocalCoopManager.instance = undefined
      const newManager = LocalCoopManager.getInstance()
      newManager.loadSettings()
      
      // Should use defaults
      expect(newManager.isCoopEnabled()).toBe(false)
    })
  })

  describe('interface validation', () => {
    it('should have correct PlayerState structure', () => {
      const player1 = coopManager.getPlayer1State()
      
      expect('playerNumber' in player1).toBe(true)
      expect('gamepadIndex' in player1).toBe(true)
      expect('isReady' in player1).toBe(true)
      expect('isAlive' in player1).toBe(true)
      expect('health' in player1).toBe(true)
      expect('lives' in player1).toBe(true)
      expect('score' in player1).toBe(true)
      expect('skin' in player1).toBe(true)
      expect('weapon' in player1).toBe(true)
    })

    it('should have correct CoopSettings structure', () => {
      const settings = coopManager.getSettings()
      
      expect('isCoopMode' in settings).toBe(true)
      expect('player1' in settings).toBe(true)
      expect('player2' in settings).toBe(true)
      expect('sharedLives' in settings).toBe(true)
      expect('friendlyFire' in settings).toBe(true)
      expect('respawnOnPartnerAlive' in settings).toBe(true)
    })
  })
})
