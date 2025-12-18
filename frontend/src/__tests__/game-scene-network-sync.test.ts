import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Comprehensive mock factory for sprites
const createSpriteMock = (options: any = {}) => {
  const dataStore: Record<string, any> = {
    enemyId: options.enemyId,
    enemyType: options.enemyType || 'fly',
    health: options.health || 100,
    maxHealth: options.maxHealth || 100,
    coinId: options.coinId,
    powerupId: options.powerupId,
    ...options.data
  }
  
  return {
    setOrigin: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockImplementation(function(x: number, y: number) {
      (this as any).x = x;
      (this as any).y = y
      return this
    }),
    setCollideWorldBounds: vi.fn().mockReturnThis(),
    setBounce: vi.fn().mockReturnThis(),
    setVelocity: vi.fn().mockReturnThis(),
    setVelocityX: vi.fn().mockReturnThis(),
    setVelocityY: vi.fn().mockReturnThis(),
    setDragX: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    setData: vi.fn().mockImplementation(function(key: string, value: any) {
      dataStore[key] = value
      return this
    }),
    getData: vi.fn().mockImplementation((key: string) => dataStore[key]),
    clearTint: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
    setFlipX: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setPushable: vi.fn().mockReturnThis(),
    setImmovable: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setActive: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    active: options.active !== undefined ? options.active : true,
    visible: true,
    x: options.x || 400,
    y: options.y || 550,
    scaleX: options.scaleX || 1,
    width: 70,
    height: 90,
    body: {
      setSize: vi.fn().mockReturnThis(),
      setOffset: vi.fn().mockReturnThis(),
      setMass: vi.fn().mockReturnThis(),
      setMaxVelocity: vi.fn().mockReturnThis(),
      setAllowGravity: vi.fn().mockReturnThis(),
      velocity: { x: 0, y: 0 }
    }
  }
}

// Mock Phaser module
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
      children = { list: [] }
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
          setBackgroundColor: vi.fn(),
          fadeIn: vi.fn(),
          fadeOut: vi.fn(),
          startFollow: vi.fn(),
          setBounds: vi.fn(),
          scrollX: 0,
          scrollY: 0
        }
      }
      add = {
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        rectangle: vi.fn().mockReturnValue({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        sprite: vi.fn().mockImplementation(() => createSpriteMock()),
        image: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }),
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          generateTexture: vi.fn(),
          destroy: vi.fn()
        }),
        particles: vi.fn().mockReturnValue({
          createEmitter: vi.fn().mockReturnValue({
            explode: vi.fn()
          }),
          destroy: vi.fn()
        }),
        group: vi.fn().mockReturnValue({
          add: vi.fn(),
          create: vi.fn().mockImplementation(() => createSpriteMock()),
          clear: vi.fn(),
          getChildren: vi.fn().mockReturnValue([]),
          getLength: vi.fn().mockReturnValue(0)
        })
      }
      physics = {
        add: {
          sprite: vi.fn().mockImplementation(() => createSpriteMock()),
          group: vi.fn().mockReturnValue({
            create: vi.fn().mockImplementation(() => createSpriteMock()),
            getChildren: vi.fn().mockReturnValue([]),
            add: vi.fn()
          }),
          collider: vi.fn(),
          overlap: vi.fn()
        }
      }
      input = {
        activePointer: { x: 500, y: 300, isDown: false },
        keyboard: {
          addKey: vi.fn().mockReturnValue({ isDown: false }),
          createCursorKeys: vi.fn().mockReturnValue({
            up: { isDown: false },
            down: { isDown: false },
            left: { isDown: false },
            right: { isDown: false }
          })
        },
        on: vi.fn(),
        gamepad: { on: vi.fn() }
      }
      tweens = {
        add: vi.fn().mockImplementation((config) => {
          if (config.onComplete) config.onComplete()
          return { stop: vi.fn() }
        }),
        killAll: vi.fn()
      }
      time = {
        addEvent: vi.fn().mockReturnValue({ destroy: vi.fn() }),
        delayedCall: vi.fn().mockImplementation((delay, callback) => {
          setTimeout(callback, 0)
          return { destroy: vi.fn() }
        }),
        removeAllEvents: vi.fn(),
        now: 1000
      }
      textures = {
        exists: vi.fn().mockReturnValue(true)
      }
      make = {
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          generateTexture: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })
      }
      sound = {
        add: vi.fn().mockReturnValue({ play: vi.fn(), stop: vi.fn() }),
        stopAll: vi.fn()
      }
      scene = {
        start: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        launch: vi.fn(),
        manager: { getScene: vi.fn() }
      }
    },
    Math: {
      Linear: (a: number, b: number, t: number) => a + (b - a) * t,
      Between: vi.fn().mockReturnValue(50),
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => 
          Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1))
      }
    },
    Physics: {
      Arcade: {
        Sprite: class {},
        Body: class {}
      }
    }
  }
  return { default: Phaser, ...Phaser }
})

