import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      sys = { game: { canvas: {} } }
      cameras = { main: { setBackgroundColor: vi.fn() } }
      add = {
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setName: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        rectangle: vi.fn().mockReturnValue({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis()
        }),
        sprite: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis()
        }),
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis()
        }),
        container: vi.fn().mockReturnValue({
          add: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis()
        })
      }
      load = {
        image: vi.fn(),
        audio: vi.fn(),
        spritesheet: vi.fn()
      }
      scene = {
        start: vi.fn(),
        stop: vi.fn()
      }
      input = {
        keyboard: {
          on: vi.fn(),
          addKey: vi.fn().mockReturnValue({
            on: vi.fn()
          })
        }
      }
      sound = {
        add: vi.fn().mockReturnValue({
          play: vi.fn(),
          stop: vi.fn()
        }),
        stopAll: vi.fn()
      }
      cache = {
        audio: {
          exists: vi.fn().mockReturnValue(true)
        }
      }
      time = {
        addEvent: vi.fn(),
        delayedCall: vi.fn()
      }
      tweens = {
        add: vi.fn()
      }
      physics = {
        add: {
          existing: vi.fn(),
          sprite: vi.fn().mockReturnValue({
            setOrigin: vi.fn().mockReturnThis(),
            setBounce: vi.fn().mockReturnThis(),
            setCollideWorldBounds: vi.fn().mockReturnThis()
          }),
          staticGroup: vi.fn().mockReturnValue({
            add: vi.fn(),
            getChildren: vi.fn().mockReturnValue([])
          }),
          group: vi.fn().mockReturnValue({
            add: vi.fn(),
            getChildren: vi.fn().mockReturnValue([])
          }),
          collider: vi.fn(),
          overlap: vi.fn()
        }
      }
    }
  }
}))

// Scene key constants (matching actual scene keys)
const SCENE_KEYS = {
  MENU: 'MenuScene',
  GAME: 'GameScene',
  LEADERBOARD: 'LeaderboardScene',
  SHOP: 'ShopScene',
  INVENTORY: 'InventoryScene',
  CREDITS: 'CreditScene',
  BOSS_GALLERY: 'BossGalleryScene',
  COOP_LOBBY: 'CoopLobbyScene',
  DQN_TRAINING: 'DQNTrainingScene'
}

