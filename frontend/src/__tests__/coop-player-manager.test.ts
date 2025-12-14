/**
 * Tests for CoopPlayerManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock LocalCoopManager
vi.mock('../utils/LocalCoopManager', () => ({
  LocalCoopManager: {
    getInstance: vi.fn(() => ({
      getSettings: vi.fn(() => ({
        player1: { skin: 'alien', weapon: 'raygun' },
        player2: { skin: 'robot', weapon: 'laser' },
        respawnOnPartnerAlive: true
      })),
      getPlayer1State: vi.fn(() => ({
        playerNumber: 1,
        health: 100,
        lives: 3,
        isAlive: true,
        score: 0
      })),
      getPlayer2State: vi.fn(() => ({
        playerNumber: 2,
        health: 100,
        lives: 3,
        isAlive: true,
        score: 0
      })),
      updatePlayerState: vi.fn(),
      areBothPlayersDead: vi.fn(() => false)
    }))
  }
}))

import { CoopPlayerManager, CoopPlayer } from '../utils/CoopPlayerManager'

describe('CoopPlayerManager', () => {
  let manager: CoopPlayerManager
  let mockScene: any
  let mockPlatforms: any
  let mockBulletGroup1: any
  let mockBulletGroup2: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock bullet groups
    mockBulletGroup1 = {
      create: vi.fn(),
      getChildren: vi.fn(() => [])
    }
    mockBulletGroup2 = {
      create: vi.fn(),
      getChildren: vi.fn(() => [])
    }

    // Create mock scene
    mockScene = {
      physics: {
        add: {
          sprite: vi.fn((x, y, texture) => ({
            x,
            y,
            texture,
            body: {
              enable: true,
              setSize: vi.fn(),
              setOffset: vi.fn()
            },
            setBounce: vi.fn().mockReturnThis(),
            setCollideWorldBounds: vi.fn().mockReturnThis(),
            setGravityY: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            play: vi.fn(),
            setPosition: vi.fn(function(this: any, newX: number, newY: number) {
              this.x = newX
              this.y = newY
              return this
            }),
            setAlpha: vi.fn().mockReturnThis(),
            clearTint: vi.fn().mockReturnThis(),
            setTint: vi.fn().mockReturnThis(),
            setAngle: vi.fn().mockReturnThis(),
            destroy: vi.fn()
          }))
        }
      },
      add: {
        image: vi.fn((x, y, texture) => ({
          x,
          y,
          texture,
          setScale: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setFlipY: vi.fn().mockReturnThis(),
          setRotation: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        rectangle: vi.fn((x, y, width, height, color) => ({
          x,
          y,
          width,
          height,
          color,
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        text: vi.fn((x, y, text, style) => ({
          x,
          y,
          text,
          style,
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        sprite: vi.fn((x, y, texture) => ({
          x,
          y,
          texture,
          setScale: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }))
      },
      input: {
        gamepad: {
          gamepads: []
        }
      },
      time: {
        now: 1000,
        delayedCall: vi.fn((delay, callback) => {
          callback()
          return { remove: vi.fn() }
        })
      },
      tweens: {
        add: vi.fn((config) => {
          if (config.onComplete) {
            config.onComplete()
          }
          return { remove: vi.fn() }
        })
      }
    }

    mockPlatforms = {
      create: vi.fn()
    }

    manager = new CoopPlayerManager(mockScene, mockPlatforms)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize manager', () => {
      expect(manager).toBeDefined()
    })

    it('should have null players initially', () => {
      expect(manager.getPlayer1()).toBeNull()
      expect(manager.getPlayer2()).toBeNull()
    })
  })

  describe('createPlayers', () => {
    it('should create both players', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      expect(manager.getPlayer1()).not.toBeNull()
      expect(manager.getPlayer2()).not.toBeNull()
    })

    it('should offset player positions', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      // Player 1 should be offset left (-50)
      expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(
        350, 550, 'alien_stand'
      )
      // Player 2 should be offset right (+50)
      expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(
        450, 550, 'robot_stand'
      )
    })

    it('should create guns for both players', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      expect(mockScene.add.image).toHaveBeenCalledTimes(2)
      // First call for raygun, second for laser
      expect(mockScene.add.image).toHaveBeenNthCalledWith(1, 370, 550, 'raygun')
      expect(mockScene.add.image).toHaveBeenNthCalledWith(2, 470, 550, 'laserGun')
    })

    it('should create health bars for both players', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      // 2 health bar backgrounds + 2 fills = 4 rectangles
      expect(mockScene.add.rectangle).toHaveBeenCalledTimes(4)
    })

    it('should create lives text for both players', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      // 2 players x 2 text elements (lives + label) = 4 text calls
      expect(mockScene.add.text).toHaveBeenCalledTimes(4)
    })

    it('should create spawn shields for both players', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      // 2 spawn shields
      expect(mockScene.add.sprite).toHaveBeenCalledTimes(2)
      expect(mockScene.add.sprite).toHaveBeenCalledWith(350, 550, 'powerShield')
      expect(mockScene.add.sprite).toHaveBeenCalledWith(450, 550, 'powerShield')
    })

    it('should set up gamepad if available', () => {
      const mockGamepad1 = { index: 0 }
      const mockGamepad2 = { index: 1 }
      mockScene.input.gamepad.gamepads = [mockGamepad1, mockGamepad2]

      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      expect(manager.getPlayer1()?.gamepad).toBe(mockGamepad1)
      expect(manager.getPlayer2()?.gamepad).toBe(mockGamepad2)
    })

    it('should handle no gamepads', () => {
      mockScene.input.gamepad.gamepads = []

      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      expect(manager.getPlayer1()?.gamepad).toBeNull()
      expect(manager.getPlayer2()?.gamepad).toBeNull()
    })

    it('should set sprite physics properties', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      const player1 = manager.getPlayer1()
      expect(player1?.sprite.setBounce).toHaveBeenCalledWith(0.1)
      expect(player1?.sprite.setCollideWorldBounds).toHaveBeenCalledWith(true)
      expect(player1?.sprite.setDepth).toHaveBeenCalledWith(10)
    })

    it('should initialize player states correctly', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      const player1 = manager.getPlayer1()
      expect(player1?.state.health).toBe(100)
      expect(player1?.state.lives).toBe(3)
      expect(player1?.state.isAlive).toBe(true)
      expect(player1?.isDead).toBe(false)
      expect(player1?.isInvincible).toBe(true) // Spawn invincibility
    })
  })

  describe('getPlayer1', () => {
    it('should return null before creation', () => {
      expect(manager.getPlayer1()).toBeNull()
    })

    it('should return player1 after creation', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      expect(manager.getPlayer1()).not.toBeNull()
    })
  })

  describe('getPlayer2', () => {
    it('should return null before creation', () => {
      expect(manager.getPlayer2()).toBeNull()
    })

    it('should return player2 after creation', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      expect(manager.getPlayer2()).not.toBeNull()
    })
  })

  describe('getBothPlayers', () => {
    it('should return empty array before creation', () => {
      expect(manager.getBothPlayers()).toEqual([])
    })

    it('should return both players after creation', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const players = manager.getBothPlayers()
      expect(players.length).toBe(2)
    })
  })

  describe('updatePlayerUI', () => {
    it('should update health bar width based on health', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      player.state.health = 50
      manager.updatePlayerUI(player)

      expect(player.healthBarFill.width).toBe(98) // 196 * 0.5
    })

    it('should show green for high health', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      player.state.health = 60
      manager.updatePlayerUI(player)

      expect(player.healthBarFill.setFillStyle).toHaveBeenCalledWith(0x00ff00)
    })

    it('should show orange for medium health', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      player.state.health = 30
      manager.updatePlayerUI(player)

      expect(player.healthBarFill.setFillStyle).toHaveBeenCalledWith(0xffaa00)
    })

    it('should show red for low health', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      player.state.health = 10
      manager.updatePlayerUI(player)

      expect(player.healthBarFill.setFillStyle).toHaveBeenCalledWith(0xff0000)
    })

    it('should update lives text', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      player.state.lives = 2
      manager.updatePlayerUI(player)

      expect(player.livesText.setText).toHaveBeenCalledWith('x 2')
    })

    it('should use cyan for player 2 high health', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player2 = manager.getPlayer2()!

      player2.state.health = 60
      manager.updatePlayerUI(player2)

      expect(player2.healthBarFill.setFillStyle).toHaveBeenCalledWith(0x00ffff)
    })
  })

  describe('updateGun', () => {
    it('should position gun near player', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      manager.updateGun(player, 500, 550) // Aim right

      expect(player.gun.setRotation).toHaveBeenCalled()
    })

    it('should flip gun when aiming left', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      manager.updateGun(player, 200, 550) // Aim left

      expect(player.gun.setFlipY).toHaveBeenCalledWith(true)
    })

    it('should not flip gun when aiming right', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      manager.updateGun(player, 600, 550) // Aim right

      expect(player.gun.setFlipY).toHaveBeenCalledWith(false)
    })

    it('should handle player without body', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.sprite.body = null

      // Should not throw
      expect(() => manager.updateGun(player, 500, 550)).not.toThrow()
    })
  })

  describe('damagePlayer', () => {
    beforeEach(() => {
      // Override tween to not auto-complete (so invincibility stays)
      mockScene.tweens.add = vi.fn((config) => {
        // Don't call onComplete immediately
        return { remove: vi.fn() }
      })
    })

    it('should reduce player health', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isInvincible = false

      manager.damagePlayer(player, 25)

      expect(player.state.health).toBe(75)
    })

    it('should not damage invincible player', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isInvincible = true

      manager.damagePlayer(player, 25)

      expect(player.state.health).toBe(100) // Unchanged
    })

    it('should not damage dead player', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isInvincible = false
      player.isDead = true

      manager.damagePlayer(player, 25)

      expect(player.state.health).toBe(100) // Unchanged
    })

    it('should make player invincible after damage', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isInvincible = false

      manager.damagePlayer(player, 25)

      expect(player.isInvincible).toBe(true)
    })

    it('should trigger flash effect', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isInvincible = false

      manager.damagePlayer(player, 25)

      expect(mockScene.tweens.add).toHaveBeenCalled()
    })

    it('should kill player when health reaches 0', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isInvincible = false

      manager.damagePlayer(player, 100)

      expect(player.isDead).toBe(true)
    })
  })

  describe('killPlayer', () => {
    beforeEach(() => {
      // Don't auto-complete tweens in kill tests to preserve state
      mockScene.tweens.add = vi.fn(() => ({ remove: vi.fn() }))
    })

    it('should mark player as dead', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      manager.killPlayer(player)

      expect(player.isDead).toBe(true)
    })

    it('should reduce lives', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      manager.killPlayer(player)

      expect(player.state.lives).toBe(2)
    })

    it('should set isAlive to false', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      manager.killPlayer(player)

      expect(player.state.isAlive).toBe(false)
    })

    it('should not kill already dead player', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isDead = true
      player.state.lives = 3

      manager.killPlayer(player)

      expect(player.state.lives).toBe(3) // Unchanged
    })

    it('should apply death tint', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      manager.killPlayer(player)

      expect(player.sprite.setTint).toHaveBeenCalledWith(0xff0000)
    })

    it('should trigger death animation', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!

      manager.killPlayer(player)

      expect(mockScene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('respawnPlayer', () => {
    beforeEach(() => {
      // Don't auto-complete tweens in respawn tests 
      mockScene.tweens.add = vi.fn(() => ({ remove: vi.fn() }))
    })

    it('should reset player health', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isDead = true
      player.state.health = 0
      player.state.lives = 2

      manager.respawnPlayer(player)

      expect(player.state.health).toBe(100)
    })

    it('should reset player state', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isDead = true
      player.state.isAlive = false
      player.state.lives = 2

      manager.respawnPlayer(player)

      expect(player.isDead).toBe(false)
      expect(player.state.isAlive).toBe(true)
    })

    it('should make player invincible on spawn', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isDead = true
      player.state.lives = 2

      manager.respawnPlayer(player)

      expect(player.isInvincible).toBe(true)
    })

    it('should respawn near alive partner', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player1 = manager.getPlayer1()!
      const player2 = manager.getPlayer2()!
      player1.isDead = true
      player1.state.lives = 2
      player2.sprite.x = 800
      player2.sprite.y = 400
      player2.state.isAlive = true

      manager.respawnPlayer(player1)

      expect(player1.sprite.setPosition).toHaveBeenCalledWith(850, 400)
    })

    it('should respawn at checkpoint if partner dead', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player1 = manager.getPlayer1()!
      const player2 = manager.getPlayer2()!
      player1.isDead = true
      player1.state.lives = 2
      player2.state.isAlive = false

      manager.respawnPlayer(player1)

      expect(player1.sprite.setPosition).toHaveBeenCalledWith(400, 550)
    })

    it('should create spawn shield', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player = manager.getPlayer1()!
      player.isDead = true
      player.state.lives = 2

      const initialCalls = mockScene.add.sprite.mock.calls.length

      manager.respawnPlayer(player)

      expect(mockScene.add.sprite).toHaveBeenCalledTimes(initialCalls + 1)
    })
  })

  describe('isGameOver', () => {
    it('should return false when players alive', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)

      expect(manager.isGameOver()).toBe(false)
    })

    it('should return true when both have no lives', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player1 = manager.getPlayer1()!
      const player2 = manager.getPlayer2()!
      player1.state.lives = 0
      player2.state.lives = 0

      expect(manager.isGameOver()).toBe(true)
    })

    it('should return false when one has lives', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player1 = manager.getPlayer1()!
      const player2 = manager.getPlayer2()!
      player1.state.lives = 0
      player2.state.lives = 1

      expect(manager.isGameOver()).toBe(false)
    })
  })

  describe('getCameraFocusPoint', () => {
    it('should return default when no players', () => {
      const focus = manager.getCameraFocusPoint()
      expect(focus).toEqual({ x: 640, y: 360 })
    })

    it('should return single player position', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player1 = manager.getPlayer1()!
      const player2 = manager.getPlayer2()!
      player1.sprite.x = 500
      player1.sprite.y = 400
      player2.isDead = true

      const focus = manager.getCameraFocusPoint()

      expect(focus).toEqual({ x: 500, y: 400 })
    })

    it('should return average of both players', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player1 = manager.getPlayer1()!
      const player2 = manager.getPlayer2()!
      player1.sprite.x = 400
      player1.sprite.y = 400
      player2.sprite.x = 600
      player2.sprite.y = 500

      const focus = manager.getCameraFocusPoint()

      expect(focus.x).toBe(500) // (400 + 600) / 2
      expect(focus.y).toBe(450) // (400 + 500) / 2
    })

    it('should only consider alive players', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player1 = manager.getPlayer1()!
      const player2 = manager.getPlayer2()!
      player1.sprite.x = 400
      player1.sprite.y = 400
      player1.isDead = true
      player2.sprite.x = 600
      player2.sprite.y = 500

      const focus = manager.getCameraFocusPoint()

      expect(focus).toEqual({ x: 600, y: 500 })
    })
  })

  describe('destroy', () => {
    it('should destroy all player resources', () => {
      manager.createPlayers(400, 550, mockBulletGroup1, mockBulletGroup2)
      const player1 = manager.getPlayer1()!
      const player2 = manager.getPlayer2()!

      manager.destroy()

      expect(player1.sprite.destroy).toHaveBeenCalled()
      expect(player1.gun.destroy).toHaveBeenCalled()
      expect(player1.healthBarBg.destroy).toHaveBeenCalled()
      expect(player1.healthBarFill.destroy).toHaveBeenCalled()
      expect(player1.livesText.destroy).toHaveBeenCalled()
      expect(player1.playerLabel.destroy).toHaveBeenCalled()

      expect(player2.sprite.destroy).toHaveBeenCalled()
      expect(player2.gun.destroy).toHaveBeenCalled()
    })

    it('should handle empty destroy', () => {
      // Should not throw when called without creating players
      expect(() => manager.destroy()).not.toThrow()
    })
  })
})