// Mock all game services
vi.mock('../services/GameAPI', () => ({
  GameAPI: {
    submitScore: vi.fn().mockResolvedValue({}),
    getAllBosses: vi.fn().mockResolvedValue([]),
    saveGame: vi.fn().mockResolvedValue(true),
    deleteSave: vi.fn().mockResolvedValue(true)
  }
}))

vi.mock('../services/OnlineService', () => ({
  OnlineService: {
    getInstance: vi.fn().mockReturnValue({
      isHost: vi.fn().mockReturnValue(false),
      reportCoinSpawn: vi.fn(),
      reportPowerUpSpawn: vi.fn(),
      reportEnemySpawn: vi.fn(),
      reportEnemyKilled: vi.fn()
    })
  }
}))

// Create UIManager mock
class MockUIManager {
  updateScore = vi.fn()
  updateLives = vi.fn()
  updateCoins = vi.fn()
  updateHealth = vi.fn()
  showTip = vi.fn()
  updateLevel = vi.fn()
  updateAIStatus = vi.fn()
  closeInGameChat = vi.fn()
  showLoadingProgress = vi.fn()
  hideLoadingProgress = vi.fn()
  create = vi.fn()
  destroy = vi.fn()
}

vi.mock('../managers/UIManager', () => ({
  UIManager: vi.fn().mockImplementation(() => new MockUIManager())
}))

// Mock MusicManager
vi.mock('../utils/MusicManager', () => ({
  MusicManager: vi.fn().mockImplementation(() => ({
    preload: vi.fn(),
    playMenuMusic: vi.fn(),
    playGameMusic: vi.fn(),
    stopMusic: vi.fn()
  }))
}))

// Mock AudioManager
vi.mock('../managers/AudioManager', () => ({
  AudioManager: vi.fn().mockImplementation(() => ({
    preload: vi.fn(),
    playJump: vi.fn(),
    playCoin: vi.fn(),
    playDamage: vi.fn(),
    playDeath: vi.fn(),
    playShoot: vi.fn(),
    playBossSound: vi.fn()
  }))
}))

// Mock OnlinePlayerManager
vi.mock('../managers/OnlinePlayerManager', () => ({
  OnlinePlayerManager: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }))
}))

// Mock WorldGenerator
vi.mock('../utils/WorldGenerator', () => ({
  WorldGenerator: vi.fn().mockImplementation(() => ({
    generateWorld: vi.fn().mockReturnValue(1000),
    generateChunk: vi.fn()
  }))
}))

// Mock CoopPlayerManager
vi.mock('../managers/CoopPlayerManager', () => ({
  CoopPlayerManager: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }))
}))

// Mock AIPlayer
vi.mock('../utils/AIPlayer', () => ({
  AIPlayer: vi.fn().mockImplementation(() => ({
    getDecision: vi.fn().mockReturnValue({
      moveLeft: false,
      moveRight: true,
      jump: false,
      shoot: false
    })
  }))
}))

// Mock MLAIPlayer
vi.mock('../utils/MLAIPlayer', () => ({
  MLAIPlayer: vi.fn().mockImplementation(() => ({
    getDecision: vi.fn().mockReturnValue({
      moveLeft: false,
      moveRight: true,
      jump: false,
      shoot: false
    }),
    captureGameState: vi.fn().mockReturnValue({}),
    isModelTrained: vi.fn().mockReturnValue(false)
  }))
}))

// Mock DQNAgent
vi.mock('../utils/DQNAgent', () => ({
  DQNAgent: vi.fn().mockImplementation(() => ({
    selectAction: vi.fn().mockReturnValue(0),
    storeExperience: vi.fn(),
    train: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn()
  }))
}))

// Mock BossManager
vi.mock('../managers/BossManager', () => ({
  BossManager: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    update: vi.fn(),
    spawnBoss: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  }))
}))