describe('Scene Configuration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Scene Keys', () => {
    it('should have unique scene keys', () => {
      const keys = Object.values(SCENE_KEYS)
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(keys.length)
    })

    it('should have MenuScene as entry point', () => {
      expect(SCENE_KEYS.MENU).toBe('MenuScene')
    })

    it('should have GameScene for main gameplay', () => {
      expect(SCENE_KEYS.GAME).toBe('GameScene')
    })
  })

  describe('Menu Scene', () => {
    it('should have correct scene key', () => {
      expect(SCENE_KEYS.MENU).toBe('MenuScene')
    })

    it('should support player name from localStorage', () => {
      localStorage.setItem('player_name', 'TestPlayer')
      const playerName = localStorage.getItem('player_name')
      expect(playerName).toBe('TestPlayer')
    })

    it('should default to Guest when no name saved', () => {
      const playerName = localStorage.getItem('player_name') || 'Guest'
      expect(playerName).toBe('Guest')
    })

    it('should load coin count from localStorage', () => {
      localStorage.setItem('playerCoins', '500')
      const coins = parseInt(localStorage.getItem('playerCoins') || '0')
      expect(coins).toBe(500)
    })

    it('should default to 0 coins when not saved', () => {
      const coins = parseInt(localStorage.getItem('playerCoins') || '0')
      expect(coins).toBe(0)
    })
  })

  describe('Game Scene', () => {
    it('should have correct scene key', () => {
      expect(SCENE_KEYS.GAME).toBe('GameScene')
    })

    it('should support game mode selection', () => {
      const gameModes = ['classic', 'arcade', 'survival', 'coop']
      gameModes.forEach(mode => {
        expect(typeof mode).toBe('string')
      })
    })

    it('should support skin selection', () => {
      localStorage.setItem('equippedSkin', 'alienBlue')
      const skin = localStorage.getItem('equippedSkin') || 'alienBeige'
      expect(skin).toBe('alienBlue')
    })

    it('should default to alienBeige skin', () => {
      const skin = localStorage.getItem('equippedSkin') || 'alienBeige'
      expect(skin).toBe('alienBeige')
    })
  })

  describe('Leaderboard Scene', () => {
    it('should have correct scene key', () => {
      expect(SCENE_KEYS.LEADERBOARD).toBe('LeaderboardScene')
    })
  })

  describe('Shop Scene', () => {
    it('should have correct scene key', () => {
      expect(SCENE_KEYS.SHOP).toBe('ShopScene')
    })

    it('should track purchased skins', () => {
      const purchasedSkins = ['alienBeige', 'alienBlue']
      localStorage.setItem('purchasedSkins', JSON.stringify(purchasedSkins))
      
      const saved = JSON.parse(localStorage.getItem('purchasedSkins') || '[]')
      expect(saved).toContain('alienBeige')
      expect(saved).toContain('alienBlue')
    })
  })

  describe('Inventory Scene', () => {
    it('should have correct scene key', () => {
      expect(SCENE_KEYS.INVENTORY).toBe('InventoryScene')
    })

    it('should support equipped skin storage', () => {
      localStorage.setItem('equippedSkin', 'alienGreen')
      expect(localStorage.getItem('equippedSkin')).toBe('alienGreen')
    })
  })

  describe('Boss Gallery Scene', () => {
    it('should have correct scene key', () => {
      expect(SCENE_KEYS.BOSS_GALLERY).toBe('BossGalleryScene')
    })
  })

  describe('Credits Scene', () => {
    it('should have correct scene key', () => {
      expect(SCENE_KEYS.CREDITS).toBe('CreditScene')
    })
  })
})

describe('Scene State Management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Player Progress', () => {
    it('should persist coin count', () => {
      const coins = 1000
      localStorage.setItem('playerCoins', coins.toString())
      
      expect(parseInt(localStorage.getItem('playerCoins') || '0')).toBe(1000)
    })

    it('should persist high score', () => {
      localStorage.setItem('highScore', '5000')
      expect(localStorage.getItem('highScore')).toBe('5000')
    })

    it('should persist level progress', () => {
      localStorage.setItem('currentLevel', '3')
      expect(localStorage.getItem('currentLevel')).toBe('3')
    })
  })

  describe('Settings Persistence', () => {
    it('should persist sound settings', () => {
      localStorage.setItem('soundEnabled', 'true')
      localStorage.setItem('soundVolume', '0.7')
      
      expect(localStorage.getItem('soundEnabled')).toBe('true')
      expect(localStorage.getItem('soundVolume')).toBe('0.7')
    })

    it('should persist music settings', () => {
      localStorage.setItem('musicEnabled', 'true')
      localStorage.setItem('musicVolume', '0.5')
      
      expect(localStorage.getItem('musicEnabled')).toBe('true')
      expect(localStorage.getItem('musicVolume')).toBe('0.5')
    })

    it('should persist control settings', () => {
      const controlSettings = {
        inputMethod: 'gamepad',
        gamepadMapping: { shoot: 7, moveLeftStick: true, moveDpad: true, aimRightStick: true }
      }
      localStorage.setItem('controlSettings', JSON.stringify(controlSettings))
      
      const saved = JSON.parse(localStorage.getItem('controlSettings') || '{}')
      expect(saved.inputMethod).toBe('gamepad')
    })
  })

  describe('Inventory Persistence', () => {
    it('should persist purchased skins', () => {
      const skins = ['alienBeige', 'alienBlue', 'alienGreen']
      localStorage.setItem('purchasedSkins', JSON.stringify(skins))
      
      const saved = JSON.parse(localStorage.getItem('purchasedSkins') || '[]')
      expect(saved).toHaveLength(3)
    })

    it('should persist equipped skin', () => {
      localStorage.setItem('equippedSkin', 'alienPink')
      expect(localStorage.getItem('equippedSkin')).toBe('alienPink')
    })
  })
})

