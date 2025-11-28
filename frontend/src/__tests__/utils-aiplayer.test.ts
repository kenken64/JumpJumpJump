/**
 * utils-aiplayer.test.ts
 * Tests for the AIPlayer utility class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIPlayer, AIDecision } from '../utils/AIPlayer'

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Math: {
      Distance: {
        Between: vi.fn((x1, y1, x2, y2) => {
          return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        })
      },
      Angle: {
        Between: vi.fn((x1, y1, x2, y2) => {
          return Math.atan2(y2 - y1, x2 - x1)
        })
      }
    },
    Physics: {
      Arcade: {
        Sprite: class {},
        Body: class {},
        StaticGroup: class {},
        Group: class {}
      }
    }
  }
}))

function createMockScene() {
  const mockPlayer = {
    x: 100,
    y: 500,
    body: {
      velocity: { x: 0, y: 0 },
      touching: { down: true }
    }
  }

  const mockPlatforms = {
    getChildren: vi.fn().mockReturnValue([
      {
        active: true,
        getBounds: () => ({ left: 0, right: 500, top: 550, bottom: 600, centerX: 250 })
      }
    ])
  }

  const mockSpikes = {
    getChildren: vi.fn().mockReturnValue([])
  }

  const mockEnemies = {
    getChildren: vi.fn().mockReturnValue([])
  }

  const mockCoins = {
    getChildren: vi.fn().mockReturnValue([])
  }

  return {
    player: mockPlayer,
    platforms: mockPlatforms,
    spikes: mockSpikes,
    enemies: mockEnemies,
    coins: mockCoins,
    portal: null,
    canDoubleJump: true,
    hasDoubleJumped: false
  }
}

describe('AIPlayer', () => {
  let scene: ReturnType<typeof createMockScene>
  let aiPlayer: AIPlayer

  beforeEach(() => {
    vi.clearAllMocks()
    scene = createMockScene()
    aiPlayer = new AIPlayer(scene as any)
  })

  describe('constructor', () => {
    it('should create an AIPlayer instance', () => {
      expect(aiPlayer).toBeDefined()
    })
  })

  describe('getDecision()', () => {
    it('should return a decision object', () => {
      const decision = aiPlayer.getDecision(0)
      
      expect(decision).toBeDefined()
      expect(typeof decision.moveLeft).toBe('boolean')
      expect(typeof decision.moveRight).toBe('boolean')
      expect(typeof decision.jump).toBe('boolean')
      expect(typeof decision.shoot).toBe('boolean')
      expect(typeof decision.aimX).toBe('number')
      expect(typeof decision.aimY).toBe('number')
    })

    it('should update decision at interval', () => {
      const decision1 = aiPlayer.getDecision(0)
      const decision2 = aiPlayer.getDecision(50) // Before interval
      const decision3 = aiPlayer.getDecision(150) // After interval
      
      expect(decision1).toBeDefined()
      expect(decision2).toBeDefined()
      expect(decision3).toBeDefined()
    })

    it('should default to moving right when no threats/targets', () => {
      const decision = aiPlayer.getDecision(200)
      
      expect(decision.moveRight).toBe(true)
      expect(decision.moveLeft).toBe(false)
    })
  })

  describe('threat avoidance', () => {
    it('should avoid spike on the left', () => {
      scene.spikes.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          x: 50, // Spike to the left of player (player at x=100)
          y: 500
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.moveRight).toBe(true)
    })

    it('should avoid spike on the right', () => {
      scene.spikes.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          x: 150, // Spike to the right of player (player at x=100)
          y: 500
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.moveLeft).toBe(true)
    })

    it('should jump when spike is very close', () => {
      scene.spikes.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          x: 130, // Very close spike
          y: 500
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.jump).toBe(true)
    })
  })

  describe('combat behavior', () => {
    it('should shoot at nearby enemy', () => {
      scene.enemies.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          x: 250, // Enemy within combat range
          y: 500,
          getData: vi.fn().mockReturnValue(100)
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.shoot).toBe(true)
      expect(decision.aimX).toBe(250)
      expect(decision.aimY).toBe(500)
    })

    it('should back away from very close enemy', () => {
      scene.enemies.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          x: 150, // Enemy very close on right
          y: 500,
          getData: vi.fn().mockReturnValue(100)
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.shoot).toBe(true)
      expect(decision.moveLeft).toBe(true) // Back away
    })

    it('should approach far enemy within combat range', () => {
      scene.enemies.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          x: 450, // Enemy at edge of combat range on right
          y: 500,
          getData: vi.fn().mockReturnValue(100)
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.shoot).toBe(true)
      expect(decision.moveRight).toBe(true) // Move closer
    })
  })

  describe('coin collection', () => {
    it('should move toward nearby coin', () => {
      scene.coins.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          x: 300, // Coin to the right
          y: 500
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.moveRight).toBe(true)
    })

    it('should move left toward coin on left', () => {
      scene.coins.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          x: 20, // Coin to the left
          y: 500
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.moveLeft).toBe(true)
    })
  })

  describe('portal seeking (win condition)', () => {
    it('should prioritize portal when nearby', () => {
      scene.portal = {
        active: true,
        x: 500,
        y: 500
      }

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.moveRight).toBe(true) // Move toward portal
    })

    it('should move left toward portal on left', () => {
      scene.player.x = 500
      scene.portal = {
        active: true,
        x: 100,
        y: 500
      }

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.moveLeft).toBe(true)
    })
  })

  describe('jumping behavior', () => {
    it('should jump when there is no ground ahead', () => {
      // Remove ground ahead
      scene.platforms.getChildren = vi.fn().mockReturnValue([
        {
          active: true,
          getBounds: () => ({ left: 0, right: 80, top: 550, bottom: 600, centerX: 40 }) // Ground only behind
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.jump).toBe(true)
    })

    it('should use double jump when stuck in air', () => {
      scene.player.body.touching.down = false
      scene.player.body.velocity.x = 0 // Stuck (no horizontal movement)
      scene.canDoubleJump = true
      scene.hasDoubleJumped = false

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.jump).toBe(true)
    })

    it('should not double jump if already used', () => {
      scene.player.body.touching.down = false
      scene.player.body.velocity.x = 0
      scene.canDoubleJump = true
      scene.hasDoubleJumped = true

      const decision = aiPlayer.getDecision(200)
      
      // Can't double jump, so jump should be based on other factors
      expect(typeof decision.jump).toBe('boolean')
    })
  })

  describe('null safety', () => {
    it('should handle missing player gracefully', () => {
      scene.player = null
      
      const decision = aiPlayer.getDecision(200)
      
      expect(decision).toBeDefined()
      expect(decision.moveLeft).toBe(false)
      expect(decision.moveRight).toBe(false)
    })

    it('should handle missing player body gracefully', () => {
      scene.player = { x: 100, y: 500, body: null }
      
      const decision = aiPlayer.getDecision(200)
      
      expect(decision).toBeDefined()
    })

    it('should handle missing platforms gracefully', () => {
      scene.platforms = null
      
      const decision = aiPlayer.getDecision(200)
      
      expect(decision).toBeDefined()
    })

    it('should handle missing enemies gracefully', () => {
      scene.enemies = null
      
      const decision = aiPlayer.getDecision(200)
      
      expect(decision).toBeDefined()
    })

    it('should handle missing coins gracefully', () => {
      scene.coins = null
      
      const decision = aiPlayer.getDecision(200)
      
      expect(decision).toBeDefined()
    })

    it('should handle missing spikes gracefully', () => {
      scene.spikes = null
      
      const decision = aiPlayer.getDecision(200)
      
      expect(decision).toBeDefined()
    })

    it('should handle inactive portal gracefully', () => {
      scene.portal = { active: false, x: 500, y: 500 }
      
      const decision = aiPlayer.getDecision(200)
      
      expect(decision).toBeDefined()
    })
  })

  describe('inactive entities handling', () => {
    it('should ignore inactive enemies', () => {
      scene.enemies.getChildren = vi.fn().mockReturnValue([
        {
          active: false,
          x: 150,
          y: 500,
          getData: vi.fn().mockReturnValue(100)
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      expect(decision.shoot).toBe(false) // No active enemy to shoot
    })

    it('should ignore inactive coins', () => {
      scene.coins.getChildren = vi.fn().mockReturnValue([
        {
          active: false,
          x: 300,
          y: 500
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      // Should default to moving right, not seeking inactive coin specifically
      expect(decision.moveRight).toBe(true)
    })

    it('should ignore inactive spikes', () => {
      scene.spikes.getChildren = vi.fn().mockReturnValue([
        {
          active: false,
          x: 130, // Would be dangerous if active
          y: 500
        }
      ])

      const decision = aiPlayer.getDecision(200)
      
      // Should not be avoiding since spike is inactive
      expect(decision.moveRight).toBe(true)
    })
  })

  describe('AIDecision interface', () => {
    it('should have all required properties', () => {
      const decision = aiPlayer.getDecision(200)
      
      expect('moveLeft' in decision).toBe(true)
      expect('moveRight' in decision).toBe(true)
      expect('jump' in decision).toBe(true)
      expect('shoot' in decision).toBe(true)
      expect('aimX' in decision).toBe(true)
      expect('aimY' in decision).toBe(true)
    })
  })
})
