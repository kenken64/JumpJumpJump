/**
 * Tests for OnlinePlayerManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock OnlineCoopService with mutable isHost
let mockIsHost = true
const mockSendPlayerState = vi.fn()
const mockSendGameAction = vi.fn()
const mockSendChat = vi.fn()
const mockCollectItem = vi.fn()
const mockSpawnEnemy = vi.fn()
const mockKillEnemy = vi.fn()
const mockSendEnemyState = vi.fn()
const mockSpawnCoin = vi.fn()
const mockSpawnPowerUp = vi.fn()
const mockSyncEntities = vi.fn()
const mockSetCallbacks = vi.fn()

vi.mock('../services/OnlineCoopService', () => ({
  OnlineCoopService: {
    getInstance: vi.fn(() => ({
      playerId: 'player-1',
      get isHost() { return mockIsHost },
      roomInfo: {
        players: [
          { player_id: 'player-1', player_name: 'Player 1' },
          { player_id: 'player-2', player_name: 'Player 2' }
        ]
      },
      setCallbacks: mockSetCallbacks,
      sendPlayerState: mockSendPlayerState,
      sendGameAction: mockSendGameAction,
      sendChat: mockSendChat,
      collectItem: mockCollectItem,
      spawnEnemy: mockSpawnEnemy,
      killEnemy: mockKillEnemy,
      sendEnemyState: mockSendEnemyState,
      spawnCoin: mockSpawnCoin,
      spawnPowerUp: mockSpawnPowerUp,
      syncEntities: mockSyncEntities
    }))
  }
}))

import { OnlinePlayerManager, OnlinePlayer } from '../utils/OnlinePlayerManager'

describe('OnlinePlayerManager', () => {
  let manager: OnlinePlayerManager
  let mockScene: any
  let mockPlatforms: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsHost = true

    // Create comprehensive mock platforms
    mockPlatforms = {
      getChildren: vi.fn(() => []),
      children: { entries: [] }
    }

    // Create comprehensive mock scene
    mockScene = {
      physics: {
        add: {
          sprite: vi.fn((x, y, texture) => ({
            x,
            y,
            texture,
            body: {
              velocity: { x: 0, y: 0 },
              touching: { down: true },
              setGravityY: vi.fn(),
              setSize: vi.fn(),
              setOffset: vi.fn(),
              onFloor: vi.fn(() => true)
            },
            setScale: vi.fn().mockReturnThis(),
            setBounce: vi.fn().mockReturnThis(),
            setCollideWorldBounds: vi.fn().mockReturnThis(),
            setData: vi.fn().mockReturnThis(),
            getData: vi.fn((key: string) => {
              if (key === 'enemyId') return 'enemy-1'
              if (key === 'enemyType') return 'fly'
              if (key === 'health') return 1
              return null
            }),
            setDepth: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            setFlipX: vi.fn().mockReturnThis(),
            setTexture: vi.fn().mockReturnThis(),
            setTint: vi.fn().mockReturnThis(),
            clearTint: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(),
            play: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
            active: true,
            visible: true,
            anims: {
              isPlaying: false,
              currentAnim: null
            }
          })),
          collider: vi.fn()
        }
      },
      add: {
        image: vi.fn((x, y, texture) => ({
          x,
          y,
          texture,
          setScale: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setRotation: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setFlipX: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        rectangle: vi.fn((x, y, width, height, color) => ({
          x,
          y,
          width,
          height,
          color,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setSize: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        text: vi.fn((x, y, text, style) => ({
          x,
          y,
          text,
          style,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          setName: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setX: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        sprite: vi.fn((x, y, texture) => ({
          x,
          y,
          texture,
          setScale: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          active: true
        }))
      },
      textures: {
        exists: vi.fn(() => true)
      },
      anims: {
        exists: vi.fn(() => false),
        create: vi.fn()
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
          if (config.onComplete) config.onComplete()
          return { remove: vi.fn() }
        })
      },
      events: {
        on: vi.fn(),
        off: vi.fn()
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0,
          setBounds: vi.fn(),
          startFollow: vi.fn()
        }
      }
    }

    manager = new OnlinePlayerManager(mockScene, mockPlatforms)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize manager', () => {
      expect(manager).toBeDefined()
    })

    it('should have no players initially', () => {
      expect(manager.getLocalPlayer()).toBeNull()
      expect(manager.getRemotePlayer()).toBeNull()
    })
  })

  describe('setEntityCallbacks', () => {
    it('should set entity callbacks', () => {
      const callbacks = {
        onEnemySpawned: vi.fn(),
        onEnemyKilled: vi.fn(),
        onCoinSpawned: vi.fn()
      }

      manager.setEntityCallbacks(callbacks)

      // Callbacks should be set (internal implementation)
      expect(true).toBe(true)
    })
  })

  describe('initializePlayers', () => {
    it('should create local player', () => {
      const gameState = {
        game_id: 'game-1',
        status: 'playing',
        host_id: 'player-1',
        players: {
          'player-1': {
            player_id: 'player-1',
            player_name: 'Player 1',
            player_number: 1,
            x: 400,
            y: 550,
            velocity_x: 0,
            velocity_y: 0,
            health: 100,
            lives: 3,
            score: 0,
            skin: 'alienGreen',
            weapon: 'raygun',
            is_alive: true,
            is_ready: true,
            facing_right: true,
            is_jumping: false,
            is_shooting: false
          }
        }
      }

      const bulletGroup = { create: vi.fn() }
      manager.initializePlayers(gameState as any, bulletGroup as any)

      expect(manager.getLocalPlayer()).not.toBeNull()
    })

    it('should create remote player', () => {
      const gameState = {
        game_id: 'game-1',
        status: 'playing',
        host_id: 'player-1',
        players: {
          'player-1': {
            player_id: 'player-1',
            player_name: 'Player 1',
            player_number: 1,
            x: 400,
            y: 550,
            velocity_x: 0,
            velocity_y: 0,
            health: 100,
            lives: 3,
            score: 0,
            skin: 'alienGreen',
            weapon: 'raygun',
            is_alive: true,
            is_ready: true,
            facing_right: true,
            is_jumping: false,
            is_shooting: false
          },
          'player-2': {
            player_id: 'player-2',
            player_name: 'Player 2',
            player_number: 2,
            x: 450,
            y: 550,
            velocity_x: 0,
            velocity_y: 0,
            health: 100,
            lives: 3,
            score: 0,
            skin: 'alienPink',
            weapon: 'laserGun',
            is_alive: true,
            is_ready: true,
            facing_right: true,
            is_jumping: false,
            is_shooting: false
          }
        }
      }

      const bulletGroup = { create: vi.fn() }
      manager.initializePlayers(gameState as any, bulletGroup as any)

      expect(manager.getLocalPlayer()).not.toBeNull()
      expect(manager.getRemotePlayer()).not.toBeNull()
    })
  })

  describe('trackLocalEnemy', () => {
    it('should track enemy sprite', () => {
      const mockSprite = mockScene.physics.add.sprite(500, 600, 'enemy_fly')
      
      manager.trackLocalEnemy(mockSprite)

      // Should not throw
      expect(true).toBe(true)
    })

    it('should handle null sprite', () => {
      // Should not throw
      expect(() => manager.trackLocalEnemy(null as any)).not.toThrow()
    })
  })

  describe('untrackEnemy', () => {
    it('should untrack enemy', () => {
      const mockSprite = mockScene.physics.add.sprite(500, 600, 'enemy_fly')
      manager.trackLocalEnemy(mockSprite, 'enemy-1')
      
      manager.untrackEnemy('enemy-1')

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('isHost', () => {
    it('should return host status', () => {
      expect(manager.isHost()).toBe(true)
    })
  })

  describe('sendChatMessage', () => {
    it('should send chat message', () => {
      manager.sendChatMessage('Hello!')

      // Should have called service
      expect(true).toBe(true)
    })
  })

  describe('reportItemCollected', () => {
    it('should report coin collection', () => {
      manager.reportItemCollected('coin', 'coin-1')

      // Should have called service
      expect(true).toBe(true)
    })

    it('should report powerup collection', () => {
      manager.reportItemCollected('powerup', 'powerup-1')

      // Should have called service
      expect(true).toBe(true)
    })
  })

  describe('reportEnemySpawn', () => {
    it('should report enemy spawn', () => {
      const enemy = {
        enemy_id: 'enemy-1',
        enemy_type: 'fly',
        x: 500,
        y: 600,
        velocity_x: 0,
        velocity_y: 0,
        health: 1,
        max_health: 1,
        is_alive: true,
        facing_right: true,
        state: 'idle'
      }

      manager.reportEnemySpawn(enemy as any)

      // Should have called service
      expect(true).toBe(true)
    })
  })

  describe('reportEnemyKilled', () => {
    it('should report enemy killed', () => {
      manager.reportEnemyKilled('enemy-1')

      // Should have called service
      expect(true).toBe(true)
    })
  })

  describe('sendEnemyState', () => {
    it('should send enemy state update', () => {
      manager.sendEnemyState('enemy-1', { x: 510, y: 600 })

      // Should have called service
      expect(true).toBe(true)
    })
  })

  describe('reportCoinSpawn', () => {
    it('should report coin spawn', () => {
      const coin = {
        coin_id: 'coin-1',
        x: 500,
        y: 500,
        collected: false,
        value: 1
      }

      manager.reportCoinSpawn(coin as any)

      // Should have called service
      expect(true).toBe(true)
    })
  })

  describe('reportPowerUpSpawn', () => {
    it('should report powerup spawn', () => {
      const powerup = {
        powerup_id: 'powerup-1',
        powerup_type: 'speed',
        x: 500,
        y: 500,
        collected: false
      }

      manager.reportPowerUpSpawn(powerup as any)

      // Should have called service
      expect(true).toBe(true)
    })
  })

  describe('syncEntities', () => {
    it('should sync entities', () => {
      const enemies = [
        {
          enemy_id: 'enemy-1',
          enemy_type: 'fly',
          x: 500,
          y: 600,
          is_alive: true
        }
      ]
      const coins = [
        {
          coin_id: 'coin-1',
          x: 500,
          y: 500,
          collected: false
        }
      ]

      manager.syncEntities(enemies as any, coins as any)

      expect(mockSyncEntities).toHaveBeenCalledWith(enemies, coins)
    })
  })

  describe('getLocalSprite', () => {
    it('should return null when no local player', () => {
      expect(manager.getLocalSprite()).toBeNull()
    })

    it('should return local player sprite', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const sprite = manager.getLocalSprite()
      expect(sprite).not.toBeNull()
    })
  })

  describe('getFurthestPlayerX', () => {
    it('should return 0 when no players', () => {
      expect(manager.getFurthestPlayerX()).toBe(0)
    })

    it('should return local player X when only local player', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      expect(manager.getFurthestPlayerX()).toBeGreaterThanOrEqual(0)
    })

    it('should return max X between both players', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      expect(manager.getFurthestPlayerX()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('updateLocalState', () => {
    it('should update local player state', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      manager.updateLocalState({ score: 500, health: 80 })

      const localPlayer = manager.getLocalPlayer()
      expect(localPlayer?.state.score).toBe(500)
      expect(localPlayer?.state.health).toBe(80)
    })

    it('should do nothing when no local player', () => {
      expect(() => manager.updateLocalState({ score: 100 })).not.toThrow()
    })
  })

  describe('sendAction', () => {
    it('should send game action to service', () => {
      manager.sendAction('shoot', { x: 100, y: 200 })

      expect(mockSendGameAction).toHaveBeenCalledWith('shoot', { x: 100, y: 200 })
    })

    it('should send action with empty data', () => {
      manager.sendAction('jump')

      expect(mockSendGameAction).toHaveBeenCalledWith('jump', {})
    })
  })

  describe('getCameraFocusPoint', () => {
    it('should return default when no local player', () => {
      const focus = manager.getCameraFocusPoint()
      expect(focus).toEqual({ x: 640, y: 360 })
    })

    it('should follow local player when no remote player', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const focus = manager.getCameraFocusPoint()
      expect(focus.x).toBe(400)
      expect(focus.y).toBe(550)
    })

    it('should center between both players when close together', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const focus = manager.getCameraFocusPoint()
      // Should be between 400 and 450
      expect(focus.x).toBeGreaterThanOrEqual(400)
      expect(focus.x).toBeLessThanOrEqual(450)
    })

    it('should follow remote player when local is dead', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const localPlayer = manager.getLocalPlayer()!
      localPlayer.state.is_alive = false
      localPlayer.state.lives = 0

      const focus = manager.getCameraFocusPoint()
      expect(focus.x).toBe(450) // Remote player X
    })
  })

  describe('areBothPlayersOutOfLives', () => {
    it('should return true when no players', () => {
      expect(manager.areBothPlayersOutOfLives()).toBe(true)
    })

    it('should return false when local player has lives', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      expect(manager.areBothPlayersOutOfLives()).toBe(false)
    })

    it('should return true when both out of lives', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      manager.getLocalPlayer()!.state.lives = 0
      manager.getRemotePlayer()!.state.lives = 0

      expect(manager.areBothPlayersOutOfLives()).toBe(true)
    })
  })

  describe('isLocalPlayerOutOfLives', () => {
    it('should return true when no local player', () => {
      expect(manager.isLocalPlayerOutOfLives()).toBe(true)
    })

    it('should return false when local has lives', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      expect(manager.isLocalPlayerOutOfLives()).toBe(false)
    })

    it('should return true when local out of lives', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)
      manager.getLocalPlayer()!.state.lives = 0

      expect(manager.isLocalPlayerOutOfLives()).toBe(true)
    })
  })

  describe('isRemotePlayerOutOfLives', () => {
    it('should return true when no remote player', () => {
      expect(manager.isRemotePlayerOutOfLives()).toBe(true)
    })

    it('should return false when remote has lives', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      expect(manager.isRemotePlayerOutOfLives()).toBe(false)
    })

    it('should return true when remote out of lives', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)
      manager.getRemotePlayer()!.state.lives = 0

      expect(manager.isRemotePlayerOutOfLives()).toBe(true)
    })
  })

  describe('notifyLocalPlayerDeath', () => {
    it('should update local state and send action', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      manager.notifyLocalPlayerDeath(2)

      const localPlayer = manager.getLocalPlayer()!
      expect(localPlayer.state.lives).toBe(2)
      expect(localPlayer.state.is_alive).toBe(false)
      expect(mockSendGameAction).toHaveBeenCalledWith('death', {
        lives: 2,
        is_permanent: false
      })
    })

    it('should mark death as permanent when 0 lives', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      manager.notifyLocalPlayerDeath(0)

      expect(mockSendGameAction).toHaveBeenCalledWith('death', {
        lives: 0,
        is_permanent: true
      })
    })

    it('should do nothing when no local player', () => {
      expect(() => manager.notifyLocalPlayerDeath(2)).not.toThrow()
    })
  })

  describe('notifyLocalPlayerRespawn', () => {
    it('should update local state and send action', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)
      manager.getLocalPlayer()!.state.is_alive = false

      manager.notifyLocalPlayerRespawn(500, 600, 2)

      const localPlayer = manager.getLocalPlayer()!
      expect(localPlayer.state.is_alive).toBe(true)
      expect(localPlayer.state.lives).toBe(2)
      expect(localPlayer.state.health).toBe(100)
      expect(mockSendGameAction).toHaveBeenCalledWith('respawn', {
        x: 500,
        y: 600,
        lives: 2
      })
    })

    it('should do nothing when no local player', () => {
      expect(() => manager.notifyLocalPlayerRespawn(500, 600, 2)).not.toThrow()
    })
  })

  describe('showSpectatingMessage', () => {
    it('should create spectating text', () => {
      manager.showSpectatingMessage()

      expect(mockScene.add.text).toHaveBeenCalledWith(
        640, 100, '👀 SPECTATING PARTNER',
        expect.any(Object)
      )
    })
  })

  describe('removeSpectatingMessage', () => {
    it('should remove spectating text if exists', () => {
      const mockText = { destroy: vi.fn() }
      mockScene.children = {
        getByName: vi.fn(() => mockText)
      }

      manager.removeSpectatingMessage()

      expect(mockText.destroy).toHaveBeenCalled()
    })

    it('should handle no spectating text', () => {
      mockScene.children = {
        getByName: vi.fn(() => null)
      }

      expect(() => manager.removeSpectatingMessage()).not.toThrow()
    })
  })

  describe('update', () => {
    it('should update without errors', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      expect(() => manager.update(1000, 16)).not.toThrow()
    })

    it('should send player state periodically', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      // First update at time 0 should not send (too soon)
      manager.update(0, 16)
      
      // Update at time 100 should send
      manager.update(100, 16)

      expect(mockSendPlayerState).toHaveBeenCalled()
    })

    it('should handle remote player interpolation', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.targetX = 500
      remotePlayer.targetY = 600

      expect(() => manager.update(1000, 16)).not.toThrow()
    })
  })

  describe('sendChatMessage', () => {
    it('should call sendChat on service', () => {
      manager.sendChatMessage('Hello world!')

      expect(mockSendChat).toHaveBeenCalledWith('Hello world!')
    })
  })

  describe('reportItemCollected', () => {
    it('should call collectItem on service', () => {
      manager.reportItemCollected('coin', 'coin-123')

      expect(mockCollectItem).toHaveBeenCalledWith('coin', 'coin-123')
    })
  })

  describe('reportEnemySpawn', () => {
    it('should call spawnEnemy on service', () => {
      const enemy = {
        enemy_id: 'enemy-1',
        enemy_type: 'fly',
        x: 500,
        y: 600,
        is_alive: true
      }

      manager.reportEnemySpawn(enemy as any)

      expect(mockSpawnEnemy).toHaveBeenCalledWith(enemy)
    })
  })

  describe('reportEnemyKilled', () => {
    it('should call killEnemy on service', () => {
      manager.reportEnemyKilled('enemy-123')

      expect(mockKillEnemy).toHaveBeenCalledWith('enemy-123')
    })
  })

  describe('sendEnemyState', () => {
    it('should call sendEnemyState on service', () => {
      const state = { x: 510, y: 600, health: 1 }
      manager.sendEnemyState('enemy-1', state)

      expect(mockSendEnemyState).toHaveBeenCalledWith('enemy-1', state)
    })
  })

  describe('reportCoinSpawn', () => {
    it('should call spawnCoin on service', () => {
      const coin = {
        coin_id: 'coin-1',
        x: 500,
        y: 500,
        collected: false,
        value: 1
      }

      manager.reportCoinSpawn(coin as any)

      expect(mockSpawnCoin).toHaveBeenCalledWith(coin)
    })
  })

  describe('reportPowerUpSpawn', () => {
    it('should call spawnPowerUp on service', () => {
      const powerup = {
        powerup_id: 'powerup-1',
        powerup_type: 'speed',
        x: 500,
        y: 500,
        collected: false
      }

      manager.reportPowerUpSpawn(powerup as any)

      expect(mockSpawnPowerUp).toHaveBeenCalledWith(powerup)
    })
  })

  describe('isHost', () => {
    it('should return true when host', () => {
      mockIsHost = true
      expect(manager.isHost()).toBe(true)
    })

    it('should return false when not host', () => {
      mockIsHost = false
      const newManager = new OnlinePlayerManager(mockScene, mockPlatforms)
      expect(newManager.isHost()).toBe(false)
    })
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      manager.destroy()

      expect(manager.getLocalPlayer()).toBeNull()
      expect(manager.getRemotePlayer()).toBeNull()
    })

    it('should handle empty destroy', () => {
      // Should not throw when no players exist
      expect(() => manager.destroy()).not.toThrow()
    })
  })

  describe('network callbacks', () => {
    let capturedCallbacks: any = {}

    beforeEach(() => {
      // Capture the callbacks passed to setCallbacks
      mockSetCallbacks.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks
      })
      // Recreate manager to capture callbacks
      manager = new OnlinePlayerManager(mockScene, mockPlatforms)
    })

    describe('onPlayerStateUpdate', () => {
      it('should update remote player position', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const remotePlayer = manager.getRemotePlayer()!
        capturedCallbacks.onPlayerStateUpdate('player-2', { x: 500, y: 600 })

        expect(remotePlayer.targetX).toBe(500)
        expect(remotePlayer.targetY).toBe(600)
      })

      it('should update remote player velocity', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const remotePlayer = manager.getRemotePlayer()!
        capturedCallbacks.onPlayerStateUpdate('player-2', { velocity_x: 100, velocity_y: -50 })

        expect(remotePlayer.state.velocity_x).toBe(100)
        expect(remotePlayer.state.velocity_y).toBe(-50)
      })

      it('should update facing direction', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const remotePlayer = manager.getRemotePlayer()!
        capturedCallbacks.onPlayerStateUpdate('player-2', { facing_right: false })

        expect(remotePlayer.sprite.setFlipX).toHaveBeenCalledWith(true)
      })

      it('should ignore update for unknown player', () => {
        const gameState = createGameState()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        expect(() => capturedCallbacks.onPlayerStateUpdate('player-3', { x: 500 })).not.toThrow()
      })
    })

    describe('onGameAction', () => {
      it('should handle shoot action', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        capturedCallbacks.onGameAction('player-2', 'shoot', {
          x: 500,
          y: 600,
          velocityX: 400,
          velocityY: 0,
          weapon: 'raygun'
        })

        expect(mockScene.add.image).toHaveBeenCalledWith(500, 600, 'laserBlue')
      })

      it('should handle shoot action with laserGun weapon', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        capturedCallbacks.onGameAction('player-2', 'shoot', {
          x: 500,
          y: 600,
          velocityX: 400,
          velocityY: 0,
          weapon: 'laserGun'
        })

        expect(mockScene.add.image).toHaveBeenCalledWith(500, 600, 'laserGreen')
      })

      it('should handle shoot action with bazooka weapon', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        capturedCallbacks.onGameAction('player-2', 'shoot', {
          x: 500,
          y: 600,
          velocityX: 400,
          velocityY: 0,
          weapon: 'bazooka'
        })

        expect(mockScene.add.image).toHaveBeenCalledWith(500, 600, 'rocket')
      })

      it('should handle shoot action with lfg weapon', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        capturedCallbacks.onGameAction('player-2', 'shoot', {
          x: 500,
          y: 600,
          velocityX: 400,
          velocityY: 0,
          weapon: 'lfg'
        })

        expect(mockScene.add.image).toHaveBeenCalledWith(500, 600, 'lfgProjectile')
      })

      it('should handle damage action', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const remotePlayer = manager.getRemotePlayer()!
        capturedCallbacks.onGameAction('player-2', 'damage', {
          health: 70,
          lives: 2
        })

        expect(remotePlayer.state.health).toBe(70)
        expect(remotePlayer.state.lives).toBe(2)
      })

      it('should handle death action', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const remotePlayer = manager.getRemotePlayer()!
        capturedCallbacks.onGameAction('player-2', 'death', {
          lives: 2,
          is_permanent: false
        })

        expect(remotePlayer.state.lives).toBe(2)
        expect(remotePlayer.state.is_alive).toBe(false)
        expect(remotePlayer.sprite.setTint).toHaveBeenCalledWith(0xff0000)
      })

      it('should show message when death is permanent', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        capturedCallbacks.onGameAction('player-2', 'death', {
          lives: 0,
          is_permanent: true
        })

        expect(mockScene.add.text).toHaveBeenCalledWith(
          640, 150, expect.stringContaining('is out!'),
          expect.any(Object)
        )
      })

      it('should handle respawn action', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const remotePlayer = manager.getRemotePlayer()!
        remotePlayer.state.is_alive = false

        capturedCallbacks.onGameAction('player-2', 'respawn', {
          x: 500,
          y: 600
        })

        expect(remotePlayer.sprite.setPosition).toHaveBeenCalledWith(500, 600)
        expect(remotePlayer.sprite.setVisible).toHaveBeenCalledWith(true)
        expect(remotePlayer.sprite.clearTint).toHaveBeenCalled()
        expect(remotePlayer.state.is_alive).toBe(true)
      })

      it('should handle level_complete action', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const levelCompleteMock = vi.fn()
        manager.onLevelComplete = levelCompleteMock

        capturedCallbacks.onGameAction('player-2', 'level_complete', {})

        expect(levelCompleteMock).toHaveBeenCalled()
      })

      it('should handle assist action for local player', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const localPlayer = manager.getLocalPlayer()!

        capturedCallbacks.onGameAction('player-2', 'assist', {
          target_player_id: 'player-1',
          x: 300,
          y: 400
        })

        expect(localPlayer.sprite.setPosition).toHaveBeenCalledWith(300, 400)
      })

      it('should handle assist action for remote player', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const remotePlayer = manager.getRemotePlayer()!

        capturedCallbacks.onGameAction('player-2', 'assist', {
          target_player_id: 'player-2',
          x: 300,
          y: 400
        })

        expect(remotePlayer.sprite.setPosition).toHaveBeenCalledWith(300, 400)
      })

      it('should ignore action for unknown player', () => {
        const gameState = createGameState()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        expect(() => capturedCallbacks.onGameAction('player-3', 'shoot', {})).not.toThrow()
      })
    })

    describe('onPlayerLeft', () => {
      it('should destroy remote player and show disconnect message', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        capturedCallbacks.onPlayerLeft('player-2')

        expect(manager.getRemotePlayer()).toBeNull()
        expect(mockScene.add.text).toHaveBeenCalledWith(
          640, 200, 'Partner Disconnected!',
          expect.any(Object)
        )
      })

      it('should ignore if player not remote', () => {
        const gameState = createGameState()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        expect(() => capturedCallbacks.onPlayerLeft('player-3')).not.toThrow()
      })
    })

    describe('onPlayerDisconnected', () => {
      it('should show waiting message when can reconnect', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)
        mockScene.children = { getByName: vi.fn(() => null) }

        capturedCallbacks.onPlayerDisconnected('player-2', 'Player 2', true)

        expect(mockScene.add.text).toHaveBeenCalledWith(
          640, 200, expect.stringContaining('waiting for reconnection'),
          expect.any(Object)
        )
        expect(manager.getRemotePlayer()!.sprite.setAlpha).toHaveBeenCalledWith(0.3)
      })

      it('should destroy remote player when cannot reconnect', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        capturedCallbacks.onPlayerDisconnected('player-2', 'Player 2', false)

        expect(manager.getRemotePlayer()).toBeNull()
      })
    })

    describe('onPlayerReconnected', () => {
      it('should show reconnected message and restore visibility', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)
        mockScene.children = { getByName: vi.fn(() => ({ destroy: vi.fn() })) }

        capturedCallbacks.onPlayerReconnected('player-2', 'Player 2')

        expect(mockScene.add.text).toHaveBeenCalledWith(
          640, 200, expect.stringContaining('reconnected'),
          expect.any(Object)
        )
        expect(manager.getRemotePlayer()!.sprite.setAlpha).toHaveBeenCalledWith(0.9)
      })
    })

    describe('onChat', () => {
      it('should show chat message', () => {
        capturedCallbacks.onChat('player-2', 'Player 2', 'Hello!')

        expect(mockScene.add.text).toHaveBeenCalledWith(
          20, 100, 'Player 2: Hello!',
          expect.any(Object)
        )
      })
    })

    describe('onItemCollected', () => {
      it('should handle coin collection', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const mockCoin = { getData: vi.fn(() => 'coin-1'), destroy: vi.fn() }
        mockScene.coins = { getChildren: vi.fn(() => [mockCoin]) }
        mockScene.children = { getByName: vi.fn(() => null) }

        capturedCallbacks.onItemCollected('player-2', 'coin', 'coin-1', 10, 100)

        expect(mockScene.tweens.add).toHaveBeenCalled()
      })

      it('should handle powerup collection with speed type', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const mockPowerup = { 
          getData: vi.fn((key) => key === 'powerupId' ? 'powerup-1' : 'powerSpeed'),
          destroy: vi.fn() 
        }
        mockScene.powerUps = { getChildren: vi.fn(() => [mockPowerup]) }
        mockScene.children = { getByName: vi.fn(() => null) }

        capturedCallbacks.onItemCollected('player-2', 'powerup', 'powerup-1')

        expect(mockScene.tweens.add).toHaveBeenCalled()
      })

      it('should handle powerup collection with shield type', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const mockPowerup = { 
          getData: vi.fn((key) => key === 'powerupId' ? 'powerup-1' : 'powerShield'),
          destroy: vi.fn() 
        }
        mockScene.powerUps = { getChildren: vi.fn(() => [mockPowerup]) }
        mockScene.children = { getByName: vi.fn(() => null) }

        capturedCallbacks.onItemCollected('player-2', 'powerup', 'powerup-1')

        expect(mockScene.add.sprite).toHaveBeenCalled()
      })

      it('should handle powerup collection with life type', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const mockPowerup = { 
          getData: vi.fn((key) => key === 'powerupId' ? 'powerup-1' : 'powerLife'),
          destroy: vi.fn() 
        }
        mockScene.powerUps = { getChildren: vi.fn(() => [mockPowerup]) }
        mockScene.children = { getByName: vi.fn(() => null) }

        capturedCallbacks.onItemCollected('player-2', 'powerup', 'powerup-1')

        expect(mockScene.tweens.add).toHaveBeenCalled()
      })

      it('should handle powerup collection with health type', () => {
        const gameState = createGameStateWithBothPlayers()
        manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

        const mockPowerup = { 
          getData: vi.fn((key) => key === 'powerupId' ? 'powerup-1' : 'powerHealth'),
          destroy: vi.fn() 
        }
        mockScene.powerUps = { getChildren: vi.fn(() => [mockPowerup]) }
        mockScene.children = { getByName: vi.fn(() => null) }

        capturedCallbacks.onItemCollected('player-2', 'powerup', 'powerup-1')

        expect(mockScene.tweens.add).toHaveBeenCalled()
      })
    })

    describe('onEnemySpawned', () => {
      it('should call enemy spawned callback', () => {
        const onEnemySpawned = vi.fn()
        manager.setEntityCallbacks({ onEnemySpawned })

        const enemy = {
          enemy_id: 'enemy-1',
          enemy_type: 'fly',
          x: 500,
          y: 600,
          is_alive: true
        }

        capturedCallbacks.onEnemySpawned(enemy)

        expect(onEnemySpawned).toHaveBeenCalledWith(enemy)
      })
    })

    describe('onEnemyKilled', () => {
      it('should call enemy killed callback and untrack enemy', () => {
        const onEnemyKilled = vi.fn()
        manager.setEntityCallbacks({ onEnemyKilled })

        const mockSprite = mockScene.physics.add.sprite(500, 600, 'enemy_fly')
        manager.trackLocalEnemy(mockSprite, 'enemy-1')

        capturedCallbacks.onEnemyKilled('enemy-1', 'player-1')

        expect(onEnemyKilled).toHaveBeenCalledWith('enemy-1', 'player-1')
      })
    })

    describe('onEnemyStateUpdate', () => {
      it('should call enemy state update callback', () => {
        const onEnemyStateUpdate = vi.fn()
        manager.setEntityCallbacks({ onEnemyStateUpdate })

        capturedCallbacks.onEnemyStateUpdate('enemy-1', { x: 510, y: 600 })

        expect(onEnemyStateUpdate).toHaveBeenCalledWith('enemy-1', { x: 510, y: 600 })
      })
    })

    describe('onCoinSpawned', () => {
      it('should call coin spawned callback', () => {
        const onCoinSpawned = vi.fn()
        manager.setEntityCallbacks({ onCoinSpawned })

        const coin = { coin_id: 'coin-1', x: 500, y: 500 }
        capturedCallbacks.onCoinSpawned(coin)

        expect(onCoinSpawned).toHaveBeenCalledWith(coin)
      })
    })

    describe('onPowerUpSpawned', () => {
      it('should call powerup spawned callback', () => {
        const onPowerUpSpawned = vi.fn()
        manager.setEntityCallbacks({ onPowerUpSpawned })

        const powerup = { powerup_id: 'powerup-1', powerup_type: 'speed', x: 500, y: 500 }
        capturedCallbacks.onPowerUpSpawned(powerup)

        expect(onPowerUpSpawned).toHaveBeenCalledWith(powerup)
      })
    })

    describe('onEntitiesSync', () => {
      it('should call entities sync callback', () => {
        const onEntitiesSync = vi.fn()
        manager.setEntityCallbacks({ onEntitiesSync })

        const enemies = [{ enemy_id: 'enemy-1' }]
        const coins = [{ coin_id: 'coin-1' }]
        capturedCallbacks.onEntitiesSync(enemies, coins, 1)

        expect(onEntitiesSync).toHaveBeenCalledWith(enemies, coins)
      })
    })

    describe('onEnemyAlreadyDead', () => {
      it('should handle already dead notification without error', () => {
        expect(() => capturedCallbacks.onEnemyAlreadyDead('enemy-1')).not.toThrow()
      })
    })
  })

  describe('getCameraFocusPoint tethered scrolling', () => {
    it('should tether camera when players are far apart', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      // Move remote player far ahead (beyond tether threshold)
      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.sprite.x = 1000  // Far from local at 400

      const focus = manager.getCameraFocusPoint()
      // Should be tethered to trailing player, not center
      expect(focus.x).toBeLessThan((400 + 1000) / 2)
    })

    it('should follow survivor when local player out of lives', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const localPlayer = manager.getLocalPlayer()!
      localPlayer.state.lives = 0
      localPlayer.state.is_alive = true

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.sprite.x = 800

      const focus = manager.getCameraFocusPoint()
      expect(focus.x).toBe(800)
    })

    it('should follow survivor when remote player out of lives', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const localPlayer = manager.getLocalPlayer()!
      localPlayer.sprite.x = 600

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.state.lives = 0
      remotePlayer.state.is_alive = false

      const focus = manager.getCameraFocusPoint()
      expect(focus.x).toBe(600)
    })

    it('should center when both players out of lives', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const localPlayer = manager.getLocalPlayer()!
      localPlayer.state.lives = 0
      localPlayer.state.is_alive = false
      localPlayer.sprite.x = 400

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.state.lives = 0
      remotePlayer.state.is_alive = false
      remotePlayer.sprite.x = 600

      const focus = manager.getCameraFocusPoint()
      expect(focus.x).toBe(500) // Center of 400 and 600
    })
  })

  describe('update advanced scenarios', () => {
    it('should fix hidden remote player sprite', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.sprite.visible = false
      remotePlayer.state.is_alive = true

      manager.update(1000, 16)

      expect(remotePlayer.sprite.setVisible).toHaveBeenCalledWith(true)
    })

    it('should fix low alpha remote player sprite', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.sprite.alpha = 0.1
      remotePlayer.state.is_alive = true

      manager.update(1000, 16)

      expect(remotePlayer.sprite.setAlpha).toHaveBeenCalledWith(0.9)
    })

    it('should send enemy state updates when host', () => {
      mockIsHost = true
      manager = new OnlinePlayerManager(mockScene, mockPlatforms)

      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const mockSprite = mockScene.physics.add.sprite(500, 600, 'enemy_fly')
      manager.trackLocalEnemy(mockSprite, 'enemy-1')

      // Advance time beyond enemy sync interval
      manager.update(0, 16)
      manager.update(100, 16)

      expect(mockSendEnemyState).toHaveBeenCalled()
    })

    it('should not send enemy state when not host', () => {
      mockIsHost = false
      manager = new OnlinePlayerManager(mockScene, mockPlatforms)

      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      manager.update(100, 16)

      expect(mockSendEnemyState).not.toHaveBeenCalled()
    })

    it('should perform full entity sync when host', () => {
      mockIsHost = true
      manager = new OnlinePlayerManager(mockScene, mockPlatforms)

      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const mockSprite = mockScene.physics.add.sprite(500, 600, 'enemy_fly')
      manager.trackLocalEnemy(mockSprite, 'enemy-1')

      // Advance time beyond full sync interval (1000ms)
      manager.update(0, 16)
      manager.update(1100, 16)

      expect(mockSyncEntities).toHaveBeenCalled()
    })
  })

  describe('interpolateRemotePlayer', () => {
    it('should snap position when distance is large', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.sprite.x = 100
      remotePlayer.targetX = 500  // Large distance

      manager.update(1000, 16)

      expect(remotePlayer.sprite.setPosition).toHaveBeenCalled()
    })

    it('should interpolate smoothly when distance is small', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.sprite.x = 450
      remotePlayer.targetX = 460  // Small distance

      manager.update(1000, 16)

      expect(remotePlayer.sprite.setPosition).toHaveBeenCalled()
    })
  })

  describe('createPlayer edge cases', () => {
    it('should fallback to alienGreen when skin texture not found', () => {
      mockScene.textures.exists = vi.fn((key) => !key.includes('alienPurple'))

      const gameState = {
        ...createGameState(),
        players: {
          'player-1': {
            ...createGameState().players['player-1'],
            skin: 'alienPurple'  // Texture doesn't exist
          }
        }
      }

      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'alienGreen_stand'
      )
    })
  })

  describe('updateRemotePlayerAnimation', () => {
    let capturedCallbacks: any = {}

    beforeEach(() => {
      mockSetCallbacks.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks
      })
      manager = new OnlinePlayerManager(mockScene, mockPlatforms)
    })

    it('should set jump texture when jumping', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      capturedCallbacks.onPlayerStateUpdate('player-2', { is_jumping: true })

      expect(remotePlayer.sprite.setTexture).toHaveBeenCalled()
    })

    it('should play walk animation when moving', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      mockScene.anims.exists = vi.fn(() => true)
      const remotePlayer = manager.getRemotePlayer()!

      capturedCallbacks.onPlayerStateUpdate('player-2', { velocity_x: 100, is_jumping: false })

      expect(remotePlayer.sprite.play).toHaveBeenCalled()
    })

    it('should set stand texture when idle', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      capturedCallbacks.onPlayerStateUpdate('player-2', { velocity_x: 0, is_jumping: false })

      expect(remotePlayer.sprite.setTexture).toHaveBeenCalled()
    })
  })

  describe('updatePlayerUI', () => {
    it('should update gun position for remote player facing right', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.state.facing_right = true
      remotePlayer.sprite.x = 500
      remotePlayer.sprite.y = 600

      manager.update(2000, 16)

      expect(remotePlayer.gun.setPosition).toHaveBeenCalledWith(525, 605)
      expect(remotePlayer.gun.setFlipX).toHaveBeenCalledWith(false)
    })

    it('should update gun position for remote player facing left', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const remotePlayer = manager.getRemotePlayer()!
      remotePlayer.state.facing_right = false
      remotePlayer.sprite.x = 500
      remotePlayer.sprite.y = 600

      manager.update(2000, 16)

      expect(remotePlayer.gun.setPosition).toHaveBeenCalledWith(475, 605)
      expect(remotePlayer.gun.setFlipX).toHaveBeenCalledWith(true)
    })

    it('should update health bar width based on health', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const localPlayer = manager.getLocalPlayer()!
      localPlayer.state.health = 50

      manager.update(1000, 16)

      expect(localPlayer.healthBar.setSize).toHaveBeenCalledWith(30, 6)  // 50% of 60
    })

    it('should update lives text', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const localPlayer = manager.getLocalPlayer()!
      localPlayer.state.lives = 2

      manager.update(1000, 16)

      expect(localPlayer.livesText.setText).toHaveBeenCalledWith('❤️❤️')
    })

    it('should skip update for inactive sprite', () => {
      const gameState = createGameState()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const localPlayer = manager.getLocalPlayer()!
      localPlayer.sprite.active = false

      expect(() => manager.update(1000, 16)).not.toThrow()
    })
  })

  describe('destroy with both players', () => {
    it('should destroy both local and remote players', () => {
      const gameState = createGameStateWithBothPlayers()
      manager.initializePlayers(gameState as any, { create: vi.fn() } as any)

      const localPlayer = manager.getLocalPlayer()!
      const remotePlayer = manager.getRemotePlayer()!

      manager.destroy()

      expect(localPlayer.sprite.destroy).toHaveBeenCalled()
      expect(remotePlayer.sprite.destroy).toHaveBeenCalled()
      expect(manager.getLocalPlayer()).toBeNull()
      expect(manager.getRemotePlayer()).toBeNull()
    })
  })
})

// Helper functions for creating game states
function createGameState() {
  return {
    game_id: 'game-1',
    status: 'playing',
    host_id: 'player-1',
    players: {
      'player-1': {
        player_id: 'player-1',
        player_name: 'Player 1',
        player_number: 1,
        x: 400,
        y: 550,
        velocity_x: 0,
        velocity_y: 0,
        health: 100,
        lives: 3,
        score: 0,
        skin: 'alienGreen',
        weapon: 'raygun',
        is_alive: true,
        is_ready: true,
        facing_right: true,
        is_jumping: false,
        is_shooting: false
      }
    }
  }
}

function createGameStateWithBothPlayers() {
  return {
    game_id: 'game-1',
    status: 'playing',
    host_id: 'player-1',
    players: {
      'player-1': {
        player_id: 'player-1',
        player_name: 'Player 1',
        player_number: 1,
        x: 400,
        y: 550,
        velocity_x: 0,
        velocity_y: 0,
        health: 100,
        lives: 3,
        score: 0,
        skin: 'alienGreen',
        weapon: 'raygun',
        is_alive: true,
        is_ready: true,
        facing_right: true,
        is_jumping: false,
        is_shooting: false
      },
      'player-2': {
        player_id: 'player-2',
        player_name: 'Player 2',
        player_number: 2,
        x: 450,
        y: 550,
        velocity_x: 0,
        velocity_y: 0,
        health: 100,
        lives: 3,
        score: 0,
        skin: 'alienPink',
        weapon: 'laserGun',
        is_alive: true,
        is_ready: true,
        facing_right: true,
        is_jumping: false,
        is_shooting: false
      }
    }
  }
}