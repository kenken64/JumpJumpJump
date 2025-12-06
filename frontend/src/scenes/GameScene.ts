/**
 * @fileoverview GameScene - Main gameplay scene for JumpJumpJump platformer
 * 
 * This is the core game scene handling all gameplay mechanics:
 * - Player movement, jumping (single/double), and stomping
 * - Shooting with multiple weapon types
 * - Enemy spawning, AI, and combat
 * - Boss encounters every 5 levels
 * - Coin and power-up collection
 * - Health, lives, and damage system
 * - Level progression and portals
 * - Endless mode world generation
 * - AI player modes (rule-based, ML, DQN)
 * - Local co-op support
 * - Checkpoints and respawning
 * - Score tracking and submission
 * 
 * Supports multiple game modes:
 * - 'levels': Fixed-length levels with boss fights
 * - 'endless': Procedurally generated infinite mode
 * 
 * Can be controlled by human player, AI, or DQN training agent.
 * 
 * @module scenes/GameScene
 */

import Phaser from 'phaser'
import { GameAPI } from '../services/api'
import { AudioManager } from '../utils/AudioManager'
import { MusicManager } from '../utils/MusicManager'
import { WorldGenerator } from '../utils/WorldGenerator'
import { ControlManager } from '../utils/ControlManager'
import { AIPlayer } from '../utils/AIPlayer'
import { MLAIPlayer } from '../utils/MLAIPlayer'
import { DQNAgent, DQNState, DQNAction } from '../utils/DQNAgent'
import { OnlinePlayerManager } from '../utils/OnlinePlayerManager'
import { OnlineCoopService, NetworkGameState, NetworkEnemyState, NetworkCoinState, NetworkPowerUpState } from '../services/OnlineCoopService'
import { WEAPON_CONFIGS } from '../types/GameTypes'

/**
 * Main gameplay scene containing all game logic
 * @extends Phaser.Scene
 */