describe('GameScene - Network Sync Handlers', () => {
  let GameScene: any
  let scene: any
  
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Import GameScene dynamically
    const module = await import('../scenes/GameScene')
    GameScene = module.default
    
    scene = new GameScene()
    scene.sys = {
      settings: { data: {} },
      game: {
        device: { os: { desktop: true } },
        canvas: { width: 1280, height: 720 }
      }
    }
    
    // Setup scene properties
    scene.cameras = {
      main: {
        width: 1280,
        height: 720,
        setBackgroundColor: vi.fn(),
        fadeIn: vi.fn(),
        startFollow: vi.fn(),
        setBounds: vi.fn(),
        scrollX: 0
      }
    }
    
    scene.add = {
      text: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }),
      rectangle: vi.fn().mockReturnValue({
        setStrokeStyle: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }),
      sprite: vi.fn().mockImplementation(() => createSpriteMock()),
      image: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }),
      graphics: vi.fn().mockReturnValue({
        fillStyle: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        generateTexture: vi.fn(),
        destroy: vi.fn()
      }),
      particles: vi.fn().mockReturnValue({
        createEmitter: vi.fn().mockReturnValue({ explode: vi.fn() }),
        destroy: vi.fn()
      })
    }
    
    scene.physics = {
      add: {
        sprite: vi.fn().mockImplementation(() => createSpriteMock()),
        group: vi.fn().mockReturnValue({
          create: vi.fn().mockImplementation((x: number, y: number, key: string) => 
            createSpriteMock({ x, y })
          ),
          getChildren: vi.fn().mockReturnValue([]),
          add: vi.fn()
        }),
        collider: vi.fn(),
        overlap: vi.fn()
      }
    }
    
    scene.tweens = {
      add: vi.fn().mockImplementation((config) => {
        if (config.onComplete) config.onComplete()
        return { stop: vi.fn() }
      }),
      killAll: vi.fn()
    }
    
    scene.time = {
      addEvent: vi.fn().mockReturnValue({ destroy: vi.fn() }),
      delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn() }),
      now: 1000
    }
    
    scene.textures = {
      exists: vi.fn().mockReturnValue(true)
    }
    
    scene.events = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    }
    
    scene.input = {
      activePointer: { x: 500, y: 300, isDown: false },
      keyboard: {
        addKey: vi.fn().mockReturnValue({ isDown: false }),
        createCursorKeys: vi.fn().mockReturnValue({
          up: { isDown: false },
          down: { isDown: false },
          left: { isDown: false },
          right: { isDown: false }
        })
      },
      on: vi.fn(),
      gamepad: { on: vi.fn() }
    }
    
    // Initialize game state
    scene.isOnlineMode = true
    scene.isOnlineHost = false
    scene.remoteEnemies = new Map()
    scene.remoteCoins = new Map()
    scene.farthestPlayerX = 0
    scene.currentLevel = 1
    scene.gameMode = 'endless'
    scene.score = 0
    scene.enemiesDefeated = 0
    
    scene.uiManager = new MockUIManager()
    
    // Mock enemy group
    scene.enemies = {
      create: vi.fn().mockImplementation((x: number, y: number, texture: string) => 
        createSpriteMock({ x, y, enemyType: texture })
      ),
      getChildren: vi.fn().mockReturnValue([])
    }
    
    // Mock coins group
    scene.coins = {
      create: vi.fn().mockImplementation((x: number, y: number) => 
        createSpriteMock({ x, y })
      ),
      getChildren: vi.fn().mockReturnValue([])
    }
    
    // Mock powerUps group
    scene.powerUps = {
      create: vi.fn().mockImplementation((x: number, y: number, type: string) => 
        createSpriteMock({ x, y })
      ),
      getChildren: vi.fn().mockReturnValue([])
    }
    
    // Mock player
    scene.player = createSpriteMock({ x: 100, y: 500 })
    
    // Mock dropCoins method
    scene.dropCoins = vi.fn()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================
  // handleRemoteEnemyStateUpdate Tests
  // ==========================================
  
  describe('handleRemoteEnemyStateUpdate', () => {
    it('should snap position when distance > 50', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 100, enemyId: 'enemy_1' })
      scene.remoteEnemies.set('enemy_1', enemySprite)
      
      const state = {
        x: 200, // 100 units away - above threshold
        y: 200,
        velocity_x: 10,
        velocity_y: 0,
        health: 80,
        is_alive: true
      }
      
      // Call the private method
      const handler = scene['handleRemoteEnemyStateUpdate']
      if (handler) {
        handler.call(scene, 'enemy_1', state)
        
        // Should snap to new position
        expect(enemySprite.setPosition).toHaveBeenCalled()
      }
    })
    
    it('should lerp position when distance < 50', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 100, enemyId: 'enemy_1' })
      scene.remoteEnemies.set('enemy_1', enemySprite)
      
      const state = {
        x: 120, // Only 20 units away - below threshold
        y: 110,
        velocity_x: 5,
        velocity_y: 0,
        health: 100,
        is_alive: true
      }
      
      const handler = scene['handleRemoteEnemyStateUpdate']
      if (handler) {
        handler.call(scene, 'enemy_1', state)
        
        // Should interpolate position
        expect(enemySprite.setPosition).toHaveBeenCalled()
      }
    })
    
    it('should update velocity from state', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 100, enemyId: 'enemy_1' })
      scene.remoteEnemies.set('enemy_1', enemySprite)
      
      const state = {
        x: 105,
        y: 100,
        velocity_x: 50,
        velocity_y: -100,
        health: 100,
        is_alive: true
      }
      
      const handler = scene['handleRemoteEnemyStateUpdate']
      if (handler) {
        handler.call(scene, 'enemy_1', state)
        
        expect(enemySprite.setVelocity).toHaveBeenCalledWith(50, -100)
      }
    })
    
    it('should update health when provided', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 100, enemyId: 'enemy_1', health: 100 })
      scene.remoteEnemies.set('enemy_1', enemySprite)
      
      const state = {
        x: 105,
        y: 100,
        velocity_x: 0,
        velocity_y: 0,
        health: 50,
        is_alive: true
      }
      
      const handler = scene['handleRemoteEnemyStateUpdate']
      if (handler) {
        handler.call(scene, 'enemy_1', state)
        
        expect(enemySprite.setData).toHaveBeenCalledWith('health', 50)
      }
    })
    
    it('should apply red tint when enemy is not alive', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 100, enemyId: 'enemy_1' })
      scene.remoteEnemies.set('enemy_1', enemySprite)
      
      const state = {
        x: 105,
        y: 100,
        velocity_x: 0,
        velocity_y: 0,
        health: 0,
        is_alive: false
      }
      
      const handler = scene['handleRemoteEnemyStateUpdate']
      if (handler) {
        handler.call(scene, 'enemy_1', state)
        
        expect(enemySprite.setTint).toHaveBeenCalledWith(0xff0000)
      }
    })
    
    it('should find enemy in local group if not in remoteEnemies', () => {
      const enemySprite = createSpriteMock({ x: 100, y: 100, enemyId: 'enemy_1' })
      scene.enemies.getChildren = vi.fn().mockReturnValue([enemySprite])
      
      const state = {
        x: 110,
        y: 105,
        velocity_x: 0,
        velocity_y: 0,
        is_alive: true
      }
      
      const handler = scene['handleRemoteEnemyStateUpdate']
      if (handler) {
        handler.call(scene, 'enemy_1', state)
        
        expect(scene.enemies.getChildren).toHaveBeenCalled()
      }
    })
    
    it('should return early if enemy not found', () => {
      const state = {
        x: 110,
        y: 105,
        velocity_x: 0,
        velocity_y: 0,
        is_alive: true
      }
      
      const handler = scene['handleRemoteEnemyStateUpdate']
      if (handler) {
        // Should not throw
        expect(() => handler.call(scene, 'nonexistent', state)).not.toThrow()
      }
    })
  })

  // ==========================================
  // handleRemoteCoinSpawn Tests
  // ==========================================
  
  describe('handleRemoteCoinSpawn', () => {
    it('should skip spawn when isOnlineHost is true', () => {
      scene.isOnlineHost = true
      
      const coinState = {
        coin_id: 'coin_1',
        x: 500,
        y: 400,
        value: 1
      }
      
      const handler = scene['handleRemoteCoinSpawn']
      if (handler) {
        handler.call(scene, coinState)
        
        // Should not create coin
        expect(scene.coins.create).not.toHaveBeenCalled()
      }
    })
    
    it('should skip if coin already in remoteCoins', () => {
      scene.isOnlineHost = false
      const existingCoin = createSpriteMock({ coinId: 'coin_1' })
      scene.remoteCoins.set('coin_1', existingCoin)
      
      const coinState = {
        coin_id: 'coin_1',
        x: 500,
        y: 400,
        value: 1
      }
      
      const handler = scene['handleRemoteCoinSpawn']
      if (handler) {
        handler.call(scene, coinState)
        
        expect(scene.coins.create).not.toHaveBeenCalled()
      }
    })
    
    it('should sync existing coin position if found locally', () => {
      scene.isOnlineHost = false
      const existingCoin = createSpriteMock({ x: 490, y: 390, coinId: 'coin_1' })
      scene.coins.getChildren = vi.fn().mockReturnValue([existingCoin])
      
      const coinState = {
        coin_id: 'coin_1',
        x: 500,
        y: 400,
        value: 1
      }
      
      const handler = scene['handleRemoteCoinSpawn']
      if (handler) {
        handler.call(scene, coinState)
        
        expect(existingCoin.setPosition).toHaveBeenCalledWith(500, 400)
        expect(scene.remoteCoins.get('coin_1')).toBe(existingCoin)
      }
    })
    
    it('should create new coin sprite with correct properties', () => {
      scene.isOnlineHost = false
      const newCoin = createSpriteMock({ x: 500, y: 400 })
      scene.coins.create = vi.fn().mockReturnValue(newCoin)
      
      const coinState = {
        coin_id: 'coin_level_1',
        x: 500,
        y: 400,
        value: 5
      }
      
      const handler = scene['handleRemoteCoinSpawn']
      if (handler) {
        handler.call(scene, coinState)
        
        expect(scene.coins.create).toHaveBeenCalledWith(500, 400, 'coin')
        expect(newCoin.setScale).toHaveBeenCalledWith(0.5)
        expect(newCoin.setBounce).toHaveBeenCalledWith(0.3)
        expect(newCoin.setData).toHaveBeenCalledWith('coinId', 'coin_level_1')
        expect(newCoin.setData).toHaveBeenCalledWith('value', 5)
      }
    })
    
    it('should apply gravity for dropped coins (coin_drop_ prefix)', () => {
      scene.isOnlineHost = false
      const droppedCoin = createSpriteMock({ x: 500, y: 400 })
      scene.coins.create = vi.fn().mockReturnValue(droppedCoin)
      
      const coinState = {
        coin_id: 'coin_drop_123',
        x: 500,
        y: 400,
        value: 1,
        velocity_x: 50,
        velocity_y: -100
      }
      
      const handler = scene['handleRemoteCoinSpawn']
      if (handler) {
        handler.call(scene, coinState)
        
        expect(droppedCoin.body.setAllowGravity).toHaveBeenCalledWith(true)
        expect(droppedCoin.setVelocity).toHaveBeenCalledWith(50, -100)
        expect(droppedCoin.setDragX).toHaveBeenCalledWith(200)
      }
    })
    
    it('should apply floating animation for static coins', () => {
      scene.isOnlineHost = false
      const staticCoin = createSpriteMock({ x: 500, y: 400 })
      scene.coins.create = vi.fn().mockReturnValue(staticCoin)
      
      const coinState = {
        coin_id: 'coin_level_5',
        x: 500,
        y: 400,
        value: 1
      }
      
      const handler = scene['handleRemoteCoinSpawn']
      if (handler) {
        handler.call(scene, coinState)
        
        expect(staticCoin.body.setAllowGravity).toHaveBeenCalledWith(false)
        // Floating animation tween should be added
        expect(scene.tweens.add).toHaveBeenCalled()
      }
    })
  })

  // ==========================================
  // handleRemotePowerUpSpawn Tests
  // ==========================================
  
  describe('handleRemotePowerUpSpawn', () => {
    it('should skip spawn when isOnlineHost is true', () => {
      scene.isOnlineHost = true
      
      const powerupState = {
        powerup_id: 'powerup_1',
        x: 500,
        y: 400,
        type: 'speed'
      }
      
      const handler = scene['handleRemotePowerUpSpawn']
      if (handler) {
        handler.call(scene, powerupState)
        
        expect(scene.powerUps.create).not.toHaveBeenCalled()
      }
    })
    
    it('should sync existing powerup position if found locally', () => {
      scene.isOnlineHost = false
      const existingPowerUp = createSpriteMock({ x: 490, y: 390, powerupId: 'powerup_1' })
      scene.powerUps.getChildren = vi.fn().mockReturnValue([existingPowerUp])
      
      const powerupState = {
        powerup_id: 'powerup_1',
        x: 500,
        y: 400,
        type: 'speed'
      }
      
      const handler = scene['handleRemotePowerUpSpawn']
      if (handler) {
        handler.call(scene, powerupState)
        
        expect(existingPowerUp.setPosition).toHaveBeenCalledWith(500, 400)
      }
    })
    
    it('should create new powerup with floating and glow animations', () => {
      scene.isOnlineHost = false
      const newPowerUp = createSpriteMock({ x: 500, y: 400 })
      scene.powerUps.create = vi.fn().mockReturnValue(newPowerUp)
      
      const powerupState = {
        powerup_id: 'powerup_2',
        x: 500,
        y: 400,
        type: 'shield'
      }
      
      const handler = scene['handleRemotePowerUpSpawn']
      if (handler) {
        handler.call(scene, powerupState)
        
        expect(scene.powerUps.create).toHaveBeenCalledWith(500, 400, 'shield')
        expect(newPowerUp.setScale).toHaveBeenCalledWith(0.6)
        expect(newPowerUp.setBounce).toHaveBeenCalledWith(0.2)
        expect(newPowerUp.setData).toHaveBeenCalledWith('powerupId', 'powerup_2')
        expect(newPowerUp.setData).toHaveBeenCalledWith('type', 'shield')
        // Should add both floating and glow animations
        expect(scene.tweens.add).toHaveBeenCalled()
      }
    })
  })

  // ==========================================
  // handleEntitiesSync Tests
  // ==========================================
  
  describe('handleEntitiesSync', () => {
    it('should update existing enemy in remoteEnemies map', () => {
      const existingEnemy = createSpriteMock({ x: 100, y: 100, enemyId: 'enemy_1' })
      scene.remoteEnemies.set('enemy_1', existingEnemy)
      
      const enemies = [{
        enemy_id: 'enemy_1',
        x: 150,
        y: 100,
        velocity_x: 10,
        velocity_y: 0,
        is_alive: true
      }]
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, enemies, [])
        
        // Should update position
        expect(existingEnemy.setPosition).toHaveBeenCalled()
      }
    })
    
    it('should find enemy in local group and add to remoteEnemies', () => {
      const localEnemy = createSpriteMock({ x: 200, y: 300, enemyId: 'enemy_2' })
      scene.enemies.getChildren = vi.fn().mockReturnValue([localEnemy])
      
      const enemies = [{
        enemy_id: 'enemy_2',
        x: 200,
        y: 300,
        velocity_x: 0,
        velocity_y: 0,
        is_alive: true
      }]
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, enemies, [])
        
        expect(scene.remoteEnemies.get('enemy_2')).toBe(localEnemy)
      }
    })
    
    it('should spawn new enemy if not found and is_alive', () => {
      scene.enemies.getChildren = vi.fn().mockReturnValue([])
      
      const enemies = [{
        enemy_id: 'new_enemy_1',
        enemy_type: 'fly',
        x: 500,
        y: 400,
        velocity_x: 0,
        velocity_y: 0,
        health: 50,
        max_health: 50,
        is_alive: true,
        scale: 1
      }]
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, enemies, [])
        
        // Should trigger handleRemoteEnemySpawn
        // The enemy should be created
        expect(scene.enemies.create).toHaveBeenCalled()
      }
    })
    
    it('should remove stale enemies from remoteEnemies', () => {
      scene.isOnlineHost = false
      const staleEnemy = createSpriteMock({ enemyId: 'stale_enemy', active: true })
      scene.remoteEnemies.set('stale_enemy', staleEnemy)
      
      // Empty enemies list from server
      const enemies: any[] = []
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, enemies, [])
        
        expect(staleEnemy.destroy).toHaveBeenCalled()
        expect(scene.remoteEnemies.has('stale_enemy')).toBe(false)
      }
    })
    
    it('should remove untracked stale enemies from local group', () => {
      scene.isOnlineHost = false
      const untrackedEnemy = createSpriteMock({ enemyId: 'untracked_1', active: true })
      scene.enemies.getChildren = vi.fn().mockReturnValue([untrackedEnemy])
      
      // Empty enemies list from server
      const enemies: any[] = []
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, enemies, [])
        
        expect(untrackedEnemy.destroy).toHaveBeenCalled()
      }
    })
    
    it('should sync coin positions when significantly different', () => {
      scene.isOnlineHost = false
      const existingCoin = createSpriteMock({ x: 490, y: 390, coinId: 'coin_1' })
      scene.remoteCoins.set('coin_1', existingCoin)
      
      const coins = [{
        coin_id: 'coin_1',
        x: 500, // 10 units difference - above 5 threshold
        y: 400,
        is_collected: false
      }]
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, [], coins)
        
        expect(existingCoin.setPosition).toHaveBeenCalledWith(500, 400)
      }
    })
    
    it('should destroy collected coins', () => {
      scene.isOnlineHost = false
      const collectedCoin = createSpriteMock({ coinId: 'coin_2', active: true })
      scene.remoteCoins.set('coin_2', collectedCoin)
      
      const coins = [{
        coin_id: 'coin_2',
        x: 500,
        y: 400,
        is_collected: true
      }]
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, [], coins)
        
        expect(collectedCoin.destroy).toHaveBeenCalled()
      }
    })
    
    it('should spawn new coins not in local', () => {
      scene.isOnlineHost = false
      scene.coins.getChildren = vi.fn().mockReturnValue([])
      const newCoin = createSpriteMock({ x: 600, y: 350 })
      scene.coins.create = vi.fn().mockReturnValue(newCoin)
      
      const coins = [{
        coin_id: 'new_coin_1',
        x: 600,
        y: 350,
        value: 1,
        is_collected: false
      }]
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, [], coins)
        
        expect(scene.coins.create).toHaveBeenCalled()
      }
    })
    
    it('should remove untracked stale coins from local group', () => {
      scene.isOnlineHost = false
      const staleCoin = createSpriteMock({ coinId: 'stale_coin', active: true })
      scene.coins.getChildren = vi.fn().mockReturnValue([staleCoin])
      
      // Empty coins list from server
      const coins: any[] = []
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, [], coins)
        
        expect(staleCoin.destroy).toHaveBeenCalled()
      }
    })
    
    it('should not remove entities when isOnlineHost is true', () => {
      scene.isOnlineHost = true
      const staleEnemy = createSpriteMock({ enemyId: 'stale_enemy', active: true })
      scene.remoteEnemies.set('stale_enemy', staleEnemy)
      
      const handler = scene['handleEntitiesSync']
      if (handler) {
        handler.call(scene, [], [])
        
        // Host should not have its entities removed
        expect(staleEnemy.destroy).not.toHaveBeenCalled()
      }
    })
  })

  // ==========================================
  // handleRemoteEnemySpawn Tests
  // ==========================================
  
  describe('handleRemoteEnemySpawn', () => {
    it('should skip spawn when isOnlineHost is true', () => {
      scene.isOnlineHost = true
      
      const enemyState = {
        enemy_id: 'enemy_1',
        enemy_type: 'fly',
        x: 500,
        y: 400,
        health: 50,
        max_health: 50,
        scale: 1
      }
      
      const handler = scene['handleRemoteEnemySpawn']
      if (handler) {
        handler.call(scene, enemyState)
        
        expect(scene.enemies.create).not.toHaveBeenCalled()
      }
    })
    
    it('should skip if enemy already in remoteEnemies', () => {
      scene.isOnlineHost = false
      const existingEnemy = createSpriteMock({ enemyId: 'enemy_1' })
      scene.remoteEnemies.set('enemy_1', existingEnemy)
      
      const enemyState = {
        enemy_id: 'enemy_1',
        enemy_type: 'fly',
        x: 500,
        y: 400,
        health: 50,
        max_health: 50,
        scale: 1
      }
      
      const handler = scene['handleRemoteEnemySpawn']
      if (handler) {
        handler.call(scene, enemyState)
        
        expect(scene.enemies.create).not.toHaveBeenCalled()
      }
    })
    
    it('should force sync existing local enemy with server state', () => {
      scene.isOnlineHost = false
      const localEnemy = createSpriteMock({ x: 490, y: 390, enemyId: 'enemy_2', enemyType: 'fly' })
      scene.enemies.getChildren = vi.fn().mockReturnValue([localEnemy])
      
      const enemyState = {
        enemy_id: 'enemy_2',
        enemy_type: 'slime', // Different type
        x: 500,
        y: 400,
        velocity_x: 10,
        velocity_y: 0,
        health: 40,
        max_health: 50,
        scale: 1
      }
      
      const handler = scene['handleRemoteEnemySpawn']
      if (handler) {
        handler.call(scene, enemyState)
        
        expect(localEnemy.setPosition).toHaveBeenCalledWith(500, 400)
        expect(localEnemy.setData).toHaveBeenCalledWith('health', 40)
        // Type mismatch should update texture
        expect(localEnemy.setTexture).toHaveBeenCalled()
      }
    })
    
    it('should create new enemy sprite with correct properties', () => {
      scene.isOnlineHost = false
      scene.enemies.getChildren = vi.fn().mockReturnValue([])
      const newEnemy = createSpriteMock({ x: 500, y: 400 })
      scene.enemies.create = vi.fn().mockReturnValue(newEnemy)
      
      const enemyState = {
        enemy_id: 'new_enemy_1',
        enemy_type: 'fly',
        x: 500,
        y: 400,
        velocity_x: 0,
        velocity_y: 0,
        health: 50,
        max_health: 50,
        coin_reward: 5,
        scale: 0.8,
        facing_right: true
      }
      
      const handler = scene['handleRemoteEnemySpawn']
      if (handler) {
        handler.call(scene, enemyState)
        
        expect(scene.enemies.create).toHaveBeenCalledWith(500, 400, 'fly')
        expect(newEnemy.setScale).toHaveBeenCalledWith(0.8)
        expect(newEnemy.setData).toHaveBeenCalledWith('enemyId', 'new_enemy_1')
        expect(newEnemy.setData).toHaveBeenCalledWith('health', 50)
        expect(newEnemy.setData).toHaveBeenCalledWith('maxHealth', 50)
        expect(newEnemy.setData).toHaveBeenCalledWith('coinReward', 5)
        // enemySize is determined by scale: 0.8 == 0.8 is medium, < 0.8 is small
        expect(newEnemy.setData).toHaveBeenCalledWith('enemySize', 'medium')
      }
    })
    
    it('should set enemy size based on scale', () => {
      scene.isOnlineHost = false
      scene.enemies.getChildren = vi.fn().mockReturnValue([])
      const newEnemy = createSpriteMock({ x: 500, y: 400 })
      scene.enemies.create = vi.fn().mockReturnValue(newEnemy)
      
      // Large scale enemy
      const enemyState = {
        enemy_id: 'large_enemy',
        enemy_type: 'slime',
        x: 500,
        y: 400,
        health: 100,
        max_health: 100,
        scale: 1.5 // > 1.1 = large
      }
      
      const handler = scene['handleRemoteEnemySpawn']
      if (handler) {
        handler.call(scene, enemyState)
        
        expect(newEnemy.setData).toHaveBeenCalledWith('enemySize', 'large')
      }
    })
  })

  // ==========================================
  // handleRemoteEnemyKilled Tests
  // ==========================================
  
  describe('handleRemoteEnemyKilled', () => {
    it('should find and destroy enemy from remoteEnemies map', () => {
      const killedEnemy = createSpriteMock({ 
        x: 500, 
        y: 400, 
        enemyId: 'kill_1',
        enemyType: 'fly',
        active: true,
        enemySize: 'medium'
      })
      scene.remoteEnemies.set('kill_1', killedEnemy)
      
      const handler = scene['handleRemoteEnemyKilled']
      if (handler) {
        handler.call(scene, 'kill_1', 'player1')
        
        // Should start death animation
        expect(killedEnemy.setVelocity).toHaveBeenCalledWith(0, 0)
        expect(killedEnemy.setTint).toHaveBeenCalledWith(0xff0000)
        // Should be removed from map
        expect(scene.remoteEnemies.has('kill_1')).toBe(false)
      }
    })
    
    it('should find enemy in local group if not in map', () => {
      const localKilledEnemy = createSpriteMock({ 
        enemyId: 'local_kill_1',
        enemyType: 'slime',
        active: true 
      })
      scene.enemies.getChildren = vi.fn().mockReturnValue([localKilledEnemy])
      
      const handler = scene['handleRemoteEnemyKilled']
      if (handler) {
        handler.call(scene, 'local_kill_1', 'player2')
        
        expect(localKilledEnemy.setTint).toHaveBeenCalledWith(0xff0000)
      }
    })
    
    it('should not throw when enemy not found', () => {
      scene.enemies.getChildren = vi.fn().mockReturnValue([])
      
      const handler = scene['handleRemoteEnemyKilled']
      if (handler) {
        expect(() => handler.call(scene, 'nonexistent', 'player1')).not.toThrow()
      }
    })
    
    it('should award score based on enemy size', () => {
      scene.score = 0
      const largeEnemy = createSpriteMock({ 
        enemyId: 'large_1',
        enemyType: 'slime',
        active: true,
        data: { enemySize: 'large' }
      })
      largeEnemy.getData = vi.fn().mockImplementation((key: string) => {
        if (key === 'enemySize') return 'large'
        if (key === 'enemyId') return 'large_1'
        if (key === 'enemyType') return 'slime'
        return null
      })
      scene.remoteEnemies.set('large_1', largeEnemy)
      
      const handler = scene['handleRemoteEnemyKilled']
      if (handler) {
        handler.call(scene, 'large_1', 'player1')
        
        // Large enemy should award 200 points
        expect(scene.score).toBe(200)
        expect(scene.uiManager.updateScore).toHaveBeenCalledWith(200)
      }
    })
    
    it('should host spawn coins for remote kills', () => {
      scene.isOnlineMode = true
      scene.isOnlineHost = true
      
      const enemy = createSpriteMock({ 
        x: 500,
        y: 400,
        enemyId: 'coin_spawn_enemy',
        enemyType: 'fly',
        active: true,
        data: { coinReward: 10 }
      })
      enemy.getData = vi.fn().mockImplementation((key: string) => {
        if (key === 'coinReward') return 10
        if (key === 'enemyId') return 'coin_spawn_enemy'
        if (key === 'enemyType') return 'fly'
        if (key === 'enemySize') return 'medium'
        return null
      })
      scene.remoteEnemies.set('coin_spawn_enemy', enemy)
      
      const handler = scene['handleRemoteEnemyKilled']
      if (handler) {
        handler.call(scene, 'coin_spawn_enemy', 'player2')
        
        expect(scene.dropCoins).toHaveBeenCalledWith(500, 400, 10)
      }
    })
  })
})