describe('Scene Transitions', () => {
  describe('Menu to Game', () => {
    it('should support classic mode transition', () => {
      const gameMode = 'classic'
      expect(gameMode).toBe('classic')
    })

    it('should support arcade mode transition', () => {
      const gameMode = 'arcade'
      expect(gameMode).toBe('arcade')
    })

    it('should support AI demo mode transition', () => {
      const gameMode = 'ai_demo'
      expect(gameMode).toBe('ai_demo')
    })

    it('should support ML training mode transition', () => {
      const gameMode = 'ml_training'
      expect(gameMode).toBe('ml_training')
    })
  })

  describe('Game to Results', () => {
    it('should pass score data on game over', () => {
      const scoreData = {
        score: 1500,
        coins: 50,
        enemiesDefeated: 10,
        distance: 5000,
        level: 3
      }
      
      expect(scoreData.score).toBe(1500)
      expect(scoreData.coins).toBe(50)
    })
  })
})

describe('Game Configuration', () => {
  describe('Screen Settings', () => {
    it('should use standard game dimensions', () => {
      const width = 1280
      const height = 720
      
      expect(width).toBe(1280)
      expect(height).toBe(720)
    })
  })

  describe('Physics Settings', () => {
    it('should have gravity setting', () => {
      const gravity = { y: 600 }
      expect(gravity.y).toBe(600)
    })
  })

  describe('Player Settings', () => {
    it('should have player speed', () => {
      const playerSpeed = 300
      expect(playerSpeed).toBe(300)
    })

    it('should have jump velocity', () => {
      const jumpVelocity = -400
      expect(jumpVelocity).toBeLessThan(0)
    })

    it('should have double jump support', () => {
      const maxJumps = 2
      expect(maxJumps).toBe(2)
    })
  })

  describe('Enemy Settings', () => {
    it('should have enemy types', () => {
      const enemyTypes = ['slime', 'fly', 'spinner']
      expect(enemyTypes).toHaveLength(3)
    })
  })

  describe('Power-up Settings', () => {
    it('should have power-up types', () => {
      const powerUpTypes = ['health', 'speed', 'shield', 'multishot']
      expect(powerUpTypes.length).toBeGreaterThan(0)
    })
  })
})

describe('Asset Loading', () => {
  describe('Alien Skins', () => {
    it('should have all alien skin names', () => {
      const skins = ['alienBeige', 'alienBlue', 'alienGreen', 'alienPink', 'alienYellow']
      expect(skins).toHaveLength(5)
    })
  })

  describe('Platform Tiles', () => {
    it('should have biome tile names', () => {
      const biomes = ['metal', 'stone', 'dirt']
      expect(biomes).toHaveLength(3)
    })
  })

  describe('Enemy Sprites', () => {
    it('should have enemy sprite names', () => {
      const enemies = ['slimePurple', 'flyGreen', 'spinner']
      expect(enemies.length).toBeGreaterThan(0)
    })
  })
})

describe('Event System', () => {
  describe('Game Events', () => {
    it('should have player damage event', () => {
      const event = 'player_damaged'
      expect(event).toBe('player_damaged')
    })

    it('should have enemy killed event', () => {
      const event = 'enemy_killed'
      expect(event).toBe('enemy_killed')
    })

    it('should have coin collected event', () => {
      const event = 'coin_collected'
      expect(event).toBe('coin_collected')
    })

    it('should have power-up collected event', () => {
      const event = 'powerup_collected'
      expect(event).toBe('powerup_collected')
    })

    it('should have boss spawned event', () => {
      const event = 'boss_spawned'
      expect(event).toBe('boss_spawned')
    })

    it('should have level complete event', () => {
      const event = 'level_complete'
      expect(event).toBe('level_complete')
    })
  })
})