export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private gun!: Phaser.GameObjects.Image
  private bullets!: Phaser.Physics.Arcade.Group
  private lastShotTime: number = 0
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    w: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
  }
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null
  // @ts-expect-error - assistKey is set but only used for reference
  private assistKey?: Phaser.Input.Keyboard.Key
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private enemies!: Phaser.Physics.Arcade.Group
  private canDoubleJump: boolean = true
  private hasDoubleJumped: boolean = false
  private isStomping: boolean = false
  private stompStartY: number = 0
  private blockFragments!: Phaser.Physics.Arcade.Group
  private playerIsDead: boolean = false
  private playerHealth: number = 100
  private maxHealth: number = 100
  private playerLives: number = 3
  private playerSpawnX: number = 400
  private playerSpawnY: number = 550
  private healthBarBackground!: Phaser.GameObjects.Rectangle
  private healthBarFill!: Phaser.GameObjects.Rectangle
  private livesText!: Phaser.GameObjects.Text
  private reloadBarBackground!: Phaser.GameObjects.Rectangle
  private reloadBarFill!: Phaser.GameObjects.Rectangle
  private coins!: Phaser.Physics.Arcade.Group
  private coinCount: number = 0
  private coinText!: Phaser.GameObjects.Text
  private coinIcon!: Phaser.GameObjects.Image
  private score: number = 0
  private highScore: number = 0
  private scoreText!: Phaser.GameObjects.Text
  private highScoreText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private enemiesDefeated: number = 0
  private jumpParticles!: Phaser.GameObjects.Particles.ParticleEmitter
  private landParticles!: Phaser.GameObjects.Particles.ParticleEmitter
  private coinParticles!: Phaser.GameObjects.Particles.ParticleEmitter
  private wasOnGround: boolean = false
  private worldGenerationX: number = 0
  private spikes!: Phaser.Physics.Arcade.StaticGroup
  private worldGenerator!: WorldGenerator
  private spikePositions: Array<{ x: number, y: number, width: number }> = []
  private checkpoints: Array<{ x: number, marker: Phaser.GameObjects.Rectangle }> = []
  private lastCheckpointX: number = 0
  private currentCheckpoint: number = 0
  private checkpointInterval: number = 2000 // 20 meters = 2000 pixels
  private currentLevel: number = 1
  private gameMode: 'levels' | 'endless' = 'levels'
  private levelLength: number = 10000 // 100 meters per level
  private levelEndMarker!: Phaser.GameObjects.Rectangle | null
  private portal!: Phaser.Physics.Arcade.Sprite | null
  private shownTips: Set<string> = new Set() // Track which tips have been shown
  private boss!: Phaser.Physics.Arcade.Sprite | null
  private bossActive: boolean = false
  private defeatedBossLevels: Set<number> = new Set() // Track which boss levels have been defeated
  private bossHealthBar!: Phaser.GameObjects.Rectangle | null
  private bossHealthBarBg!: Phaser.GameObjects.Rectangle | null
  private bossNameText!: Phaser.GameObjects.Text | null
  private equippedSkin: string = 'alienBeige'
  private equippedWeapon: string = 'raygun'
  private powerUps!: Phaser.Physics.Arcade.Group
  private hasSpeedBoost: boolean = false
  private hasShield: boolean = false
  private shieldSprite!: Phaser.GameObjects.Sprite | null
  private audioContext!: AudioContext
  private farthestPlayerX: number = 0 // Track farthest X position reached
  private levelCompleteShown: boolean = false // Prevent multiple level complete triggers
  private audioManager!: AudioManager
  private musicManager!: MusicManager

  // Debug mode
  private debugMode: boolean = false
  private debugText: Phaser.GameObjects.Text | null = null
  private fpsText: Phaser.GameObjects.Text | null = null
  private coordText: Phaser.GameObjects.Text | null = null

  // AI Player
  private aiPlayer!: AIPlayer
  private aiEnabled: boolean = false
  private aiStatusText: Phaser.GameObjects.Text | null = null

  // ML AI Player
  private mlAIPlayer!: MLAIPlayer
  private mlAIEnabled: boolean = false
  private mlAIDecision: { moveLeft: boolean; moveRight: boolean; jump: boolean; shoot: boolean } = {
    moveLeft: false,
    moveRight: false,
    jump: false,
    shoot: false
  }
  // Recording removed - use DQN training instead

  // Co-op multiplayer
  private isCoopMode: boolean = false
  private player2!: Phaser.Physics.Arcade.Sprite
  private gun2!: Phaser.GameObjects.Image
  private bullets2!: Phaser.Physics.Arcade.Group

  // Online multiplayer
  private isOnlineMode: boolean = false
  private onlinePlayerManager?: OnlinePlayerManager
  private onlineGameState?: NetworkGameState
  private onlinePlayerId?: string
  private onlinePlayerNumber?: number
  private onlineSeed?: number
  private onlineRngState: number = 0
  // Track remote enemies and coins by network ID for online sync
  private remoteEnemies: Map<string, Phaser.Physics.Arcade.Sprite> = new Map()
  private remoteCoins: Map<string, Phaser.Physics.Arcade.Sprite> = new Map()
  private isOnlineHost: boolean = false
  // Counter for unique respawn enemy IDs
  private respawnEnemyCounter: number = 0
  // Counter for unique coin drop IDs
  private coinDropCounter: number = 0
  // Counter for unique power-up IDs
  private powerUpCounter: number = 0

  // DQN Training
  private dqnTraining: boolean = false
  private dqnAgent?: DQNAgent
  private lastDQNState?: DQNState
  private lastDQNAction?: DQNAction
  private dqnStepCount: number = 0
  private dqnEpisodeCount: number = 0
  private dqnCurrentReward: number = 0
  private dqnLastEpisodeReward: number = 0
  private dqnTotalReward: number = 0
  private dqnTrainingPaused: boolean = false
  private dqnAutoRestart: boolean = true
  private dqnSpeedMultiplier: number = 1
  private dqnStatsText?: Phaser.GameObjects.Text
  private dqnStatusText?: Phaser.GameObjects.Text
  private dqnShooting: boolean = false
  
  // Carry over data from previous level
  private initLives?: number
  private initScore?: number
  private initHealth?: number
  private initCoins?: number
  private initWeapon?: string

  // In-game chat (online mode)
  private chatInputActive: boolean = false
  private chatInputElement: HTMLInputElement | null = null
  private chatContainer: HTMLDivElement | null = null

  // Player Recording for DQN Learning
  private isRecordingForDQN: boolean = false
  private recordedDemonstrations: Array<{
    state: DQNState,
    action: { moveLeft: boolean, moveRight: boolean, jump: boolean, shoot: boolean },
    nextState: DQNState,
    reward: number,
    done: boolean
  }> = []
  private lastRecordedState?: DQNState
  private lastRecordedAction?: { moveLeft: boolean, moveRight: boolean, jump: boolean, shoot: boolean }
  private recordingStatusText?: Phaser.GameObjects.Text
  private recordingFrameCount: number = 0

  constructor() {
    super('GameScene')
  }

  init(data?: any) {
    // Check if launching in co-op mode
    if (data && data.mode === 'coop') {
      this.isCoopMode = true
      this.isOnlineMode = false
      console.log('🎮 Co-op mode enabled!')
    } else if (data && data.mode === 'online_coop') {
      this.isOnlineMode = true
      this.isCoopMode = false
      this.onlineGameState = data.gameState
      this.onlinePlayerNumber = data.playerNumber
      this.onlinePlayerId = data.playerId
      console.log('🌐 Online Co-op mode enabled! Player', this.onlinePlayerNumber)
    } else {
      this.isCoopMode = false
      this.isOnlineMode = false
    }

    // Check if launching in DQN training mode
    if (data && data.dqnTraining) {
      this.dqnTraining = true
      this.gameMode = data.gameMode || 'endless'
      this.currentLevel = data.level || 1
      console.log('🤖 DQN Training mode enabled!')
      // Agent will be initialized after scene is ready
    }

    // Handle loaded game
    if (data && data.isLoadedGame) {
      this.currentLevel = data.level
      this.initScore = data.score
      this.initLives = data.lives
      this.initHealth = data.health
      this.initCoins = data.coins
      this.initWeapon = data.weapon
      this.gameMode = data.gameMode || 'levels'
      console.log(`💾 Loaded game at Level ${this.currentLevel}`)
    }

    // Carry over lives and score from previous level
    if (data && typeof data.lives === 'number') {
      this.initLives = data.lives
      console.log(`❤️ Carrying over ${data.lives} lives from previous level`)
    } else {
      this.initLives = undefined
    }
    if (data && typeof data.score === 'number') {
      this.initScore = data.score
      console.log(`⭐ Carrying over score ${data.score} from previous level`)
    } else {
      this.initScore = undefined
    }

    // Carry over recording state from previous level
    if (data && data.isRecording) {
      this.isRecordingForDQN = true
      console.log('🎥 Resuming recording from previous level')
    }
  }

  /**
   * Seeded random number generator for online mode (mulberry32 algorithm)
   * Returns a number between 0 and 1, deterministic based on seed
   */
  private onlineSeededRandom(): number {
    this.onlineRngState += 0x6D2B79F5
    let t = this.onlineRngState
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Seeded random integer between min and max (inclusive) for online mode
   */
  private onlineSeededBetween(min: number, max: number): number {
    return Math.floor(this.onlineSeededRandom() * (max - min + 1)) + min
  }

  preload() {
    // Listen for load errors and create fallback textures
    this.load.on('loaderror', (file: any) => {
      console.warn(`Failed to load: ${file.key} from ${file.url}, will create fallback`)
    })

    // Load alien sprites (using alienBeige as the player)
    this.load.image('alienBeige_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_stand.png')
    this.load.image('alienBeige_walk1', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_walk1.png')
    this.load.image('alienBeige_walk2', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_walk2.png')
    this.load.image('alienBeige_jump', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_jump.png')
    this.load.image('alienBeige_hurt', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_hurt.png')
    this.load.image('alienBeige_duck', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_duck.png')

    // Load purchasable skins
    this.load.image('alienBlue_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBlue_stand.png')
    this.load.image('alienBlue_walk1', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBlue_walk1.png')
    this.load.image('alienBlue_walk2', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBlue_walk2.png')
    this.load.image('alienBlue_jump', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBlue_jump.png')

    this.load.image('alienGreen_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienGreen_stand.png')
    this.load.image('alienGreen_walk1', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienGreen_walk1.png')
    this.load.image('alienGreen_walk2', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienGreen_walk2.png')
    this.load.image('alienGreen_jump', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienGreen_jump.png')

    this.load.image('alienPink_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienPink_stand.png')
    this.load.image('alienPink_walk1', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienPink_walk1.png')
    this.load.image('alienPink_walk2', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienPink_walk2.png')
    this.load.image('alienPink_jump', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienPink_jump.png')

    this.load.image('alienYellow_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienYellow_stand.png')
    this.load.image('alienYellow_walk1', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienYellow_walk1.png')
    this.load.image('alienYellow_walk2', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienYellow_walk2.png')
    this.load.image('alienYellow_jump', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienYellow_jump.png')

    // Load enemy sprites - Small enemies (flies, bees)
    this.load.image('fly', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/fly.png')
    this.load.image('fly_fly', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/fly_fly.png')
    this.load.image('fly_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/fly_dead.png')
    this.load.image('bee', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/bee.png')
    this.load.image('bee_fly', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/bee_fly.png')
    this.load.image('bee_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/bee_dead.png')

    // Medium enemies (slimes)
    this.load.image('slimeGreen', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/slimeGreen.png')
    this.load.image('slimeGreen_walk', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/slimeGreen_walk.png')
    this.load.image('slimeGreen_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/slimeGreen_dead.png')
    this.load.image('slimeBlue', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/slimeBlue.png')
    this.load.image('slimeBlue_walk', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/slimeBlue.png')
    this.load.image('slimeBlue_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/slimeBlue_dead.png')

    // Large enemies (worms) - using base worm sprites with tint for variants
    this.load.image('wormGreen', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/worm.png')
    this.load.image('wormGreen_walk', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/worm_walk.png')
    this.load.image('wormGreen_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/worm_dead.png')
    this.load.image('wormPink', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/worm.png')
    this.load.image('wormPink_walk', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/worm_walk.png')
    this.load.image('wormPink_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/worm_dead.png')

    // Load platform beams
    this.load.image('beam', '/assets/kenney_platformer-art-requests/Tiles/beam.png')
    this.load.image('beamBolts', '/assets/kenney_platformer-art-requests/Tiles/beamBolts.png')

    // Load additional terrain tiles for world generation
    this.load.image('metalCenter', '/assets/kenney_platformer-art-requests/Tiles/metalCenter.png')
    this.load.image('metalLeft', '/assets/kenney_platformer-art-requests/Tiles/metalLeft.png')
    this.load.image('metalMid', '/assets/kenney_platformer-art-requests/Tiles/metalMid.png')
    this.load.image('metalRight', '/assets/kenney_platformer-art-requests/Tiles/metalRight.png')
    this.load.image('metalCliffLeft', '/assets/kenney_platformer-art-requests/Tiles/metalCliffLeft.png')
    this.load.image('metalCliffRight', '/assets/kenney_platformer-art-requests/Tiles/metalCliffRight.png')
    this.load.image('metalPlatform', '/assets/kenney_platformer-art-requests/Tiles/metalPlatform.png')
    this.load.image('metalPlatformWire', '/assets/kenney_platformer-art-requests/Tiles/metalPlatformWire.png')
    this.load.image('stoneCaveTop', '/assets/kenney_platformer-art-requests/Tiles/stoneCaveTop.png')
    this.load.image('stoneCaveBottom', '/assets/kenney_platformer-art-requests/Tiles/stoneCaveBottom.png')
    this.load.image('stoneCaveUL', '/assets/kenney_platformer-art-requests/Tiles/stoneCaveUL.png')
    this.load.image('stoneCaveUR', '/assets/kenney_platformer-art-requests/Tiles/stoneCaveUR.png')
    this.load.image('stoneCaveBL', '/assets/kenney_platformer-art-requests/Tiles/stoneCaveBL.png')
    this.load.image('stoneCaveBR', '/assets/kenney_platformer-art-requests/Tiles/stoneCaveBR.png')
    this.load.image('stoneCaveRockLarge', '/assets/kenney_platformer-art-requests/Tiles/stoneCaveRockLarge.png')
    this.load.image('stoneCaveRockSmall', '/assets/kenney_platformer-art-requests/Tiles/stoneCaveRockSmall.png')
    this.load.image('dirtCaveTop', '/assets/kenney_platformer-art-requests/Tiles/dirtCaveTop.png')
    this.load.image('dirtCaveBottom', '/assets/kenney_platformer-art-requests/Tiles/dirtCaveBottom.png')

    // Load metal blocks for fragments
    this.load.image('metalBlock', '/assets/kenney_platformer-art-requests/Tiles/metal.png')

    // Load gun and bullet assets
    this.load.image('raygun', '/assets/kenney_platformer-art-requests/Tiles/raygun.png')
    this.load.image('laserBlue', '/assets/kenney_platformer-art-requests/Tiles/laserBlueHorizontal.png')

    // Load coin (using gold shield as coin)
    this.load.image('coin', '/assets/kenney_platformer-art-requests/Tiles/shieldGold.png')

    // Load particle (using laser burst for particles)
    this.load.image('particle', '/assets/kenney_platformer-art-requests/Tiles/laserYellowBurst.png')

    // Load spikes - removed, using procedural texture instead

    // Load portal sprite (using sci-fi structure)
    this.load.image('portal', '/assets/kenney_sci-fi-rts/PNG/Default size/Structure/scifiStructure_01.png')
    this.load.image('homeIcon', '/assets/kenney_ui-pack-space-expansion/PNG/Blue/Default/bar_square_gloss_small.png')

    // Load planet backgrounds
    this.load.image('planet00', '/assets/kenny_planets/Planets/planet00.png')
    this.load.image('planet01', '/assets/kenny_planets/Planets/planet01.png')
    this.load.image('planet02', '/assets/kenny_planets/Planets/planet02.png')
    this.load.image('planet03', '/assets/kenny_planets/Planets/planet03.png')
    this.load.image('planet04', '/assets/kenny_planets/Planets/planet04.png')
    this.load.image('planet05', '/assets/kenny_planets/Planets/planet05.png')

    // Load individual boss images (22 bosses)
    for (let i = 0; i < 22; i++) {
      const bossKey = `boss_${i.toString().padStart(2, '0')}`
      this.load.image(bossKey, `/assets/bosses_individual/boss_${i.toString().padStart(2, '0')}.png`)
    }

    // Load power-up sprites - removed, using procedural textures instead

    // Load game music
    this.load.audio('gameMusic', '/assets/music/game.wav')
  }

  create() {
    // Get game mode and level from scene data (passed from menu)
    const data = this.scene.settings.data as any
    this.gameMode = data?.gameMode || 'levels'
    this.currentLevel = data?.level || 1

    // Create fallback textures for any missing assets
    this.createFallbackTextures()

    // Create procedural textures for power-ups and items
    this.createProceduralTextures()

    // Initialize audio context (safe initialization)
    try {
      this.audioContext = new AudioContext()
      // Resume audio context on first user interaction
      const resumeAudio = () => {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume()
        }
      }
      this.input.once('pointerdown', resumeAudio)
      this.input.keyboard?.once('keydown', resumeAudio)
    } catch (e) {
      console.warn('AudioContext not supported:', e)
      // Create a dummy audio context if not supported
      this.audioContext = { state: 'running' } as AudioContext
    }

    // Initialize audio and music managers
    this.audioManager = new AudioManager(this.audioContext)
    this.musicManager = new MusicManager(this)

    // Reset all state variables
    this.playerIsDead = false
    this.playerHealth = this.initHealth !== undefined ? this.initHealth : 100
    // Use carried over lives from previous level, or default to 3
    this.playerLives = this.initLives !== undefined ? this.initLives : 3
    // Use carried over score from previous level, or start at 0
    this.score = this.initScore !== undefined ? this.initScore : 0
    
    // Set weapon if loaded
    if (this.initWeapon) {
      this.equippedWeapon = this.initWeapon
    }

    this.debugMode = false  // Always reset debug mode on scene start/restart
    this.levelCompleteShown = false // Reset level complete flag

    // Load coin count from localStorage (for single player / shop)
    // In online mode, start fresh to show session coins only
    if (this.isOnlineMode) {
      this.coinCount = 0  // Online mode: show session coins only
    } else if (this.initCoins !== undefined) {
      this.coinCount = this.initCoins
    } else {
      const savedCoins = localStorage.getItem('playerCoins')
      this.coinCount = savedCoins ? parseInt(savedCoins) : 0
    }

    // Load equipped items from inventory
    const equippedWeapon = localStorage.getItem('equippedWeapon')
    const equippedSkin = localStorage.getItem('equippedSkin')
    this.equippedWeapon = equippedWeapon || 'raygun'

    // Override skin based on game mode
    if (this.isOnlineMode && this.onlineGameState && this.onlinePlayerId) {
      // In online mode, use the skin assigned by the server
      const playerState = this.onlineGameState.players[this.onlinePlayerId]
      if (playerState) {
        this.equippedSkin = playerState.skin
        console.log('🎨 Online mode - using server-assigned skin:', this.equippedSkin)
      } else {
        this.equippedSkin = 'alienGreen'
      }
    } else if (this.isCoopMode) {
      this.equippedSkin = 'alienGreen' // Player 1 uses green alien in co-op
    } else {
      this.equippedSkin = equippedSkin || 'alienBeige'
    }

    // Initialize power-up state
    this.hasSpeedBoost = false
    this.hasShield = false
    this.shieldSprite = null

    this.worldGenerationX = 0
    this.canDoubleJump = true
    this.hasDoubleJumped = false
    this.isStomping = false
    this.lastShotTime = 0
    this.wasOnGround = false
    this.spikePositions = []
    this.checkpoints = []
    this.lastCheckpointX = 0
    this.currentCheckpoint = 0
    this.levelEndMarker = null
    this.portal = null

    // Create space background with blackhole effect
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.createBlackholeBackground()

    // Add planet backgrounds with parallax scrolling
    const planet1 = this.add.image(200, 150, 'planet00')
    planet1.setScale(0.3)
    planet1.setScrollFactor(0.1)
    planet1.setAlpha(0.8)

    const planet2 = this.add.image(800, 250, 'planet01')
    planet2.setScale(0.4)
    planet2.setScrollFactor(0.15)
    planet2.setAlpha(0.7)

    const planet3 = this.add.image(1500, 180, 'planet02')
    planet3.setScale(0.35)
    planet3.setScrollFactor(0.12)
    planet3.setAlpha(0.75)

    const planet4 = this.add.image(2500, 220, 'planet03')
    planet4.setScale(0.5)
    planet4.setScrollFactor(0.2)
    planet4.setAlpha(0.6)

    const planet5 = this.add.image(3800, 160, 'planet04')
    planet5.setScale(0.45)
    planet5.setScrollFactor(0.18)
    planet5.setAlpha(0.65)

    const planet6 = this.add.image(5200, 200, 'planet05')
    planet6.setScale(0.38)
    planet6.setScrollFactor(0.14)
    planet6.setAlpha(0.7)

    // Add slow rotation to planets
    this.tweens.add({
      targets: [planet1, planet3, planet5],
      angle: 360,
      duration: 60000,
      repeat: -1,
      ease: 'Linear'
    })

    this.tweens.add({
      targets: [planet2, planet4, planet6],
      angle: -360,
      duration: 80000,
      repeat: -1,
      ease: 'Linear'
    })

    // Initialize boss variables
    this.boss = null
    this.bossActive = false
    this.bossHealthBar = null
    this.bossHealthBarBg = null
    this.bossNameText = null

    // Load defeated boss levels from localStorage
    const savedDefeatedLevels = localStorage.getItem('defeatedBossLevels')
    if (savedDefeatedLevels) {
      this.defeatedBossLevels = new Set(JSON.parse(savedDefeatedLevels))
      console.log('📊 Loaded defeated boss levels:', Array.from(this.defeatedBossLevels))
    }

    // Play game music using MusicManager
    this.musicManager.playGameMusic()

    // Set world bounds (infinite to the right)
    this.physics.world.setBounds(0, 0, 100000, 1200)
    this.cameras.main.setBounds(0, 0, 100000, 1200)

    // Set world bounds
    this.physics.world.setBounds(0, 0, 100000, 1200)

    // Set world gravity (microgravity)
    this.physics.world.gravity.y = 400

    // Create platforms with procedural generation
    this.platforms = this.physics.add.staticGroup()
    this.spikes = this.physics.add.staticGroup()

    // Initialize WorldGenerator with seed from online game state (if online mode)
    const rawSeed = this.isOnlineMode && this.onlineGameState ? this.onlineGameState.seed : undefined
    // Ensure seed is an integer
    const worldSeed = rawSeed !== undefined ? Math.floor(rawSeed) : undefined
    
    // === SEED VERIFICATION LOGGING ===
    if (this.isOnlineMode) {
      console.log('═══════════════════════════════════════════════════════════')
      console.log('🌍 ONLINE GAME SEED VERIFICATION')
      console.log('═══════════════════════════════════════════════════════════')
      console.log('🎯 Player Number:', this.onlinePlayerNumber)
      console.log('📦 onlineGameState exists:', !!this.onlineGameState)
      console.log('🌱 Server Seed (raw):', rawSeed)
      console.log('🔢 worldSeed passed to WorldGenerator:', worldSeed)
      
      // CRITICAL: Verify we have a valid seed for online mode
      if (worldSeed === undefined || worldSeed === null) {
        console.error('❌❌❌ CRITICAL ERROR: No seed received for online mode! ❌❌❌')
        console.error('onlineGameState:', this.onlineGameState)
        // Create an obvious visual error indicator
        this.add.text(400, 300, 'ERROR: No sync seed!', { fontSize: '48px', color: '#ff0000' })
      }
      console.log('═══════════════════════════════════════════════════════════')
    }
    
    console.log('🌐 GameScene - Online mode:', this.isOnlineMode, 'World seed:', worldSeed)
    this.worldGenerator = new WorldGenerator(this, this.platforms, this.spikes, this.spikePositions, worldSeed)
    
    // Verify the WorldGenerator got the correct seed
    if (this.isOnlineMode) {
      const actualSeed = this.worldGenerator.getSeed()
      console.log('✅ WorldGenerator seed verification:', actualSeed, '(expected:', worldSeed, ')')
      if (actualSeed !== worldSeed) {
        console.error('❌❌❌ SEED MISMATCH! WorldGenerator did not receive correct seed! ❌❌❌')
      }
    }
    
    // Initialize seeded random for BOTH online and offline modes
    // In offline mode, use the WorldGenerator's seed to ensure consistency
    if (this.isOnlineMode && this.onlineGameState) {
      this.onlineSeed = this.onlineGameState.seed
    } else {
      // For offline mode, use the seed from WorldGenerator (which is either random or fixed)
      this.onlineSeed = this.worldGenerator.getSeed()
    }
    
    this.onlineRngState = this.onlineSeed + 1000000 // Offset to get different sequence from world gen
    console.log('🎲 Entity RNG initialized with seed:', this.onlineSeed, 'RNG state:', this.onlineRngState)
      
    // Log first few random values to verify sync
    const testState = this.onlineRngState
    console.log('📊 RNG Verification - first 5 values:')
    for (let i = 0; i < 5; i++) {
      this.onlineRngState += 0x6D2B79F5
      let t = this.onlineRngState
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      const val = ((t ^ (t >>> 14)) >>> 0) / 4294967296
      console.log(`  Value ${i+1}: ${val.toFixed(6)}`)
    }
    // Reset to correct state
    this.onlineRngState = testState

    console.log('Generating world...')
    this.worldGenerationX = this.worldGenerator.generateWorld()
    console.log('Platforms created:', this.platforms.getChildren().length)

    // Create player animations FIRST before creating the player sprite
    // Create animations for equipped skin
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: `${this.equippedSkin}_stand` }],
      frameRate: 1,
      repeat: -1
    })

    this.anims.create({
      key: 'player_walk',
      frames: [
        { key: `${this.equippedSkin}_walk1` },
        { key: `${this.equippedSkin}_walk2` }
      ],
      frameRate: 8,
      repeat: -1
    })

    this.anims.create({
      key: 'player_jump',
      frames: [{ key: `${this.equippedSkin}_jump` }],
      frameRate: 1
    })

    // Create player with equipped skin
    console.log('=== PLAYER CREATION ===')
    this.player = this.physics.add.sprite(400, 550, `${this.equippedSkin}_stand`)
    this.player.setBounce(0.1)
    this.player.setCollideWorldBounds(true)
    this.player.setGravityY(0) // Start with no gravity

    console.log('Player created at:', this.player.x, this.player.y)
    console.log('Floor is at Y:', 650)
    console.log('Player is', 650 - 550, 'pixels above floor')

    // Ensure physics body is enabled and properly sized
    if (this.player.body) {
      const body = this.player.body as Phaser.Physics.Arcade.Body
      body.enable = true
      // Adjust body size to match sprite (alien sprites are about 70x90)
      body.setSize(50, 80)
      body.setOffset(10, 10)
      console.log('Player body:', {
        width: body.width,
        height: body.height,
        x: body.x,
        y: body.y,
        gravityY: body.gravity.y,
        enable: body.enable,
        type: 'dynamic'
      })
    } else {
      console.error('ERROR: Player has no body!')
    }

    this.player.play('player_idle') // Start with idle animation

    // Enable gravity after a short delay to ensure platforms are loaded
    this.time.delayedCall(100, () => {
      if (this.player && this.player.body) {
        console.log('=== ENABLING PLAYER GRAVITY ===')
        console.log('Player position before gravity:', this.player.x, this.player.y)
        console.log('Platforms in world:', this.platforms.getChildren().length)
        this.player.setGravityY(200)
        console.log('Player gravity set to:', (this.player.body as Phaser.Physics.Arcade.Body).gravity.y)
        console.log('World gravity:', this.physics.world.gravity.y)
        console.log('Total player gravity:', (this.player.body as Phaser.Physics.Arcade.Body).gravity.y + this.physics.world.gravity.y)
      }
    })

    // Give player 1 second of invincibility on spawn
    this.player.setData('lastHitTime', this.time.now)
    this.hasShield = true
    this.shieldSprite = this.add.sprite(this.player.x, this.player.y, 'powerShield')
    this.shieldSprite.setScale(1.5)
    this.shieldSprite.setAlpha(0.6)
    this.shieldSprite.setDepth(5)

    // Shield animation
    this.tweens.add({
      targets: this.shieldSprite,
      angle: 360,
      duration: 3000,
      repeat: 0 // Only one rotation for spawn shield
    })

    // Player start dialogue
    const dialogueText = this.add.text(this.player.x, this.player.y - 60, "Lets ROCK and ROLL !", {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
      fontStyle: 'bold'
    })
    dialogueText.setOrigin(0.5)
    dialogueText.setDepth(100)

    // Make dialogue follow player
    const updateDialogue = () => {
      if (dialogueText.active && this.player.active) {
        dialogueText.setPosition(this.player.x, this.player.y - 60)
      }
    }
    this.events.on('update', updateDialogue)

    // Fade out and destroy dialogue
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: dialogueText,
        alpha: 0,
        y: dialogueText.y - 20,
        duration: 1000,
        onComplete: () => {
          dialogueText.destroy()
          this.events.off('update', updateDialogue)
        }
      })
    })

    // Remove spawn shield after 1 second
    this.time.delayedCall(1000, () => {
      this.hasShield = false
      if (this.shieldSprite) {
        this.tweens.add({
          targets: this.shieldSprite,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => {
            if (this.shieldSprite) {
              this.shieldSprite.destroy()
              this.shieldSprite = null
            }
          }
        })
      }
    })

    // Create gun (visual representation using equipped weapon)
    this.gun = this.add.image(0, 0, this.equippedWeapon)
    // For sword, pivot from handle (bottom). For guns, pivot from base
    if (this.equippedWeapon === 'sword') {
      this.gun.setOrigin(0.5, 0.9) // Pivot from near the bottom (handle)
    } else {
      this.gun.setOrigin(0, 0.5) // Pivot from the base of the gun
    }
    this.gun.setScale(1.0) // Larger gun size
    this.gun.setDepth(10)

    // Create bullets group
    this.bullets = this.physics.add.group({
      defaultKey: 'laserBlue',
      maxSize: 30
    })

    // Create Player 2 for co-op mode
    if (this.isCoopMode) {
      const player2Skin = 'alienBlue' // Player 2 uses blue alien skin

      // Create Player 2 animations with blue skin
      this.anims.create({
        key: 'player2_idle',
        frames: [{ key: `${player2Skin}_stand` }],
        frameRate: 1,
        repeat: -1
      })

      this.anims.create({
        key: 'player2_walk',
        frames: [
          { key: `${player2Skin}_walk1` },
          { key: `${player2Skin}_walk2` }
        ],
        frameRate: 8,
        repeat: -1
      })

      this.anims.create({
        key: 'player2_jump',
        frames: [{ key: `${player2Skin}_jump` }],
        frameRate: 1
      })

      // Create player 2 sprite
      this.player2 = this.physics.add.sprite(450, 550, `${player2Skin}_stand`)
      this.player2.setBounce(0.1)
      this.player2.setCollideWorldBounds(true)
      this.player2.setGravityY(0)
      this.player2.setDepth(10)

      if (this.player2.body) {
        const body = this.player2.body as Phaser.Physics.Arcade.Body
        body.enable = true
        body.setSize(50, 80)
        body.setOffset(10, 10)
      }

      this.player2.play('player2_idle') // Use Player 2's blue animations

      // Enable gravity after delay
      this.time.delayedCall(100, () => {
        if (this.player2 && this.player2.body) {
          this.player2.setGravityY(200)
        }
      })

      // Create player 2 gun
      this.gun2 = this.add.image(0, 0, this.equippedWeapon)
      if (this.equippedWeapon === 'sword') {
        this.gun2.setOrigin(0.5, 0.9)
      } else {
        this.gun2.setOrigin(0, 0.5)
      }
      this.gun2.setScale(1.0)
      this.gun2.setDepth(10)

      // Create player 2 bullets
      this.bullets2 = this.physics.add.group({
        defaultKey: 'laserBlue',
        maxSize: 30
      })

      console.log('\ud83c\udfae Player 2 created at:', this.player2.x, this.player2.y)
    }

    // Initialize Online multiplayer mode
    if (this.isOnlineMode && this.onlineGameState) {
      console.log('🌐 Initializing Online Co-op mode...')
      
      // Verify player number with service to ensure correctness
      const servicePlayerNumber = OnlineCoopService.getInstance().playerNumber
      if (this.onlinePlayerNumber !== servicePlayerNumber && servicePlayerNumber > 0) {
        console.warn(`⚠️ Player number mismatch! Scene: ${this.onlinePlayerNumber}, Service: ${servicePlayerNumber}. Using Service value.`)
        this.onlinePlayerNumber = servicePlayerNumber
      }
      
      // Determine if this player is the host (player 1)
      this.isOnlineHost = this.onlinePlayerNumber === 1
      console.log(`🌐 isOnlineHost: ${this.isOnlineHost} (player ${this.onlinePlayerNumber})`)
      
      // Create online player manager
      this.onlinePlayerManager = new OnlinePlayerManager(this, this.platforms)
      this.onlinePlayerManager.initializePlayers(this.onlineGameState, this.bullets)
      
      // Sync initial lives from GameScene to player manager
      this.onlinePlayerManager.updateLocalState({ lives: this.playerLives })
      
      // Setup entity sync callbacks for enemies and coins
      this.onlinePlayerManager.setEntityCallbacks({
        onEnemySpawned: (enemy) => this.handleRemoteEnemySpawn(enemy),
        onEnemyKilled: (enemyId, killedBy) => this.handleRemoteEnemyKilled(enemyId, killedBy),
        onEnemyStateUpdate: (enemyId, state) => {
          // enemyId is passed separately, state is partial update
          this.handleRemoteEnemyStateUpdate(enemyId, state as NetworkEnemyState)
        },
        onCoinSpawned: (coin) => this.handleRemoteCoinSpawn(coin),
        onPowerUpSpawned: (powerup) => this.handleRemotePowerUpSpawn(powerup),
        onEntitiesSync: (enemies, coins) => this.handleEntitiesSync(enemies, coins)
      })
      
      // Get local player sprite for standard game mechanics
      const localSprite = this.onlinePlayerManager.getLocalSprite()
      if (localSprite) {
        // Replace default player with online local player
        this.player.destroy()
        this.player = localSprite
        
        // Setup collisions for local player
        this.physics.add.collider(this.player, this.platforms)
      }
      
      console.log('🌐 Online players initialized, local player number:', this.onlinePlayerNumber)
    }

    // Create enemy animations - Flies
    this.anims.create({
      key: 'fly_idle',
      frames: [{ key: 'fly' }],
      frameRate: 1,
      repeat: -1
    })
    this.anims.create({
      key: 'fly_move',
      frames: [{ key: 'fly' }, { key: 'fly_fly' }],
      frameRate: 8,
      repeat: -1
    })

    // Bees
    this.anims.create({
      key: 'bee_idle',
      frames: [{ key: 'bee' }],
      frameRate: 1,
      repeat: -1
    })
    this.anims.create({
      key: 'bee_move',
      frames: [{ key: 'bee' }, { key: 'bee_fly' }],
      frameRate: 8,
      repeat: -1
    })

    // Slimes (medium)
    this.anims.create({
      key: 'slimeGreen_idle',
      frames: [{ key: 'slimeGreen' }],
      frameRate: 1,
      repeat: -1
    })
    this.anims.create({
      key: 'slimeGreen_move',
      frames: [{ key: 'slimeGreen' }, { key: 'slimeGreen_walk' }],
      frameRate: 6,
      repeat: -1
    })
    this.anims.create({
      key: 'slimeBlue_idle',
      frames: [{ key: 'slimeBlue' }],
      frameRate: 1,
      repeat: -1
    })
    this.anims.create({
      key: 'slimeBlue_move',
      frames: [{ key: 'slimeBlue' }, { key: 'slimeBlue_walk' }],
      frameRate: 6,
      repeat: -1
    })

    // Worms (large)
    this.anims.create({
      key: 'wormGreen_idle',
      frames: [{ key: 'wormGreen' }],
      frameRate: 1,
      repeat: -1
    })
    this.anims.create({
      key: 'wormGreen_move',
      frames: [{ key: 'wormGreen' }, { key: 'wormGreen_walk' }],
      frameRate: 5,
      repeat: -1
    })
    this.anims.create({
      key: 'wormPink_idle',
      frames: [{ key: 'wormPink' }],
      frameRate: 1,
      repeat: -1
    })
    this.anims.create({
      key: 'wormPink_move',
      frames: [{ key: 'wormPink' }, { key: 'wormPink_walk' }],
      frameRate: 5,
      repeat: -1
    })

    // Boss animations are created dynamically when boss spawns

    // Create enemies
    this.enemies = this.physics.add.group()

    // Spawn enemies randomly across the world
    // In online mode, both clients spawn using the same seed for determinism
    // Reset RNG state before initial enemy spawn for consistency
    if (this.isOnlineMode && this.onlineGameState) {
      this.onlineRngState = this.onlineGameState.seed * 11 + 99999  // Unique offset for initial enemies
      console.log(`👾 Initial enemy RNG reset, seed state: ${this.onlineRngState}`)
    }
    
    // In online mode, only the HOST spawns enemies - non-host receives them via network
    // This prevents duplicate enemies (local spawn + remote spawn messages)
    const shouldSpawnEnemies = !this.isOnlineMode || this.isOnlineHost
    
    if (shouldSpawnEnemies) {
      const numEnemies = 15
      console.log('═══════════════════════════════════════════════════════════')
      console.log('👾 ENEMY SPAWN - Host spawning enemies locally')
      console.log('═══════════════════════════════════════════════════════════')
      for (let i = 0; i < numEnemies; i++) {
        const rngBefore = this.onlineRngState
        const x = this.isOnlineMode ? this.onlineSeededBetween(300, 3000) : Phaser.Math.Between(300, 3000)
        const y = this.isOnlineMode ? this.onlineSeededBetween(200, 900) : Phaser.Math.Between(200, 900)
        if (this.isOnlineMode) {
          console.log(`👾 Enemy ${i}: pos=(${x}, ${y}) rngBefore=${rngBefore}`)
        }
        this.spawnRandomEnemy(x, y, 1.0, -1, i)  // Use -1 for chunk index to indicate initial spawn
      }
      if (this.isOnlineMode) {
        console.log('═══════════════════════════════════════════════════════════')
      }
    } else {
      console.log('👾 Non-host: Waiting for enemy spawn messages from host...')
    }

    // Create block fragments group
    this.blockFragments = this.physics.add.group()

    // Create coins group
    this.coins = this.physics.add.group()
    this.spawnCoins()

    // Create power-ups group
    this.powerUps = this.physics.add.group()
    this.spawnPowerUps()

    // If we're the online host, register the deterministic map entities (enemies + coins)
    // with the server so it has a full authoritative list for this session. We delay
    // slightly so all initial spawn logic has finished.
    if (this.isOnlineMode && this.isOnlineHost && this.onlinePlayerManager) {
      this.time.delayedCall(300, () => {
        try {
          const enemiesPayload: NetworkEnemyState[] = []
          this.enemies.getChildren().forEach((child: any) => {
            const s = child as Phaser.Physics.Arcade.Sprite
            const eid = s.getData('enemyId')
            if (!eid) return
            enemiesPayload.push({
              enemy_id: eid,
              enemy_type: s.getData('enemyType') || 'unknown',
              x: Math.round(s.x),
              y: Math.round(s.y),
              velocity_x: Math.round((s.body as any)?.velocity?.x || 0),
              velocity_y: Math.round((s.body as any)?.velocity?.y || 0),
              health: s.getData('health') ?? 10,
              max_health: s.getData('maxHealth') ?? (s.getData('health') ?? 10),
              is_alive: !!s.active && ((s.getData('health') ?? 1) > 0),
              facing_right: s.scaleX >= 0,
              state: s.getData('state') || 'idle'
            })
          })

          const coinsPayload: NetworkCoinState[] = []
          this.coins.getChildren().forEach((child: any) => {
            const c = child as Phaser.Physics.Arcade.Sprite
            const cid = c.getData('coinId')
            if (!cid) return
            const body = c.body as Phaser.Physics.Arcade.Body | undefined
            coinsPayload.push({
              coin_id: cid,
              x: Math.round(c.x),
              y: Math.round(c.y),
              is_collected: !!c.getData('isCollected') || false,
              collected_by: c.getData('collectedBy') || null,
              value: c.getData('value') ?? 1,
              velocity_x: body?.velocity.x || 0,
              velocity_y: body?.velocity.y || 0
            })
          })

          console.log(`🌐 Host: syncing ${enemiesPayload.length} enemies and ${coinsPayload.length} coins to server`)
          this.onlinePlayerManager?.syncEntities(enemiesPayload, coinsPayload)
        } catch (e) {
          console.warn('Failed to sync initial entities to server', e)
        }
      })
    }

    // Setup collisions
    console.log('=== COLLISION SETUP ===')
    console.log('Player:', this.player)
    console.log('Player body:', this.player.body)
    console.log('Platforms count:', this.platforms.getChildren().length)
    console.log('Platforms children:', this.platforms.getChildren().map((p: any) => ({
      x: p.x,
      y: p.y,
      hasBody: !!p.body,
      bodyType: p.body ? p.body.constructor.name : 'none'
    })))

    // CRITICAL: Enable physics debugging to see collision bodies
    console.log('=== ENABLING COLLISIONS ===')
    console.log('Physics world running:', this.physics.world.isPaused)
    console.log('Platforms in group:', this.platforms.getChildren().length)

    // Verify all platforms have bodies
    const platformsWithBodies = this.platforms.getChildren().filter((p: any) => p.body !== null)
    console.log('Platforms with bodies:', platformsWithBodies.length)

    // Create colliders with explicit active flag
    console.log('Creating colliders...')
    const playerCollider = this.physics.add.collider(this.player, this.platforms)
    playerCollider.active = true
    console.log('Player-Platform collider:', {
      active: playerCollider.active,
      object1: playerCollider.object1,
      object2: playerCollider.object2
    })

    // Player 2 colliders for co-op mode
    if (this.isCoopMode && this.player2) {
      const player2Collider = this.physics.add.collider(this.player2, this.platforms)
      player2Collider.active = true
      console.log('\ud83c\udfae Player 2-Platform collider created')

      this.physics.add.overlap(this.player2, this.enemies, this.handlePlayerEnemyCollision, undefined, this)
      this.physics.add.overlap(this.bullets2, this.enemies, this.handleBulletEnemyCollision, undefined, this)
      this.physics.add.overlap(this.player2, this.coins, this.collectCoin as any, undefined, this)
      this.physics.add.overlap(this.player2, this.powerUps, this.collectPowerUp as any, undefined, this)
      this.physics.add.collider(this.bullets2, this.platforms, this.handleBulletPlatformCollision, undefined, this)

      // Friendly fire: Player 1 bullets can hit Player 2
      this.physics.add.overlap(this.bullets, this.player2, this.handleFriendlyFire, undefined, this)
      // Friendly fire: Player 2 bullets can hit Player 1
      this.physics.add.overlap(this.bullets2, this.player, this.handleFriendlyFire, undefined, this)
    }

    const enemyCollider = this.physics.add.collider(this.enemies, this.platforms)
    enemyCollider.active = true
    console.log('Enemy-Platform collider created and activated')

    this.physics.add.collider(this.enemies, this.enemies) // Enemies collide with each other
    this.physics.add.collider(this.blockFragments, this.platforms)
    this.physics.add.collider(this.bullets, this.platforms, this.handleBulletPlatformCollision, undefined, this)
    this.physics.add.collider(this.coins, this.platforms)
    this.physics.add.collider(this.powerUps, this.platforms)

    // Setup player-enemy collision with overlap detection
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this)

    // Setup bullet-enemy collision
    this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyCollision, undefined, this)

    // Setup coin collection
    this.physics.add.overlap(this.player, this.coins, this.collectCoin as any, undefined, this)

    // Setup power-up collection
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp as any, undefined, this)

    // No collider with spikes - we'll handle manually in update

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }

    // Initialize gamepad support
    if (this.input.gamepad) {
      // Check for already connected gamepads
      if (this.input.gamepad.total > 0) {
        this.gamepad = this.input.gamepad.getPad(0)
        console.log('Gamepad already connected:', this.gamepad?.id)
      }

      // Listen for new gamepad connections
      this.input.gamepad.on('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
        this.gamepad = pad
        console.log('Gamepad connected:', pad.id)
        this.showTip('gamepad', 'Gamepad connected! Left stick/D-pad: Move, A: Jump, RT: Shoot')
      })

      // Listen for gamepad disconnections
      this.input.gamepad.on('disconnected', (pad: Phaser.Input.Gamepad.Gamepad) => {
        if (this.gamepad === pad) {
          this.gamepad = null
          console.log('Gamepad disconnected:', pad.id)
        }
      })
    }

    // Add debug toggle key
    const debugKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F3)
    debugKey.on('down', () => {
      console.log('F3 pressed!')
      this.toggleDebugMode()
    })

    // Test key to trigger game over (F8)
    const gameOverTestKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F8)
    gameOverTestKey.on('down', () => {
      console.log('🧪 F8 TEST: Forcing game over...')
      this.playerLives = 0
      this.showGameOver()
    })

    // Boss teleport key (F4) - cycles through boss levels
    const bossTeleportKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F4)
    bossTeleportKey.on('down', () => {
      if (this.gameMode === 'levels') {
        // Find next boss level (5, 10, 15, 20, etc.)
        const nextBossLevel = Math.floor(this.currentLevel / 5) * 5 + 5
        
        // Cap at level 110 (Final Boss)
        if (nextBossLevel > 110) {
          console.log('⚠️ F4: Cannot teleport beyond Level 110 (Final Boss)')
          this.showTip('debug', 'Cannot teleport beyond Level 110 (Final Boss)')
          return
        }

        console.log(`🎮 F4: Teleporting to boss level ${nextBossLevel}...`)
        const bossData: any = { gameMode: 'levels', level: nextBossLevel }
        if (this.isCoopMode) {
          bossData.mode = 'coop'
        }
        this.scene.restart(bossData)
      } else {
        console.log('⚠️ F4: Boss teleport only works in level mode')
      }
    })

    // Clear defeated bosses key (F5) - debug only
    const clearBossesKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F5)
    clearBossesKey.on('down', () => {
      if (this.debugMode) {
        localStorage.removeItem('defeatedBossLevels')
        this.defeatedBossLevels.clear()

        // Also clear specific boss keys for current player
        const playerName = localStorage.getItem('player_name') || 'Guest'
        for (let i = 0; i < 24; i++) {
          localStorage.removeItem(`${playerName}_boss_${i}`)
        }

        console.log('🧹 F5: Cleared all defeated boss levels and boss records!')
        console.log('💡 Bosses will respawn on levels 5, 10, 15, etc.')
      } else {
        console.log('⚠️ F5: Enable debug mode (F3) first to clear defeated bosses')
      }
    })

    // F6: Kill final boss (Cheat)
    const endingCheatKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F6)
    endingCheatKey.on('down', () => {
      if (this.bossActive && this.boss) {
         const bossIndex = this.boss.getData('bossIndex')
         // Check if it's the last boss (Index 21 based on % 22)
         if (bossIndex === 21) {
            console.log('📜 F6: Killing final boss to trigger ending...')
            this.boss.setData('health', 0)
            this.defeatBoss()
         } else {
            console.log(`⚠️ F6: Current boss is ${bossIndex}. Only works on final boss (21).`)
            this.showTip('debug', `F6 only works on Final Boss (Index 21). Current: ${bossIndex}`)
         }
      } else {
         console.log('⚠️ F6: No active boss found.')
      }
    })

    // ESC key to quit game and return to menu
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      this.showQuitConfirmation()
    })

    // P key to toggle AI player
    const aiToggleKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P)
    aiToggleKey.on('down', () => {
      this.toggleAI()
    })

    // Initialize AI player
    this.aiPlayer = new AIPlayer(this)

    // Initialize ML AI
    this.mlAIPlayer = new MLAIPlayer(this)

    // O key to toggle ML AI (O for "observational AI")
    const mlAIToggleKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O)
    mlAIToggleKey.on('down', () => {
      this.toggleMLAI()
    })

    // Alternative debug key (Shift+D)
    const shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    this.input.keyboard!.on('keydown-D', () => {
      if (shiftKey.isDown) {
        console.log('Shift+D pressed!')
        this.toggleDebugMode()
      }
    })
    
    // T key to open chat (online mode only)
    if (this.isOnlineMode) {
      const chatKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T)
      chatKey.on('down', () => {
        this.openInGameChat()
      })
    }

    // G key: rescue / assist partner when they are held back
    const assistKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.G)
    assistKey.on('down', () => {
      this.attemptAssistPartner()
    })
    this.assistKey = assistKey

    // Camera follows player (or both players in co-op)
    if (this.isCoopMode) {
      // In co-op, camera will be manually updated to follow center point
      console.log('\ud83c\udfae Co-op camera: Will follow center between players')
    } else {
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    }

    // Create UI elements
    this.createUI()

    // Create debug UI (hidden by default)
    this.createDebugUI()

    // Resume recording if it was active in previous level
    if (this.isRecordingForDQN) {
      this.time.delayedCall(500, () => {
        this.showRecordingStatus()
        console.log('🎥 Recording resumed from previous level')
      })
    }

    // Show tutorial tips after a delay
    this.time.delayedCall(2000, () => {
      this.showTip('welcome', 'Use WASD or Arrow Keys to move. Press W/Up to jump!')
    })

    this.time.delayedCall(8000, () => {
      this.showTip('shooting', 'Click to aim and shoot enemies. Different weapons have different speeds!')
    })
  }

  private createUI() {
    if (this.isCoopMode) {
      // Co-op mode: Show two separate health bars at top-right
      const rightX = this.cameras.main.width - 20
      const topY = 20

      // Player 1 (Green) - Top Right
      const p1Label = this.add.text(rightX - 310, topY, 'P1', {
        fontSize: '28px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      })
      p1Label.setScrollFactor(0)
      p1Label.setDepth(100)

      const p1HealthBarBg = this.add.rectangle(rightX - 260, topY + 14, 200, 20, 0x333333)
      p1HealthBarBg.setOrigin(0, 0.5)
      p1HealthBarBg.setScrollFactor(0)
      p1HealthBarBg.setDepth(100)

      this.healthBarFill = this.add.rectangle(rightX - 260, topY + 14, 200, 20, 0x00ff00)
      this.healthBarFill.setOrigin(0, 0.5)
      this.healthBarFill.setScrollFactor(0)
      this.healthBarFill.setDepth(101)

      this.livesText = this.add.text(rightX - 50, topY + 14, `x${this.playerLives}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      })
      this.livesText.setOrigin(0, 0.5)
      this.livesText.setScrollFactor(0)
      this.livesText.setDepth(100)

      // Player 2 (Cyan) - Below Player 1
      const p2Y = topY + 45
      const p2Label = this.add.text(rightX - 310, p2Y, 'P2', {
        fontSize: '28px',
        color: '#00ffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      })
      p2Label.setScrollFactor(0)
      p2Label.setDepth(100)

      const p2HealthBarBg = this.add.rectangle(rightX - 260, p2Y + 14, 200, 20, 0x333333)
      p2HealthBarBg.setOrigin(0, 0.5)
      p2HealthBarBg.setScrollFactor(0)
      p2HealthBarBg.setDepth(100)
      p2HealthBarBg.setName('p2HealthBarBg')

      const p2HealthBarFill = this.add.rectangle(rightX - 260, p2Y + 14, 200, 20, 0x00ffff)
      p2HealthBarFill.setOrigin(0, 0.5)
      p2HealthBarFill.setScrollFactor(0)
      p2HealthBarFill.setDepth(101)
      p2HealthBarFill.setName('p2HealthBarFill')

      const p2LivesText = this.add.text(rightX - 50, p2Y + 14, `x${this.playerLives}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      })
      p2LivesText.setOrigin(0, 0.5)
      p2LivesText.setScrollFactor(0)
      p2LivesText.setDepth(100)
      p2LivesText.setName('p2LivesText')

      // Store references for player 2
      this.player2.setData('healthBarFill', p2HealthBarFill)
      this.player2.setData('livesText', p2LivesText)
      this.player2.setData('health', 100)
      this.player2.setData('lives', 3)
      this.player2.setData('coins', 0)
      this.player2.setData('score', 0)

      this.healthBarBackground = p1HealthBarBg

      // Add separate score/coin displays for co-op mode below health bars
      const scoreY = p2Y + 50

      // Player 1 Score/Coins
      const p1ScoreText = this.add.text(rightX - 310, scoreY, 'Score: 0', {
        fontSize: '18px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      })
      p1ScoreText.setScrollFactor(0)
      p1ScoreText.setDepth(100)
      p1ScoreText.setName('p1ScoreText')

      const p1CoinIcon = this.add.text(rightX - 180, scoreY, '🪙', {
        fontSize: '18px'
      })
      p1CoinIcon.setScrollFactor(0)
      p1CoinIcon.setDepth(100)

      const p1CoinText = this.add.text(rightX - 160, scoreY, '0', {
        fontSize: '18px',
        color: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      })
      p1CoinText.setScrollFactor(0)
      p1CoinText.setDepth(100)
      p1CoinText.setName('p1CoinText')

      // Player 2 Score/Coins
      const p2ScoreTextObj = this.add.text(rightX - 310, scoreY + 25, 'Score: 0', {
        fontSize: '18px',
        color: '#00ffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      })
      p2ScoreTextObj.setScrollFactor(0)
      p2ScoreTextObj.setDepth(100)
      p2ScoreTextObj.setName('p2ScoreText')

      const p2CoinIcon = this.add.text(rightX - 180, scoreY + 25, '🪙', {
        fontSize: '18px'
      })
      p2CoinIcon.setScrollFactor(0)
      p2CoinIcon.setDepth(100)

      const p2CoinText = this.add.text(rightX - 160, scoreY + 25, '0', {
        fontSize: '18px',
        color: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      })
      p2CoinText.setScrollFactor(0)
      p2CoinText.setDepth(100)
      p2CoinText.setName('p2CoinText')
    } else {
      // Single player mode: Original UI at top-right
      const startX = this.cameras.main.width - 20
      const startY = 20

      // Top-right: Lives and Health - show player name in online mode
      this.livesText = this.add.text(startX, startY, this.getLivesText(), {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      })
      this.livesText.setOrigin(1, 0)
      this.livesText.setScrollFactor(0)

      // Create health bar (below lives)
      const healthBarWidth = 200
      const healthBarHeight = 20
      const healthBarY = startY + 35

      // Background (empty state)
      this.healthBarBackground = this.add.rectangle(
        startX - healthBarWidth,
        healthBarY,
        healthBarWidth,
        healthBarHeight,
        0x333333
      )
      this.healthBarBackground.setOrigin(0, 0)
      this.healthBarBackground.setScrollFactor(0)

      // Fill (shows current health)
      this.healthBarFill = this.add.rectangle(
        startX - healthBarWidth,
        healthBarY,
        healthBarWidth,
        healthBarHeight,
        0x00ff00
      )
      this.healthBarFill.setOrigin(0, 0)
      this.healthBarFill.setScrollFactor(0)

      // Create reload bar below health bar (single player only)
      const reloadBarY = healthBarY + healthBarHeight + 10
      const reloadBarWidth = 60
      const reloadBarHeight = 12

      this.reloadBarBackground = this.add.rectangle(
        startX - reloadBarWidth,
        reloadBarY,
        reloadBarWidth,
        reloadBarHeight,
        0x333333
      )
      this.reloadBarBackground.setScrollFactor(0)
      this.reloadBarBackground.setOrigin(0, 0)

      this.reloadBarFill = this.add.rectangle(
        startX - reloadBarWidth,
        reloadBarY,
        0,
        reloadBarHeight,
        0x00aaff
      )
      this.reloadBarFill.setScrollFactor(0)
      this.reloadBarFill.setOrigin(0, 0)
    }

    // Reload bars for co-op mode (optional - can be added later if needed)
    if (this.isCoopMode) {
      // For now, skip reload bars in co-op to keep UI clean
      this.reloadBarBackground = this.add.rectangle(0, 0, 0, 0, 0x000000)
      this.reloadBarBackground.setVisible(false)
      this.reloadBarFill = this.add.rectangle(0, 0, 0, 0, 0x000000)
      this.reloadBarFill.setVisible(false)
    }

    // Top-left: Coins and Score (compact)
    this.coinIcon = this.add.image(25, 20, 'coin')
    this.coinIcon.setScrollFactor(0)
    this.coinIcon.setScale(0.35)

    this.coinText = this.add.text(50, 12, '0', {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.coinText.setScrollFactor(0)

    this.scoreText = this.add.text(20, 40, 'Score: 0', {
      fontSize: '22px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.scoreText.setScrollFactor(0)

    // High score (compact, below score)
    this.highScore = parseInt(localStorage.getItem('jumpjump_highscore') || '0')
    this.highScoreText = this.add.text(20, 65, `Best: ${this.highScore}`, {
      fontSize: '18px',
      color: '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    })
    this.highScoreText.setScrollFactor(0)

    // Save Button (Single Player Levels Mode Only)
    if (!this.isCoopMode && !this.isOnlineMode && this.gameMode === 'levels') {
      const saveBtn = this.add.text(20, 95, '💾 SAVE & QUIT', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#008800',
        padding: { x: 8, y: 4 }
      })
      saveBtn.setScrollFactor(0)
      saveBtn.setDepth(100)
      saveBtn.setInteractive({ useHandCursor: true })
      saveBtn.on('pointerover', () => saveBtn.setBackgroundColor('#00aa00'))
      saveBtn.on('pointerout', () => saveBtn.setBackgroundColor('#008800'))
      saveBtn.on('pointerdown', () => {
        this.saveGame()
        this.time.delayedCall(1500, () => {
           this.scene.start('MenuScene')
        })
      })
    }

    // Level display
    const levelDisplayText = this.gameMode === 'endless' ? 'ENDLESS MODE' : `LEVEL ${this.currentLevel}`
    this.levelText = this.add.text(640, 20, levelDisplayText, {
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    this.levelText.setOrigin(0.5, 0)
    this.levelText.setScrollFactor(0)
    this.levelText.setDepth(100)

    // AI status indicator (top center, below level)
    this.aiStatusText = this.add.text(640, 55, '', {
      fontSize: '18px',
      color: '#ff00ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.aiStatusText.setOrigin(0.5, 0)
    this.aiStatusText.setScrollFactor(0)
    this.aiStatusText.setDepth(100)
    this.aiStatusText.setVisible(false)

    // Create home button (bottom-left corner) - prominent red circle
    const homeButtonX = 60
    const homeButtonY = 660

    // Create a red circle button (always use circle, ignore icon)
    const homeButton = this.add.circle(homeButtonX, homeButtonY, 35, 0xff0000, 0.8)
    homeButton.setStrokeStyle(3, 0xffffff)
    homeButton.setDepth(1000) // High depth to be visible
    homeButton.setScrollFactor(0)
    homeButton.setInteractive({ useHandCursor: true })

    // Add HOME text inside circle
    const homeText = this.add.text(homeButtonX, homeButtonY, 'HOME', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    homeText.setOrigin(0.5)
    homeText.setScrollFactor(0)
    homeText.setDepth(1001)

    homeButton.on('pointerover', () => {
      homeButton.setFillStyle(0xff3333, 1)
      homeButton.setScale(1.1)
      homeText.setScale(1.1)
    })
    homeButton.on('pointerout', () => {
      homeButton.setFillStyle(0xff0000, 0.8)
      homeButton.setScale(1)
      homeText.setScale(1)
    })
    homeButton.on('pointerdown', () => {
      this.showQuitConfirmation()
    })

    // Create particle emitters
    this.jumpParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 150 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.3, end: 0 },
      lifespan: 400,
      gravityY: 200,
      quantity: 5,
      tint: 0xaaaaaa
    })
    this.jumpParticles.stop()

    this.landParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 30, max: 100 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.4, end: 0 },
      lifespan: 500,
      gravityY: 300,
      quantity: 8,
      tint: 0x888888
    })
    this.landParticles.stop()

    this.coinParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 600,
      gravityY: -100,
      quantity: 10,
      tint: 0xFFD700
    })
    this.coinParticles.stop()

    // Initialize DQN agent if in training mode
    if (this.dqnTraining) {
      this.initializeDQNAgent()
    }
  }

  private spawnCoins() {
    // In online mode, only HOST spawns coins - non-host receives them via network
    // This prevents duplicate coins
    if (this.isOnlineMode && !this.isOnlineHost) {
      console.log('🪙 COIN DEBUG: Non-host skipping spawnCoins() - waiting for network')
      return
    }
    console.log(`🪙 COIN DEBUG: spawnCoins() called - isOnlineMode=${this.isOnlineMode}, isHost=${this.isOnlineHost}`)
    
    // Spawn coins at various positions throughout the world (Y values are above floor at 650)
    const coinPositions = [
      { x: 600, y: 450 },
      { x: 1000, y: 400 },
      { x: 1400, y: 350 },
      { x: 1800, y: 500 },
      { x: 2200, y: 400 },
      { x: 2600, y: 450 },
      { x: 3000, y: 350 },
      { x: 800, y: 300 },
      { x: 1200, y: 550 },
      { x: 1600, y: 300 },
      { x: 2000, y: 500 },
      { x: 2400, y: 350 },
      { x: 2800, y: 500 },
      { x: 500, y: 400 },
      { x: 1100, y: 350 }
    ]

    coinPositions.forEach((pos, index) => {
      const coin = this.coins.create(pos.x, pos.y, 'coin')
      coin.setScale(0.5)
      coin.setBounce(0.3)
      coin.setCollideWorldBounds(true)
      // Disable gravity for floating level coins so they don't fall
      if (coin.body) {
        (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
      }
      // Add unique ID for online sync
      coin.setData('coinId', `coin_init_${index}_${pos.x}_${pos.y}`)
      coin.setData('value', 1)

      // Add floating animation
      this.tweens.add({
        targets: coin,
        y: pos.y - 20,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // Add rotation animation
      this.tweens.add({
        targets: coin,
        angle: 360,
        duration: 3000,
        repeat: -1,
        ease: 'Linear'
      })

      // Only host reports to server - non-host generates same coins locally
      if (!this.isOnlineMode || this.isOnlineHost) {
        console.log(`🪙 COIN DEBUG: Initial coin ${coin.getData('coinId')} at (${pos.x}, ${pos.y}) - reporting to server`)
        this.reportCoinSpawnToServer(coin)
      }
    })
  }

  // ============================================================================
  // DQN TRAINING METHODS
  // ============================================================================

  private async initializeDQNAgent() {
    if (!this.dqnTraining) return

    // If agent already exists (from previous level), just recreate UI
    if (this.dqnAgent) {
      console.log('🤖 DQN Agent exists, recreating UI...')
      this.createDQNTrainingUI()
      return
    }

    console.log('🤖 Initializing DQN Agent...')
    this.dqnAgent = new DQNAgent(this)
    
    // Try to load existing model
    try {
      await this.dqnAgent.loadModel()
      console.log('✅ Loaded existing DQN model')
    } catch (e) {
      console.log('ℹ️ No existing model found, starting fresh')
    }

    this.dqnEpisodeCount = 0
    this.dqnStepCount = 0
    this.dqnCurrentReward = 0
    this.dqnLastEpisodeReward = 0
    this.dqnTotalReward = 0
    this.dqnTrainingPaused = false

    // Create UI overlay for training stats
    this.createDQNTrainingUI()
  }

  private createDQNTrainingUI() {
    if (!this.dqnTraining) return

    // Training status panel (right side, avoiding center tip area)
    const panelX = 1095
    const panelY = 320
    const panelWidth = 350
    const panelHeight = 320
    
    // Background
    const panelBg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x000000, 0.8)
    panelBg.setScrollFactor(0)
    panelBg.setDepth(1000)
    
    // Border using graphics for clean rendering
    const border = this.add.graphics()
    border.lineStyle(3, 0x00ff00, 1)
    border.strokeRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight)
    border.setScrollFactor(0)
    border.setDepth(1000)

    const title = this.add.text(panelX, panelY - 130, '🤖 DQN TRAINING', {
      fontSize: '24px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    title.setOrigin(0.5)
    title.setScrollFactor(0)
    title.setDepth(1001)

    this.dqnStatusText = this.add.text(panelX, panelY - 100, '● RUNNING', {
      fontSize: '20px',
      color: '#00ff00',
      fontStyle: 'bold'
    })
    this.dqnStatusText.setOrigin(0.5)
    this.dqnStatusText.setScrollFactor(0)
    this.dqnStatusText.setDepth(1001)

    this.dqnStatsText = this.add.text(panelX, panelY - 50, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'left',
      wordWrap: { width: 320, useAdvancedWrap: true }
    })
    this.dqnStatsText.setOrigin(0.5, 0)
    this.dqnStatsText.setScrollFactor(0)
    this.dqnStatsText.setDepth(1001)

    const controls = this.add.text(panelX, panelY + 135, 'SPACE: Pause | R: Reset | S: Save | L: Load\n1-5: Speed | A: Auto-restart | ESC: Exit', {
      fontSize: '11px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 340, useAdvancedWrap: true }
    })
    controls.setOrigin(0.5, 0.5)
    controls.setScrollFactor(0)
    controls.setDepth(1001)
  }

  private updateDQNTrainingUI() {
    if (!this.dqnTraining || !this.dqnAgent) return
    
    // Check if UI elements exist and are active
    if (!this.dqnStatsText || !this.dqnStatsText.active) return
    if (!this.dqnStatusText || !this.dqnStatusText.active) return

    try {
      // Update status
      if (this.dqnTrainingPaused) {
        this.dqnStatusText.setText('● PAUSED')
        this.dqnStatusText.setColor('#ffaa00')
      } else {
        this.dqnStatusText.setText('● RUNNING')
        this.dqnStatusText.setColor('#00ff00')
      }

      // Get stats from agent
      const stats = this.dqnAgent.getStats()
      
      // Calculate average reward (last 100 episodes)
      const avgReward = this.dqnEpisodeCount > 0 ? (this.dqnTotalReward / this.dqnEpisodeCount).toFixed(2) : '0.00'

      // Update stats text (compact layout)
      const statsText = [
        `Episode: ${this.dqnEpisodeCount}  |  Steps: ${this.dqnStepCount}  |  Speed: ${this.dqnSpeedMultiplier}x`,
        `Epsilon: ${stats.epsilon.toFixed(3)}  |  Buffer: ${stats.bufferSize}  |  Train: ${stats.trainingSteps}`,
        ``,
        `Reward: ${this.dqnCurrentReward.toFixed(2)}  |  Last: ${this.dqnLastEpisodeReward.toFixed(2)}  |  Avg: ${avgReward}`
      ].join('\n')

      this.dqnStatsText.setText(statsText)
    } catch (error) {
      // Silently catch errors during scene transition
      console.warn('Error updating DQN UI:', error)
    }
  }

  private extractDQNState(): DQNState {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    
    // Player position and velocity
    const playerX = this.player.x
    const playerY = this.player.y
    const velocityX = body.velocity.x
    const velocityY = body.velocity.y
    const onGround = body.touching.down || body.blocked.down
    
    // Find nearest platform ahead
    let nearestPlatformDistance = 1000
    let nearestPlatformHeight = 0
    let hasGroundAhead = false
    let gapAhead = false
    
    const platformsArray = this.platforms.getChildren() as Phaser.Physics.Arcade.Sprite[]
    const playerBottom = this.player.y + 20
    const searchDistance = 300
    
    for (const platform of platformsArray) {
      if (!platform.active) continue
      
      const platformLeft = platform.x - platform.width / 2
      const platformRight = platform.x + platform.width / 2
      const platformTop = platform.y - platform.height / 2
      
      // Check if platform is ahead of player
      if (platformRight > playerX && platformLeft < playerX + searchDistance) {
        const distance = Math.abs(platformLeft - playerX)
        const heightDiff = platformTop - playerBottom
        
        if (distance < nearestPlatformDistance) {
          nearestPlatformDistance = distance
          nearestPlatformHeight = heightDiff
        }
        
        // Check if there's ground directly ahead (within 100px)
        if (distance < 100 && Math.abs(heightDiff) < 50) {
          hasGroundAhead = true
        }
      }
    }
    
    // Check for gaps ahead (no platform within reasonable distance)
    if (onGround && !hasGroundAhead && nearestPlatformDistance > 150) {
      gapAhead = true
    }
    
    // Find nearest enemy
    let nearestEnemyDistance = 1000
    const enemiesArray = this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
    for (const enemy of enemiesArray) {
      if (!enemy.active) continue
      const distance = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y)
      if (distance < nearestEnemyDistance) {
        nearestEnemyDistance = distance
      }
    }
    
    // Find nearest spike
    let nearestSpikeDistance = 1000
    for (const spikePos of this.spikePositions) {
      const distance = Math.abs(spikePos.x - playerX)
      if (distance < nearestSpikeDistance && spikePos.x > playerX - 50) {
        nearestSpikeDistance = distance
      }
    }
    
    // Boss detection
    let bossActive = false
    let bossDistance = 1000
    let bossHealth = 100
    if (this.boss && this.boss.active && this.bossActive) {
      bossActive = true
      bossDistance = Phaser.Math.Distance.Between(playerX, playerY, this.boss.x, this.boss.y)
      bossHealth = (this.boss.getData('health') || 100)
    }
    
    return {
      playerX,
      playerY,
      velocityX,
      velocityY,
      onGround,
      nearestPlatformDistance,
      nearestPlatformHeight,
      nearestEnemyDistance,
      nearestSpikeDistance,
      hasGroundAhead,
      gapAhead,
      bossActive,
      bossDistance,
      bossHealth
    }
  }

  private applyDQNAction(action: DQNAction) {
    if (!this.dqnAgent || this.dqnTrainingPaused) return

    const body = this.player.body as Phaser.Physics.Arcade.Body
    const moveSpeed = 300 * this.dqnSpeedMultiplier
    const onGround = body.touching.down || body.blocked.down

    // Reset horizontal velocity
    body.setVelocityX(0)

    // Apply movement
    if (action.moveLeft) {
      body.setVelocityX(-moveSpeed)
      this.player.setFlipX(true)
    } else if (action.moveRight) {
      body.setVelocityX(moveSpeed)
      this.player.setFlipX(false)
    }

    // Apply jump (including double jump)
    if (action.jump) {
      if (onGround) {
        // First jump
        body.setVelocityY(-600)
        this.canDoubleJump = true
        this.hasDoubleJumped = false
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // Double jump
        body.setVelocityY(-550)
        this.hasDoubleJumped = true
        this.canDoubleJump = false
      }
    }

    // Auto-aim gun at nearest enemy
    const enemiesArray = this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
    let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null
    let nearestDistance = Infinity

    for (const enemy of enemiesArray) {
      if (!enemy.active) continue
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      )
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    }

    // Calculate gun angle
    let gunAngle = 0
    if (nearestEnemy) {
      gunAngle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y,
        nearestEnemy.x, nearestEnemy.y
      )
    } else {
      // Aim forward in movement direction
      gunAngle = this.player.flipX ? Math.PI : 0
    }

    // For sword, position 23 degrees ahead
    if (this.equippedWeapon === 'sword') {
      gunAngle += Phaser.Math.DegToRad(23)
    }

    // Position gun around player with proper offset
    const distanceFromPlayer = 30
    const gunX = this.player.x + Math.cos(gunAngle) * distanceFromPlayer
    const gunY = this.player.y + Math.sin(gunAngle) * distanceFromPlayer
    this.gun.setPosition(gunX, gunY)

    // Flip gun sprite if pointing backward
    if (gunAngle > Math.PI / 2 || gunAngle < -Math.PI / 2) {
      this.gun.setScale(1.0, -1.0)
    } else {
      this.gun.setScale(1.0, 1.0)
    }

    // Apply rotation
    this.gun.setRotation(gunAngle)

    // Store shooting intent for handleShooting to use
    this.dqnShooting = action.shoot
  }

  private async updateDQNTraining() {
    if (!this.dqnTraining || !this.dqnAgent || this.dqnTrainingPaused || this.playerIsDead) {
      return
    }

    // Extract current state
    const currentState = this.extractDQNState()

    // If we have a previous state and action, store the experience
    if (this.lastDQNState && this.lastDQNAction !== undefined) {
      const reward = this.dqnAgent.calculateReward(
        this.lastDQNState,
        this.playerIsDead,
        this.score,
        this.lastDQNAction.actionIndex
      )
      
      this.dqnCurrentReward += reward
      this.dqnTotalReward += reward

      // Store experience
      this.dqnAgent.remember(
        this.lastDQNState,
        this.lastDQNAction.actionIndex,
        reward,
        currentState,
        this.playerIsDead
      )

      // Train the agent periodically
      if (this.dqnStepCount % 4 === 0) {
        await this.dqnAgent.train()
      }
    }

    // Get next action from agent
    const action = await this.dqnAgent.selectAction(currentState)
    
    // Apply action to player
    this.applyDQNAction(action)

    // Store state and action for next frame
    this.lastDQNState = currentState
    this.lastDQNAction = action
    this.dqnStepCount++
  }

  private async handleDQNEpisodeEnd() {
    if (!this.dqnTraining || !this.dqnAgent) return

    console.log(`📊 Episode ${this.dqnEpisodeCount} ended - Reward: ${this.dqnCurrentReward.toFixed(2)}, Steps: ${this.dqnStepCount}`)

    // Store episode reward
    this.dqnLastEpisodeReward = this.dqnCurrentReward

    // Reset episode
    this.dqnAgent.resetEpisode()
    this.dqnEpisodeCount++
    this.dqnCurrentReward = 0
    this.dqnStepCount = 0
    this.lastDQNState = undefined
    this.lastDQNAction = undefined

    // Auto-restart if enabled
    if (this.dqnAutoRestart) {
      console.log('🔄 Auto-restarting DQN training episode...')
      
      // Force stop all animations and effects immediately
      this.tweens.killAll()
      this.time.removeAllEvents()
      this.cameras.main.resetFX()
      this.cameras.main.setAlpha(1)
      this.cameras.main.setBackgroundColor(0x000000)
      
      // Use nextTick to ensure clean restart
      this.time.delayedCall(1, () => {
        this.scene.restart({
          gameMode: this.gameMode,
          level: this.currentLevel,
          dqnTraining: true
        })
      })
    }
  }

  private handleDQNKeyboardControls() {
    if (!this.dqnTraining || !this.input.keyboard) return

    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    const rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
    const sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    const lKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
    const aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)

    // SPACE - Pause/Resume
    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
      this.dqnTrainingPaused = !this.dqnTrainingPaused
      console.log(this.dqnTrainingPaused ? '⏸️ Training paused' : '▶️ Training resumed')
    }

    // R - Reset episode
    if (Phaser.Input.Keyboard.JustDown(rKey)) {
      console.log('🔄 Resetting episode...')
      this.scene.restart({
        gameMode: this.gameMode,
        level: this.currentLevel,
        dqnTraining: true
      })
    }

    // S - Save model
    if (Phaser.Input.Keyboard.JustDown(sKey) && this.dqnAgent) {
      console.log('💾 Saving model...')
      this.dqnAgent.saveModel()
    }

    // L - Load model
    if (Phaser.Input.Keyboard.JustDown(lKey) && this.dqnAgent) {
      console.log('📂 Loading model...')
      this.dqnAgent.loadModel()
    }

    // 1-5 - Speed multiplier
    const oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
    const twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
    const threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    const fourKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
    const fiveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE)
    
    if (Phaser.Input.Keyboard.JustDown(oneKey)) {
      this.dqnSpeedMultiplier = 1
      this.physics.world.timeScale = 1
      console.log('⚡ Speed: 1x')
    } else if (Phaser.Input.Keyboard.JustDown(twoKey)) {
      this.dqnSpeedMultiplier = 2
      this.physics.world.timeScale = 0.5
      console.log('⚡ Speed: 2x')
    } else if (Phaser.Input.Keyboard.JustDown(threeKey)) {
      this.dqnSpeedMultiplier = 3
      this.physics.world.timeScale = 0.333
      console.log('⚡ Speed: 3x')
    } else if (Phaser.Input.Keyboard.JustDown(fourKey)) {
      this.dqnSpeedMultiplier = 4
      this.physics.world.timeScale = 0.25
      console.log('⚡ Speed: 4x')
    } else if (Phaser.Input.Keyboard.JustDown(fiveKey)) {
      this.dqnSpeedMultiplier = 5
      this.physics.world.timeScale = 0.2
      console.log('⚡ Speed: 5x')
    }

    // A - Toggle auto-restart
    if (Phaser.Input.Keyboard.JustDown(aKey)) {
      this.dqnAutoRestart = !this.dqnAutoRestart
      console.log(this.dqnAutoRestart ? '🔁 Auto-restart ON' : '⏹️ Auto-restart OFF')
    }

    // ESC - Exit training
    if (Phaser.Input.Keyboard.JustDown(escKey)) {
      console.log('🚪 Exiting training...')
      if (this.dqnAgent) {
        this.dqnAgent.dispose()
        this.dqnAgent = undefined  // Clear reference after disposal
      }
      this.dqnTraining = false
      this.scene.start('MenuScene')
    }
  }

  /**
   * Handle T key for recording player gameplay to teach DQN
   */
  private handleDQNRecordingKey() {
    if (!this.input.keyboard) return
    
    const tKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T)
    const iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I)
    
    // T - Toggle recording
    if (Phaser.Input.Keyboard.JustDown(tKey)) {
      this.isRecordingForDQN = !this.isRecordingForDQN
      
      if (this.isRecordingForDQN) {
        console.log('🎥 Started recording gameplay for DQN learning...')
        this.recordedDemonstrations = []
        this.lastRecordedState = undefined
        this.lastRecordedAction = undefined
        this.showRecordingStatus()
      } else {
        console.log(`🎥 Stopped recording. Collected ${this.recordedDemonstrations.length} demonstrations.`)
        this.hideRecordingStatus()
        
        // Save demonstrations - limit to last 5000 frames to avoid quota issues
        if (this.recordedDemonstrations.length > 0) {
          const maxDemos = 5000
          const demosToSave = this.recordedDemonstrations.slice(-maxDemos)
          
          // Compress data by rounding floats to 2 decimal places
          const compressedDemos = demosToSave.map(d => ({
            s: this.compressState(d.state),
            a: d.action,
            ns: this.compressState(d.nextState),
            r: Math.round(d.reward * 100) / 100,
            d: d.done ? 1 : 0
          }))
          
          try {
            localStorage.setItem('dqn-demonstrations', JSON.stringify(compressedDemos))
            console.log(`💾 Saved ${demosToSave.length} demonstrations to localStorage`)
            this.showTip('recording_saved', `✅ Saved ${demosToSave.length} demonstrations! Press I to import into DQN.`)
          } catch (e) {
            console.warn('localStorage quota exceeded, importing directly to DQN...')
            // Direct import instead of saving
            this.importDemonstrationsToDQN()
          }
        }
      }
    }
    
    // I - Import recorded demonstrations into DQN
    if (Phaser.Input.Keyboard.JustDown(iKey)) {
      this.importDemonstrationsToDQN()
    }
    
    // Record current frame if recording is active (sample every 3rd frame to reduce data)
    if (this.isRecordingForDQN && !this.playerIsDead) {
      this.recordingFrameCount++
      if (this.recordingFrameCount % 3 === 0) {
        this.recordPlayerFrame()
      }
    }
  }

  // Compress state to reduce storage size
  private compressState(state: any) {
    return {
      px: Math.round(state.playerX),
      py: Math.round(state.playerY),
      vx: Math.round(state.velocityX * 10) / 10,
      vy: Math.round(state.velocityY * 10) / 10,
      og: state.onGround ? 1 : 0,
      np: Math.round(state.nearestPlatformX),
      npy: Math.round(state.nearestPlatformY),
      ne: Math.round(state.nearestEnemyX),
      ney: Math.round(state.nearestEnemyY),
      ns: Math.round(state.nearestSpikeX),
      ba: state.bossActive ? 1 : 0,
      bd: Math.round(state.bossDistance),
      bh: Math.round(state.bossHealth)
    }
  }

  // Decompress state back to full format
  private decompressState(s: any) {
    return {
      playerX: s.px,
      playerY: s.py,
      velocityX: s.vx,
      velocityY: s.vy,
      onGround: s.og === 1,
      nearestPlatformX: s.np,
      nearestPlatformY: s.npy,
      nearestEnemyX: s.ne,
      nearestEnemyY: s.ney,
      nearestSpikeX: s.ns,
      bossActive: s.ba === 1,
      bossDistance: s.bd,
      bossHealth: s.bh
    }
  }

  private showRecordingStatus() {
    try {
      // Destroy old text if it exists but is not active
      if (this.recordingStatusText && !this.recordingStatusText.active) {
        this.recordingStatusText = undefined
      }
      
      if (!this.recordingStatusText) {
        this.recordingStatusText = this.add.text(640, 50, '🔴 RECORDING - Press T to stop', {
          fontSize: '24px',
          color: '#ff0000',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
          backgroundColor: '#000000aa',
          padding: { x: 10, y: 5 }
        })
        this.recordingStatusText.setOrigin(0.5)
        this.recordingStatusText.setScrollFactor(0)
        this.recordingStatusText.setDepth(2000)
      }
      this.recordingStatusText.setVisible(true)
    } catch (e) {
      console.warn('Could not show recording status:', e)
    }
  }

  private hideRecordingStatus() {
    try {
      if (this.recordingStatusText && this.recordingStatusText.active) {
        this.recordingStatusText.setVisible(false)
      }
    } catch (e) {
      // Ignore errors when hiding
    }
  }

  private recordPlayerFrame() {
    // Capture current state
    const currentState = this.extractDQNState()
    
    // Capture player's current action
    const currentAction = {
      moveLeft: this.cursors.left.isDown || this.wasd.a.isDown,
      moveRight: this.cursors.right.isDown || this.wasd.d.isDown,
      jump: Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.w),
      shoot: this.input.activePointer.isDown
    }
    
    // If we have a previous state, create a demonstration
    if (this.lastRecordedState && this.lastRecordedAction) {
      // Simple reward: progress-based
      const progress = currentState.playerX - this.lastRecordedState.playerX
      let reward = progress / 100  // Reward forward progress
      reward += 0.01  // Small survival bonus
      if (currentState.onGround) reward += 0.02
      
      this.recordedDemonstrations.push({
        state: this.lastRecordedState,
        action: this.lastRecordedAction,
        nextState: currentState,
        reward: reward,
        done: this.playerIsDead
      })
      
      // Update recording status text
      if (this.recordingStatusText && this.recordingStatusText.active && this.recordedDemonstrations.length % 50 === 0) {
        try {
          this.recordingStatusText.setText(`🔴 RECORDING: ${this.recordedDemonstrations.length} frames - Press T to stop`)
        } catch (e) {
          // Text object may be destroyed, ignore
        }
      }
    }
    
    // Store current as last for next frame
    this.lastRecordedState = currentState
    this.lastRecordedAction = currentAction
  }

  private async importDemonstrationsToDQN() {
    // Initialize DQN agent if not exists
    if (!this.dqnAgent) {
      console.log('🤖 Creating DQN agent for importing demonstrations...')
      this.dqnAgent = new DQNAgent(this)
    }
    
    // Try to load from localStorage
    const savedData = localStorage.getItem('dqn-demonstrations')
    if (!savedData) {
      console.log('❌ No saved demonstrations found. Press T to record gameplay first.')
      this.showTip('no_demos', '❌ No saved demonstrations! Press T to record your gameplay first.')
      return
    }
    
    try {
      const compressedDemos = JSON.parse(savedData)
      console.log(`📦 Found ${compressedDemos.length} saved demonstrations`)
      
      // Decompress demonstrations back to full format
      const demonstrations = compressedDemos.map((d: any) => ({
        state: this.decompressState(d.s),
        action: d.a,
        nextState: this.decompressState(d.ns),
        reward: d.r,
        done: d.d === 1
      }))
      
      const importedCount = await this.dqnAgent.importDemonstrations(demonstrations)
      
      this.showTip('demos_imported', `✅ Imported ${importedCount} demonstrations! DQN is learning from your gameplay.`)
      
      // Optionally save the model
      await this.dqnAgent.saveModel()
      console.log('💾 Model saved after learning from demonstrations')
      
    } catch (error) {
      console.error('❌ Error importing demonstrations:', error)
      this.showTip('import_error', '❌ Error importing demonstrations. Check console for details.')
    }
  }

  private collectCoin(_player: Phaser.Physics.Arcade.Sprite, coin: Phaser.Physics.Arcade.Sprite) {
    // Get coin ID for online sync - use deterministic ID based on stored data or position
    const coinId = coin.getData('coinId') || `coin_${Math.floor(coin.x)}_${Math.floor(coin.y)}`
    
    // Report collection to online service (if online mode)
    if (this.isOnlineMode && this.onlinePlayerManager) {
      this.onlinePlayerManager.reportItemCollected('coin', coinId)
      // Also remove from remote coins tracking if present
      this.remoteCoins.delete(coinId)
    }
    
    // Remove coin
    coin.destroy()

    // Determine which player collected the coin
    const isPlayer2 = this.isCoopMode && _player === this.player2

    if (this.isCoopMode && isPlayer2) {
      // Player 2 collected coin - track separately (local co-op)
      const p2Coins = (_player.getData('coins') || 0) + 1
      const p2Score = (_player.getData('score') || 0) + 10
      _player.setData('coins', p2Coins)
      _player.setData('score', p2Score)

      // Update Player 2's UI (if exists)
      const p2CoinText = this.children.getByName('p2CoinText') as Phaser.GameObjects.Text
      const p2ScoreText = this.children.getByName('p2ScoreText') as Phaser.GameObjects.Text
      if (p2CoinText) p2CoinText.setText(p2Coins.toString())
      if (p2ScoreText) p2ScoreText.setText(`Score: ${p2Score}`)
    } else {
      // Local player collected coin (single player, online mode, or player 1 in local co-op)
      this.coinCount++
      this.updateScore(10)

      // Update coin text (handle both single player and co-op)
      if (this.isCoopMode) {
        const p1CoinText = this.children.getByName('p1CoinText') as Phaser.GameObjects.Text
        if (p1CoinText) p1CoinText.setText(this.coinCount.toString())
      } else if (this.coinText) {
        this.coinText.setText(this.coinCount.toString())
      }
    }

    // Save total coins to localStorage (combined for shop access)
    const totalCoins = this.coinCount + (this.player2?.getData('coins') || 0)
    localStorage.setItem('playerCoins', totalCoins.toString())

    // Show shop tip when player reaches 50 coins for the first time
    if (this.coinCount === 50) {
      this.showTip('shop', 'You have 50 coins! Visit the Shop from the menu to buy weapons and skins!')
    }

    // Play coin sound
    this.audioManager.playCoinSound()

    // Play collection particle effect
    this.coinParticles.emitParticleAt(coin.x, coin.y)

    // Scale animation on coin icon
    this.tweens.add({
      targets: this.coinIcon,
      scale: 0.6,
      duration: 100,
      yoyo: true,
      ease: 'Cubic.easeOut'
    })
  }

  private spawnPowerUps() {
    // In online mode, only HOST spawns power-ups - non-host receives them via network
    if (this.isOnlineMode && !this.isOnlineHost) {
      console.log('🎁 Non-host: Waiting for power-up spawn messages from host...')
      return
    }
    
    // Spawn power-ups at random positions on platforms
    const powerUpTypes = ['powerSpeed', 'powerShield', 'powerLife', 'powerHealth', 'powerHealth']
    const numPowerUps = 10

    // Reset RNG for power-ups in online mode for deterministic spawning
    // Use seeded RNG for BOTH online and offline modes
    const seed = this.onlineSeed || 12345 // Fallback seed
    this.onlineRngState = seed * 11 + 99999
    console.log('🎁 Power-up RNG initialized, seed state:', this.onlineRngState)

    for (let i = 0; i < numPowerUps; i++) {
      const x = this.onlineSeededBetween(1000, 8000)
      const y = 500
      const typeIndex = this.onlineSeededBetween(0, powerUpTypes.length - 1)
      const type = powerUpTypes[typeIndex]

      const powerUp = this.powerUps.create(x, y, type)
      powerUp.setScale(0.6)
      powerUp.setBounce(0.2)
      powerUp.setCollideWorldBounds(true)
      // Deterministic id for online mode so collections are consistent
      this.powerUpCounter++
      const powerupId = `powerup_${this.powerUpCounter}_${Math.floor(x)}_${Math.floor(y)}`
      powerUp.setData('powerupId', powerupId)
      powerUp.setData('type', type)

      // Add floating animation
      this.tweens.add({
        targets: powerUp,
        y: y - 15,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // Add glow effect
      this.tweens.add({
        targets: powerUp,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // Report to server if host
      if (this.isOnlineMode && this.isOnlineHost && this.onlinePlayerManager) {
        this.onlinePlayerManager.reportPowerUpSpawn({
          powerup_id: powerupId,
          type: type,
          x: Math.round(x),
          y: Math.round(y)
        })
      }
    }
  }

  private collectPowerUp(_player: Phaser.Physics.Arcade.Sprite, powerUp: Phaser.Physics.Arcade.Sprite) {
    const type = powerUp.getData('type')

    // Determine powerup ID for online sync and report collection
    const powerupId = powerUp.getData('powerupId') || `powerup_${Math.floor(powerUp.x)}_${Math.floor(powerUp.y)}`
    if (this.isOnlineMode && this.onlinePlayerManager) {
      this.onlinePlayerManager.reportItemCollected('powerup', powerupId)
    }

    // Remove power-up locally (server will broadcast authoritative collection to other clients)
    powerUp.destroy()

    // Show tip on first power-up
    if (this.shownTips.size < 5) {
      this.showTip('powerups', 'Power-ups: Yellow=Speed, Blue=Shield, Green=Life, Heart=Health')
    }

    // Apply power-up effect
    if (type === 'powerSpeed') {
      this.hasSpeedBoost = true

      // Show notification
      const text = this.add.text(this.player.x, this.player.y - 50, 'SPEED BOOST!', {
        fontSize: '24px',
        color: '#ffff00'
      })
      text.setOrigin(0.5)

      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 2000,
        onComplete: () => text.destroy()
      })

      // Remove after 10 seconds
      this.time.delayedCall(10000, () => {
        this.hasSpeedBoost = false
      })
    } else if (type === 'powerShield') {
      this.hasShield = true

      // Create shield sprite that follows player
      this.shieldSprite = this.add.sprite(this.player.x, this.player.y, 'powerShield')
      this.shieldSprite.setScale(1.5)
      this.shieldSprite.setAlpha(0.6)
      this.shieldSprite.setDepth(5)

      // Shield animation
      this.tweens.add({
        targets: this.shieldSprite,
        angle: 360,
        duration: 3000,
        repeat: -1,
        ease: 'Linear'
      })

      // Show notification
      const text = this.add.text(this.player.x, this.player.y - 50, 'SHIELD ACTIVE!', {
        fontSize: '24px',
        color: '#00ffff'
      })
      text.setOrigin(0.5)

      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 2000,
        onComplete: () => text.destroy()
      })

      // Remove after 15 seconds
      this.time.delayedCall(15000, () => {
        this.hasShield = false
        if (this.shieldSprite) {
          this.shieldSprite.destroy()
          this.shieldSprite = null
        }
      })
    } else if (type === 'powerHealth') {
      // Restore health
      const healthRestored = 30
      this.playerHealth = Math.min(100, this.playerHealth + healthRestored)

      // Update health bar width
      const healthPercent = this.playerHealth / 100
      const maxWidth = 200
      this.healthBarFill.width = maxWidth * healthPercent

      // Flash health bar white then back to green
      this.healthBarFill.setFillStyle(0xffffff)
      this.time.delayedCall(100, () => {
        this.healthBarFill.setFillStyle(0x00ff00)
      })

      // Show notification
      const text = this.add.text(this.player.x, this.player.y - 50, `+${healthRestored} HEALTH!`, {
        fontSize: '24px',
        color: '#00ff00'
      })
      text.setOrigin(0.5)

      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 2000,
        onComplete: () => text.destroy()
      })
    } else if (type === 'powerLife') {
      // Add extra life
      this.playerLives++

      // Update lives display
      this.livesText.setText(this.getLivesText())

      // Sync lives with online player manager
      if (this.isOnlineMode && this.onlinePlayerManager) {
        this.onlinePlayerManager.updateLocalState({ lives: this.playerLives })
      }

      // Show notification
      const text = this.add.text(this.player.x, this.player.y - 50, '+1 LIFE!', {
        fontSize: '24px',
        color: '#00ff00'
      })
      text.setOrigin(0.5)

      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 2000,
        onComplete: () => text.destroy()
      })
    }
  }

  private showTip(tipId: string, message: string) {
    // Only show each tip once
    if (this.shownTips.has(tipId)) return
    this.shownTips.add(tipId)

    // Create tip banner at top of screen
    const banner = this.add.rectangle(640, 100, 700, 80, 0x000000, 0.8)
    banner.setScrollFactor(0)
    banner.setDepth(200)
    banner.setStrokeStyle(2, 0xffff00)

    const tipText = this.add.text(640, 85, '💡 TIP', {
      fontSize: '18px',
      color: '#ffff00',
      fontStyle: 'bold'
    })
    tipText.setOrigin(0.5)
    tipText.setScrollFactor(0)
    tipText.setDepth(201)

    const messageText = this.add.text(640, 115, message, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 650 }
    })
    messageText.setOrigin(0.5)
    messageText.setScrollFactor(0)
    messageText.setDepth(201)

    // Slide in animation
    banner.setY(50)
    tipText.setY(35)
    messageText.setY(65)

    this.tweens.add({
      targets: [banner, tipText, messageText],
      y: '+=50',
      duration: 300,
      ease: 'Back.easeOut'
    })

    // Auto-dismiss after 5 seconds
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: [banner, tipText, messageText],
        y: '-=50',
        alpha: 0,
        duration: 300,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          banner.destroy()
          tipText.destroy()
          messageText.destroy()
        }
      })
    })
  }

  private dropCoins(x: number, y: number, count: number) {
    // In online mode, only host spawns dropped coins - non-host receives via network
    if (this.isOnlineMode && !this.isOnlineHost) {
      console.log(`🪙 COIN DEBUG: Non-host skipping dropCoins(${Math.floor(x)}, ${Math.floor(y)}, ${count})`)
      return
    }
    console.log(`🪙 COIN DEBUG: dropCoins(${Math.floor(x)}, ${Math.floor(y)}, ${count}) - isHost=${this.isOnlineHost}`)

    // Drop coins at the enemy's position
    // In online mode, use deterministic positions based on enemy position
    for (let i = 0; i < count; i++) {
      // Spawn coin with slight delay and spread
      this.time.delayedCall(i * 50, () => {
        // Use deterministic offsets based on position for online sync
        const offsetX = this.isOnlineMode 
          ? ((Math.floor(x) * 7 + i * 13) % 61) - 30  // Deterministic: -30 to 30
          : Phaser.Math.Between(-30, 30)
        const offsetY = this.isOnlineMode
          ? ((Math.floor(y) * 11 + i * 17) % 21) - 20  // Deterministic: -20 to 0
          : Phaser.Math.Between(-20, 0)
        // Use unique counter for coin drop IDs to avoid duplicates
        this.coinDropCounter++
        const coinId = `coin_drop_${this.coinDropCounter}_${Math.floor(x)}_${Math.floor(y)}_${i}`
        const coinX = x + offsetX
        const coinY = y + offsetY
        const coin = this.coins.create(coinX, coinY, 'coin')
        // Set deterministic coin ID for online sync
        coin.setData('coinId', coinId)
        coin.setData('value', 1)
        coin.setBounce(0.7)
        const velX = this.isOnlineMode
          ? ((Math.floor(x) * 3 + i * 19) % 201) - 100  // Deterministic: -100 to 100
          : Phaser.Math.Between(-100, 100)
        const velY = this.isOnlineMode
          ? -200 + ((Math.floor(y) * 5 + i * 23) % 101)  // Deterministic: -200 to -100
          : Phaser.Math.Between(-200, -100)
        coin.setVelocity(velX, velY)
        coin.setScale(0.5)
        coin.setCollideWorldBounds(true)
        coin.body.setAllowGravity(true)
        // Add drag to prevent coins from sliding forever and causing sync issues
        coin.setDragX(200)

        // Fade in animation
        coin.setAlpha(0)
        this.tweens.add({
          targets: coin,
          alpha: 1,
          duration: 200,
          ease: 'Cubic.easeOut'
        })

        // Report dropped coin to server for non-host to receive
        if (this.isOnlineMode && this.isOnlineHost && this.onlinePlayerManager) {
          const coinState: NetworkCoinState = {
            coin_id: coinId,
            x: Math.round(coinX),
            y: Math.round(coinY),
            is_collected: false,
            collected_by: null,
            value: 1,
            velocity_x: velX,
            velocity_y: velY
          }
          console.log(`🪙 HOST: Reporting dropped coin ${coinId} at (${Math.round(coinX)}, ${Math.round(coinY)})`)
          this.onlinePlayerManager.reportCoinSpawn(coinState)
        }
      })
    }
  }



  private spawnCoinsInArea(startX: number, endX: number) {
    // In online mode, only HOST spawns coins - non-host receives them via network
    // This prevents duplicate coins
    if (this.isOnlineMode && !this.isOnlineHost) {
      console.log(`🪙 COIN DEBUG: Non-host skipping spawnCoinsInArea(${startX}, ${endX})`)
      return // Non-host doesn't spawn coins locally
    }
    console.log(`🪙 COIN DEBUG: spawnCoinsInArea(${startX}, ${endX}) - isHost=${this.isOnlineHost}`)
    
    // Reset RNG for this chunk to ensure deterministic coin spawning in online mode
    // Use a unique formula to differentiate from enemy RNG
    // Use seeded RNG for BOTH online and offline modes
    const chunkIndex = Math.floor(startX / 800)
    const seed = this.onlineSeed || 12345 // Fallback seed if undefined
    this.onlineRngState = seed * 3 + chunkIndex * 54321
    console.log(`🪙 Coin RNG reset for chunk ${chunkIndex}, seed state: ${this.onlineRngState}`)
    
    const numCoins = this.onlineSeededBetween(2, 4)
    
    if (this.isOnlineMode) {
      console.log(`🪙 Spawning ${numCoins} coins in chunk ${Math.floor(startX / 800)}`)
    }
    
    for (let i = 0; i < numCoins; i++) {
      // Use purely seeded positions without isOnSpikes check
      // This ensures both clients get exactly the same positions
      const x = this.onlineSeededBetween(startX + 100, endX - 100)
      const y = this.onlineSeededBetween(300, 600)

      // Only check spikes in offline mode - online mode needs deterministic positions
      if (!this.isOnlineMode) {
        let retries = 0
        let currentX = x
        let currentY = y
        while (retries < 5 && this.isOnSpikes(currentX, currentY)) {
          currentX = this.onlineSeededBetween(startX + 100, endX - 100)
          currentY = this.onlineSeededBetween(300, 600)
          retries++
        }
        if (this.isOnSpikes(currentX, currentY)) continue
        // Use the retry-adjusted position
        this.createCoinAt(currentX, currentY, startX, i)
      } else {
        // Online mode - use exact seeded position
        if (this.isOnlineMode) {
          console.log(`🪙 Coin ${i}: (${x}, ${y})`)
        }
        this.createCoinAt(x, y, startX, i)
      }
    }
  }

  private createCoinAt(x: number, y: number, chunkStartX: number, index: number) {
    const coin = this.coins.create(x, y, 'coin')
    coin.setScale(0.5)
    coin.setBounce(0.3)
    coin.setCollideWorldBounds(true)
    // Use deterministic ID based on chunk and index, not position
    coin.setData('coinId', `coin_chunk_${Math.floor(chunkStartX / 800)}_${index}`)
    coin.setData('value', 1)

    // Disable gravity for static level coins
    if (coin.body) {
      (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    }

    // Add floating animation
    this.tweens.add({
      targets: coin,
      y: y - 20,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Add rotation animation
    this.tweens.add({
      targets: coin,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    })

    this.reportCoinSpawnToServer(coin)
  }

  private reportCoinSpawnToServer(coin: Phaser.Physics.Arcade.Sprite) {
    if (!this.isOnlineMode || !this.isOnlineHost || !this.onlinePlayerManager) {
      return
    }

    const coinId = coin.getData('coinId')
    if (!coinId) return

    const body = coin.body as Phaser.Physics.Arcade.Body | undefined
    const coinState: NetworkCoinState = {
      coin_id: coinId,
      x: Math.round(coin.x),
      y: Math.round(coin.y),
      is_collected: !!coin.getData('isCollected') || false,
      collected_by: coin.getData('collectedBy') || null,
      value: coin.getData('value') ?? 1,
      velocity_x: body?.velocity.x || 0,
      velocity_y: body?.velocity.y || 0
    }

    this.onlinePlayerManager.reportCoinSpawn(coinState)
  }

  private spawnEnemiesInArea(startX: number, endX: number) {
    // In online mode, only HOST spawns enemies - non-host receives them via network
    // This prevents duplicate enemies
    if (this.isOnlineMode && !this.isOnlineHost) {
      console.log(`👾 Non-host skipping spawnEnemiesInArea(${startX}, ${endX})`)
      return // Non-host doesn't spawn enemies locally
    }
    
    // Don't spawn enemies on the starting platform (first 500 pixels)
    if (startX < 500) return

    const chunkIndex = Math.floor(startX / 800)
    
    // Reset RNG for this chunk to ensure deterministic enemy spawning in online mode
    // Use a unique multiplier (12345) different from coins
    // Use seeded RNG for BOTH online and offline modes
    const seed = this.onlineSeed || 12345 // Fallback seed
    this.onlineRngState = seed * 7 + chunkIndex * 12345
    console.log(`👾 Enemy RNG reset for chunk ${chunkIndex}, seed state: ${this.onlineRngState}`)

    // Scale difficulty based on level - use startX for consistent difficulty in online mode
    const difficultyMultiplier = this.gameMode === 'endless'
      ? 1 + Math.floor(startX / 5000) * 0.2  // Use startX instead of player.x for consistency
      : 1 + (this.currentLevel - 1) * 0.3

    const baseEnemies = 2
    const maxEnemies = Math.min(5, baseEnemies + Math.floor(difficultyMultiplier))
    const numEnemies = this.onlineSeededBetween(baseEnemies, maxEnemies)

    if (this.isOnlineMode) {
      console.log(`👾 Spawning ${numEnemies} enemies in chunk ${chunkIndex}`)
    }

    for (let i = 0; i < numEnemies; i++) {
      const x = this.onlineSeededBetween(startX + 100, endX - 100)
      const y = this.onlineSeededBetween(200, 900)

      this.spawnRandomEnemy(x, y, difficultyMultiplier, chunkIndex, i)
    }
  }

  private spawnRandomEnemy(x: number, y: number, difficultyMultiplier: number, chunkIndex?: number, enemyIndex?: number) {
    // Safeguard: In online mode, if this is a respawn (enemyIndex undefined), ONLY host should spawn
    if (this.isOnlineMode && enemyIndex === undefined && !this.isOnlineHost) {
      console.warn('⚠️ Non-host tried to spawn random enemy (respawn)! Aborting to prevent desync.')
      return
    }

    // Randomly select enemy size with weighted probability (use seeded random for online mode)
    const rand = this.isOnlineMode ? this.onlineSeededRandom() : Math.random()
    let enemyType: string
    let enemySize: 'small' | 'medium' | 'large'
    let scale: number
    let baseHealth: number
    let coinReward: number

    if (this.isOnlineMode) {
      console.log(`👾 Enemy ${enemyIndex ?? 'RESPAWN'} at (${Math.floor(x)}, ${Math.floor(y)}), rand=${rand.toFixed(4)}`)
    }

    if (rand < 0.4) {
      // Small enemies (40% chance) - flies or bees
      const typeRand = this.isOnlineMode ? this.onlineSeededRandom() : Math.random()
      enemyType = typeRand < 0.5 ? 'fly' : 'bee'
      enemySize = 'small'
      scale = 0.6
      baseHealth = 2
      coinReward = 5
    } else if (rand < 0.8) {
      // Medium enemies (40% chance) - slimes
      const typeRand = this.isOnlineMode ? this.onlineSeededRandom() : Math.random()
      enemyType = typeRand < 0.5 ? 'slimeGreen' : 'slimeBlue'
      enemySize = 'medium'
      scale = 1.0
      baseHealth = 4
      coinReward = 10
    } else {
      // Large enemies (20% chance) - worms
      const typeRand = this.isOnlineMode ? this.onlineSeededRandom() : Math.random()
      enemyType = typeRand < 0.5 ? 'wormGreen' : 'wormPink'
      enemySize = 'large'
      scale = 1.3
      baseHealth = 8
      coinReward = 15
    }

    if (this.isOnlineMode) {
      console.log(`👾 Enemy ${enemyIndex ?? 'RESPAWN'}: type=${enemyType}`)
    }

    const enemy = this.enemies.create(x, y, enemyType)
    enemy.setScale(scale)
    enemy.setBounce(0.3)
    enemy.setCollideWorldBounds(true)
    enemy.clearTint() // Ensure no tint on spawn
    enemy.play(`${enemyType}_idle`)
    enemy.setData('enemyType', enemyType)
    enemy.setData('enemySize', enemySize)
    enemy.setData('coinReward', coinReward)
    enemy.setData('detectionRange', 300)
    enemy.setData('speed', 80 + (difficultyMultiplier - 1) * 20)
    // Use seeded random for wander direction in online mode
    const wanderDir = this.isOnlineMode ? this.onlineSeededBetween(-1, 1) : Phaser.Math.Between(-1, 1)
    enemy.setData('wanderDirection', wanderDir)
    enemy.setData('wanderTimer', 0)
    enemy.setData('idleTimer', 0)
    enemy.setData('health', Math.floor(baseHealth * difficultyMultiplier))
    enemy.setData('maxHealth', Math.floor(baseHealth * difficultyMultiplier))
    enemy.setData('spawnX', x)
    enemy.setData('spawnY', y)
    // Add unique ID for online sync - use chunk index and enemy index for determinism
    // For respawned enemies (no chunk index), use a counter to ensure uniqueness
    let enemyId: string
    if (chunkIndex !== undefined && enemyIndex !== undefined) {
      enemyId = `enemy_chunk_${chunkIndex}_${enemyIndex}`
    } else {
      // Respawned enemy - use counter for unique ID
      this.respawnEnemyCounter++
      enemyId = `enemy_respawn_${this.respawnEnemyCounter}_${Math.floor(x)}_${Math.floor(y)}`
    }
    enemy.setData('enemyId', enemyId)
    
    if (this.isOnlineMode) {
      console.log(`👾 Created enemy ${enemyId} of type ${enemyType} at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    enemy.body!.setSize(enemy.width * 0.7, enemy.height * 0.7)
    enemy.body!.setOffset(enemy.width * 0.15, enemy.height * 0.15)
    enemy.body!.setMass(1)
    enemy.setPushable(true)
    enemy.body!.setMaxVelocity(200, 600)

    // Report spawn to network if online host
    if (this.isOnlineMode && this.isOnlineHost && this.onlinePlayerManager) {
      // Report spawn using server-friendly field names
      this.onlinePlayerManager.reportEnemySpawn({
        enemy_id: enemyId,
        enemy_type: enemyType,
        x: x,
        y: y,
        velocity_x: 0,
        velocity_y: 0,
        health: Math.floor(baseHealth * difficultyMultiplier),
        max_health: Math.floor(baseHealth * difficultyMultiplier),
        is_alive: true,
        facing_right: wanderDir >= 0,
        state: 'idle',
        coin_reward: coinReward,
        scale: scale
      })
      // Track local enemy so host can stream position/health periodically
      this.onlinePlayerManager.trackLocalEnemy(enemy, enemyId)
    } else if (this.isOnlineMode && this.onlinePlayerManager) {
      // Non-host also tracks enemies locally for collision detection
      // but doesn't report to server - host is authoritative
      this.onlinePlayerManager.trackLocalEnemy(enemy, enemyId)
    }
  }

  // Find next undefeated boss for current player (cycles through all 24 bosses)
  private findNextUndefeatedBoss(startIndex: number): number | null {
    const playerName = localStorage.getItem('player_name') || 'Guest'
    const totalBosses = 24

    // Check all bosses starting from startIndex
    for (let i = 0; i < totalBosses; i++) {
      const checkIndex = (startIndex + i) % totalBosses
      const bossKey = `${playerName}_boss_${checkIndex}`
      const isDefeated = localStorage.getItem(bossKey) === 'defeated'

      if (!isDefeated) {
        console.log('✅ Found undefeated boss:', checkIndex)
        return checkIndex
      }
    }

    console.log('🏆 All bosses defeated! Starting over from boss 0')
    return 0 // If all bosses defeated, start over
  }

  private async spawnBoss(x: number, forcedBossIndex?: number) {
    if (this.bossActive || this.boss) return

    this.bossActive = true
    const bossY = 350 // Higher position to hover above ground

    // Show boss warning tip
    this.showTip('boss', '⚠️ BOSS FIGHT! Shoot the boss to defeat it and earn 100 coins!')

    // Play boss spawn sound
    this.audioManager.playBossSound()

    // Calculate which boss to use based on level (0-21 different bosses)
    // Level 5 = boss 0, Level 10 = boss 1, Level 15 = boss 2, etc.
    const defaultBossIndex = Math.floor((this.currentLevel / 5) - 1) % 22
    const bossIndex = forcedBossIndex !== undefined ? forcedBossIndex : defaultBossIndex

    // Fetch boss data from backend
    let bossName = 'BOSS'
    try {
      const bosses = await GameAPI.getAllBosses()
      const bossData = bosses.find(b => b.boss_index === bossIndex)
      if (bossData) {
        bossName = bossData.boss_name.toUpperCase()
      }
    } catch (error) {
      console.error('Failed to fetch boss data:', error)
    }

    // Use individual boss image
    const bossKey = `boss_${bossIndex.toString().padStart(2, '0')}`

    // Create boss sprite using individual image (hovering)
    this.boss = this.physics.add.sprite(x, bossY, bossKey)

    // Scale boss to appropriate size (around 200-250px)
    const targetSize = 250
    const scale = Math.min(targetSize / this.boss.width, targetSize / this.boss.height)
    this.boss.setScale(scale)

    this.boss.setDepth(10) // In front of player and enemies
    this.boss.setCollideWorldBounds(true)
    this.boss.setData('bossKey', bossKey) // Store boss image key

    // Set hitbox for hovering boss (no gravity)
    if (this.boss.body) {
      const body = this.boss.body as Phaser.Physics.Arcade.Body
      body.setSize(128, 180) // Player-sized hitbox
      body.setOffset(64, 38) // Center the hitbox on sprite
      body.setAllowGravity(false) // Disable gravity - boss hovers
      body.setImmovable(false) // Allow collisions with bullets
    }

    // Boss stats
    const bossMaxHealth = 50 + (this.currentLevel * 20)
    this.boss.setData('health', bossMaxHealth)
    this.boss.setData('maxHealth', bossMaxHealth)
    this.boss.setData('lastAttack', 0)
    this.boss.setData('attackCooldown', 2000)
    this.boss.setData('phase', 1)
    this.boss.setData('bossIndex', bossIndex) // Store boss index for defeat tracking

    // Create boss health bar (moved down to avoid level text overlap)
    this.bossHealthBarBg = this.add.rectangle(640, 80, 500, 30, 0x000000, 0.7)
    this.bossHealthBarBg.setScrollFactor(0)
    this.bossHealthBarBg.setDepth(999)

    this.bossHealthBar = this.add.rectangle(640, 80, 500, 30, 0xff0000, 1)
    this.bossHealthBar.setScrollFactor(0)
    this.bossHealthBar.setDepth(1000)

    // Display boss name from backend
    this.bossNameText = this.add.text(640, 80, bossName, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.bossNameText.setOrigin(0.5)
    this.bossNameText.setScrollFactor(0)
    this.bossNameText.setDepth(1001)

    // Add collision with player bullets
    this.physics.add.overlap(this.bullets, this.boss, this.handleBulletBossCollision as any, undefined, this)

    // Add collision with player (damage player)
    this.physics.add.overlap(this.player, this.boss, () => {
      if (!this.playerIsDead && !this.debugMode) {
        this.damagePlayer(10)
      }
    })
  }

  private updateBoss() {
    if (!this.boss || !this.boss.active || !this.bossActive) return

    const bossHealth = this.boss.getData('health')
    const bossMaxHealth = this.boss.getData('maxHealth')

    // Update health bar
    if (this.bossHealthBar) {
      const healthPercent = bossHealth / bossMaxHealth
      const newWidth = 500 * healthPercent
      this.bossHealthBar.setSize(newWidth, 30)
      // Adjust position to keep it left-aligned
      this.bossHealthBar.x = 640 - (500 - newWidth) / 2
      console.log('Boss health updated:', bossHealth, '/', bossMaxHealth, 'Bar width:', newWidth)
    }

    // Boss AI - hovers and follows player horizontally
    const lastAttack = this.boss.getData('lastAttack')
    const attackCooldown = this.boss.getData('attackCooldown')

    const horizontalDistance = this.player.x - this.boss.x
    const moveSpeed = 120 // Moderate hovering speed

    // Horizontal movement toward player
    if (Math.abs(horizontalDistance) > 150) {
      if (horizontalDistance > 0) {
        this.boss.setVelocityX(moveSpeed)
        this.boss.setFlipX(false)
      } else {
        this.boss.setVelocityX(-moveSpeed)
        this.boss.setFlipX(true)
      }
    } else {
      this.boss.setVelocityX(0)
    }

    // Gentle hovering motion (vertical bobbing)
    const hoverY = 350 + Math.sin(this.time.now / 1000) * 30
    this.boss.setVelocityY((hoverY - this.boss.y) * 2)

    // Attack patterns - alternate between 360 spray and homing
    if (this.time.now - lastAttack > attackCooldown) {
      // Use deterministic attack pattern in online mode based on attack count
      const attackCount = this.boss.getData('attackCount') || 0
      const attackType = this.isOnlineMode 
        ? (attackCount % 2 === 0 ? '360' : 'homing')  // Alternate deterministically
        : (Math.random() < 0.5 ? '360' : 'homing')
      this.bossAttack(attackType)
      this.boss.setData('lastAttack', this.time.now)
      this.boss.setData('attackCount', attackCount + 1)
    }
  }

  private bossAttack(attackType: string = '360') {
    if (!this.boss) return

    // Play attack animation
    const attackKey = this.boss.getData('attackKey')
    if (attackKey && this.anims.exists(attackKey)) {
      this.boss.play(attackKey)
    }

    // Play boss attack sound
    this.audioManager.playBossAttackSound()

    if (attackType === '360') {
      // 360-degree spray attack - 12 projectiles in a circle
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12

        const projectile = this.physics.add.sprite(this.boss!.x, this.boss!.y, 'laserBlue')
        projectile.setTint(0xff0000)
        projectile.setScale(1.5)
        projectile.setVelocity(
          Math.cos(angle) * 250,
          Math.sin(angle) * 250
        )
        projectile.setRotation(angle)
        projectile.setData('attackType', '360')

        // Disable physics body to prevent collisions with platforms
        if (projectile.body) {
          projectile.body.setAllowGravity(false)
          const body = projectile.body as Phaser.Physics.Arcade.Body
          body.setSize(0, 0) // Disable collision with world
        }

        // Damage player on hit (disabled in debug mode)
        this.physics.add.overlap(this.player, projectile, () => {
          if (!this.playerIsDead && !this.debugMode) {
            this.damagePlayer(15)
            projectile.destroy()
          }
        })

        // Destroy after 4 seconds
        this.time.delayedCall(4000, () => {
          if (projectile.active) projectile.destroy()
        })
      }
    } else {
      // Homing attack - 3 projectiles that follow the player
      for (let i = 0; i < 3; i++) {
        this.time.delayedCall(i * 300, () => {
          const projectile = this.physics.add.sprite(this.boss!.x, this.boss!.y, 'laserBlue')
          projectile.setTint(0xff00ff) // Purple for homing
          projectile.setScale(1.8)
          projectile.setData('attackType', 'homing')
          projectile.setData('spawnTime', this.time.now)

          // Damage player on hit (disabled in debug mode)
          this.physics.add.overlap(this.player, projectile, () => {
            if (!this.playerIsDead && !this.debugMode) {
              this.damagePlayer(20) // More damage for homing
              projectile.destroy()
            }
          })

          // Destroy after 5 seconds
          this.time.delayedCall(5000, () => {
            if (projectile.active) projectile.destroy()
          })

          // Update homing projectile in update loop
          const updateHomingEvent = this.time.addEvent({
            delay: 50,
            callback: () => {
              if (projectile.active && this.player.active) {
                const angle = Phaser.Math.Angle.Between(
                  projectile.x, projectile.y,
                  this.player.x, this.player.y
                )
                projectile.setVelocity(
                  Math.cos(angle) * 200,
                  Math.sin(angle) * 200
                )
                projectile.setRotation(angle)
              } else {
                updateHomingEvent.remove()
              }
            },
            loop: true
          })
        })
      }
    }
  }

  private handleBulletBossCollision(bullet: any, boss: any) {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite
    const bossSprite = boss as Phaser.Physics.Arcade.Sprite

    const isRocket = bulletSprite.getData('isRocket')

    // If it's a rocket, create explosion
    if (isRocket) {
      this.createExplosion(bulletSprite.x, bulletSprite.y)
    }

    console.log('Boss hit! Current health:', bossSprite.getData('health'))

    // Destroy bullet
    bulletSprite.destroy()

    // Damage boss
    let damage = bulletSprite.getData('damage')
    
    // Fallback for legacy behavior if damage is not set
    if (!damage) {
        damage = isRocket ? 30 : 10
    }

    let health = bossSprite.getData('health')
    health -= damage
    bossSprite.setData('health', health)

    // Flash effect
    bossSprite.setTint(0xff0000)
    this.time.delayedCall(100, () => {
      bossSprite.clearTint()
    })

    // Check if boss defeated
    if (health <= 0) {
      this.defeatBoss()
    }
  }

  private createExplosion(x: number, y: number) {
    // Create explosion visual effect
    const explosionRadius = 80

    // Orange flash circle
    const flash = this.add.circle(x, y, explosionRadius, 0xff6600, 1)
    flash.setDepth(1000)

    // Explosion particles
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i
      const particle = this.add.circle(x, y, 8, 0xff4400, 1)
      particle.setDepth(1000)

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * explosionRadius * 1.5,
        y: y + Math.sin(angle) * explosionRadius * 1.5,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      })
    }

    // Flash animation
    this.tweens.add({
      targets: flash,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    })

    // Damage nearby enemies with splash damage
    const splashRadius = explosionRadius * 1.2
    this.enemies.children.entries.forEach((enemy: any) => {
      if (!enemy.active) return
      const enemySprite = enemy as Phaser.Physics.Arcade.Sprite
      const distance = Phaser.Math.Distance.Between(x, y, enemySprite.x, enemySprite.y)

      if (distance < splashRadius) {
        // Splash damage (3 damage for splash hits)
        let health = enemySprite.getData('health')
        health -= 3
        enemySprite.setData('health', health)

        // Visual feedback
        enemySprite.setTint(0xff6600)
        this.time.delayedCall(100, () => {
          if (enemySprite && enemySprite.active) {
            enemySprite.clearTint()
          }
        })

        // Knockback
        const knockbackAngle = Phaser.Math.Angle.Between(x, y, enemySprite.x, enemySprite.y)
        enemySprite.setVelocity(
          Math.cos(knockbackAngle) * 300,
          Math.sin(knockbackAngle) * 300
        )

        // Check if enemy died from splash
        if (health <= 0) {
          const coinReward = enemySprite.getData('coinReward')
          this.dropCoins(enemySprite.x, enemySprite.y, coinReward)
          const enemySize = enemySprite.getData('enemySize')
          let scoreReward = 50
          if (enemySize === 'medium') scoreReward = 100
          if (enemySize === 'large') scoreReward = 200
          this.updateScore(scoreReward)
          this.enemiesDefeated++
          enemySprite.destroy()
        }
      }
    })
  }

  private defeatBoss() {
    if (!this.boss) return

    this.bossActive = false

    // Get player name and boss index
    const playerName = localStorage.getItem('player_name') || 'Guest'
    const bossIndex = this.boss.getData('bossIndex') || 0
    const bossKey = `${playerName}_boss_${bossIndex}`

    // Save defeated boss with player-specific key
    localStorage.setItem(bossKey, 'defeated')
    console.log('💾 Boss defeated by', playerName, '- Boss Index:', bossIndex)

    // Also track in current session
    this.defeatedBossLevels.add(this.currentLevel)
    localStorage.setItem('defeatedBossLevels', JSON.stringify(Array.from(this.defeatedBossLevels)))
    console.log('💾 Saved defeated boss level:', this.currentLevel)

    // Reward coins
    const coinReward = 100
    this.dropCoins(this.boss.x, this.boss.y, coinReward)

    // Award huge score bonus for defeating boss
    this.updateScore(1000)

    // Check for final boss (Index 21)
    if (bossIndex === 21) {
       console.log('🏆 FINAL BOSS DEFEATED! Portal will trigger ending sequence...')
       // Do NOT trigger ending immediately. Wait for player to enter portal.
       // The portal logic in checkLevelComplete will handle the transition.
    }

    // Death animation
    this.tweens.add({
      targets: this.boss,
      alpha: 0,
      scale: 0,
      duration: 1000,
      onComplete: () => {
        if (this.boss) {
          this.boss.destroy()
          this.boss = null
        }
      }
    })

    // Remove health bar
    if (this.bossHealthBar) {
      this.bossHealthBar.destroy()
      this.bossHealthBar = null
    }
    if (this.bossHealthBarBg) {
      this.bossHealthBarBg.destroy()
      this.bossHealthBarBg = null
    }
    if (this.bossNameText) {
      this.bossNameText.destroy()
      this.bossNameText = null
    }

    // Victory message
    const victoryText = this.add.text(640, 300, 'BOSS DEFEATED!\\n+100 Coins', {
      fontSize: '48px',
      color: '#ffff00',
      fontStyle: 'bold',
      align: 'center'
    })
    victoryText.setOrigin(0.5)
    victoryText.setScrollFactor(0)
    victoryText.setDepth(1002)

    this.tweens.add({
      targets: victoryText,
      alpha: 0,
      y: 250,
      duration: 3000,
      onComplete: () => victoryText.destroy()
    })
  }

  private createCheckpoint(x: number) {
    // Create visual checkpoint marker (green pole)
    const marker = this.add.rectangle(x, 600, 30, 400, 0x00ff00, 0.7)
    marker.setOrigin(0.5, 1)

    // Add glow effect
    const glow = this.add.circle(x, 400, 40, 0x00ff00, 0.3)

    // Pulse animation
    this.tweens.add({
      targets: [marker, glow],
      alpha: 0.4,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Add checkpoint text
    const text = this.add.text(x, 350, 'CHECKPOINT', {
      fontSize: '24px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    text.setOrigin(0.5)

    this.checkpoints.push({ x, marker })
  }

  private checkCheckpoints() {
    // Check if player has passed a new checkpoint
    for (let i = this.currentCheckpoint; i < this.checkpoints.length; i++) {
      const checkpoint = this.checkpoints[i]
      if (this.player.x >= checkpoint.x && i > this.currentCheckpoint) {
        this.currentCheckpoint = i

        // Visual feedback
        this.cameras.main.flash(200, 0, 255, 0)

        // Sound effect (screen shake)
        this.cameras.main.shake(150, 0.003)

        // Heal player a bit
        this.playerHealth = Math.min(this.maxHealth, this.playerHealth + 20)

        // Show notification
        const notif = this.add.text(this.cameras.main.centerX, 200, 'CHECKPOINT REACHED!\n+20 HP', {
          fontSize: '32px',
          color: '#00ff00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 6,
          align: 'center'
        })
        notif.setOrigin(0.5)
        notif.setScrollFactor(0)

        this.tweens.add({
          targets: notif,
          alpha: 0,
          y: 150,
          duration: 2000,
          ease: 'Power2',
          onComplete: () => notif.destroy()
        })

        break
      }
    }
  }

  private createLevelEndMarker() {
    const endX = this.levelLength

    // Create portal sprite
    this.portal = this.physics.add.sprite(endX, 450, 'portal')
    this.portal.setScale(1.5)
    this.portal.setImmovable(true)
    if (this.portal.body) {
      (this.portal.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    }

    // Portal glow effect
    const glow1 = this.add.circle(endX, 450, 80, 0x00ffff, 0.3)
    const glow2 = this.add.circle(endX, 450, 100, 0x0088ff, 0.2)

    // Pulsing animation
    this.tweens.add({
      targets: [glow1, glow2],
      alpha: 0.1,
      scale: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Rotating animation for portal
    this.tweens.add({
      targets: this.portal,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    })

    // Add text above portal
    const text = this.add.text(endX, 320, 'PORTAL\nEnter to\nNext Level', {
      fontSize: '24px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    })
    text.setOrigin(0.5)

    // Text floating animation
    this.tweens.add({
      targets: text,
      y: 310,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Add collision detection
    this.physics.add.overlap(this.player, this.portal, () => {
      if (this.portal && this.portal.active) {
        this.portal.active = false
        this.enterPortal()
      }
    })

    this.levelEndMarker = this.add.rectangle(endX, 600, 50, 400, 0xffff00, 0) // Invisible marker for reference
  }

  private enterPortal() {
    if (this.playerIsDead) return
    this.playerIsDead = true

    // Save coins before transitioning
    localStorage.setItem('playerCoins', this.coinCount.toString())

    // Portal entry effect
    this.cameras.main.flash(500, 0, 255, 255)
    this.player.setTint(0x00ffff)

    // Scale down player into portal
    this.tweens.add({
      targets: this.player,
      scale: 0,
      alpha: 0,
      duration: 500,
      ease: 'Power2'
    })

    // Wait for animation then transition
    this.time.delayedCall(600, () => {
      const nextLevelData: any = { 
        gameMode: 'levels', 
        level: this.currentLevel + 1,
        lives: this.playerLives,
        score: this.score,
        isRecording: this.isRecordingForDQN
      }
      if (this.isCoopMode) {
        nextLevelData.mode = 'coop'
      }
      if (this.dqnTraining) {
        nextLevelData.dqnTraining = true
      }
      this.scene.restart(nextLevelData)
    })
  }

  /**
   * Attempt to assist partner when they are held back/stuck.
   * - Local coop: instantly nudge player2 forward if far behind
   * - Online: host may issue an authoritative assist which the server will broadcast
   */
  private attemptAssistPartner() {
    if (!this.isCoopMode) return

    // Prefer online manager when in online mode
    if (this.isOnlineMode && this.onlinePlayerManager) {
      // Only host can issue authoritative assists
      if (!this.isOnlineHost) {
        this.showTip('assist_denied', 'Only the host can assist a remote partner')
        return
      }

      const remote = this.onlinePlayerManager.getRemotePlayer()
      if (!remote || !remote.sprite) {
        this.showTip('assist_no_partner', 'No partner to assist')
        return
      }

      const gap = this.player.x - remote.sprite.x
      if (gap < 180) {
        this.showTip('assist_unnecessary', 'Partner is not far behind')
        return
      }

      // Compute target position safely ahead of partner but behind leader
      const newX = Math.round(this.player.x - 150)
      const newY = Math.round(remote.sprite.y)

      // Send assist action to server (host-initiated)
      try {
        this.onlinePlayerManager.sendAction('assist', { target_player_id: remote.playerId, x: newX, y: newY })
      } catch (e) {
        console.warn('Assist send failed', e)
      }

      // Apply local visual nudge so host feels immediate effect
      remote.sprite.setPosition(newX, newY)
      this.showTip('assist_done', 'Partner pulled forward!')
      return
    }

    // Local co-op: directly nudge player2 forward if they are far behind
    if (this.player2 && this.isCoopMode) {
      const gap = this.player.x - this.player2.x
      if (gap < 120) {
        this.showTip('assist_unnecessary', 'Partner is not far behind')
        return
      }

      const targetX = this.player.x - 150
      const targetY = this.player2.y
      this.player2.setPosition(targetX, targetY)
      const body = this.player2.body as Phaser.Physics.Arcade.Body
      if (body) body.setVelocity(120, -120)

      this.showTip('assist_done', 'Partner pulled forward!')
    }
  }

  private checkLevelComplete() {
    if (!this.levelEndMarker) return
    if (this.levelCompleteShown) return // Prevent multiple triggers

    // Check if any player reached the end (in co-op, one player triggers completion for both)
    const player1ReachedEnd = this.player.x >= this.levelLength
    const player2ReachedEnd = this.isCoopMode && this.player2 && this.player2.x >= this.levelLength

    if (player1ReachedEnd || player2ReachedEnd) {
      // Don't allow level completion if boss is still active (boss levels: 5, 10, 15, etc.)
      if (this.bossActive && this.boss && this.boss.active) {
        console.log('⚠️ Cannot complete level - boss is still active!')
        // Push player back from the portal
        this.player.x = this.levelLength - 100
        if (this.isCoopMode && this.player2 && player2ReachedEnd) {
          this.player2.x = this.levelLength - 100
        }
        return
      }
      
      this.levelCompleteShown = true

      // Check if this is the final level (110)
      if (this.currentLevel === 110) {
        console.log('🏆 LEVEL 110 COMPLETE! Transitioning to Ending Scene...')
        this.scene.start('EndingScene')
        return
      }

      this.showLevelComplete()
    }
  }

  private showLevelComplete() {
    this.playerIsDead = true // Stop player movement

    // Stop both players
    this.player.setVelocity(0, 0)
    if (this.isCoopMode && this.player2) {
      this.player2.setVelocity(0, 0)
    }

    // Create completion screen
    const bg = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8)
    bg.setScrollFactor(0)
    bg.setDepth(1000)

    const title = this.add.text(640, 200, 'LEVEL COMPLETE!', {
      fontSize: '72px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    })
    title.setOrigin(0.5)
    title.setScrollFactor(0)
    title.setDepth(1001)

    const stats = this.add.text(640, 320,
      `Coins Collected: ${this.coinCount}\nLives Remaining: ${this.playerLives}\n\nNext Level: ${this.currentLevel + 1}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    })
    stats.setOrigin(0.5)
    stats.setScrollFactor(0)
    stats.setDepth(1001)

    const nextText = this.add.text(640, 520, 'Press SPACE for Next Level\nPress E for Endless Mode', {
      fontSize: '24px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    })
    nextText.setOrigin(0.5)
    nextText.setScrollFactor(0)
    nextText.setDepth(1001)

    // Blinking animation
    this.tweens.add({
      targets: nextText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    })

    // Home button
    const homeButton = this.add.text(640, 600, 'HOME', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#0066cc',
      padding: { x: 30, y: 15 },
      stroke: '#000000',
      strokeThickness: 4
    })
    homeButton.setOrigin(0.5)
    homeButton.setScrollFactor(0)
    homeButton.setDepth(1001)
    homeButton.setInteractive({ useHandCursor: true })

    homeButton.on('pointerover', () => {
      homeButton.setStyle({ backgroundColor: '#0088ff' })
    })

    homeButton.on('pointerout', () => {
      homeButton.setStyle({ backgroundColor: '#0066cc' })
    })

    homeButton.on('pointerdown', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })

    // Auto-progress for DQN training mode
    if (this.dqnTraining) {
      this.time.delayedCall(500, () => {
        this.tweens.killAll()
        const nextLevelData: any = { 
          gameMode: 'levels', 
          level: this.currentLevel + 1,
          lives: this.playerLives,
          score: this.score,
          dqnTraining: true
        }
        this.scene.restart(nextLevelData)
      })
      return // Skip manual input handlers for DQN mode
    }

    // Input handlers
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.tweens.killAll()
      const nextLevelData: any = { 
        gameMode: 'levels', 
        level: this.currentLevel + 1,
        lives: this.playerLives,
        score: this.score,
        isRecording: this.isRecordingForDQN
      }
      if (this.isCoopMode) {
        nextLevelData.mode = 'coop'
      }
      if (this.dqnTraining) {
        nextLevelData.dqnTraining = true
      }
      this.scene.restart(nextLevelData)
    })

    this.input.keyboard!.once('keydown-E', () => {
      this.tweens.killAll()
      const endlessData: any = { gameMode: 'endless', level: 1 }
      if (this.isCoopMode) {
        endlessData.mode = 'coop'
      }
      this.scene.restart(endlessData)
    })

    this.input.keyboard!.once('keydown-M', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })

    // Gamepad support for level progression (co-op mode)
    if (this.isCoopMode) {
      const checkGamepadProgress = () => {
        const gamepads = this.input.gamepad?.gamepads || []
        for (const gamepad of gamepads) {
          if (gamepad.A) {
            this.tweens.killAll()
            const nextLevelData: any = { 
              gameMode: 'levels', 
              level: this.currentLevel + 1, 
              mode: 'coop',
              lives: this.playerLives,
              score: this.score,
              isRecording: this.isRecordingForDQN
            }
            if (this.dqnTraining) {
              nextLevelData.dqnTraining = true
            }
            this.scene.restart(nextLevelData)
            return
          }
        }
        // Check again next frame if level complete screen is still showing
        if (this.levelCompleteShown) {
          this.time.delayedCall(100, checkGamepadProgress)
        }
      }
      this.time.delayedCall(100, checkGamepadProgress)
    }
  }

  update() {
    // DQN Training: Handle keyboard controls and training loop
    if (this.dqnTraining) {
      this.handleDQNKeyboardControls()
      this.updateDQNTraining()
      this.updateDQNTrainingUI()
    }

    // Online mode: Update online player manager
    if (this.isOnlineMode && this.onlinePlayerManager) {
      this.onlinePlayerManager.update(this.time.now, this.game.loop.delta)
      
      // Update camera to follow both online players
      const focusPoint = this.onlinePlayerManager.getCameraFocusPoint()
      this.cameras.main.scrollX = focusPoint.x - 640
      this.cameras.main.scrollY = Phaser.Math.Clamp(focusPoint.y - 360, 0, 1200 - 720)
      
      // Check if both players are out of lives (game over condition)
      if (this.onlinePlayerManager.areBothPlayersOutOfLives() && !this.playerIsDead) {
        this.playerIsDead = true // Prevent multiple triggers
        this.showOnlineGameOver()
        return
      }
    }

    // CONTINUOUS DEBUGGING - log every 60 frames (about once per second)
    if (this.time.now % 1000 < 20) {  // Log roughly once per second
      const body = this.player.body as Phaser.Physics.Arcade.Body
      console.log('Player Y:', Math.round(this.player.y), 'VelocityY:', Math.round(body.velocity.y), 'Touching.down:', body.touching.down, 'Blocked.down:', body.blocked.down)
    }

    // Track farthest X position player has reached
    if (this.player.x > this.farthestPlayerX) {
      this.farthestPlayerX = this.player.x
    }

    // Co-op mode: Update camera to follow both players
    if (this.isCoopMode && this.player2) {
      const avgX = (this.player.x + this.player2.x) / 2
      const avgY = (this.player.y + this.player2.y) / 2
      this.cameras.main.scrollX = avgX - 640
      this.cameras.main.scrollY = Phaser.Math.Clamp(avgY - 360, 0, 1200 - 720)
    }

    // Player movement (skip if DQN is controlling, or if in spectator mode)
    if (!this.dqnTraining && !(this.isOnlineMode && this.onlinePlayerManager?.isLocalPlayerOutOfLives())) {
      this.handlePlayerMovement()
    }

    // Player 2 movement (co-op mode)
    if (this.isCoopMode && this.player2) {
      this.handlePlayer2Movement()
    }

    // T key - Toggle recording player gameplay for DQN learning
    this.handleDQNRecordingKey()

    // Update shield sprite position if active
    if (this.hasShield && this.shieldSprite) {
      this.shieldSprite.setPosition(this.player.x, this.player.y)
    }

    // Generate new world chunks as player moves forward
    // In online mode, use the furthest player's X to ensure both clients
    // generate the same chunks at the same time
    const generationTriggerX = this.isOnlineMode && this.onlinePlayerManager
      ? this.onlinePlayerManager.getFurthestPlayerX()
      : this.player.x
    
    // Calculate which chunk index we need to generate up to
    // Chunks are 800 pixels wide, and we want to generate 2 chunks ahead (1600 pixels)
    const targetChunkIndex = Math.floor((generationTriggerX + 1600) / 800)
    
    // Generate any missing chunks up to the target
    while (Math.floor(this.worldGenerationX / 800) < targetChunkIndex) {
      // Check if we need to stop generation (levels mode only)
      const shouldGenerate = this.gameMode === 'endless' || this.worldGenerationX < this.levelLength

      if (shouldGenerate) {
        const chunkStartX = this.worldGenerationX
        
        if (this.isOnlineMode) {
          console.log(`🌍 Generating chunk ${Math.floor(chunkStartX / 800)} at X=${chunkStartX}`)
        }
        
        this.worldGenerator.generateChunk(chunkStartX)
        this.worldGenerationX += 800

        // Spawn coins in new area
        this.spawnCoinsInArea(chunkStartX, chunkStartX + 800)

        // Spawn enemies in new area with difficulty scaling
        this.spawnEnemiesInArea(chunkStartX, chunkStartX + 800)
      } else if (!this.levelEndMarker) {
        // Create level end marker
        this.createLevelEndMarker()
        break
      } else {
        break
      }
    }
    
    // Generate checkpoints every 20 meters
    if (generationTriggerX > this.lastCheckpointX + this.checkpointInterval) {
      this.createCheckpoint(this.lastCheckpointX + this.checkpointInterval)
      this.lastCheckpointX += this.checkpointInterval
    }

    // Update gun position and aiming
    this.handleGunAiming()

    // Handle shooting
    this.handleShooting()

    // Player 2 gun and shooting (co-op mode)
    if (this.isCoopMode && this.player2) {
      this.handlePlayer2GunAndShooting()
    }

    // Update bullets manually (no physics)
    this.updateBullets()

    // Enemy AI
    this.handleEnemyAI()

    // Boss AI
    if (this.bossActive) {
      this.updateBoss()
    }

    // Spawn boss at certain levels (levels 5, 10, 15, etc.) - only if not already defeated by this player
    if (this.gameMode === 'levels' && !this.bossActive && !this.boss && !this.defeatedBossLevels.has(this.currentLevel)) {
      if (this.currentLevel % 5 === 0 && this.player.x > this.levelLength - 3000 && this.player.x < this.levelLength - 2800) {
        // Check if this player has defeated this specific boss
        const playerName = localStorage.getItem('player_name') || 'Guest'
        const defaultBossIndex = Math.floor((this.currentLevel / 5) - 1) % 24
        const bossKey = `${playerName}_boss_${defaultBossIndex}`
        const alreadyDefeated = localStorage.getItem(bossKey) === 'defeated'

        console.log('🎮 Level', this.currentLevel, '- Default Boss Index:', defaultBossIndex, '- Already defeated:', alreadyDefeated)

        if (!alreadyDefeated) {
          // Spawn the default boss for this level
          this.spawnBoss(this.levelLength - 2500)
        } else {
          // Find next undefeated boss and spawn it instead
          console.log('🔄 Boss', defaultBossIndex, 'already defeated, finding next undefeated boss...')
          const nextBossIndex = this.findNextUndefeatedBoss(defaultBossIndex + 1)
          if (nextBossIndex !== null) {
            this.spawnBoss(this.levelLength - 2500, nextBossIndex)
          }
        }
      }
    }

    // Update stomp mechanic
    this.handleStompMechanic()

    // Check spike collision with custom hitbox
    this.checkSpikeCollision()

    // Check for checkpoint activation
    this.checkCheckpoints()

    // Check for level completion (only in levels mode)
    if (this.gameMode === 'levels') {
      this.checkLevelComplete()
    }

    // Update UI
    this.updateUI()

    // Update debug UI
    if (this.debugMode) {
      this.updateDebugUI()
    }
  }

  private updateUI() {
    // Award 1 point per meter traveled (throttled to avoid spam)
    const currentMeter = Math.floor(this.player.x / 100)
    const lastMeter = Math.floor((this.player.x - (this.player.body as Phaser.Physics.Arcade.Body).velocity.x * 0.016) / 100)
    if (currentMeter > lastMeter) {
      this.updateScore(1) // 1 point per meter
    }

    // Update Player 1 health bar
    const healthPercent = this.playerHealth / this.maxHealth
    const healthBarMaxWidth = 200
    this.healthBarFill.width = healthBarMaxWidth * healthPercent

    // Change color based on health
    if (healthPercent > 0.6) {
      this.healthBarFill.setFillStyle(0x00ff00) // Green
    } else if (healthPercent > 0.3) {
      this.healthBarFill.setFillStyle(0xffaa00) // Orange
    } else {
      this.healthBarFill.setFillStyle(0xff0000) // Red
    }

    // Update lives text
    if (this.isCoopMode) {
      this.livesText.setText(`x${this.playerLives}`)
    } else {
      this.livesText.setText(this.getLivesText())
    }

    // Update Player 2 health bar in co-op mode
    if (this.isCoopMode && this.player2) {
      const p2Health = this.player2.getData('health') || 100
      const p2HealthPercent = p2Health / 100
      const p2HealthBarFill = this.player2.getData('healthBarFill') as Phaser.GameObjects.Rectangle
      const p2LivesText = this.player2.getData('livesText') as Phaser.GameObjects.Text

      if (p2HealthBarFill) {
        p2HealthBarFill.width = healthBarMaxWidth * p2HealthPercent

        // Change color based on health
        if (p2HealthPercent > 0.6) {
          p2HealthBarFill.setFillStyle(0x00ffff) // Cyan
        } else if (p2HealthPercent > 0.3) {
          p2HealthBarFill.setFillStyle(0xffaa00) // Orange
        } else {
          p2HealthBarFill.setFillStyle(0xff0000) // Red
        }
      }

      if (p2LivesText) {
        const p2Lives = this.player2.getData('lives') || 3
        p2LivesText.setText(`x${p2Lives}`)
      }
    }

    // Update reload bar
    const currentTime = this.time.now
    const timeSinceLastShot = currentTime - this.lastShotTime

    // Get weapon-specific cooldown
    let shootCooldown = 1000 // Default raygun
    if (this.equippedWeapon === 'laserGun') {
      shootCooldown = 300
    } else if (this.equippedWeapon === 'sword') {
      shootCooldown = 500
    } else if (this.equippedWeapon === 'bazooka') {
      shootCooldown = 2000 // Slow but powerful
    }

    // Calculate reload progress (0 to 1)
    const reloadProgress = Math.min(timeSinceLastShot / shootCooldown, 1)

    // Update reload bar width
    const reloadBarMaxWidth = 60
    this.reloadBarFill.width = reloadBarMaxWidth * reloadProgress
  }

  private handlePlayerMovement() {
    // Skip if player is dead
    if (this.playerIsDead) return
    
    // Skip if chat input is active (online mode)
    if (this.chatInputActive) return

    let speed = 200
    const jumpVelocity = -500 // Higher jump due to microgravity

    // Apply speed boost if active
    if (this.hasSpeedBoost) {
      speed = speed * 1.5 // 50% faster
    }

    // Check if player is on ground - simplified check
    const onGround = this.player.body!.touching.down

    // Detect landing and emit particles
    if (onGround && !this.wasOnGround) {
      this.landParticles.emitParticleAt(this.player.x, this.player.y + 30)
    }
    this.wasOnGround = onGround

    // Reset double jump when on ground
    if (onGround) {
      this.canDoubleJump = true
      this.hasDoubleJumped = false
      this.isStomping = false
    }

    // Get AI decision if AI is enabled
    let aiLeft = false
    let aiRight = false
    let aiJump = false

    if (this.aiEnabled) {
      const aiDecision = this.aiPlayer.getDecision(this.time.now)
      aiLeft = aiDecision.moveLeft
      aiRight = aiDecision.moveRight
      aiJump = aiDecision.jump
    } else if (this.mlAIEnabled) {
      // Use ML AI decision from stored state (updated asynchronously)
      aiLeft = this.mlAIDecision.moveLeft
      aiRight = this.mlAIDecision.moveRight
      aiJump = this.mlAIDecision.jump

      // Debug log every 60 frames (~1 second)
      if (Math.random() < 0.016) {
        console.log('ML AI applying decision:', { aiLeft, aiRight, aiJump })
      }

      // Update ML AI decision asynchronously for next frame
      this.mlAIPlayer.getDecision().then(aiDecision => {
        this.mlAIDecision = aiDecision
      }).catch(error => {
        console.error('ML AI decision error:', error)
      })
    }

    // Get gamepad input (only if input method is gamepad and AI is disabled)
    const controlSettings = ControlManager.getControlSettings()
    const useGamepad = !this.aiEnabled && !this.mlAIEnabled && controlSettings.inputMethod === 'gamepad'

    let gamepadLeft = false
    let gamepadRight = false
    let gamepadJump = false

    if (useGamepad && this.gamepad) {
      const mapping = controlSettings.gamepadMapping

      // Left stick or D-pad for movement
      const leftStickX = this.gamepad.leftStick.x
      const leftStickY = this.gamepad.leftStick.y
      const dpadLeft = this.gamepad.left
      const dpadRight = this.gamepad.right
      const dpadUp = this.gamepad.up

      if (mapping.moveLeftStick && (leftStickX < -0.3)) {
        gamepadLeft = true
      } else if (mapping.moveLeftStick && (leftStickX > 0.3)) {
        gamepadRight = true
      }

      if (mapping.moveDpad && dpadLeft) {
        gamepadLeft = true
      } else if (mapping.moveDpad && dpadRight) {
        gamepadRight = true
      }

      // Jump is D-pad Up or Left Stick Up when using gamepad
      gamepadJump = dpadUp || (mapping.moveLeftStick && leftStickY < -0.3)
    }

    // Horizontal movement (A/D or Arrow keys or Gamepad or AI)
    const moveSpeed = this.debugMode ? speed * 2 : speed  // 2x speed in debug mode
    const keyboardLeft = !this.aiEnabled && !this.mlAIEnabled && !useGamepad && (this.wasd.a.isDown || this.cursors.left!.isDown)
    const keyboardRight = !this.aiEnabled && !this.mlAIEnabled && !useGamepad && (this.wasd.d.isDown || this.cursors.right!.isDown)

    if (keyboardLeft || gamepadLeft || aiLeft) {
      this.player.setVelocityX(-moveSpeed)
      this.player.setFlipX(true)
      // Sync facing direction for online mode
      if (this.isOnlineMode && this.onlinePlayerManager) {
        this.onlinePlayerManager.updateLocalState({ facing_right: false })
      }
      if (onGround) {
        this.player.play('player_walk', true)
      }
    } else if (keyboardRight || gamepadRight || aiRight) {
      this.player.setVelocityX(moveSpeed)
      this.player.setFlipX(false)
      // Sync facing direction for online mode
      if (this.isOnlineMode && this.onlinePlayerManager) {
        this.onlinePlayerManager.updateLocalState({ facing_right: true })
      }
      if (onGround) {
        this.player.play('player_walk', true)
      }
    } else {
      this.player.setVelocityX(0)
      if (onGround) {
        this.player.play('player_idle', true)
      }
    }

    // Check for continuous left stick up for jetpack behavior
    const isJetpacking = useGamepad && this.gamepad && controlSettings.gamepadMapping.moveLeftStick && this.gamepad.leftStick.y < -0.5

    // Track gamepad jump button state for "just pressed" detection
    const wasGamepadJumpPressed = this.player.getData('wasGamepadJumpPressed') || false
    const gamepadJustPressed = gamepadJump && !wasGamepadJumpPressed
    this.player.setData('wasGamepadJumpPressed', gamepadJump)

    // Track AI jump button state for "just pressed" detection
    const wasAIJumpPressed = this.player.getData('wasAIJumpPressed') || false
    const aiJustPressed = aiJump && !wasAIJumpPressed
    this.player.setData('wasAIJumpPressed', aiJump)

    // Jump (W or Up arrow or Gamepad button or AI) - or fly up in debug mode
    const keyboardJump = !this.aiEnabled && !this.mlAIEnabled && !useGamepad && (Phaser.Input.Keyboard.JustDown(this.wasd.w) || Phaser.Input.Keyboard.JustDown(this.cursors.up!))

    if (this.debugMode && !this.aiEnabled && !this.mlAIEnabled && !useGamepad && this.wasd.w.isDown) {
      // Debug flight mode - fly up
      this.player.setVelocityY(-400)
    } else if (isJetpacking) {
      // Jetpack mode - continuous flight with left stick held up
      this.player.setVelocityY(-300)
      this.player.play('player_jump', true)
      // Emit particles for jetpack effect
      if (Math.random() < 0.3) { // 30% chance each frame
        this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
      }
    } else if (keyboardJump || gamepadJustPressed || aiJustPressed) {
      console.log('Jump pressed! onGround:', onGround, 'canDoubleJump:', this.canDoubleJump, 'hasDoubleJumped:', this.hasDoubleJumped)

      if (onGround) {
        // First jump from ground
        console.log('Ground jump!')
        this.player.setVelocityY(jumpVelocity)
        this.player.play('player_jump', true)
        this.audioManager.playJumpSound()
        this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
        this.stompStartY = this.player.y
        this.canDoubleJump = true // Enable double jump after first jump
        this.hasDoubleJumped = false
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // Double jump - can be used at any height after first jump
        console.log('Double jump!')
        this.player.setVelocityY(jumpVelocity)
        this.player.play('player_jump', true)
        this.audioManager.playJumpSound(true)
        this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
        this.hasDoubleJumped = true
        this.stompStartY = this.player.y

        // Add spin effect for double jump
        this.tweens.add({
          targets: this.player,
          angle: 360,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.player.setAngle(0)
          }
        })
      }
    }

    // Debug mode: fly down with S key
    if (this.debugMode && this.wasd.s.isDown) {
      this.player.setVelocityY(400)
    }
    // Stomp (S key - Easter egg)
    else if (Phaser.Input.Keyboard.JustDown(this.wasd.s) && !onGround && !this.isStomping) {
      const jumpHeight = this.stompStartY - this.player.y
      const doubleJumpHeight = Math.abs(jumpVelocity * 2) / this.physics.world.gravity.y * Math.abs(jumpVelocity)

      if (jumpHeight >= doubleJumpHeight * 0.6) {
        this.isStomping = true
        this.player.setVelocityY(800) // Fast downward velocity
      }
    }
  }

  private handleStompMechanic() {
    if (this.isStomping && this.player.body!.touching.down) {
      // Player landed with stomp
      this.isStomping = false

      // Create screen shake
      this.cameras.main.shake(200, 0.01)

      // Create block fragments around player
      const fragmentCount = 8
      for (let i = 0; i < fragmentCount; i++) {
        const angle = (Math.PI * 2 / fragmentCount) * i
        const distance = 50 + Math.random() * 30
        const x = this.player.x + Math.cos(angle) * distance
        const y = this.player.y + 20

        const fragment = this.blockFragments.create(x, y, 'metalBlock')
        fragment.setScale(0.3 + Math.random() * 0.2)
        fragment.setVelocity(
          Math.cos(angle) * (200 + Math.random() * 100),
          -300 - Math.random() * 200
        )
        fragment.setAngularVelocity(Math.random() * 400 - 200)
        fragment.setBounce(0.6)
        fragment.setCollideWorldBounds(true)

        // Fade out and destroy fragments after 2 seconds
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: fragment,
            alpha: 0,
            duration: 500,
            onComplete: () => fragment.destroy()
          })
        })
      }
    }
  }

  private handleEnemyAI() {
    // In online mode, only HOST runs enemy AI logic
    // Non-host receives position updates from host
    if (this.isOnlineMode && !this.isOnlineHost) {
      return
    }

    this.enemies.children.entries.forEach((enemyObj) => {
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite
      const detectionRange = enemy.getData('detectionRange')
      const speed = enemy.getData('speed')

      // Separate enemies that are too close to each other
      this.enemies.children.entries.forEach((otherEnemyObj) => {
        const otherEnemy = otherEnemyObj as Phaser.Physics.Arcade.Sprite
        if (enemy !== otherEnemy) {
          const distanceBetween = Phaser.Math.Distance.Between(
            enemy.x,
            enemy.y,
            otherEnemy.x,
            otherEnemy.y
          )

          const horizontalDistance = Math.abs(enemy.x - otherEnemy.x)
          const verticalDistance = Math.abs(enemy.y - otherEnemy.y)

          // Prevent horizontal overlap
          const minHorizontalDistance = 70
          if (horizontalDistance < minHorizontalDistance && distanceBetween > 0) {
            const angle = Phaser.Math.Angle.Between(otherEnemy.x, otherEnemy.y, enemy.x, enemy.y)
            const force = 150
            const pushX = Math.cos(angle) * force
            enemy.setVelocityX(enemy.body!.velocity.x + pushX)
          }

          // Prevent vertical stacking - if enemy is directly above or below another
          if (verticalDistance < 60 && horizontalDistance < 50) {
            // If this enemy is above another, push it horizontally away
            if (enemy.y < otherEnemy.y) {
              const direction = enemy.x > otherEnemy.x ? 1 : -1
              enemy.setVelocityX(enemy.body!.velocity.x + direction * 100)
            }
            // If this enemy is on top of another, make it hop off
            if (enemy.y < otherEnemy.y && enemy.y > otherEnemy.y - 40 && enemy.body!.touching.down) {
              const direction = enemy.x > otherEnemy.x ? 1 : -1
              enemy.setVelocityX(direction * 150)
              enemy.setVelocityY(-200)
            }
          }
        }
      })

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y
      )

      // In co-op mode, also check distance to player 2 and target the nearest
      let targetPlayer = this.player
      let targetDistance = distance

      if (this.isCoopMode && this.player2) {
        const distance2 = Phaser.Math.Distance.Between(
          this.player2.x,
          this.player2.y,
          enemy.x,
          enemy.y
        )

        if (distance2 < targetDistance) {
          targetPlayer = this.player2
          targetDistance = distance2
        }
      }

      if (targetDistance < detectionRange) {
        // Enemy detected player - move towards nearest player
        const direction = targetPlayer.x > enemy.x ? 1 : -1
        const enemyOnGround = enemy.body!.touching.down
        const horizontalDistance = Math.abs(targetPlayer.x - enemy.x)

        // Check if enemy is blocked (touching wall in the direction they want to move)
        const isBlockedRight = enemy.body!.blocked.right || enemy.body!.touching.right
        const isBlockedLeft = enemy.body!.blocked.left || enemy.body!.touching.left
        const isBlocked = (direction === 1 && isBlockedRight) || (direction === -1 && isBlockedLeft)

        // Check if enemy hasn't moved much (stuck detection)
        const lastX = enemy.getData('lastX') || enemy.x
        const movementDelta = Math.abs(enemy.x - lastX)
        let stuckTimer = enemy.getData('stuckTimer') || 0

        // Update stuck timer if not moving much
        if (movementDelta < 5 && enemyOnGround) {
          stuckTimer += this.game.loop.delta / 1000
        } else {
          stuckTimer = 0
        }
        enemy.setData('lastX', enemy.x)
        enemy.setData('stuckTimer', stuckTimer)

        // If enemy is stuck or blocked, use avoidance behavior
        if ((isBlocked || stuckTimer > 0.3) && enemyOnGround) {
          // Jump to try to get over obstacle
          if (enemyOnGround) {
            enemy.setVelocityY(-400)
          }

          // Alternate between trying direct path and going around
          const avoidanceMode = enemy.getData('avoidanceMode') || 0

          if (stuckTimer > 1) {
            // Been stuck too long, try going the other way
            const alternateDir = direction * -1
            enemy.setVelocityX(alternateDir * speed)
            enemy.setFlipX(alternateDir === -1)

            // Switch avoidance mode after 2 seconds
            if (stuckTimer > 2) {
              enemy.setData('stuckTimer', 0)
              enemy.setData('avoidanceMode', (avoidanceMode + 1) % 2)
            }
          } else {
            // Try jumping while moving forward
            enemy.setVelocityX(direction * speed)
            enemy.setFlipX(direction === -1)
          }
        } else {
          // Not blocked, move normally toward player
          enemy.setVelocityX(direction * speed)
          enemy.setFlipX(direction === -1) // Flip when moving left
        }

        const enemyType = enemy.getData('enemyType')
        enemy.play(`${enemyType}_move`, true)

        // Reset idle timer when chasing
        enemy.setData('idleTimer', 0)

        // Check if target player is above enemy and enemy is on ground - make enemy jump
        const playerAbove = targetPlayer.y < enemy.y - 50 // Player is at least 50px higher

        if (playerAbove && enemyOnGround && horizontalDistance < 200 && stuckTimer < 0.3) {
          enemy.setVelocityY(-400) // Jump velocity
        }
      } else {
        // Player out of range - wander around
        const deltaTime = this.game.loop.delta / 1000 // Convert to seconds
        let idleTimer = enemy.getData('idleTimer')
        let wanderTimer = enemy.getData('wanderTimer')
        let wanderDirection = enemy.getData('wanderDirection')

        // Update timers
        idleTimer += deltaTime
        wanderTimer += deltaTime

        // Change wander direction every 3 seconds (fixed for online sync)
        const wanderInterval = this.isOnlineMode ? 3 : Phaser.Math.Between(2, 4)
        if (wanderTimer > wanderInterval) {
          // Use deterministic direction based on enemy position in online mode
          if (this.isOnlineMode) {
            const enemyX = Math.floor(enemy.x)
            wanderDirection = ((enemyX + Math.floor(wanderTimer * 10)) % 3) - 1  // -1, 0, or 1
          } else {
            wanderDirection = Phaser.Math.Between(-1, 1) // -1 (left), 0 (idle), or 1 (right)
          }
          enemy.setData('wanderDirection', wanderDirection)
          wanderTimer = 0
        }

        // Force movement if idle for more than 1 second
        if (idleTimer > 1 && wanderDirection === 0) {
          if (this.isOnlineMode) {
            // Deterministic direction based on enemy X position
            wanderDirection = (Math.floor(enemy.x) % 2) === 0 ? -1 : 1
          } else {
            wanderDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1
          }
          enemy.setData('wanderDirection', wanderDirection)
          idleTimer = 0
        }

        // Apply wander movement
        if (wanderDirection !== 0) {
          enemy.setVelocityX(wanderDirection * speed * 0.5) // Half speed when wandering
          enemy.setFlipX(wanderDirection === -1) // Flip when moving left
          const enemyType = enemy.getData('enemyType')
          enemy.play(`${enemyType}_move`, true)
          idleTimer = 0 // Reset idle timer when moving
        } else {
          enemy.setVelocityX(0)
          const enemyType = enemy.getData('enemyType')
          enemy.play(`${enemyType}_idle`, true)
        }

        // Save updated timers
        enemy.setData('idleTimer', idleTimer)
        enemy.setData('wanderTimer', wanderTimer)
      }
    })
  }

  private damagePlayer(damage: number) {
    if (this.playerIsDead) return

    const currentTime = this.time.now
    const lastHitTime = this.player.getData('lastHitTime') || 0
    const invincibilityDuration = 1000

    if (currentTime - lastHitTime < invincibilityDuration) {
      return // Still invincible
    }

    // Check for shield - if active, don't take damage and deactivate shield
    if (this.hasShield) {
      this.hasShield = false
      if (this.shieldSprite) {
        // Shield break effect
        this.tweens.add({
          targets: this.shieldSprite,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => {
            if (this.shieldSprite) {
              this.shieldSprite.destroy()
              this.shieldSprite = null
            }
          }
        })
      }

      // Show shield break text
      const text = this.add.text(this.player.x, this.player.y - 50, 'SHIELD BROKEN!', {
        fontSize: '20px',
        color: '#ff0000'
      })
      text.setOrigin(0.5)

      this.tweens.add({
        targets: text,
        y: text.y - 30,
        alpha: 0,
        duration: 1500,
        onComplete: () => text.destroy()
      })

      return // Shield absorbed the damage
    }

    // Debug mode god mode - no damage
    if (this.debugMode) {
      return
    }

    // Play damage sound
    this.audioManager.playDamageSound()

    this.player.setData('lastHitTime', currentTime)
    this.playerHealth -= damage

    if (this.playerHealth <= 0) {
      this.playerHealth = 0
      this.handlePlayerDeath()
      return
    }

    // Flash effect
    this.player.setTint(0xff0000)
    this.time.delayedCall(100, () => {
      this.player.clearTint()
    })
  }

  private handlePlayerEnemyCollision(
    player: any,
    enemy: any
  ) {
    const playerSprite = player as Phaser.Physics.Arcade.Sprite
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite

    // Determine which player was hit
    const isPlayer1 = playerSprite === this.player
    const isPlayer2 = this.isCoopMode && playerSprite === this.player2

    // Skip if player is already dead
    if (isPlayer1 && this.playerIsDead) return
    if (isPlayer2 && playerSprite.getData('isDead')) return

    // Check if player has invincibility frames
    const lastHitTime = playerSprite.getData('lastHitTime') || 0
    const currentTime = this.time.now
    const invincibilityDuration = 1000 // 1 second of invincibility

    if (currentTime - lastHitTime < invincibilityDuration) {
      return // Player is still invincible
    }

    // Debug mode god mode - no damage
    if (this.debugMode) {
      // Instantly kill enemy in debug mode
      const coinReward = enemySprite.getData('coinReward') || 10
      this.dropCoins(enemySprite.x, enemySprite.y, coinReward)
      this.updateScore(100)
      
      // Create death effect
      const enemyType = enemySprite.getData('enemyType') || 'alienGreen'
      const deadTexture = `${enemyType}_dead`
      if (this.textures.exists(deadTexture)) {
        // Create a temporary sprite for the death animation since we're destroying the original
        const deadSprite = this.physics.add.sprite(enemySprite.x, enemySprite.y, deadTexture)
        deadSprite.setVelocity(0, -200)
        deadSprite.setTint(0xff0000)
        this.tweens.add({
          targets: deadSprite,
          alpha: 0,
          y: deadSprite.y + 50,
          duration: 500,
          onComplete: () => deadSprite.destroy()
        })
      }
      
      enemySprite.destroy()
      return
    }

    // Check if player has shield - absorb damage and destroy shield
    const hasShield = isPlayer1 ? this.hasShield : playerSprite.getData('hasShield')
    if (hasShield) {
      // Shield absorbs the hit
      if (isPlayer1) {
        this.hasShield = false
      } else {
        playerSprite.setData('hasShield', false)
      }

      // Bounce enemy away
      const bounceDirection = enemySprite.x > playerSprite.x ? 1 : -1
      enemySprite.setVelocityX(bounceDirection * 300)
      enemySprite.setVelocityY(-300)

      // No damage to player
      return
    }

    // Player takes damage
    if (isPlayer1) {
      this.playerHealth -= 20
      if (this.playerHealth <= 0) {
        this.playerHealth = 0
        this.handlePlayerDeath()
        return
      }
    } else if (isPlayer2) {
      const p2Health = playerSprite.getData('health') || 100
      playerSprite.setData('health', Math.max(0, p2Health - 20))

      if (p2Health - 20 <= 0) {
        // Player 2 dies
        const p2Lives = playerSprite.getData('lives') || 3
        playerSprite.setData('lives', p2Lives - 1)

        if (p2Lives - 1 <= 0) {
          // Player 2 game over
          playerSprite.setData('isDead', true)
          playerSprite.setAlpha(0.3)
        } else {
          // Respawn player 2
          playerSprite.setPosition(this.player.x + 50, this.player.y)
          playerSprite.setData('health', 100)
        }
        return
      }
    }

    playerSprite.setData('lastHitTime', currentTime)

    // Flash player red
    playerSprite.setTint(0xff0000)
    this.time.delayedCall(100, () => {
      playerSprite.setTint(0xffffff)
      this.time.delayedCall(100, () => {
        playerSprite.setTint(0xff0000)
        this.time.delayedCall(100, () => {
          playerSprite.setTint(0xffffff)
        })
      })
    })

    // Check if enemy is above player
    const enemyAbovePlayer = enemySprite.y < playerSprite.y - 20 // Enemy is at least 20px above player

    // Determine bounce direction
    const bounceDirection = enemySprite.x > playerSprite.x ? 1 : -1

    if (enemyAbovePlayer) {
      // Enemy is above - bounce diagonally upward (top right or left)
      enemySprite.setVelocityX(bounceDirection * 300) // Stronger horizontal bounce
      enemySprite.setVelocityY(-400) // Strong upward bounce

      // Mark that this enemy bounced from above
      enemySprite.setData('lastBounceFromAbove', currentTime)
    } else {
      // Enemy is at same level or below - regular bounce
      enemySprite.setVelocityX(bounceDirection * 200)
      enemySprite.setVelocityY(-200) // Regular bounce up
    }

    // Also push player back slightly
    const playerPushDirection = bounceDirection * -1
    playerSprite.setVelocityX(playerPushDirection * 150)

    // Don't reset double jump - player maintains their jump state
    // This prevents infinite jumping after getting hit

    // Screen shake effect
    this.cameras.main.shake(100, 0.005)
  }

  private handleFriendlyFire(
    player: any,
    bullet: any
  ) {
    const playerSprite = player as Phaser.Physics.Arcade.Sprite
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite

    // Determine which player was hit
    const isPlayer1 = playerSprite === this.player
    const isPlayer2 = this.isCoopMode && playerSprite === this.player2

    // Skip if player is already dead
    if (isPlayer1 && this.playerIsDead) return
    if (isPlayer2 && playerSprite.getData('isDead')) return

    // Check if player has invincibility frames
    const lastHitTime = playerSprite.getData('lastHitTime') || 0
    const currentTime = this.time.now
    const invincibilityDuration = 1000 // 1 second of invincibility

    if (currentTime - lastHitTime < invincibilityDuration) {
      bulletSprite.destroy()
      return
    }

    // Debug mode god mode - no damage
    if (this.debugMode) {
      bulletSprite.destroy()
      return
    }

    // Check if player has shield - absorb damage and destroy shield
    const hasShield = isPlayer1 ? this.hasShield : playerSprite.getData('hasShield')
    if (hasShield) {
      if (isPlayer1) {
        this.hasShield = false
      } else {
        playerSprite.setData('hasShield', false)
      }
      bulletSprite.destroy()
      return
    }

    // Player takes damage (10 damage from friendly fire - less than enemy hit)
    const damage = 10

    if (isPlayer1) {
      this.playerHealth -= damage
      if (this.playerHealth <= 0) {
        this.playerHealth = 0
        this.handlePlayerDeath()
        bulletSprite.destroy()
        return
      }
    } else if (isPlayer2) {
      const p2Health = playerSprite.getData('health') || 100
      playerSprite.setData('health', Math.max(0, p2Health - damage))

      if (p2Health - damage <= 0) {
        // Player 2 dies
        const p2Lives = playerSprite.getData('lives') || 3
        playerSprite.setData('lives', p2Lives - 1)

        if (p2Lives - 1 <= 0) {
          // Player 2 game over
          playerSprite.setData('isDead', true)
          playerSprite.setAlpha(0.3)
        } else {
          // Respawn player 2
          playerSprite.setPosition(this.player.x + 50, this.player.y)
          playerSprite.setData('health', 100)
        }
        bulletSprite.destroy()
        return
      }
    }

    playerSprite.setData('lastHitTime', currentTime)

    // Flash player yellow (different from enemy red)
    playerSprite.setTint(0xffff00)
    this.time.delayedCall(100, () => {
      playerSprite.setTint(0xffffff)
    })

    // Small knockback from bullet direction
    const knockbackDirection = bulletSprite.body && (bulletSprite.body as Phaser.Physics.Arcade.Body).velocity.x > 0 ? 1 : -1
    playerSprite.setVelocityX(knockbackDirection * 100)

    // Destroy bullet
    bulletSprite.destroy()

    // Small screen shake
    this.cameras.main.shake(50, 0.003)
  }

  private handlePlayerDeath() {
    console.log('💀 handlePlayerDeath called', {
      dqnTraining: this.dqnTraining,
      hasAgent: !!this.dqnAgent,
      autoRestart: this.dqnAutoRestart,
      isOnlineMode: this.isOnlineMode
    })
    
    this.playerIsDead = true

    // DQN Training: End episode and quick restart if auto-restart is on
    if (this.dqnTraining && this.dqnAgent && this.dqnAutoRestart) {
      console.log('💀 Player died - ending DQN episode (fast restart)')
      // Don't play death animation, just end episode and restart
      this.handleDQNEpisodeEnd()
      return  // handleDQNEpisodeEnd will handle the restart
    }

    console.log('💀 Playing normal death animation')
    // Stop player movement
    this.player.setVelocity(0, 0)
    this.player.setGravityY(0)
    this.player.body!.enable = false

    // Hide gun and shield if active
    this.gun.setVisible(false)
    if (this.hasShield && this.shieldSprite) {
      this.shieldSprite.destroy()
      this.shieldSprite = null
      this.hasShield = false
    }

    // Change to duck/sit sprite (sad pose)
    this.player.setTexture(`${this.equippedSkin}_duck`)

    // Turn player red
    this.player.setTint(0xff0000)

    // Play death sound
    this.audioManager.playDeathSound()    // Create particle burst
    const particleCount = 25
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i
      const speed = Phaser.Math.Between(100, 300)
      const particle = this.add.circle(this.player.x, this.player.y, 4, 0xff0000)
      particle.setDepth(20)

      this.tweens.add({
        targets: particle,
        x: this.player.x + Math.cos(angle) * speed,
        y: this.player.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      })
    }

    // Fade out player with spin
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      angle: 360,
      scaleX: 0.5,
      scaleY: 0.5,
      y: this.player.y - 50,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Fade to black
        this.cameras.main.fadeOut(500, 0, 0, 0)

        this.time.delayedCall(500, () => {
          // Lose a life
          this.playerLives--

          // Online mode: Notify remote player and check game over
          if (this.isOnlineMode && this.onlinePlayerManager) {
            this.onlinePlayerManager.notifyLocalPlayerDeath(this.playerLives)
            
            if (this.playerLives <= 0) {
              // Check if both players are out
              if (this.onlinePlayerManager.areBothPlayersOutOfLives()) {
                // Both players dead - game over
                this.showOnlineGameOver()
              } else {
                // Partner still alive - switch to spectator mode
                this.enterSpectatorMode()
              }
            } else {
              // Respawn with full health
              this.respawnPlayer()
            }
            return
          }

          if (this.playerLives <= 0) {
            // Game Over
            this.showGameOver()
          } else {
            // Respawn with full health
            this.respawnPlayer()
          }
        })
      }
    })
  }

  private respawnPlayer() {
    // Reset player position to last checkpoint
    const checkpointX = this.checkpoints[this.currentCheckpoint]?.x || this.playerSpawnX
    this.player.setPosition(checkpointX, this.playerSpawnY)

    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Start with player invisible and small
    this.player.setAlpha(0)
    this.player.setScale(0)
    this.player.setTexture(`${this.equippedSkin}_stand`)
    this.player.setGravityY(200)
    this.player.body!.enable = true
    this.player.angle = 0
    this.player.clearTint()

    // Checkpoint glow effect
    if (this.checkpoints[this.currentCheckpoint]) {
      const checkpoint = this.checkpoints[this.currentCheckpoint]

      // Create glow ring at checkpoint position
      const glowRing = this.add.circle(checkpoint.x, 600, 50, 0x00ff00, 0.3)
      glowRing.setDepth(1)

      this.tweens.add({
        targets: glowRing,
        scale: 2,
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => glowRing.destroy()
      })
    }

    // Scale up spawn animation
    this.tweens.add({
      targets: this.player,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.player.play('player_idle')
      }
    })

    // Reset health to full
    this.playerHealth = this.maxHealth
    this.playerIsDead = false
    this.gun.setVisible(true)
    this.lastShotTime = 0

    // Give player 1 second of invincibility on respawn
    this.player.setData('lastHitTime', this.time.now)
    this.hasShield = true
    this.shieldSprite = this.add.sprite(this.player.x, this.player.y, 'powerShield')
    this.shieldSprite.setScale(1.5)
    this.shieldSprite.setAlpha(0.6)
    this.shieldSprite.setDepth(5)

    // Shield animation
    this.tweens.add({
      targets: this.shieldSprite,
      angle: 360,
      duration: 3000,
      repeat: 0
    })

    // Remove spawn shield after 1 second
    this.time.delayedCall(1000, () => {
      this.hasShield = false
      if (this.shieldSprite) {
        this.tweens.add({
          targets: this.shieldSprite,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => {
            if (this.shieldSprite) {
              this.shieldSprite.destroy()
              this.shieldSprite = null
            }
          }
        })
      }
    })

    // Update lives display
    this.livesText.setText(this.getLivesText())

    // Flash camera white
    this.cameras.main.flash(500, 255, 255, 255)
    
    // Notify online partner of respawn
    if (this.isOnlineMode && this.onlinePlayerManager) {
      const respawnX = this.checkpoints[this.currentCheckpoint]?.x || this.playerSpawnX
      this.onlinePlayerManager.notifyLocalPlayerRespawn(
        respawnX, 
        this.playerSpawnY, 
        this.playerLives
      )
    }
  }

  private showGameOver() {
    console.log('🎮🎮🎮 GAME OVER TRIGGERED 🎮🎮🎮')
    console.log('Current Score:', this.score)
    console.log('Current Coins:', this.coinCount)
    console.log('Enemies Defeated:', this.enemiesDefeated)

    this.physics.pause()

    // Fade camera back in from black
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Submit score to backend (non-blocking)
    this.submitScoreToBackend().catch(err => {
      console.log('Score submission failed (backend may be offline):', err)
    })

    // Dark overlay background
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85)
    overlay.setScrollFactor(0)
    overlay.setDepth(2000)

    // Game over panel
    const panelWidth = 600
    const panelHeight = 500
    const panel = this.add.rectangle(640, 360, panelWidth, panelHeight, 0x1a1a2e)
    panel.setStrokeStyle(4, 0xff0000)
    panel.setScrollFactor(0)
    panel.setDepth(2001)

    // Game over title
    const gameOverText = this.add.text(640, 150, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    })
    gameOverText.setOrigin(0.5)
    gameOverText.setScrollFactor(0)
    gameOverText.setDepth(2002)

    // Stats
    const statsText = this.add.text(640, 300,
      `Level: ${this.currentLevel}\nScore: ${this.score}\nCoins: ${this.coinCount}\nEnemies: ${this.enemiesDefeated}\nDistance: ${Math.floor(this.player.x / 70)}m`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 10
    })
    statsText.setOrigin(0.5)
    statsText.setScrollFactor(0)
    statsText.setDepth(2002)

    // Restart Button
    const restartBtn = this.add.rectangle(540, 480, 200, 60, 0x00aa00)
    restartBtn.setStrokeStyle(3, 0x00ff00)
    restartBtn.setScrollFactor(0)
    restartBtn.setDepth(2002)
    restartBtn.setInteractive({ useHandCursor: true })

    const restartText = this.add.text(540, 480, 'RESTART', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    restartText.setOrigin(0.5)
    restartText.setScrollFactor(0)
    restartText.setDepth(2003)

    // Home Button
    const homeBtn = this.add.rectangle(740, 480, 200, 60, 0x0066cc)
    homeBtn.setStrokeStyle(3, 0x0099ff)
    homeBtn.setScrollFactor(0)
    homeBtn.setDepth(2002)
    homeBtn.setInteractive({ useHandCursor: true })

    const homeText = this.add.text(740, 480, 'MENU', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    homeText.setOrigin(0.5)
    homeText.setScrollFactor(0)
    homeText.setDepth(2003)

    // Button hover effects
    restartBtn.on('pointerover', () => {
      restartBtn.setFillStyle(0x00ff00)
      restartBtn.setScale(1.05)
    })
    restartBtn.on('pointerout', () => {
      restartBtn.setFillStyle(0x00aa00)
      restartBtn.setScale(1)
    })

    homeBtn.on('pointerover', () => {
      homeBtn.setFillStyle(0x0099ff)
      homeBtn.setScale(1.05)
    })
    homeBtn.on('pointerout', () => {
      homeBtn.setFillStyle(0x0066cc)
      homeBtn.setScale(1)
    })

    // Button click handlers
    restartBtn.on('pointerdown', () => {
      this.tweens.killAll()
      const restartData: any = { gameMode: this.gameMode, level: this.currentLevel }
      if (this.isCoopMode) {
        restartData.mode = 'coop'
      }
      this.scene.restart(restartData)
    })

    homeBtn.on('pointerdown', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })

    // Keyboard shortcuts
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.tweens.killAll()
      const restartData: any = { gameMode: this.gameMode, level: this.currentLevel }
      if (this.isCoopMode) {
        restartData.mode = 'coop'
      }
      this.scene.restart(restartData)
    })

    this.input.keyboard!.once('keydown-M', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })

    // Pulsing animation on title
    this.tweens.add({
      targets: gameOverText,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  /**
   * Enter spectator mode when local player is out of lives but partner is still alive
   */
  private enterSpectatorMode(): void {
    if (!this.isOnlineMode || !this.onlinePlayerManager) return
    
    console.log('👀 Entering spectator mode - watching partner play')
    
    // Hide local player completely
    this.player.setVisible(false)
    this.player.body!.enable = false
    this.gun.setVisible(false)
    
    // Show spectating message
    this.onlinePlayerManager.showSpectatingMessage()
    
    // Fade camera back in
    this.cameras.main.fadeIn(500, 0, 0, 0)
    
    // Reset dead state so update loop continues
    this.playerIsDead = false
  }

  /**
   * Show game over screen for online mode - only return to menu option
   */
  private showOnlineGameOver(): void {
    console.log('🎮🎮🎮 ONLINE GAME OVER - Both players out! 🎮🎮🎮')
    
    // Clean up online connection
    if (this.onlinePlayerManager) {
      this.onlinePlayerManager.removeSpectatingMessage()
    }
    
    // Disconnect from online service
    OnlineCoopService.getInstance().disconnect()
    
    this.physics.pause()

    // Fade camera back in from black
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Submit score to backend (non-blocking)
    this.submitScoreToBackend().catch(err => {
      console.log('Score submission failed (backend may be offline):', err)
    })

    // Dark overlay background
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85)
    overlay.setScrollFactor(0)
    overlay.setDepth(2000)

    // Game over panel
    const panelWidth = 600
    const panelHeight = 450
    const panel = this.add.rectangle(640, 360, panelWidth, panelHeight, 0x1a1a2e)
    panel.setStrokeStyle(4, 0xff0000)
    panel.setScrollFactor(0)
    panel.setDepth(2001)

    // Game over title
    const gameOverText = this.add.text(640, 150, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    })
    gameOverText.setOrigin(0.5)
    gameOverText.setScrollFactor(0)
    gameOverText.setDepth(2002)

    // Online mode subtitle
    const onlineText = this.add.text(640, 210, '🌐 Online Co-op', {
      fontSize: '24px',
      color: '#9900ff',
      fontStyle: 'bold'
    })
    onlineText.setOrigin(0.5)
    onlineText.setScrollFactor(0)
    onlineText.setDepth(2002)

    // Stats
    const statsText = this.add.text(640, 320,
      `Level: ${this.currentLevel}\nScore: ${this.score}\nCoins: ${this.coinCount}\nEnemies: ${this.enemiesDefeated}\nDistance: ${Math.floor(this.farthestPlayerX / 70)}m`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 10
    })
    statsText.setOrigin(0.5)
    statsText.setScrollFactor(0)
    statsText.setDepth(2002)

    // Menu Button (centered, only option for online mode)
    const menuBtn = this.add.rectangle(640, 500, 250, 60, 0x0066cc)
    menuBtn.setStrokeStyle(3, 0x0099ff)
    menuBtn.setScrollFactor(0)
    menuBtn.setDepth(2002)
    menuBtn.setInteractive({ useHandCursor: true })

    const menuText = this.add.text(640, 500, 'BACK TO MENU', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    menuText.setOrigin(0.5)
    menuText.setScrollFactor(0)
    menuText.setDepth(2003)

    // Button hover effects
    menuBtn.on('pointerover', () => {
      menuBtn.setFillStyle(0x0099ff)
      menuBtn.setScale(1.05)
    })
    menuBtn.on('pointerout', () => {
      menuBtn.setFillStyle(0x0066cc)
      menuBtn.setScale(1)
    })

    // Button click handler
    menuBtn.on('pointerdown', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })

    // Keyboard shortcut
    this.input.keyboard!.once('keydown-M', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })
    
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })

    // Pulsing animation on title
    this.tweens.add({
      targets: gameOverText,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private handlePlayer2Movement() {
    // Get gamepad 2
    const gamepads = this.input.gamepad?.gamepads || []
    const gamepad2 = gamepads.length > 1 ? gamepads[1] : null

    if (!gamepad2 || !this.player2) return

    const speed = 200
    const jumpVelocity = -500
    const onGround = this.player2.body!.touching.down

    // Reset double jump when on ground
    const canDoubleJump = this.player2.getData('canDoubleJump') !== false
    const hasDoubleJumped = this.player2.getData('hasDoubleJumped') || false

    if (onGround) {
      this.player2.setData('canDoubleJump', true)
      this.player2.setData('hasDoubleJumped', false)
    }

    // Movement with left stick
    const leftStickX = gamepad2.leftStick.x
    const dpadLeft = gamepad2.left
    const dpadRight = gamepad2.right

    if (leftStickX < -0.3 || dpadLeft) {
      this.player2.setVelocityX(-speed)
      this.player2.setFlipX(true)
      if (onGround) this.player2.play('player2_walk', true)
    } else if (leftStickX > 0.3 || dpadRight) {
      this.player2.setVelocityX(speed)
      this.player2.setFlipX(false)
      if (onGround) this.player2.play('player2_walk', true)
    } else {
      this.player2.setVelocityX(0)
      if (onGround) this.player2.play('player2_idle', true)
    }

    // Jump with A button OR left analog stick up
    const leftStickY = gamepad2.leftStick.y
    const dpadUp = gamepad2.up

    const wasJumpPressed = this.player2.getData('wasJumpPressed') || false
    const jumpPressed = gamepad2.A || leftStickY < -0.5 || dpadUp || false
    const jumpJustPressed = jumpPressed && !wasJumpPressed
    this.player2.setData('wasJumpPressed', jumpPressed)

    if (jumpJustPressed) {
      if (onGround) {
        this.player2.setVelocityY(jumpVelocity)
        this.player2.play('player2_jump', true)
        this.audioManager.playJumpSound()
        this.player2.setData('canDoubleJump', true)
      } else if (canDoubleJump && !hasDoubleJumped) {
        this.player2.setVelocityY(jumpVelocity)
        this.player2.play('player2_jump', true)
        this.audioManager.playJumpSound(true)
        this.player2.setData('hasDoubleJumped', true)
      }
    }
  }

  private handleGunAiming() {
    // Skip if player is dead
    if (this.playerIsDead) return

    // DQN training handles its own aiming in applyDQNAction
    if (this.dqnTraining) return

    const controlSettings = ControlManager.getControlSettings()
    const useGamepad = !this.aiEnabled && controlSettings.inputMethod === 'gamepad'

    let aimX: number
    let aimY: number

    // AI aiming takes priority
    if (this.aiEnabled) {
      const aiDecision = this.aiPlayer.getDecision(this.time.now)
      aimX = aiDecision.aimX || this.player.x + 100
      aimY = aiDecision.aimY || this.player.y
    }
    // Check for gamepad right stick aiming (only if gamepad mode is enabled)
    else if (useGamepad && this.gamepad && controlSettings.gamepadMapping.aimRightStick) {
      const rightStickX = this.gamepad.rightStick.x
      const rightStickY = this.gamepad.rightStick.y
      const stickMagnitude = Math.sqrt(rightStickX * rightStickX + rightStickY * rightStickY)

      // If right stick is being used (magnitude > 0.2), use gamepad aiming with reduced sensitivity
      if (stickMagnitude > 0.2) {
        // Use right stick direction for aiming with reduced sensitivity (0.5x)
        const aimSensitivity = 0.3 // Reduced for more precise aiming
        aimX = this.player.x + rightStickX * 100 * aimSensitivity
        aimY = this.player.y + rightStickY * 100 * aimSensitivity
      } else {
        // Default to aiming in player's facing direction
        aimX = this.player.x + (this.player.flipX ? -100 : 100)
        aimY = this.player.y
      }
    } else {
      // Mouse aiming (keyboard mode or when right stick aiming is disabled)
      const pointer = this.input.activePointer
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
      aimX = worldPoint.x
      aimY = worldPoint.y
    }

    // Calculate angle to aim point
    const angleToMouse = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      aimX,
      aimY
    )

    // For sword, position 23 degrees ahead of player relative to aim direction
    let gunAngle = angleToMouse
    if (this.equippedWeapon === 'sword') {
      gunAngle = angleToMouse + Phaser.Math.DegToRad(23)
    }

    // Position gun around player center with distance
    const distanceFromPlayer = 30 // Distance from player center
    const gunX = this.player.x + Math.cos(gunAngle) * distanceFromPlayer
    const gunY = this.player.y + Math.sin(gunAngle) * distanceFromPlayer
    this.gun.setPosition(gunX, gunY)

    // Flip gun sprite vertically if pointing upward to prevent upside-down appearance
    if (gunAngle > Math.PI / 2 || gunAngle < -Math.PI / 2) {
      this.gun.setScale(1.0, -1.0) // Flip Y
    } else {
      this.gun.setScale(1.0, 1.0) // Normal
    }

    // Apply rotation directly without any clamping
    this.gun.setRotation(gunAngle)
  }

  private handleShooting() {
    // Skip if player is dead
    if (this.playerIsDead) return

    const controlSettings = ControlManager.getControlSettings()
    const useGamepad = !this.aiEnabled && controlSettings.inputMethod === 'gamepad'

    const pointer = this.input.activePointer
    const currentTime = this.time.now

    // Check AI shoot decision
    let aiShoot = false
    if (this.aiEnabled) {
      const aiDecision = this.aiPlayer.getDecision(this.time.now)
      aiShoot = aiDecision.shoot
    } else if (this.mlAIEnabled) {
      aiShoot = this.mlAIDecision.shoot
    } else if (this.dqnTraining) {
      // DQN agent shooting
      aiShoot = this.dqnShooting
    }

    // Check gamepad shoot button from mapping
    let gamepadShoot = false
    if (useGamepad && this.gamepad) {
      const shootButton = controlSettings.gamepadMapping.shoot
      gamepadShoot = this.gamepad.buttons[shootButton]?.pressed || false
    }

    // Right mouse button for special attack (sword blade throw) - keyboard only
    if (!useGamepad && pointer.rightButtonDown() && this.equippedWeapon === 'sword' && currentTime - this.lastShotTime > 2000) {
      this.throwSwordBlade()
      this.lastShotTime = currentTime
      return // Skip normal attack
    }

    // Weapon-specific cooldowns and behavior
    let shootCooldown = 500 // Default raygun cooldown (reduced from 1000)
    let bulletSpeed = 600

    if (this.equippedWeapon === 'laserGun') {
      shootCooldown = 150 // Laser gun fires very fast (reduced from 300)
      bulletSpeed = 800 // Faster bullets too
    } else if (this.equippedWeapon === 'sword') {
      shootCooldown = 250 // Sword swings fast (reduced from 500)
      // Sword will use melee attack instead of bullets
    } else if (this.equippedWeapon === 'bazooka') {
      shootCooldown = 1000 // Bazooka fire rate (reduced from 2000)
      bulletSpeed = 400 // Slower rockets
    }

    // Check for mouse button press or gamepad shoot button or AI shoot
    const mouseShoot = !this.aiEnabled && !this.mlAIEnabled && !this.dqnTraining && !useGamepad && pointer.isDown
    if ((mouseShoot || gamepadShoot || aiShoot) && currentTime - this.lastShotTime > shootCooldown) {
      this.lastShotTime = currentTime

      if (this.equippedWeapon === 'sword') {
        // Get current angle to mouse
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
        const angleToMouse = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          worldPoint.x,
          worldPoint.y
        )

        // Sword swing animation - smooth arc swing with motion trail
        const startAngle = angleToMouse + Phaser.Math.DegToRad(-60)
        const endAngle = angleToMouse + Phaser.Math.DegToRad(60)

        // Immediately set starting position
        this.gun.setRotation(startAngle)

        // Create trail effect with multiple ghost images
        const trailImages: Phaser.GameObjects.Image[] = []

        // Animate the sword swinging through the arc
        this.tweens.add({
          targets: this.gun,
          rotation: endAngle,
          duration: 300, // Slightly longer for smoother appearance
          ease: 'Quad.easeOut',
          onUpdate: (tween) => {
            // Create trail images during swing
            if (tween.progress > 0 && Math.random() < 0.4) { // 40% chance each frame
              const trailImage = this.add.image(this.gun.x, this.gun.y, this.gun.texture.key)
              trailImage.setOrigin(this.gun.originX, this.gun.originY)
              trailImage.setRotation(this.gun.rotation)
              trailImage.setScale(this.gun.scaleX, this.gun.scaleY)
              trailImage.setTint(0xff00ff) // Purple trail
              trailImage.setAlpha(0.4)
              trailImage.setDepth(this.gun.depth - 1)

              trailImages.push(trailImage)

              // Fade out trail image
              this.tweens.add({
                targets: trailImage,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                  trailImage.destroy()
                }
              })
            }
          },
          onComplete: () => {
            // Clean up any remaining trail images
            trailImages.forEach(img => {
              if (img && img.active) img.destroy()
            })
            trailImages.length = 0

            // Return to normal position (23 degrees ahead)
            this.tweens.add({
              targets: this.gun,
              rotation: angleToMouse + Phaser.Math.DegToRad(23),
              duration: 150,
              ease: 'Quad.easeIn'
            })
          }
        })

        // Melee attack: damage enemies in front of player
        const meleeRange = 80
        const meleeDirection = Math.cos(angleToMouse) > 0 ? 1 : -1
        const meleeX = this.player.x + (meleeDirection * meleeRange)
        const meleeY = this.player.y

        // Check if any enemies are in melee range
        this.enemies.children.entries.forEach((enemy: any) => {
          const enemySprite = enemy as Phaser.Physics.Arcade.Sprite
          const distance = Phaser.Math.Distance.Between(meleeX, meleeY, enemySprite.x, enemySprite.y)

          if (distance < meleeRange) {
            // Damage enemy (5 damage, same as bullet)
            let enemyHealth = enemySprite.getData('health') || 1
            enemyHealth -= 5
            enemySprite.setData('health', enemyHealth)

            // Visual feedback: flash and knockback
            enemySprite.clearTint() // Clear any existing tint first
            enemySprite.setTint(0xff0000)
            // Clear any existing tint timer
            const existingTimer = enemySprite.getData('tintTimer')
            if (existingTimer) existingTimer.remove()
            // Set new timer and store reference
            const tintTimer = this.time.delayedCall(100, () => {
              if (enemySprite && enemySprite.active) {
                enemySprite.clearTint()
              }
            })
            enemySprite.setData('tintTimer', tintTimer)

            // Knockback
            const knockbackForce = 300
            enemySprite.setVelocityX(meleeDirection * knockbackForce)

            // Check if enemy died
            if (enemyHealth <= 0) {
              const spawnX = enemySprite.getData('spawnX')
              const spawnY = enemySprite.getData('spawnY')
              const enemyType = enemySprite.getData('enemyType')
              const scale = enemySprite.scaleX

              // Award score for defeating enemy
              this.enemiesDefeated++
              const enemySize = enemySprite.getData('enemySize')
              let scoreReward = 50 // small
              if (enemySize === 'medium') scoreReward = 100
              if (enemySize === 'large') scoreReward = 200
              this.updateScore(scoreReward)

            // If we're in online mode, report the kill to the server and avoid spawning local coins
            const enemyId = enemySprite.getData('enemyId')
            if (this.isOnlineMode && this.onlinePlayerManager && enemyId) {
              // Report kill, server will be authoritative and spawn coins
              this.onlinePlayerManager.reportEnemyKilled(enemyId)
              // Make sure remote tracking is clean
              this.remoteEnemies.delete(enemyId)
              // If we're the host, also untrack this enemy for periodic updates
              if (this.isOnlineHost) {
                this.onlinePlayerManager.untrackEnemy(enemyId)
              }
            }

            // Death animation
              enemySprite.setVelocity(0, 0)
              const deadTexture = `${enemyType}_dead`
              if (this.textures.exists(deadTexture)) {
                enemySprite.setTexture(deadTexture)
              }
              enemySprite.setTint(0xff0000)

              // Fade out and sink down
              this.tweens.add({
                targets: enemySprite,
                alpha: 0,
                y: enemySprite.y + 20,
                scaleX: scale * 1.2,
                scaleY: scale * 0.8,
                duration: 500,
                onComplete: () => {
                  enemySprite.destroy()
                }
              })

              // Respawn after 20 seconds only if location is ahead of player's progress
              // In online mode, only HOST respawns enemies
              if (!this.isOnlineMode || this.isOnlineHost) {
                this.time.delayedCall(20000, () => {
                  // Don't respawn if player has already passed this area
                  if (spawnX < this.farthestPlayerX - 500) {
                    return // Skip respawn in explored areas
                  }

                  const difficultyMultiplier = this.gameMode === 'endless'
                    ? 1 + Math.floor(this.player.x / 5000) * 0.2
                    : 1 + (this.currentLevel - 1) * 0.3
                  this.spawnRandomEnemy(spawnX, spawnY, difficultyMultiplier)
                })
              }
            }
          }
        })

        // Check if boss is in melee range
        if (this.boss && this.boss.active && this.bossActive) {
          const distance = Phaser.Math.Distance.Between(meleeX, meleeY, this.boss.x, this.boss.y)

          if (distance < 150) { // Boss is bigger, larger melee range
            // Damage boss (20 damage for melee on boss)
            let bossHealth = this.boss.getData('health')
            bossHealth -= 20
            this.boss.setData('health', bossHealth)

            // Visual feedback
            this.boss.setTint(0xff0000)
            this.time.delayedCall(100, () => {
              if (this.boss && this.boss.active) {
                this.boss.clearTint()
              }
            })

            // Knockback
            const knockbackForce = 200
            this.boss.setVelocityX(meleeDirection * knockbackForce)

            // Check if boss defeated
            if (bossHealth <= 0) {
              this.defeatBoss()
            }
          }
        }

        // Flash gun sprite for visual feedback
        this.gun.setTint(0xffffff)
        this.time.delayedCall(100, () => {
          this.gun.clearTint()
        })

        // Play melee sound
        this.audioManager.playMeleeSound()
      } else {
        // Ranged weapons: shoot bullets
        // Play shoot sound
        this.audioManager.playShootSound()

        // Calculate gun tip position at the moment of firing
        const gunLength = 40 // Length from gun origin to tip
        const gunAngle = this.gun.rotation
        const bulletStartX = this.gun.x + Math.cos(gunAngle) * gunLength
        const bulletStartY = this.gun.y + Math.sin(gunAngle) * gunLength

        // Choose bullet texture based on weapon
        let bulletTexture = 'laserBlue'
        let isRocket = false
        let damage = 1

        if (this.equippedWeapon === 'laserGun') {
          bulletTexture = 'laserGreen'
          damage = WEAPON_CONFIGS.laserGun.damage
        } else if (this.equippedWeapon === 'bazooka') {
          bulletTexture = 'rocket'
          isRocket = true
          damage = WEAPON_CONFIGS.bazooka.damage
        } else if (this.equippedWeapon === 'lfg') {
          bulletTexture = 'lfgProjectile'
          damage = WEAPON_CONFIGS.lfg.damage
        } else if (this.equippedWeapon === 'raygun') {
          damage = WEAPON_CONFIGS.raygun.damage
        }

        // Create bullet at gun mouth
        const bullet = this.bullets.get(bulletStartX, bulletStartY, bulletTexture)

        if (bullet) {
          bullet.setActive(true)
          bullet.setVisible(true)
          bullet.setScale(0.5, 0.5)
          bullet.setRotation(gunAngle)
          bullet.setAlpha(1)
          bullet.setData('isRocket', isRocket)
          bullet.setData('damage', damage)

          // Disable physics for this bullet - use data to track movement
          bullet.body!.setEnable(false)

          // Store bullet direction and speed locked at time of firing
          const velocityX = Math.cos(gunAngle) * bulletSpeed
          const velocityY = Math.sin(gunAngle) * bulletSpeed
          bullet.setData('velocityX', velocityX)
          bullet.setData('velocityY', velocityY)
          bullet.setData('createdTime', currentTime)
          bullet.setData('initialScaleX', 0.5)
          bullet.setData('angle', gunAngle)
          
          // Notify online partner of bullet creation
          if (this.isOnlineMode && this.onlinePlayerManager) {
            this.onlinePlayerManager.sendAction('shoot', {
              x: bulletStartX,
              y: bulletStartY,
              velocityX,
              velocityY,
              weapon: this.equippedWeapon,
              angle: gunAngle
            })
          }
        }
      }
    }
  }

  private isOnSpikes(x: number, y: number): boolean {
    for (const spike of this.spikePositions) {
      if (x >= spike.x && x <= spike.x + spike.width &&
        Math.abs(y - spike.y) < 100) {
        return true
      }
    }
    return false
  }

  private checkSpikeCollision() {
    if (this.playerIsDead) return

    // Check if player's feet (bottom) touch spike tips (top)
    const playerBottom = this.player.y + (this.player.height / 2)
    const playerLeft = this.player.x - (this.player.width / 4)
    const playerRight = this.player.x + (this.player.width / 4)

    // Check if player has invincibility frames
    const lastHitTime = this.player.getData('lastHitTime') || 0
    const currentTime = this.time.now
    const invincibilityDuration = 1000 // 1 second of invincibility

    if (currentTime - lastHitTime < invincibilityDuration) {
      return // Player is still invincible
    }

    this.spikes.children.entries.forEach((spike: any) => {
      const spikeSprite = spike as Phaser.Physics.Arcade.Sprite
      const spikeTop = spikeSprite.y - (spikeSprite.height / 2) + 10 // Only top 10px are dangerous
      const spikeLeft = spikeSprite.x - (spikeSprite.width / 2)
      const spikeRight = spikeSprite.x + (spikeSprite.width / 2)

      // Check if player's feet overlap with spike tips
      if (playerBottom >= spikeTop && playerBottom <= spikeTop + 20 &&
        playerRight >= spikeLeft && playerLeft <= spikeRight) {

        // Debug mode god mode - no damage
        if (this.debugMode) {
          return
        }

        // Player takes damage
        this.playerHealth -= 15
        this.player.setData('lastHitTime', currentTime)

        // Check if player died
        if (this.playerHealth <= 0) {
          this.playerHealth = 0
          this.handlePlayerDeath()
          return
        }

        // Flash player red
        this.player.setTint(0xff0000)
        this.time.delayedCall(100, () => {
          this.player.setTint(0xffffff)
          this.time.delayedCall(100, () => {
            this.player.setTint(0xff0000)
            this.time.delayedCall(100, () => {
              this.player.setTint(0xffffff)
            })
          })
        })

        // Knockback effect
        this.player.setVelocityY(-300)

        // Screen shake effect
        this.cameras.main.shake(100, 0.005)
      }
    })
  }

  private handlePlayer2GunAndShooting() {
    if (!this.isCoopMode || !this.player2 || !this.gun2) return

    // Get gamepad 2
    const gamepads = this.input.gamepad?.gamepads || []
    const gamepad2 = gamepads.length > 1 ? gamepads[1] : null
    if (!gamepad2) return

    // Aim with right stick
    const rightStickX = gamepad2.rightStick.x
    const rightStickY = gamepad2.rightStick.y
    const stickMagnitude = Math.sqrt(rightStickX * rightStickX + rightStickY * rightStickY)

    let aimX: number
    let aimY: number

    if (stickMagnitude > 0.3) {
      // Use right stick for aiming
      const aimAngle = Math.atan2(rightStickY, rightStickX)
      const aimDistance = 120 // Reduced for more precise aiming
      aimX = this.player2.x + Math.cos(aimAngle) * aimDistance
      aimY = this.player2.y + Math.sin(aimAngle) * aimDistance
    } else {
      // Aim forward based on facing direction
      aimX = this.player2.x + (this.player2.flipX ? -100 : 100)
      aimY = this.player2.y
    }

    // Update gun position and rotation
    const angleToPointer = Phaser.Math.Angle.Between(this.player2.x, this.player2.y, aimX, aimY)
    const gunDistance = 20
    this.gun2.x = this.player2.x + Math.cos(angleToPointer) * gunDistance
    this.gun2.y = this.player2.y + Math.sin(angleToPointer) * gunDistance
    this.gun2.setRotation(angleToPointer)

    if (aimX < this.player2.x) {
      this.gun2.setFlipY(true)
    } else {
      this.gun2.setFlipY(false)
    }

    // Shooting with RT (R2) button
    const shootPressed = gamepad2.R2 > 0.5 || (gamepad2.buttons[5] && gamepad2.buttons[5].pressed)
    const fireRate = this.equippedWeapon === 'raygun' ? 200 : 500
    const lastShotTime = this.player2.getData('lastShotTime') || 0
    const currentTime = this.time.now

    if (shootPressed && currentTime - lastShotTime > fireRate) {
      // Match Player 1 bullet creation logic
      const gunLength = 40
      const gunAngle = this.gun2.rotation
      const bulletStartX = this.gun2.x + Math.cos(gunAngle) * gunLength
      const bulletStartY = this.gun2.y + Math.sin(gunAngle) * gunLength

      // Choose bullet texture based on weapon (same as Player 1)
      let bulletTexture = 'laserBlue'
      let isRocket = false
      if (this.equippedWeapon === 'laserGun') {
        bulletTexture = 'laserGreen'
      } else if (this.equippedWeapon === 'bazooka') {
        bulletTexture = 'rocket'
        isRocket = true
      }

      const bulletSpeed = isRocket ? 500 : 800
      const bullet = this.bullets2.get(bulletStartX, bulletStartY, bulletTexture)

      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setScale(0.5, 0.5)
        bullet.setRotation(gunAngle)
        bullet.setAlpha(1)
        bullet.setData('isRocket', isRocket)

        // Disable physics for this bullet - use data to track movement (same as Player 1)
        bullet.body!.setEnable(false)

        // Store bullet direction and speed locked at time of firing
        bullet.setData('velocityX', Math.cos(gunAngle) * bulletSpeed)
        bullet.setData('velocityY', Math.sin(gunAngle) * bulletSpeed)
        bullet.setData('createdTime', currentTime)
        bullet.setData('initialScaleX', 0.5)
        bullet.setData('angle', gunAngle)

        this.audioManager.playShootSound()
        this.player2.setData('lastShotTime', currentTime)
      }
    }
  }

  private updateBullets() {
    const currentTime = this.time.now
    const bulletLifetime = 3000 // 3 seconds
    const fadeStartTime = 2500 // Start fading at 2.5 seconds

    // Update Player 1 bullets
    this.bullets.children.entries.forEach((bullet: any) => {
      if (!bullet.active) return

      const sprite = bullet as Phaser.Physics.Arcade.Sprite
      const createdTime = sprite.getData('createdTime')
      const age = currentTime - createdTime

      // Move bullet manually using delta time
      const velX = sprite.getData('velocityX')
      const velY = sprite.getData('velocityY')
      const delta = this.game.loop.delta / 1000 // Convert to seconds
      sprite.x += velX * delta
      sprite.y += velY * delta

      // Keep rotation locked to firing angle (no slanting)
      const lockedAngle = sprite.getData('angle')
      sprite.setRotation(lockedAngle)

      // Manual collision detection with enemies
      this.enemies.children.entries.forEach((enemy: any) => {
        if (!enemy.active) return
        const enemySprite = enemy as Phaser.Physics.Arcade.Sprite
        const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, enemySprite.x, enemySprite.y)

        if (distance < 30) { // Collision threshold
          this.handleBulletEnemyCollision(sprite, enemySprite)
        }
      })

      // Manual collision detection with boss
      if (this.boss && this.boss.active && this.bossActive) {
        const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.boss.x, this.boss.y)

        if (distance < 100) { // Boss is bigger, larger collision threshold
          this.handleBulletBossCollision(sprite, this.boss)
        }
      }

      // After 2.5 seconds, start shrinking and fading
      if (age >= fadeStartTime) {
        const fadeProgress = (age - fadeStartTime) / (bulletLifetime - fadeStartTime)
        sprite.setAlpha(1 - fadeProgress)
        sprite.setScale(sprite.getData('initialScaleX') * (1 - fadeProgress * 0.7), 0.5)
      }

      // Destroy after lifetime
      if (age >= bulletLifetime) {
        // Rockets explode at end of lifetime
        const isRocket = sprite.getData('isRocket')
        if (isRocket) {
          this.createExplosion(sprite.x, sprite.y)
        }

        sprite.setActive(false)
        sprite.setVisible(false)
      }
    })

    // Update Player 2 bullets (if in co-op mode)
    if (this.isCoopMode && this.bullets2) {
      this.bullets2.children.entries.forEach((bullet: any) => {
        if (!bullet.active) return

        const sprite = bullet as Phaser.Physics.Arcade.Sprite
        const createdTime = sprite.getData('createdTime')
        const age = currentTime - createdTime

        // Move bullet manually using delta time
        const velX = sprite.getData('velocityX')
        const velY = sprite.getData('velocityY')
        const delta = this.game.loop.delta / 1000 // Convert to seconds
        sprite.x += velX * delta
        sprite.y += velY * delta

        // Keep rotation locked to firing angle
        const lockedAngle = sprite.getData('angle')
        sprite.setRotation(lockedAngle)

        // Manual collision detection with enemies
        this.enemies.children.entries.forEach((enemy: any) => {
          if (!enemy.active) return
          const enemySprite = enemy as Phaser.Physics.Arcade.Sprite
          const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, enemySprite.x, enemySprite.y)

          if (distance < 30) {
            this.handleBulletEnemyCollision(sprite, enemySprite)
          }
        })

        // Manual collision detection with boss
        if (this.boss && this.boss.active && this.bossActive) {
          const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.boss.x, this.boss.y)

          if (distance < 100) {
            this.handleBulletBossCollision(sprite, this.boss)
          }
        }

        // After 2.5 seconds, start shrinking and fading
        if (age >= fadeStartTime) {
          const fadeProgress = (age - fadeStartTime) / (bulletLifetime - fadeStartTime)
          sprite.setAlpha(1 - fadeProgress)
          sprite.setScale(sprite.getData('initialScaleX') * (1 - fadeProgress * 0.7), 0.5)
        }

        // Destroy after lifetime
        if (age >= bulletLifetime) {
          const isRocket = sprite.getData('isRocket')
          if (isRocket) {
            this.createExplosion(sprite.x, sprite.y)
          }

          sprite.setActive(false)
          sprite.setVisible(false)
        }
      })
    }
  }

  private handleBulletPlatformCollision(bullet: any) {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite
    const isRocket = bulletSprite.getData('isRocket')

    // If it's a rocket, create explosion
    if (isRocket) {
      this.createExplosion(bulletSprite.x, bulletSprite.y)
    }

    bulletSprite.setActive(false)
    bulletSprite.setVisible(false)
  }

  private handleBulletEnemyCollision(bullet: any, enemy: any) {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite

    const isRocket = bulletSprite.getData('isRocket')

    // If it's a rocket, create explosion
    if (isRocket) {
      this.createExplosion(bulletSprite.x, bulletSprite.y)
    }

    // Destroy bullet
    bulletSprite.setActive(false)
    bulletSprite.setVisible(false)

    // Damage enemy
    let health = enemySprite.getData('health')
    const damage = bulletSprite.getData('damage') || 1
    
    if (isRocket) {
      // Bazooka one-shots any non-boss enemy
      health = 0
    } else {
      health -= damage
    }
    
    enemySprite.setData('health', health)

    // Flash red to show damage
    enemySprite.clearTint() // Clear any existing tint first
    enemySprite.setTint(0xff0000)
    // Clear any existing tint timer
    const existingTimer = enemySprite.getData('tintTimer')
    if (existingTimer) existingTimer.remove()
    // Set new timer and store reference
    const tintTimer = this.time.delayedCall(100, () => {
      if (enemySprite && enemySprite.active) {
        enemySprite.clearTint()
      }
    })
    enemySprite.setData('tintTimer', tintTimer)

    // Check if enemy is dead
    if (health <= 0) {
      const spawnX = enemySprite.getData('spawnX')
      const spawnY = enemySprite.getData('spawnY')
      const enemyType = enemySprite.getData('enemyType')
      const coinReward = enemySprite.getData('coinReward')
      const scale = enemySprite.scaleX
      const enemyId = enemySprite.getData('enemyId')

      // Report kill to network (all players report their kills)
      if (this.isOnlineMode && this.onlinePlayerManager && enemyId) {
        this.onlinePlayerManager.reportEnemyKilled(enemyId)
        // Remove from remote tracking
        this.remoteEnemies.delete(enemyId)
      }

      // Drop coins
      this.dropCoins(enemySprite.x, enemySprite.y, coinReward)

      // Award score for defeating enemy
      this.enemiesDefeated++
      const enemySize = enemySprite.getData('enemySize')
      let scoreReward = 50 // small
      if (enemySize === 'medium') scoreReward = 100
      if (enemySize === 'large') scoreReward = 200
      this.updateScore(scoreReward)

      // Death animation
      if (enemySprite.body) {
        enemySprite.setVelocity(0, 0)
      }
      const deadTexture = `${enemyType}_dead`
      if (this.textures.exists(deadTexture)) {
        enemySprite.setTexture(deadTexture)
      }
      enemySprite.setTint(0xff0000)

      // Fade out and sink down
      this.tweens.add({
        targets: enemySprite,
        alpha: 0,
        y: enemySprite.y + 20,
        scaleX: scale * 1.2,
        scaleY: scale * 0.8,
        duration: 500,
        onComplete: () => {
          enemySprite.destroy()
        }
      })

      // Respawn after 20 seconds only if location is ahead of player's progress.
      // Only host should schedule respawns in online mode.
      this.time.delayedCall(20000, () => {
        // Don't respawn if player has already passed this area
        if (spawnX < this.farthestPlayerX - 500) {
          return // Skip respawn in explored areas
        }

        const difficultyMultiplier = this.gameMode === 'endless'
          ? 1 + Math.floor(this.player.x / 5000) * 0.2
          : 1 + (this.currentLevel - 1) * 0.3
        if (!this.isOnlineMode) {
          // Offline/single player - spawn locally
          this.spawnRandomEnemy(spawnX, spawnY, difficultyMultiplier)
        }
      })
    }
  }


  private createBlackholeBackground() {
    // Create multiple blackholes in the background with parallax effect
    const blackholePositions = [
      { x: 400, y: 200, scale: 1.0, scrollFactor: 0.05 },
      { x: 2800, y: 250, scale: 0.8, scrollFactor: 0.08 },
      { x: 6000, y: 180, scale: 1.2, scrollFactor: 0.06 },
      { x: 9500, y: 220, scale: 0.9, scrollFactor: 0.07 }
    ]

    blackholePositions.forEach((pos) => {
      // Create the blackhole core (event horizon)
      const core = this.add.circle(pos.x, pos.y, 40 * pos.scale, 0x000000, 1)
      core.setScrollFactor(pos.scrollFactor)
      core.setDepth(-100)

      // Create the inner shadow/gradient ring
      const innerRing = this.add.circle(pos.x, pos.y, 60 * pos.scale, 0x1a0a2e, 0.9)
      innerRing.setScrollFactor(pos.scrollFactor)
      innerRing.setDepth(-99)

      // Create accretion disk rings (multiple layers for depth)
      const diskLayers = [
        { radius: 80, color: 0x8b2ff4, alpha: 0.6 },
        { radius: 100, color: 0x6b1fd4, alpha: 0.5 },
        { radius: 120, color: 0x4a0fb4, alpha: 0.4 },
        { radius: 140, color: 0x2a0594, alpha: 0.3 },
        { radius: 160, color: 0x1a0474, alpha: 0.2 }
      ]

      diskLayers.forEach(layer => {
        const ring = this.add.circle(pos.x, pos.y, layer.radius * pos.scale, layer.color, layer.alpha)
        ring.setScrollFactor(pos.scrollFactor)
        ring.setDepth(-98)

        // Add rotation animation to disk
        this.tweens.add({
          targets: ring,
          angle: 360,
          duration: 20000 - (layer.radius * 50), // Inner rings rotate faster
          repeat: -1,
          ease: 'Linear'
        })
      })

      // Create gravitational lensing effect using graphics
      const graphics = this.add.graphics()
      graphics.setScrollFactor(pos.scrollFactor)
      graphics.setDepth(-97)

      // Draw light distortion rings
      for (let i = 0; i < 5; i++) {
        const radius = 180 + (i * 30)
        graphics.lineStyle(2 - (i * 0.3), 0xff6b2f, 0.15 - (i * 0.02))
        graphics.strokeCircle(pos.x, pos.y, radius * pos.scale)
      }

      // Create particle emitter for matter being pulled in
      const particles = this.add.particles(pos.x, pos.y, 'particle', {
        speed: { min: 20, max: 50 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 3000,
        frequency: 100,
        angle: { min: 0, max: 360 },
        tint: [0x8b2ff4, 0x6b1fd4, 0xff6b2f, 0xffa500],
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 200 * pos.scale),
          quantity: 48
        },
        moveToX: pos.x,
        moveToY: pos.y
      })
      particles.setScrollFactor(pos.scrollFactor)
      particles.setDepth(-96)

      // Add pulsing glow effect to core
      this.tweens.add({
        targets: [core, innerRing],
        alpha: 0.7,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // Add some energy jets shooting out from poles (like a real blackhole)
      const jetGraphics = this.add.graphics()
      jetGraphics.setScrollFactor(pos.scrollFactor)
      jetGraphics.setDepth(-95)

      // Top jet
      jetGraphics.fillStyle(0x4a88ff, 0.3)
      jetGraphics.fillRect(pos.x - 10 * pos.scale, pos.y - 200 * pos.scale, 20 * pos.scale, 160 * pos.scale)
      jetGraphics.fillStyle(0x88bbff, 0.4)
      jetGraphics.fillRect(pos.x - 6 * pos.scale, pos.y - 200 * pos.scale, 12 * pos.scale, 160 * pos.scale)

      // Bottom jet
      jetGraphics.fillStyle(0x4a88ff, 0.3)
      jetGraphics.fillRect(pos.x - 10 * pos.scale, pos.y + 40 * pos.scale, 20 * pos.scale, 160 * pos.scale)
      jetGraphics.fillStyle(0x88bbff, 0.4)
      jetGraphics.fillRect(pos.x - 6 * pos.scale, pos.y + 40 * pos.scale, 12 * pos.scale, 160 * pos.scale)

      // Animate jet intensity
      this.tweens.add({
        targets: jetGraphics,
        alpha: 0.5,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    })
  }

  private createFallbackTextures() {
    // Create fallback textures for any assets that failed to load
    const missingTextures = [
      // Check if essential textures exist, if not create transparent or minimal fallbacks
      'alienBeige_stand', 'alienBeige_walk1', 'alienBeige_walk2', 'alienBeige_jump',
      'alienBlue_stand', 'alienGreen_stand', 'alienPink_stand', 'alienYellow_stand',
      'fly', 'bee', 'slimeGreen', 'slimeBlue', 'wormGreen', 'wormPink',
      'beam', 'beamBolts', 'metalCenter', 'metalLeft', 'metalMid', 'metalRight',
      'metalPlatform', 'stoneCaveTop', 'homeIcon'
    ]

    missingTextures.forEach(key => {
      if (!this.textures.exists(key)) {
        console.warn(`Creating fallback texture for: ${key}`)
        const graphics = this.make.graphics({ x: 0, y: 0 })

        // Create completely transparent fallback texture
        graphics.fillStyle(0x000000, 0) // Fully transparent
        graphics.fillRect(0, 0, 70, 70)
        graphics.generateTexture(key, 70, 70)
        graphics.destroy()
      }
    })
  }

  private createProceduralTextures() {
    // Create Speed Power-up (Yellow Lightning Bolt) - only if not already loaded
    if (!this.textures.exists('powerSpeed')) {
      const speedGraphics = this.make.graphics({ x: 0, y: 0 })
      speedGraphics.fillStyle(0xffff00, 1)
      speedGraphics.fillCircle(32, 32, 28)
      speedGraphics.fillStyle(0xffaa00, 1)
      speedGraphics.fillCircle(32, 32, 22)
      // Lightning bolt shape
      speedGraphics.fillStyle(0xffffff, 1)
      speedGraphics.beginPath()
      speedGraphics.moveTo(32, 12)
      speedGraphics.lineTo(28, 32)
      speedGraphics.lineTo(36, 32)
      speedGraphics.lineTo(32, 52)
      speedGraphics.lineTo(36, 32)
      speedGraphics.lineTo(28, 32)
      speedGraphics.closePath()
      speedGraphics.fillPath()
      speedGraphics.generateTexture('powerSpeed', 64, 64)
      speedGraphics.destroy()
    }

    // Create Shield Power-up (Blue Shield) - only if not already loaded
    if (!this.textures.exists('powerShield')) {
      const shieldGraphics = this.make.graphics({ x: 0, y: 0 })
      shieldGraphics.fillStyle(0x00aaff, 1)
      shieldGraphics.fillCircle(32, 32, 28)
      shieldGraphics.fillStyle(0x0088dd, 1)
      shieldGraphics.fillCircle(32, 32, 22)
      // Shield emblem
      shieldGraphics.lineStyle(4, 0xffffff, 1)
      shieldGraphics.strokeCircle(32, 32, 14)
      shieldGraphics.beginPath()
      shieldGraphics.moveTo(32, 20)
      shieldGraphics.lineTo(32, 44)
      shieldGraphics.moveTo(20, 32)
      shieldGraphics.lineTo(44, 32)
      shieldGraphics.strokePath()
      shieldGraphics.generateTexture('powerShield', 64, 64)
      shieldGraphics.destroy()
    }

    // Create Life Power-up (Green Heart) - only if not already loaded
    if (!this.textures.exists('powerLife')) {
      const lifeGraphics = this.make.graphics({ x: 0, y: 0 })
      lifeGraphics.fillStyle(0x00ff00, 1)
      lifeGraphics.fillCircle(32, 32, 28)
      lifeGraphics.fillStyle(0x00cc00, 1)
      lifeGraphics.fillCircle(32, 32, 22)
      // Heart shape using circles
      lifeGraphics.fillStyle(0xff0066, 1)
      lifeGraphics.fillCircle(26, 26, 6)
      lifeGraphics.fillCircle(38, 26, 6)
      lifeGraphics.beginPath()
      lifeGraphics.moveTo(20, 28)
      lifeGraphics.lineTo(32, 42)
      lifeGraphics.lineTo(44, 28)
      lifeGraphics.lineTo(38, 22)
      lifeGraphics.lineTo(32, 22)
      lifeGraphics.lineTo(26, 22)
      lifeGraphics.lineTo(20, 28)
      lifeGraphics.closePath()
      lifeGraphics.fillPath()
      lifeGraphics.generateTexture('powerLife', 64, 64)
      lifeGraphics.destroy()
    }

    // Create Health Power-up (Red Heart/Potion) - only if not already loaded
    if (!this.textures.exists('powerHealth')) {
      const healthGraphics = this.make.graphics({ x: 0, y: 0 })
      healthGraphics.fillStyle(0xff4444, 1)
      healthGraphics.fillCircle(32, 32, 28)
      healthGraphics.fillStyle(0xcc2222, 1)
      healthGraphics.fillCircle(32, 32, 22)
      // Cross/plus symbol for health
      healthGraphics.fillStyle(0xffffff, 1)
      healthGraphics.fillRect(26, 18, 12, 28) // Vertical bar
      healthGraphics.fillRect(18, 26, 28, 12) // Horizontal bar
      healthGraphics.generateTexture('powerHealth', 64, 64)
      healthGraphics.destroy()
    }

    // Create Coin (Gold Circle with shine) - only if not already loaded
    if (!this.textures.exists('coin')) {
      const coinGraphics = this.make.graphics({ x: 0, y: 0 })
      coinGraphics.fillStyle(0xffd700, 1)
      coinGraphics.fillCircle(32, 32, 24)
      coinGraphics.fillStyle(0xffaa00, 1)
      coinGraphics.fillCircle(32, 32, 20)
      coinGraphics.fillStyle(0xffd700, 1)
      coinGraphics.fillCircle(32, 32, 16)
      // Shine effect
      coinGraphics.fillStyle(0xffff00, 0.8)
      coinGraphics.fillCircle(26, 26, 6)
      coinGraphics.generateTexture('coin', 64, 64)
      coinGraphics.destroy()
    }

    // Create Particle (Small star burst)
    const particleGraphics = this.make.graphics({ x: 0, y: 0 })
    particleGraphics.fillStyle(0xffffff, 1)
    particleGraphics.beginPath()
    particleGraphics.moveTo(8, 4)
    particleGraphics.lineTo(10, 8)
    particleGraphics.lineTo(12, 4)
    particleGraphics.lineTo(10, 10)
    particleGraphics.lineTo(12, 12)
    particleGraphics.lineTo(8, 10)
    particleGraphics.lineTo(4, 12)
    particleGraphics.lineTo(6, 8)
    particleGraphics.lineTo(4, 4)
    particleGraphics.lineTo(8, 6)
    particleGraphics.closePath()
    particleGraphics.fillPath()
    particleGraphics.generateTexture('particle', 16, 16)
    particleGraphics.destroy()

    // Create Laser Bullet (Blue beam)
    const laserGraphics = this.make.graphics({ x: 0, y: 0 })
    laserGraphics.fillStyle(0x00aaff, 1)
    laserGraphics.fillRect(0, 6, 32, 4)
    laserGraphics.fillStyle(0x00ffff, 1)
    laserGraphics.fillRect(2, 7, 28, 2)
    laserGraphics.generateTexture('laserBlue', 32, 16)
    laserGraphics.destroy()

    // Create Laser Bullet (Green beam for laser gun)
    const laserGreenGraphics = this.make.graphics({ x: 0, y: 0 })
    laserGreenGraphics.fillStyle(0x00aa00, 1)
    laserGreenGraphics.fillRect(0, 6, 32, 4)
    laserGreenGraphics.fillStyle(0x00ff00, 1)
    laserGreenGraphics.fillRect(2, 7, 28, 2)
    laserGreenGraphics.generateTexture('laserGreen', 32, 16)
    laserGreenGraphics.destroy()

    // Create Raygun (Blue pistol shape)
    const raygunGraphics = this.make.graphics({ x: 0, y: 0 })
    raygunGraphics.fillStyle(0x0088dd, 1)
    raygunGraphics.fillRect(8, 14, 24, 8)
    raygunGraphics.fillRect(28, 10, 12, 16)
    raygunGraphics.fillStyle(0x00aaff, 1)
    raygunGraphics.fillRect(10, 16, 20, 4)
    raygunGraphics.fillRect(30, 12, 8, 12)
    raygunGraphics.fillStyle(0x00ffff, 1)
    raygunGraphics.fillCircle(38, 18, 3)
    raygunGraphics.generateTexture('raygun', 48, 36)
    raygunGraphics.destroy()

    // Create Laser Gun (Green rapid-fire weapon - matching shop design)
    const laserGunGraphics = this.make.graphics({ x: 0, y: 0 })
    // Scale down the shop design to fit 48x36
    laserGunGraphics.fillStyle(0x00ff00, 1)
    laserGunGraphics.fillRect(6, 14, 30, 9) // Barrel
    laserGunGraphics.fillRect(3, 16, 6, 6) // Tip
    laserGunGraphics.fillRect(33, 11, 9, 15) // Handle
    laserGunGraphics.fillRect(36, 26, 6, 6) // Grip
    // Energy core (cyan glow)
    laserGunGraphics.fillStyle(0x00ffff, 1)
    laserGunGraphics.fillCircle(36, 18, 3)
    laserGunGraphics.generateTexture('laserGun', 48, 36)
    laserGunGraphics.destroy()

    // Create Bazooka (Large orange/red rocket launcher - matching shop design)
    const bazookaGraphics = this.make.graphics({ x: 0, y: 0 })
    // Brown/orange bazooka body
    bazookaGraphics.fillStyle(0x884400, 1)
    bazookaGraphics.fillRect(6, 12, 33, 11) // Main tube
    // Barrel opening
    bazookaGraphics.fillStyle(0x663300, 1)
    bazookaGraphics.fillCircle(6, 17, 6)
    // Handle
    bazookaGraphics.fillRect(30, 20, 6, 11)
    // Details
    bazookaGraphics.fillStyle(0xff6600, 1)
    bazookaGraphics.fillRect(9, 14, 27, 7)
    // Scope
    bazookaGraphics.fillStyle(0x00ffff, 1)
    bazookaGraphics.fillCircle(21, 10, 2)
    bazookaGraphics.generateTexture('bazooka', 48, 36)
    bazookaGraphics.destroy()

    // Create Rocket projectile (for bazooka)
    const rocketGraphics = this.make.graphics({ x: 0, y: 0 })
    rocketGraphics.fillStyle(0xff4400, 1)
    rocketGraphics.fillRect(0, 4, 20, 8)
    rocketGraphics.fillStyle(0xff6600, 1)
    rocketGraphics.beginPath()
    rocketGraphics.moveTo(20, 8)
    rocketGraphics.lineTo(26, 8)
    rocketGraphics.lineTo(23, 4)
    rocketGraphics.closePath()
    rocketGraphics.fillPath()
    rocketGraphics.generateTexture('rocket', 26, 16)
    rocketGraphics.destroy()

    // Create LFG Projectile (Large Red/Gold Beam)
    const lfgProjGraphics = this.make.graphics({ x: 0, y: 0 })
    // Core beam
    lfgProjGraphics.fillStyle(0xff0000, 1)
    lfgProjGraphics.fillRect(0, 4, 48, 8)
    // Inner core
    lfgProjGraphics.fillStyle(0xffffff, 1)
    lfgProjGraphics.fillRect(0, 6, 48, 4)
    // Energy aura
    lfgProjGraphics.lineStyle(2, 0xFFD700, 0.8)
    lfgProjGraphics.strokeRect(0, 4, 48, 8)
    lfgProjGraphics.generateTexture('lfgProjectile', 48, 16)
    lfgProjGraphics.destroy()

    // Create LFG Weapon (Heavy Machine Gun - matching shop design)
    const lfgGraphics = this.make.graphics({ x: 0, y: 0 })
    // Heavy machine gun body
    lfgGraphics.fillStyle(0x222222, 1)
    lfgGraphics.fillRect(3, 11, 36, 15) // Main body
    // Barrels (Minigun style)
    lfgGraphics.fillStyle(0x444444, 1)
    lfgGraphics.fillRect(39, 13, 9, 3)
    lfgGraphics.fillRect(39, 17, 9, 3)
    lfgGraphics.fillRect(39, 21, 9, 3)
    // Ammo box
    lfgGraphics.fillStyle(0x004400, 1)
    lfgGraphics.fillRect(15, 26, 12, 9)
    // Gold trim
    lfgGraphics.lineStyle(1, 0xFFD700)
    lfgGraphics.strokeRect(3, 11, 36, 15)
    lfgGraphics.generateTexture('lfg', 48, 36)
    lfgGraphics.destroy()
    rocketGraphics.beginPath()
    rocketGraphics.moveTo(20, 8)
    rocketGraphics.lineTo(26, 8)
    rocketGraphics.lineTo(23, 12)
    rocketGraphics.closePath()
    rocketGraphics.fillPath()
    rocketGraphics.generateTexture('rocket', 28, 16)
    rocketGraphics.destroy()

    // Create Sword (Purple energy blade - matching shop style)
    const swordGraphics = this.make.graphics({ x: 0, y: 0 })

    // Purple energy blade
    swordGraphics.fillStyle(0xff00ff, 1)
    swordGraphics.fillRect(12, 10, 6, 20) // Main blade
    // Blade tip (triangle)
    swordGraphics.beginPath()
    swordGraphics.moveTo(15, 6) // Tip point
    swordGraphics.lineTo(12, 10)
    swordGraphics.lineTo(18, 10)
    swordGraphics.closePath()
    swordGraphics.fillPath()

    // Bright glow/inner blade
    swordGraphics.fillStyle(0xffaaff, 0.8)
    swordGraphics.fillRect(13, 11, 4, 18)

    // Gray handle/hilt
    swordGraphics.fillStyle(0x888888, 1)
    swordGraphics.fillRect(14, 30, 2, 4) // Grip
    swordGraphics.fillRect(11, 29, 8, 2) // Guard

    swordGraphics.generateTexture('sword', 30, 36)
    swordGraphics.destroy()

    // Create Spikes (Red triangular spikes) - only if not already loaded
    if (!this.textures.exists('spikes')) {
      const spikesGraphics = this.make.graphics({ x: 0, y: 0 })
      spikesGraphics.fillStyle(0xff0000, 1)
      for (let i = 0; i < 4; i++) {
        const x = i * 18
        spikesGraphics.beginPath()
        spikesGraphics.moveTo(x, 32)
        spikesGraphics.lineTo(x + 9, 0)
        spikesGraphics.lineTo(x + 18, 32)
        spikesGraphics.closePath()
        spikesGraphics.fillPath()
      }
      spikesGraphics.fillStyle(0xcc0000, 1)
      for (let i = 0; i < 4; i++) {
        const x = i * 18
        spikesGraphics.beginPath()
        spikesGraphics.moveTo(x + 4, 32)
        spikesGraphics.lineTo(x + 9, 8)
        spikesGraphics.lineTo(x + 14, 32)
        spikesGraphics.closePath()
        spikesGraphics.fillPath()
      }
      spikesGraphics.generateTexture('spikes', 72, 32)
      spikesGraphics.destroy()
    }

    // Generate enemy textures
    this.generateEnemyTextures()
  }

  private generateEnemyTextures() {
    // Fly (small flying enemy)
    const flyG = this.add.graphics()
    flyG.fillStyle(0x000000, 1)
    flyG.fillCircle(16, 16, 8)
    flyG.fillStyle(0xaaaaaa, 0.5)
    flyG.fillEllipse(10, 16, 6, 3)
    flyG.fillEllipse(22, 16, 6, 3)
    flyG.generateTexture('fly', 32, 32)
    flyG.clear()
    flyG.fillStyle(0x000000, 1)
    flyG.fillCircle(16, 16, 8)
    flyG.fillStyle(0xaaaaaa, 0.5)
    flyG.fillEllipse(8, 12, 8, 4)
    flyG.fillEllipse(24, 12, 8, 4)
    flyG.generateTexture('fly_fly', 32, 32)
    flyG.destroy()

    // Bee (small flying enemy)
    const beeG = this.add.graphics()
    beeG.fillStyle(0xffcc00, 1)
    beeG.fillEllipse(16, 16, 12, 16)
    beeG.fillStyle(0x000000, 1)
    for (let i = 0; i < 3; i++) {
      beeG.fillRect(10, 10 + i * 6, 12, 2)
    }
    beeG.generateTexture('bee', 32, 32)
    beeG.clear()
    beeG.fillStyle(0xffcc00, 1)
    beeG.fillEllipse(16, 16, 12, 16)
    beeG.fillStyle(0x000000, 1)
    for (let i = 0; i < 3; i++) {
      beeG.fillRect(10, 10 + i * 6, 12, 2)
    }
    beeG.fillStyle(0xaaaaaa, 0.6)
    beeG.fillEllipse(8, 16, 10, 4)
    beeG.fillEllipse(24, 16, 10, 4)
    beeG.generateTexture('bee_fly', 32, 32)
    beeG.destroy()

    // Slime Green
    const slimeGreenG = this.add.graphics()
    slimeGreenG.fillStyle(0x00ff00, 1)
    slimeGreenG.fillEllipse(24, 28, 40, 24)
    slimeGreenG.fillStyle(0x88ff88, 0.7)
    slimeGreenG.fillCircle(18, 24, 6)
    slimeGreenG.fillCircle(30, 24, 6)
    slimeGreenG.generateTexture('slimeGreen', 48, 48)
    slimeGreenG.clear()
    slimeGreenG.fillStyle(0x00ff00, 1)
    slimeGreenG.fillEllipse(24, 30, 44, 20)
    slimeGreenG.fillStyle(0x88ff88, 0.7)
    slimeGreenG.fillCircle(16, 26, 6)
    slimeGreenG.fillCircle(32, 26, 6)
    slimeGreenG.generateTexture('slimeGreen_walk', 48, 48)
    slimeGreenG.destroy()

    // Slime Blue
    const slimeBlueG = this.add.graphics()
    slimeBlueG.fillStyle(0x0066ff, 1)
    slimeBlueG.fillEllipse(24, 28, 40, 24)
    slimeBlueG.fillStyle(0x6699ff, 0.7)
    slimeBlueG.fillCircle(18, 24, 6)
    slimeBlueG.fillCircle(30, 24, 6)
    slimeBlueG.generateTexture('slimeBlue', 48, 48)
    slimeBlueG.clear()
    slimeBlueG.fillStyle(0x0066ff, 1)
    slimeBlueG.fillEllipse(24, 30, 44, 20)
    slimeBlueG.fillStyle(0x6699ff, 0.7)
    slimeBlueG.fillCircle(16, 26, 6)
    slimeBlueG.fillCircle(32, 26, 6)
    slimeBlueG.generateTexture('slimeBlue_walk', 48, 48)
    slimeBlueG.destroy()

    // Worm Green
    const wormGreenG = this.add.graphics()
    wormGreenG.fillStyle(0x44ff44, 1)
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 12
      const y = 32 + Math.sin(i * 0.8) * 4
      wormGreenG.fillCircle(x, y, 10)
    }
    wormGreenG.fillStyle(0x000000, 1)
    wormGreenG.fillCircle(12, 28, 2)
    wormGreenG.fillCircle(16, 28, 2)
    wormGreenG.generateTexture('wormGreen', 64, 64)
    wormGreenG.clear()
    wormGreenG.fillStyle(0x44ff44, 1)
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 12
      const y = 32 + Math.sin(i * 0.8 + 0.5) * 6
      wormGreenG.fillCircle(x, y, 10)
    }
    wormGreenG.fillStyle(0x000000, 1)
    wormGreenG.fillCircle(12, 26, 2)
    wormGreenG.fillCircle(16, 26, 2)
    wormGreenG.generateTexture('wormGreen_walk', 64, 64)
    wormGreenG.destroy()

    // Worm Pink
    const wormPinkG = this.add.graphics()
    wormPinkG.fillStyle(0xff66cc, 1)
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 12
      const y = 32 + Math.sin(i * 0.8) * 4
      wormPinkG.fillCircle(x, y, 10)
    }
    wormPinkG.fillStyle(0x000000, 1)
    wormPinkG.fillCircle(12, 28, 2)
    wormPinkG.fillCircle(16, 28, 2)
    wormPinkG.generateTexture('wormPink', 64, 64)
    wormPinkG.clear()
    wormPinkG.fillStyle(0xff66cc, 1)
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 12
      const y = 32 + Math.sin(i * 0.8 + 0.5) * 6
      wormPinkG.fillCircle(x, y, 10)
    }
    wormPinkG.fillStyle(0x000000, 1)
    wormPinkG.fillCircle(12, 26, 2)
    wormPinkG.fillCircle(16, 26, 2)
    wormPinkG.generateTexture('wormPink_walk', 64, 64)
    wormPinkG.destroy()
  }

  private async submitScoreToBackend() {
    console.log('\n========================================')
    console.log('🎯 STARTING SCORE SUBMISSION')
    console.log('========================================')

    try {
      // Get player name from localStorage or use default
      const playerName = localStorage.getItem('player_name') || 'Player'
      console.log('Player Name:', playerName)

      const scoreData = {
        player_name: playerName,
        score: this.score,
        coins: this.coinCount,
        enemies_defeated: this.enemiesDefeated,
        distance: Math.floor(this.player.x / 70),
        level: this.currentLevel,
        game_mode: this.gameMode
      }

      console.log('📊 Score Data to Submit:')
      console.log(JSON.stringify(scoreData, null, 2))
      console.log('Backend URL: http://localhost:8000')
      console.log('\n⏳ Calling GameAPI.submitScore()...')

      const response = await GameAPI.submitScore(scoreData)

      console.log('✅ Score submitted successfully!')
      console.log('Response:', response)

      // Get rank
      console.log('\n⏳ Getting rank...')
      const rankData = await GameAPI.getScoreRank(this.score, this.gameMode)
      console.log('🏆 Your rank:', rankData.rank)
      console.log('========================================\n')

      return { success: true, rank: rankData.rank }
    } catch (error) {
      console.log('\n========================================')
      console.error('❌ FAILED TO SUBMIT SCORE')
      console.error('Error:', error)
      console.error('Error message:', (error as Error).message)
      console.error('Error stack:', (error as Error).stack)
      console.log('Note: Make sure backend is running at http://localhost:8000')
      console.log('Score saved locally in localStorage instead.')
      console.log('========================================\n')
      return { success: false, rank: null }
    }
  }

  /**
   * Get formatted lives text - includes player name in online mode
   */
  private getLivesText(): string {
    if (this.isOnlineMode) {
      const onlineService = OnlineCoopService.getInstance()
      const playerName = onlineService.playerName || 'Player'
      return `${playerName} - Lives: ${this.playerLives}`
    }
    return `Lives: ${this.playerLives}`
  }

  private updateScore(points: number) {
    this.score += points

    // Update score text (handle both single player and co-op)
    if (this.isCoopMode) {
      const p1ScoreText = this.children.getByName('p1ScoreText') as Phaser.GameObjects.Text
      if (p1ScoreText) p1ScoreText.setText(`Score: ${this.score}`)
    } else {
      this.scoreText.setText(`Score: ${this.score}`)
    }

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score
      if (!this.isCoopMode && this.highScoreText) {
        this.highScoreText.setText(`Best: ${this.highScore}`)
      }
      localStorage.setItem('jumpjump_highscore', this.highScore.toString())

      // Flash effect when breaking high score
      this.tweens.add({
        targets: this.highScoreText,
        scale: 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut'
      })
    }
  }

  private createDebugUI() {
    // Debug mode indicator
    this.debugText = this.add.text(16, 120, 'DEBUG MODE [F3]', {
      fontSize: '20px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    })
    this.debugText.setScrollFactor(0)
    this.debugText.setDepth(10000)
    this.debugText.setVisible(false)

    // FPS counter
    this.fpsText = this.add.text(16, 150, 'FPS: 60', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    })
    this.fpsText.setScrollFactor(0)
    this.fpsText.setDepth(10000)
    this.fpsText.setVisible(false)

    // Coordinates
    this.coordText = this.add.text(16, 180, 'X: 0, Y: 0', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    })
    this.coordText.setScrollFactor(0)
    this.coordText.setDepth(10000)
    this.coordText.setVisible(false)
  }

  private toggleDebugMode() {
    this.debugMode = !this.debugMode
    console.log('Debug mode toggled:', this.debugMode)

    // Toggle debug graphics and text
    if (this.debugMode) {
      this.physics.world.createDebugGraphic()
      this.debugText?.setVisible(true)
      this.fpsText?.setVisible(true)
      this.coordText?.setVisible(true)
      console.log('Debug mode enabled - showing physics bodies and debug info')
    } else {
      this.physics.world.debugGraphic?.clear()
      this.physics.world.debugGraphic?.destroy()
      this.debugText?.setVisible(false)
      this.fpsText?.setVisible(false)
      this.coordText?.setVisible(false)
      console.log('Debug mode disabled')
    }
  }

  private toggleAI() {
    this.aiEnabled = !this.aiEnabled
    this.mlAIEnabled = false // Disable ML AI if rule-based is enabled
    console.log('AI Player toggled:', this.aiEnabled ? 'ENABLED' : 'DISABLED')

    if (this.aiEnabled) {
      this.aiStatusText?.setText('🤖 RULE-BASED AI (Press P to disable)')
      this.aiStatusText?.setVisible(true)
      this.showTip('ai', 'Rule-based AI is controlling the player! Press P to take back control.')
    } else {
      this.aiStatusText?.setVisible(false)
      this.showTip('ai_off', 'You are now in control! Press P for AI, R to record, O for ML AI.')
    }
  }

  private toggleMLAI() {
    console.log('🔄 Toggling ML AI...')

    try {
      const modelInfo = this.mlAIPlayer.getModelInfo()
      console.log('📊 ML AI Status:', modelInfo)

      if (!this.mlAIPlayer.isModelTrained()) {
        this.showTip('ml_no_model', '⚠️ No ML model! Press R to record gameplay, then train from menu.')
        console.log('⚠️ Train ML model first! Record gameplay (R key) then train from menu.')
        console.log('Model status:', modelInfo)
        return
      }

      // Check if model was trained with enough data
      if (modelInfo.dataFrames < 100) {
        this.showTip('ml_insufficient_data', `⚠️ Only ${modelInfo.dataFrames} frames! Need 100+ for reliable AI. Record more and retrain.`)
        console.log('⚠️ Insufficient training data:', modelInfo)
        return
      }

      this.mlAIEnabled = !this.mlAIEnabled
      this.aiEnabled = false // Disable rule-based AI if ML is enabled

      if (this.mlAIEnabled) {
        console.log('🧠 ML AI ENABLED')
        console.log('Model info:', {
          epochs: modelInfo.epochs,
          trainingFrames: modelInfo.dataFrames,
          trainedAt: new Date(modelInfo.timestamp).toLocaleString()
        })
      } else {
        console.log('🧠 ML AI DISABLED')
      }
    } catch (error) {
      console.error('❌ Error toggling ML AI:', error)
      this.showTip('ml_error', '❌ ML AI error - check console for details')
      return
    }

    if (this.mlAIEnabled) {
      this.aiStatusText?.setText('🧠 ML AI PLAYING (Press O to disable)')
      this.aiStatusText?.setVisible(true)
      this.showTip('ml_ai', 'ML AI learned from YOUR gameplay! Press O to take back control.')
    } else {
      this.aiStatusText?.setVisible(false)
    }
  }

  // Recording removed - use DQN AI Training from menu instead

  // Public method to access ML AI for training from menu
  public getMLAIPlayer(): MLAIPlayer {
    return this.mlAIPlayer
  }

  // In-game chat for online mode
  private openInGameChat() {
    if (!this.isOnlineMode || this.chatInputActive) return
    
    this.chatInputActive = true
    
    // Pause player controls while typing
    // Create chat input container
    const gameCanvas = this.game.canvas
    const canvasRect = gameCanvas.getBoundingClientRect()
    
    this.chatContainer = document.createElement('div')
    this.chatContainer.style.position = 'absolute'
    this.chatContainer.style.left = `${canvasRect.left + 10}px`
    this.chatContainer.style.bottom = `${window.innerHeight - canvasRect.bottom + 10}px`
    this.chatContainer.style.zIndex = '1000'
    this.chatContainer.style.display = 'flex'
    this.chatContainer.style.alignItems = 'center'
    this.chatContainer.style.gap = '8px'
    
    const label = document.createElement('span')
    label.textContent = 'Chat:'
    label.style.color = '#ffffff'
    label.style.fontSize = '14px'
    label.style.fontFamily = 'Arial, sans-serif'
    label.style.textShadow = '1px 1px 2px #000'
    
    this.chatInputElement = document.createElement('input')
    this.chatInputElement.type = 'text'
    this.chatInputElement.placeholder = 'Type message...'
    this.chatInputElement.maxLength = 100
    this.chatInputElement.style.width = '250px'
    this.chatInputElement.style.padding = '6px 10px'
    this.chatInputElement.style.fontSize = '14px'
    this.chatInputElement.style.fontFamily = 'Arial, sans-serif'
    this.chatInputElement.style.border = '2px solid #4488ff'
    this.chatInputElement.style.borderRadius = '4px'
    this.chatInputElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    this.chatInputElement.style.color = '#ffffff'
    this.chatInputElement.style.outline = 'none'
    
    this.chatContainer.appendChild(label)
    this.chatContainer.appendChild(this.chatInputElement)
    document.body.appendChild(this.chatContainer)
    
    // Focus the input
    this.chatInputElement.focus()
    
    // Handle Enter to send, Escape to cancel
    this.chatInputElement.addEventListener('keydown', (e: KeyboardEvent) => {
      e.stopPropagation() // Prevent game from receiving key events
      
      if (e.key === 'Enter') {
        const message = this.chatInputElement?.value.trim()
        if (message && this.onlinePlayerManager) {
          // Send chat message via online service
          const onlineService = OnlineCoopService.getInstance()
          onlineService.sendChat(message)
        }
        this.closeInGameChat()
      } else if (e.key === 'Escape') {
        this.closeInGameChat()
      }
    })
    
    // Close on blur (clicking outside)
    this.chatInputElement.addEventListener('blur', () => {
      // Small delay to allow Enter key to be processed first
      setTimeout(() => {
        if (this.chatInputActive) {
          this.closeInGameChat()
        }
      }, 100)
    })
  }
  
  private closeInGameChat() {
    this.chatInputActive = false
    
    if (this.chatContainer && this.chatContainer.parentNode) {
      this.chatContainer.parentNode.removeChild(this.chatContainer)
    }
    this.chatContainer = null
    this.chatInputElement = null
    
    // Return focus to game canvas
    this.game.canvas.focus()
  }

  private updateDebugUI() {
    if (!this.debugMode) return

    // Update FPS
    const fps = Math.round(this.game.loop.actualFps)
    this.fpsText?.setText(`FPS: ${fps}`)

    // Update coordinates
    const x = Math.round(this.player.x)
    const y = Math.round(this.player.y)
    this.coordText?.setText(`X: ${x}, Y: ${y}`)
  }

  private showQuitConfirmation() {
    // Pause game physics
    this.physics.pause()

    // Create overlay
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7)
    overlay.setScrollFactor(0)
    overlay.setDepth(10000)

    // Create dialog box
    const dialog = this.add.rectangle(640, 360, 600, 300, 0x222222, 1)
    dialog.setScrollFactor(0)
    dialog.setDepth(10001)
    dialog.setStrokeStyle(4, 0xff0000)

    // Warning title
    const title = this.add.text(640, 260, '⚠️ WARNING ⚠️', {
      fontSize: '36px',
      color: '#ff0000',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    title.setScrollFactor(0)
    title.setDepth(10002)

    // Warning message
    const message = this.add.text(640, 330,
      this.gameMode === 'endless'
        ? 'Your endless run progress will be lost!\nAre you sure you want to quit?'
        : `You will have to restart Level ${this.currentLevel}!\nAre you sure you want to quit?`,
      {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8
      }
    )
    message.setOrigin(0.5)
    message.setScrollFactor(0)
    message.setDepth(10002)

    // Yes button (quit)
    const yesButton = this.add.rectangle(540, 440, 150, 50, 0xff0000)
    yesButton.setScrollFactor(0)
    yesButton.setDepth(10002)
    yesButton.setInteractive({ useHandCursor: true })
    yesButton.on('pointerover', () => yesButton.setFillStyle(0xff3333))
    yesButton.on('pointerout', () => yesButton.setFillStyle(0xff0000))
    yesButton.on('pointerdown', () => {
      // Save coins before returning to menu
      localStorage.setItem('playerCoins', this.coinCount.toString())

      // Submit score to backend before quitting
      console.log('🚪 Player quitting - submitting score...')
      this.submitScoreToBackend().then(() => {
        console.log('✅ Score submitted on quit')
      }).catch(err => {
        console.log('⚠️ Score submission failed on quit:', err)
      }).finally(() => {
        this.physics.resume()
        this.scene.start('MenuScene')
      })
    })

    const yesText = this.add.text(540, 440, 'YES, QUIT', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    yesText.setOrigin(0.5)
    yesText.setScrollFactor(0)
    yesText.setDepth(10003)

    // No button (continue)
    const noButton = this.add.rectangle(740, 440, 150, 50, 0x00aa00)
    noButton.setScrollFactor(0)
    noButton.setDepth(10002)
    noButton.setInteractive({ useHandCursor: true })
    noButton.on('pointerover', () => noButton.setFillStyle(0x00ff00))
    noButton.on('pointerout', () => noButton.setFillStyle(0x00aa00))
    noButton.on('pointerdown', () => {
      // Resume game
      this.physics.resume()
      overlay.destroy()
      dialog.destroy()
      title.destroy()
      message.destroy()
      yesButton.destroy()
      yesText.destroy()
      noButton.destroy()
      noText.destroy()
    })

    const noText = this.add.text(740, 440, 'NO, CONTINUE', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    noText.setOrigin(0.5)
    noText.setScrollFactor(0)
    noText.setDepth(10003)
  }

  private throwSwordBlade() {
    // Create spinning purple blade projectile
    const direction = this.player.flipX ? -1 : 1
    const blade = this.physics.add.sprite(
      this.player.x + (direction * 30),
      this.player.y,
      'sword'
    )
    blade.setScale(1.2)
    blade.setVelocityX(direction * 700)
    blade.setVelocityY(-50) // Slight upward arc
    blade.setTint(0xff00ff) // Purple glow
    blade.setDepth(10)

    // Spinning animation
    this.tweens.add({
      targets: blade,
      angle: direction * 720, // 2 full rotations
      duration: 1000,
      ease: 'Linear'
    })

    // Glowing trail effect
    const trail = this.add.particles(blade.x, blade.y, 'particle', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 300,
      frequency: 30,
      tint: 0xff00ff,
      follow: blade
    })

    // Check collision with enemies
    this.physics.add.overlap(blade, this.enemies, (_bladeObj: any, enemy: any) => {
      const enemySprite = enemy as Phaser.Physics.Arcade.Sprite

      // Damage enemy (15 damage - stronger than normal attack)
      let enemyHealth = enemySprite.getData('health') || 1
      enemyHealth -= 15
      enemySprite.setData('health', enemyHealth)

      // Visual feedback
      enemySprite.clearTint()
      enemySprite.setTint(0xff00ff)
      this.time.delayedCall(100, () => {
        if (enemySprite && enemySprite.active) {
          enemySprite.clearTint()
        }
      })

      // Strong knockback
      const knockbackDirection = blade.body!.velocity.x > 0 ? 1 : -1
      enemySprite.setVelocityX(knockbackDirection * 500)
      enemySprite.setVelocityY(-200)

      // Check if enemy died
      if (enemyHealth <= 0) {
        const coinReward = enemySprite.getData('coinReward')
        this.dropCoins(enemySprite.x, enemySprite.y, coinReward)

        this.enemiesDefeated++
        const enemySize = enemySprite.getData('enemySize')
        let scoreReward = 50
        if (enemySize === 'medium') scoreReward = 100
        if (enemySize === 'large') scoreReward = 200
        this.updateScore(scoreReward)

        enemySprite.setVelocity(0, 0)
        enemySprite.setTint(0xff00ff)

        this.tweens.add({
          targets: enemySprite,
          alpha: 0,
          y: enemySprite.y + 20,
          duration: 500,
          onComplete: () => enemySprite.destroy()
        })
      }
    })

    // Destroy blade after 2 seconds or when off screen
    this.time.delayedCall(2000, () => {
      if (blade.active) {
        trail.destroy()
        blade.destroy()
      }
    })

    // Also destroy if too far off screen
    const checkBounds = () => {
      if (Math.abs(blade.x - this.player.x) > 1000) {
        trail.destroy()
        blade.destroy()
      }
    }
    this.time.addEvent({
      delay: 100,
      callback: checkBounds,
      repeat: 20
    })
  }

  /**
   * Set AI action for DQN training
   * Allows DQN agent to control the player
   */
  setAIAction(action: { moveLeft: boolean; moveRight: boolean; jump: boolean; shoot: boolean }) {
    if (!this.player || !this.player.body) return

    const speed = this.hasSpeedBoost ? 300 : 200
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const onGround = body.touching.down

    // Reset velocity
    body.setVelocityX(0)

    // Apply horizontal movement
    if (action.moveLeft) {
      body.setVelocityX(-speed)
      this.player.setFlipX(true)
    } else if (action.moveRight) {
      body.setVelocityX(speed)
      this.player.setFlipX(false)
    }

    // Apply jump
    if (action.jump && onGround) {
      body.setVelocityY(-500)
      this.audioManager.playJumpSound(false)
      this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
      this.canDoubleJump = true
      this.hasDoubleJumped = false
    } else if (action.jump && !onGround && this.canDoubleJump && !this.hasDoubleJumped) {
      // Double jump
      body.setVelocityY(-500)
      this.audioManager.playJumpSound(true)
      this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
      this.hasDoubleJumped = true
      this.canDoubleJump = false
    }

    // Apply shooting (currently disabled for DQN training)
    // if (action.shoot) {
    //   this.shootBullet()
    // }
  }

  shutdown() {
    // Stop and clean up music when scene shuts down using MusicManager
    this.musicManager.stopMusic()
    
    // Clean up DQN agent if it exists
    if (this.dqnAgent) {
      this.dqnAgent.dispose()
      this.dqnAgent = undefined
    }
    
    // Clean up in-game chat input if open
    if (this.chatContainer && this.chatContainer.parentNode) {
      this.chatContainer.parentNode.removeChild(this.chatContainer)
    }
    this.chatContainer = null
    this.chatInputElement = null
    this.chatInputActive = false
  }

  // =====================================
  // ONLINE ENTITY SYNC HANDLERS
  // =====================================

  /**
   * Handle remote enemy spawn from network
   */
  private handleRemoteEnemySpawn(enemy: NetworkEnemyState) {
    if (this.isOnlineHost) return // Host already spawned this enemy

    // Use server-provided ID
    const eid = enemy.enemy_id

    // Check if we already have this enemy (locally spawned via seeded generation)
    if (this.remoteEnemies.has(eid)) {
      console.log(`👾 Enemy ${eid} already exists, skipping spawn`)
      return
    }
    
    // Also check if enemy exists in local enemies group (seeded generation)
    const existingEnemy = this.enemies.getChildren().find((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite
      return sprite.getData('enemyId') === eid
    }) as Phaser.Physics.Arcade.Sprite | undefined
    
    if (existingEnemy) {
      // Enemy was created via seeded generation - just track it
      console.log(`👾 Enemy ${eid} found locally (seeded), tracking for sync`)
      
      // FORCE SYNC: Update the local enemy to match the authoritative server state
      // This fixes issues where RNG desync caused different enemy types or positions
      existingEnemy.setPosition(enemy.x, enemy.y)
      existingEnemy.setVelocity(enemy.velocity_x || 0, enemy.velocity_y || 0)
      existingEnemy.setData('health', enemy.health)
      existingEnemy.setData('maxHealth', enemy.max_health)
      
      // If types don't match, we should probably destroy and recreate, but for now let's just log it
      const localType = existingEnemy.getData('enemyType')
      if (localType !== enemy.enemy_type) {
        console.warn(`⚠️ Enemy type mismatch for ${eid}: Local=${localType}, Remote=${enemy.enemy_type}. Forcing texture update.`)
        existingEnemy.setTexture(`${enemy.enemy_type}_idle`)
        existingEnemy.setData('enemyType', enemy.enemy_type)
        existingEnemy.play(`${enemy.enemy_type}_idle`)
      }
      
      this.remoteEnemies.set(eid, existingEnemy)
      return
    }

    console.log(`👾 Remote enemy spawned: ${eid} at (${enemy.x}, ${enemy.y}) type=${enemy.enemy_type} scale=${enemy.scale}`)

    // Create the enemy sprite using standardized server fields
    const enemyScale = enemy.scale ?? 1
    const enemyType = enemy.enemy_type
    const enemySprite = this.enemies.create(enemy.x, enemy.y, enemyType) as Phaser.Physics.Arcade.Sprite
    
    if (!enemySprite) {
      console.error(`❌ Failed to create enemy sprite for ${eid}`)
      return
    }
    
    // Ensure sprite is visible and active
    enemySprite.setVisible(true)
    enemySprite.setActive(true)
    
    console.log(`👾 Enemy sprite created: ${eid}, visible=${enemySprite.visible}, active=${enemySprite.active}`)
    
    enemySprite.setScale(enemyScale)
    enemySprite.setBounce(0.3)
    enemySprite.setCollideWorldBounds(true)
    enemySprite.clearTint()
    enemySprite.play(`${enemyType}_idle`)
    enemySprite.setData('enemyType', enemyType)
    enemySprite.setData('enemyId', eid)
    enemySprite.setData('health', enemy.health)
    enemySprite.setData('maxHealth', enemy.max_health)
    enemySprite.setData('coinReward', enemy.coin_reward ?? 0)
    enemySprite.setData('spawnX', enemy.x)
    enemySprite.setData('spawnY', enemy.y)
    
    // Determine size from scale
    let enemySize: 'small' | 'medium' | 'large' = 'medium'
    if (enemyScale < 0.8) enemySize = 'small'
    else if (enemyScale > 1.1) enemySize = 'large'
    enemySprite.setData('enemySize', enemySize)
    
    // Add AI behavior data
    enemySprite.setData('detectionRange', 300)
    enemySprite.setData('speed', 80)
    enemySprite.setData('wanderDirection', enemy.facing_right ? 1 : -1)
    enemySprite.setData('wanderTimer', 0)
    enemySprite.setData('idleTimer', 0)

    enemySprite.body!.setSize(enemySprite.width * 0.7, enemySprite.height * 0.7)
    enemySprite.body!.setOffset(enemySprite.width * 0.15, enemySprite.height * 0.15)
    enemySprite.body!.setMass(1)
    enemySprite.setPushable(true)
    const body = enemySprite.body as Phaser.Physics.Arcade.Body
    body.setMaxVelocity(200, 600)

    // Track the remote enemy
    this.remoteEnemies.set(eid, enemySprite)
    
    console.log(`👾 Remote enemy ${eid} fully initialized and tracked. Total enemies: ${this.enemies.getChildren().length}`)
  }

  /**
   * Handle remote enemy killed from network
   */
  private handleRemoteEnemyKilled(enemyId: string, _killedBy: string) {
    console.log(`💀 Remote enemy killed: ${enemyId}`)

    // Find the enemy by ID
    let enemySprite: Phaser.Physics.Arcade.Sprite | undefined

    // Check remote enemies map first
    if (this.remoteEnemies.has(enemyId)) {
      enemySprite = this.remoteEnemies.get(enemyId)
      this.remoteEnemies.delete(enemyId)
    } else {
      // Search in local enemies group
      this.enemies.getChildren().forEach((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite
        if (sprite.getData('enemyId') === enemyId && sprite.active) {
          enemySprite = sprite
        }
      })
    }

    if (!enemySprite || !enemySprite.active) {
      console.log(`👾 Enemy ${enemyId} not found or already dead`)
      return
    }

    const enemyType = enemySprite.getData('enemyType')
    // Record original spawn location for potential respawn
    const spawnX = enemySprite.getData('spawnX')
    const spawnY = enemySprite.getData('spawnY')
    const scale = enemySprite.scaleX
    const coinReward = enemySprite.getData('coinReward') || 5

    // HOST spawns coins for remote kills and broadcasts to all players
    if (this.isOnlineMode && this.isOnlineHost) {
      this.dropCoins(enemySprite.x, enemySprite.y, coinReward)
    }

    // Award score
    this.enemiesDefeated++
    const enemySize = enemySprite.getData('enemySize')
    let scoreReward = 50
    if (enemySize === 'medium') scoreReward = 100
    if (enemySize === 'large') scoreReward = 200
    this.updateScore(scoreReward)

    // Death animation
    enemySprite.setVelocity(0, 0)
    const deadTexture = `${enemyType}_dead`
    if (this.textures.exists(deadTexture)) {
      enemySprite.setTexture(deadTexture)
    }
    enemySprite.setTint(0xff0000)

    this.tweens.add({
      targets: enemySprite,
      alpha: 0,
      y: enemySprite.y + 20,
      scaleX: scale * 1.2,
      scaleY: scale * 0.8,
      duration: 500,
      onComplete: () => {
        enemySprite!.destroy()
      }
    })

    // Host should schedule respawn (server will be authoritative for coins)
    if (this.isOnlineMode && this.isOnlineHost) {
      this.time.delayedCall(20000, () => {
        if (spawnX < this.farthestPlayerX - 500) return

        const difficultyMultiplier = this.gameMode === 'endless'
          ? 1 + Math.floor(this.player.x / 5000) * 0.2
          : 1 + (this.currentLevel - 1) * 0.3

        this.spawnRandomEnemy(spawnX, spawnY, difficultyMultiplier)
      })
    }
  }

  /**
   * Handle remote enemy state update from network
   */
  private handleRemoteEnemyStateUpdate(enemyId: string, state: NetworkEnemyState) {
    let enemySprite: Phaser.Physics.Arcade.Sprite | undefined

    // Check remote enemies map first
    if (this.remoteEnemies.has(enemyId)) {
      enemySprite = this.remoteEnemies.get(enemyId)
    } else {
      // Search in local enemies group
      this.enemies.getChildren().forEach((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite
        if (sprite.getData('enemyId') === enemyId && sprite.active) {
          enemySprite = sprite
        }
      })
    }

    if (!enemySprite || !enemySprite.active) {
      return // Enemy not found
    }

    // Prediction + reconciliation to hide latency:
    // Predict small advance using velocity (reduces perceived lag)
    const currentX = enemySprite.x
    const currentY = enemySprite.y
    const predictedX = (state.x || 0) + (state.velocity_x || 0) * 0.05
    const predictedY = (state.y || 0) + (state.velocity_y || 0) * 0.05

    const targetX = predictedX
    const targetY = predictedY

    const dx = Math.abs(targetX - currentX)
    const dy = Math.abs(targetY - currentY)

    // Snap threshold: if too far, teleport to authoritative position
    // Reduced from 150 to 50 to prevent large desyncs
    const SNAP_THRESHOLD = 50
    if (dx > SNAP_THRESHOLD || dy > SNAP_THRESHOLD) {
      enemySprite.setPosition(targetX, targetY)
    } else {
      // Smooth correction: lerp with a factor increasing with distance
      const distance = Math.sqrt(dx * dx + dy * dy)
      const factor = Math.min(0.75, 0.08 + Math.max(0, distance / 200) * 0.25)
      enemySprite.setPosition(
        Phaser.Math.Linear(currentX, targetX, factor),
        Phaser.Math.Linear(currentY, targetY, factor)
      )
    }

    // Update velocity (server uses snake_case)
    enemySprite.setVelocity(state.velocity_x || 0, state.velocity_y || 0)

    // Update health
    if (state.health !== undefined) {
      enemySprite.setData('health', state.health)
    }

    // Update animation if needed
    if (!state.is_alive) {
      enemySprite.setTint(0xff0000)
    }
  }

  /**
   * Handle remote coin spawn from network
   */
  private handleRemoteCoinSpawn(coinState: NetworkCoinState) {
    console.log(`🪙 COIN DEBUG: handleRemoteCoinSpawn received - id=${coinState.coin_id}, isHost=${this.isOnlineHost}`)
    if (this.isOnlineHost) {
      console.log(`🪙 COIN DEBUG: Host skipping handleRemoteCoinSpawn`)
      return // Host already spawned this coin
    }

    // Check if we already have this coin
    const cid = coinState.coin_id
    if (this.remoteCoins.has(cid)) {
      return
    }
    
    // Also check if coin exists in local coins group (seeded generation)
    const existingCoin = this.coins.getChildren().find((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite
      return sprite.getData('coinId') === cid
    }) as Phaser.Physics.Arcade.Sprite | undefined
    
    if (existingCoin) {
      // Coin was created via seeded generation - just track it
      console.log(`🪙 Coin ${cid} found locally (seeded), tracking for sync`)
      
      // FORCE SYNC: Update position to match server authoritative state
      if (Math.abs(existingCoin.x - coinState.x) > 2 || Math.abs(existingCoin.y - coinState.y) > 2) {
        console.log(`🪙 Syncing coin position for ${cid}: (${existingCoin.x},${existingCoin.y}) -> (${coinState.x},${coinState.y})`)
        existingCoin.setPosition(coinState.x, coinState.y)
      }
      
      this.remoteCoins.set(cid, existingCoin)
      return
    }

    console.log(`🪙 Remote coin spawned: ${cid} at (${coinState.x}, ${coinState.y})`)

    const coin = this.coins.create(coinState.x, coinState.y, 'coin') as Phaser.Physics.Arcade.Sprite
    coin.setScale(0.5)
    coin.setBounce(0.3)
    coin.setCollideWorldBounds(true)
    coin.setData('coinId', cid)
    coin.setData('value', coinState.value || 1)

    // Apply deterministic velocity if provided by server (for dropped coins)
    // Use ID prefix to distinguish dropped coins (dynamic) from level coins (static)
    if (cid.startsWith('coin_drop_')) {
      (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(true)
      coin.setVelocity(coinState.velocity_x || 0, coinState.velocity_y || 0)
      // Add drag to match host physics and prevent desync
      coin.setDragX(200)
    } else {
      // Static level coins should float and not fall
      (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
      
      // Add floating animation for stationary coins
      this.tweens.add({
        targets: coin,
        y: coinState.y - 20,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }

    // Add rotation animation
    this.tweens.add({
      targets: coin,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    })

    this.remoteCoins.set(cid, coin)
  }

  /**
   * Handle remote powerup spawn from network
   */
  private handleRemotePowerUpSpawn(powerupState: NetworkPowerUpState) {
    if (this.isOnlineHost) return // Host already spawned this

    const pid = powerupState.powerup_id
    
    // Check if we already have this powerup
    const existingPowerUp = this.powerUps.getChildren().find((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite
      return sprite.getData('powerupId') === pid
    }) as Phaser.Physics.Arcade.Sprite | undefined
    
    if (existingPowerUp) {
      console.log(`🎁 PowerUp ${pid} found locally, tracking`)
      
      // FORCE SYNC: Update position to match server authoritative state
      if (Math.abs(existingPowerUp.x - powerupState.x) > 2 || Math.abs(existingPowerUp.y - powerupState.y) > 2) {
        console.log(`🎁 Syncing powerup position for ${pid}: (${existingPowerUp.x},${existingPowerUp.y}) -> (${powerupState.x},${powerupState.y})`)
        existingPowerUp.setPosition(powerupState.x, powerupState.y)
      }
      
      return
    }

    console.log(`🎁 Remote powerup spawned: ${pid} at (${powerupState.x}, ${powerupState.y})`)

    const powerUp = this.powerUps.create(powerupState.x, powerupState.y, powerupState.type)
    powerUp.setScale(0.6)
    powerUp.setBounce(0.2)
    powerUp.setCollideWorldBounds(true)
    powerUp.setData('powerupId', pid)
    powerUp.setData('type', powerupState.type)

    // Add floating animation
    this.tweens.add({
      targets: powerUp,
      y: powerupState.y - 15,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Add glow effect
    this.tweens.add({
      targets: powerUp,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  /**
   * Handle full entities sync from host
   */
  private handleEntitiesSync(enemies: NetworkEnemyState[], coins: NetworkCoinState[]) {
    console.log(`🔄 Full entities sync received: ${enemies.length} enemies, ${coins.length} coins`)

    // Update or create enemies
    const receivedEnemyIds = new Set<string>()
    
    enemies.forEach(enemyState => {
      const eid = enemyState.enemy_id
      receivedEnemyIds.add(eid)
      
      if (this.remoteEnemies.has(eid)) {
        // Update existing enemy
        this.handleRemoteEnemyStateUpdate(eid, enemyState)
      } else {
        // Check if it exists in local group but not in map
        let found = false
        this.enemies.getChildren().forEach((child) => {
          const sprite = child as Phaser.Physics.Arcade.Sprite
          if (sprite.getData('enemyId') === eid) {
            found = true
            this.remoteEnemies.set(eid, sprite)
            this.handleRemoteEnemyStateUpdate(eid, enemyState)
          }
        })
        
        if (!found && enemyState.is_alive) {
          // Spawn new enemy
          this.handleRemoteEnemySpawn(enemyState)
        }
      }
    })

    // Remove enemies that no longer exist on host (only if we're not the host)
    if (!this.isOnlineHost) {
      // Check tracked remote enemies
      this.remoteEnemies.forEach((sprite, id) => {
        if (!receivedEnemyIds.has(id) && sprite.active) {
          console.log(`👾 Removing stale enemy (tracked): ${id}`)
          sprite.destroy()
          this.remoteEnemies.delete(id)
        }
      })

      // Also check ALL local enemies to catch any that were RNG-spawned but not yet tracked
      // This is critical for removing enemies that exist locally due to RNG but shouldn't exist
      this.enemies.getChildren().forEach((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite
        const eid = sprite.getData('enemyId')
        if (eid && !receivedEnemyIds.has(eid) && sprite.active) {
           console.log(`👾 Removing stale enemy (untracked): ${eid}`)
           sprite.destroy()
        }
      })
    }

    // Handle coins similarly (simplified since coins are mostly static)
    const receivedCoinIds = new Set<string>()
    
    coins.forEach(coinState => {
      const cid = coinState.coin_id
      receivedCoinIds.add(cid)
      
      // Check if we have this coin locally
      let existingCoin = this.remoteCoins.get(cid)
      if (!existingCoin) {
        // Try to find it in the group if not in the map
        this.coins.getChildren().forEach((child) => {
          const sprite = child as Phaser.Physics.Arcade.Sprite
          if (sprite.getData('coinId') === cid) {
            existingCoin = sprite
            this.remoteCoins.set(cid, sprite)
          }
        })
      }

      if (existingCoin) {
        // Force sync position if significantly different
        if (Math.abs(existingCoin.x - coinState.x) > 5 || Math.abs(existingCoin.y - coinState.y) > 5) {
          existingCoin.setPosition(coinState.x, coinState.y)
        }
        
        // Handle collection state
        if (coinState.is_collected && existingCoin.active) {
          existingCoin.destroy()
        }
      } else if (!coinState.is_collected) {
        this.handleRemoteCoinSpawn(coinState)
      }
    })

    // Remove local coins that are NOT in the server list (if we are not host)
    // This ensures coins collected/removed by host are removed from client
    if (!this.isOnlineHost) {
      // Check tracked remote coins
      this.remoteCoins.forEach((sprite, id) => {
        if (!receivedCoinIds.has(id) && sprite.active) {
          console.log(`🪙 Removing stale coin (tracked): ${id}`)
          sprite.destroy()
          this.remoteCoins.delete(id)
        }
      })

      // Also check ALL local coins to catch any that were RNG-spawned but not yet tracked
      this.coins.getChildren().forEach((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite
        const cid = sprite.getData('coinId')
        if (cid && !receivedCoinIds.has(cid) && sprite.active) {
          console.log(`🪙 Removing stale coin (untracked): ${cid}`)
          sprite.destroy()
        }
      })
    }
  }

  private async saveGame() {
    const playerName = localStorage.getItem('player_name') || 'Guest'
    try {
      await GameAPI.saveGame({
        player_name: playerName,
        level: this.currentLevel,
        score: this.score,
        lives: this.playerLives,
        health: this.playerHealth,
        coins: this.coinCount,
        weapon: this.equippedWeapon
      })
      
      // Show saved message
      const savedText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'GAME SAVED!', {
        fontSize: '64px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      })
      savedText.setOrigin(0.5)
      savedText.setScrollFactor(0)
      savedText.setDepth(200)
      
      this.tweens.add({
        targets: savedText,
        alpha: 0,
        duration: 1500,
        onComplete: () => savedText.destroy()
      })
      
    } catch (e) {
      console.error('Failed to save game:', e)
      
      const errText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'SAVE FAILED', {
        fontSize: '64px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      })
      errText.setOrigin(0.5)
      errText.setScrollFactor(0)
      errText.setDepth(200)
      
      this.tweens.add({
        targets: errText,
        alpha: 0,
        duration: 1500,
        onComplete: () => errText.destroy()
      })
    }
  }
}
