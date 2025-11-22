import Phaser from 'phaser'
import { GameAPI } from '../services/api'

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
  private currentBiome: 'metal' | 'stone' | 'dirt' = 'metal'
  private biomeLength: number = 0
  private lastGeneratedX: number = 0
  private spikes!: Phaser.Physics.Arcade.StaticGroup
  private spikePositions: Array<{x: number, y: number, width: number}> = []
  private checkpoints: Array<{x: number, marker: Phaser.GameObjects.Rectangle}> = []
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
  
  // Debug mode
  private debugMode: boolean = false
  private debugText: Phaser.GameObjects.Text | null = null
  private fpsText: Phaser.GameObjects.Text | null = null
  private coordText: Phaser.GameObjects.Text | null = null

  constructor() {
    super('GameScene')
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
    this.load.image('slimeBlue_walk', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/slimeBlue_walk.png')
    this.load.image('slimeBlue_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/slimeBlue_dead.png')
    
    // Large enemies (worms)
    this.load.image('wormGreen', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/wormGreen.png')
    this.load.image('wormGreen_walk', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/wormGreen_walk.png')
    this.load.image('wormGreen_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/wormGreen_dead.png')
    this.load.image('wormPink', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/wormPink.png')
    this.load.image('wormPink_walk', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/wormPink_walk.png')
    this.load.image('wormPink_dead', '/assets/kenney_platformer-art-extended-enemies/Enemy sprites/wormPink_dead.png')

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
    
    // Load spikes
    this.load.image('spikes', '/assets/kenney_platformer-art-requests/Tiles/spikes.png')
    
    // Load portal sprite
    this.load.image('portal', '/assets/kenney_sci-fi-rts/PNG/Default size/Structure/barricadeLarge.png')
    this.load.image('homeIcon', '/assets/kenney_ui-pack-space-expansion/PNG/Blue/Default/button_home.png')
    
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
    
    // Load power-up sprites
    this.load.image('powerSpeed', '/assets/kenney_platformer-art-requests/Tiles/powerupYellow.png')
    this.load.image('powerShield', '/assets/kenney_platformer-art-requests/Tiles/powerupBlue.png')
    this.load.image('powerLife', '/assets/kenney_platformer-art-requests/Tiles/powerupGreen.png')
    this.load.image('powerHealth', '/assets/pico-8/Transparent/Tiles/tile_0066.png')
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
    
    // Reset all state variables
    this.playerIsDead = false
    this.playerHealth = 100
    this.playerLives = 3
    this.debugMode = false  // Always reset debug mode on scene start/restart
    this.levelCompleteShown = false // Reset level complete flag
    
    // Load coin count from localStorage
    const savedCoins = localStorage.getItem('playerCoins')
    this.coinCount = savedCoins ? parseInt(savedCoins) : 0
    
    // Load equipped items from inventory
    const equippedWeapon = localStorage.getItem('equippedWeapon')
    const equippedSkin = localStorage.getItem('equippedSkin')
    this.equippedWeapon = equippedWeapon || 'raygun'
    this.equippedSkin = equippedSkin || 'alienBeige'
    
    // Initialize power-up state
    this.hasSpeedBoost = false
    this.hasShield = false
    this.shieldSprite = null
    
    this.worldGenerationX = 0
    this.currentBiome = 'metal'
    this.biomeLength = 0
    this.lastGeneratedX = 0
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
    console.log('Generating world...')
    this.generateWorld()
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
    const numEnemies = 15
    for (let i = 0; i < numEnemies; i++) {
      const x = Phaser.Math.Between(300, 3000)
      const y = Phaser.Math.Between(200, 900)
      
      this.spawnRandomEnemy(x, y, 1.0)
    }

    // Create block fragments group
    this.blockFragments = this.physics.add.group()
    
    // Create coins group
    this.coins = this.physics.add.group()
    this.spawnCoins()
    
    // Create power-ups group
    this.powerUps = this.physics.add.group()
    this.spawnPowerUps()

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
        console.log(`🎮 F4: Teleporting to boss level ${nextBossLevel}...`)
        this.scene.restart({ gameMode: 'levels', level: nextBossLevel })
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
        console.log('🧹 F5: Cleared all defeated boss levels!')
        console.log('💡 Bosses will respawn on levels 5, 10, 15, etc.')
      } else {
        console.log('⚠️ F5: Enable debug mode (F3) first to clear defeated bosses')
      }
    })
    
    // ESC key to quit game and return to menu
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      this.showQuitConfirmation()
    })
    
    // Alternative debug key (Shift+D)
    const shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    this.input.keyboard!.on('keydown-D', () => {
      if (shiftKey.isDown) {
        console.log('Shift+D pressed!')
        this.toggleDebugMode()
      }
    })

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    
    // Create UI elements
    this.createUI()
    
    // Create debug UI (hidden by default)
    this.createDebugUI()
    
    // Show tutorial tips after a delay
    this.time.delayedCall(2000, () => {
      this.showTip('welcome', 'Use WASD or Arrow Keys to move. Press W/Up to jump!')
    })
    
    this.time.delayedCall(8000, () => {
      this.showTip('shooting', 'Click to aim and shoot enemies. Different weapons have different speeds!')
    })
  }

  private createUI() {
    const startX = this.cameras.main.width - 20
    const startY = 20
    
    // Top-right: Lives and Health
    this.livesText = this.add.text(startX, startY, `Lives: ${this.playerLives}`, {
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
    
    // Create reload bar below health bar
    const reloadBarY = healthBarY + healthBarHeight + 10
    const reloadBarWidth = 200
    const reloadBarHeight = 12
    
    // Background (empty state)
    this.reloadBarBackground = this.add.rectangle(
      startX - reloadBarWidth,
      reloadBarY,
      reloadBarWidth,
      reloadBarHeight,
      0x333333 // Dark gray
    )
    this.reloadBarBackground.setScrollFactor(0)
    this.reloadBarBackground.setOrigin(0, 0)
    
    // Fill (shows reload progress)
    this.reloadBarFill = this.add.rectangle(
      startX - reloadBarWidth,
      reloadBarY,
      reloadBarWidth,
      reloadBarHeight,
      0x00aaff // Blue
    )
    this.reloadBarFill.setScrollFactor(0)
    this.reloadBarFill.setOrigin(0, 0)
    
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
  }

  private spawnCoins() {
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

    coinPositions.forEach(pos => {
      const coin = this.coins.create(pos.x, pos.y, 'coin')
      coin.setScale(0.5)
      coin.setBounce(0.3)
      coin.setCollideWorldBounds(true)
      
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
    })
  }

  private collectCoin(_player: Phaser.Physics.Arcade.Sprite, coin: Phaser.Physics.Arcade.Sprite) {
    // Remove coin
    coin.destroy()
    
    // Increment counter
    this.coinCount++
    this.coinText.setText(this.coinCount.toString())
    
    // Update score (coins are worth 10 points each)
    this.updateScore(10)
    
    // Save coins to localStorage
    localStorage.setItem('playerCoins', this.coinCount.toString())
    
    // Show shop tip when player reaches 50 coins for the first time
    if (this.coinCount === 50) {
      this.showTip('shop', 'You have 50 coins! Visit the Shop from the menu to buy weapons and skins!')
    }
    
    // Play coin sound
    this.playCoinSound()
    
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
    // Spawn power-ups at random positions on platforms
    const powerUpTypes = ['powerSpeed', 'powerShield', 'powerLife', 'powerHealth', 'powerHealth']
    const numPowerUps = 10
    
    for (let i = 0; i < numPowerUps; i++) {
      const x = Phaser.Math.Between(1000, 8000)
      const y = 500
      const type = Phaser.Math.RND.pick(powerUpTypes)
      
      const powerUp = this.powerUps.create(x, y, type)
      powerUp.setScale(0.6)
      powerUp.setBounce(0.2)
      powerUp.setCollideWorldBounds(true)
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
    }
  }

  private collectPowerUp(_player: Phaser.Physics.Arcade.Sprite, powerUp: Phaser.Physics.Arcade.Sprite) {
    const type = powerUp.getData('type')
    
    // Remove power-up
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
      this.livesText.setText(`Lives: ${this.playerLives}`)
      
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
    // Drop coins at the enemy's position
    for (let i = 0; i < count; i++) {
      // Spawn coin with slight delay and spread
      this.time.delayedCall(i * 50, () => {
        const offsetX = Phaser.Math.Between(-30, 30)
        const offsetY = Phaser.Math.Between(-20, 0)
        const coin = this.coins.create(x + offsetX, y + offsetY, 'coin')
        coin.setBounce(0.7)
        coin.setVelocity(
          Phaser.Math.Between(-100, 100),
          Phaser.Math.Between(-200, -100)
        )
        coin.setScale(0.5)
        coin.setCollideWorldBounds(true)
        coin.body.setAllowGravity(true)
        
        // Fade in animation
        coin.setAlpha(0)
        this.tweens.add({
          targets: coin,
          alpha: 1,
          duration: 200,
          ease: 'Cubic.easeOut'
        })
      })
    }
  }

  private generateWorld() {
    const tileSize = 70
    const floorY = 650
    
    console.log('=== Generating World ===')
    console.log('Floor Y:', floorY, 'Tile size:', tileSize)
    
    // Create safe spawn platform (500 pixels wide, no enemies)
    const spawnPlatformWidth = 500
    for (let x = 0; x < spawnPlatformWidth; x += tileSize) {
      const posX = x + tileSize/2
      
      // Create sprite first
      const tile = this.add.sprite(posX, floorY, 'metalMid')
      tile.setOrigin(0.5, 0.5)
      
      // Add static physics body
      this.physics.add.existing(tile, true)
      
      // Get the body and configure it to match texture dimensions
      const body = tile.body as Phaser.Physics.Arcade.StaticBody
      // Use 95% of texture size for more accurate hitbox
      const hitboxSize = tileSize * 0.95
      body.setSize(hitboxSize, hitboxSize)
      body.setOffset((tile.width - hitboxSize) / 2, (tile.height - hitboxSize) / 2)
      body.updateFromGameObject()
      
      // Add to platforms group AFTER physics is set up
      this.platforms.add(tile)
    }
    
    // Add decorative pillars on spawn platform edges
    for (let i = 0; i < 3; i++) {
      const pillar1 = this.add.sprite(tileSize/2, floorY - (i + 1) * tileSize, 'metalCenter')
      pillar1.setOrigin(0.5, 0.5)
      this.physics.add.existing(pillar1, true)
      const body1 = pillar1.body as Phaser.Physics.Arcade.StaticBody
      body1.setSize(tileSize, tileSize)
      body1.updateFromGameObject()
      this.platforms.add(pillar1)
      
      const pillar2 = this.add.sprite(spawnPlatformWidth - tileSize/2, floorY - (i + 1) * tileSize, 'metalCenter')
      pillar2.setOrigin(0.5, 0.5)
      this.physics.add.existing(pillar2, true)
      const body2 = pillar2.body as Phaser.Physics.Arcade.StaticBody
      body2.setSize(tileSize, tileSize)
      body2.updateFromGameObject()
      this.platforms.add(pillar2)
    }
    
    // Choose initial biome for rest of world
    const biomes: Array<'metal' | 'stone' | 'dirt'> = ['metal', 'stone', 'dirt']
    this.currentBiome = biomes[Math.floor(Math.random() * biomes.length)]
    this.biomeLength = Phaser.Math.Between(1500, 3000)
    this.worldGenerationX = spawnPlatformWidth
    
    // Generate initial world chunks after spawn platform
    for (let i = 0; i < 5; i++) {
      this.generateChunk(this.worldGenerationX)
      this.worldGenerationX += 800
    }
    
    this.lastGeneratedX = this.worldGenerationX
  }

  private generateChunk(startX: number) {
    const tileSize = 70
    const chunkWidth = 800
    const floorY = 650
    
    // Get biome-specific tiles
    const floorTile = this.getBiomeFloorTile()
    const platformTile = this.getBiomePlatformTile()
    const wallTile = this.getBiomeWallTile()
    
    // Create floor for this chunk
    for (let x = startX; x < startX + chunkWidth; x += tileSize) {
      const floor = this.add.sprite(x + tileSize/2, floorY, floorTile)
      floor.setOrigin(0.5, 0.5)
      this.physics.add.existing(floor, true)
      const body = floor.body as Phaser.Physics.Arcade.StaticBody
      // Use 95% of texture for tighter, more accurate hitbox
      const hitboxSize = tileSize * 0.95
      body.setSize(hitboxSize, hitboxSize)
      body.setOffset((floor.width - hitboxSize) / 2, (floor.height - hitboxSize) / 2)
      body.updateFromGameObject()
      this.platforms.add(floor)
      
      // Check if we need to switch biome
      if (x - (this.worldGenerationX - this.lastGeneratedX) >= this.biomeLength) {
        this.switchBiome()
      }
    }
    
    // Define 7 fixed Y levels for platform spawning (from top to ground)
    const yLevels = [300, 370, 440, 510, 580, 650] // 6 levels above ground + ground at 650
    
    // Track occupied grid cells to prevent overlap
    const occupiedCells = new Set<string>()
    const minSpacing = 200 // Minimum X distance between structures
    
    // Generate structures within chunk
    let currentX = startX + 100
    const maxX = startX + chunkWidth - 100
    
    while (currentX < maxX) {
      const structureType = Math.random()
      
      if (structureType < 0.3) {
        // Floating platform
        const platformWidth = Phaser.Math.Between(2, 4)
        const levelIndex = Phaser.Math.Between(0, yLevels.length - 2) // Don't use ground level
        const platformY = yLevels[levelIndex]
        
        // Check if this position is occupied
        const cellKey = `${Math.floor(currentX / tileSize)}-${levelIndex}`
        if (!occupiedCells.has(cellKey)) {
          for (let i = 0; i < platformWidth; i++) {
            const plat = this.add.sprite(currentX + i * tileSize + tileSize/2, platformY, platformTile)
            plat.setOrigin(0.5, 0.5)
            this.physics.add.existing(plat, true)
            const body = plat.body as Phaser.Physics.Arcade.StaticBody
            // Thin platform hitbox - match visual size (70 wide x 18 tall approximately)
            const hitboxWidth = plat.width * 0.95
            const hitboxHeight = plat.height * 0.8  // Use actual height, not square
            body.setSize(hitboxWidth, hitboxHeight)
            body.setOffset((plat.width - hitboxWidth) / 2, (plat.height - hitboxHeight) / 2)
            body.updateFromGameObject()
            this.platforms.add(plat)
            
            // Mark cells as occupied
            occupiedCells.add(`${Math.floor((currentX + i * tileSize) / tileSize)}-${levelIndex}`)
          }
        }
        currentX += minSpacing
      } else if (structureType < 0.5) {
        // Staircase - uses multiple levels
        const steps = Phaser.Math.Between(4, 7)
        const startLevelIndex = Phaser.Math.Between(2, yLevels.length - steps - 1)
        
        let canPlace = true
        // Check if any step position is occupied
        for (let i = 0; i < steps; i++) {
          const cellKey = `${Math.floor((currentX + i * tileSize) / tileSize)}-${startLevelIndex + i}`
          if (occupiedCells.has(cellKey)) {
            canPlace = false
            break
          }
        }
        
        if (canPlace) {
          for (let i = 0; i < steps; i++) {
            const levelIndex = startLevelIndex + i
            const stepY = yLevels[levelIndex]
            const step = this.add.sprite(currentX + i * tileSize + tileSize/2, stepY, platformTile)
            step.setOrigin(0.5, 0.5)
            this.physics.add.existing(step, true)
            const body = step.body as Phaser.Physics.Arcade.StaticBody
            // Thin platform hitbox - match visual size
            const hitboxWidth = step.width * 0.95
            const hitboxHeight = step.height * 0.8
            body.setSize(hitboxWidth, hitboxHeight)
            body.setOffset((step.width - hitboxWidth) / 2, (step.height - hitboxHeight) / 2)
            body.updateFromGameObject()
            this.platforms.add(step)
            
            // Mark cell as occupied
            occupiedCells.add(`${Math.floor((currentX + i * tileSize) / tileSize)}-${levelIndex}`)
          }
        }
        currentX += minSpacing + 100
      } else if (structureType < 0.7) {
        // Pillar with platform on top
        const pillarHeight = Phaser.Math.Between(3, 6)
        const topLevelIndex = Phaser.Math.Between(0, yLevels.length - pillarHeight - 1)
        const pillarTopY = yLevels[topLevelIndex]
        
        const cellKey = `${Math.floor(currentX / tileSize)}-${topLevelIndex}`
        if (!occupiedCells.has(cellKey)) {
          // Create pillar blocks
          for (let i = 0; i < pillarHeight; i++) {
            const levelIndex = topLevelIndex + i
            const pillar = this.add.sprite(currentX + tileSize/2, yLevels[levelIndex], wallTile)
            pillar.setOrigin(0.5, 0.5)
            this.physics.add.existing(pillar, true)
            const bodyP = pillar.body as Phaser.Physics.Arcade.StaticBody
            const hitboxSize = tileSize * 0.95
            bodyP.setSize(hitboxSize, hitboxSize)
            bodyP.setOffset((pillar.width - hitboxSize) / 2, (pillar.height - hitboxSize) / 2)
            bodyP.updateFromGameObject()
            this.platforms.add(pillar)
            
            // Mark cell as occupied
            occupiedCells.add(`${Math.floor(currentX / tileSize)}-${levelIndex}`)
          }
          
          // Platform on top (3 tiles wide)
          for (let i = 0; i < 3; i++) {
            const top = this.add.sprite(currentX + (i - 1) * tileSize + tileSize/2, pillarTopY, platformTile)
            top.setOrigin(0.5, 0.5)
            this.physics.add.existing(top, true)
            const bodyT = top.body as Phaser.Physics.Arcade.StaticBody
            const hitboxWidth = top.width * 0.95
            const hitboxHeight = top.height * 0.8
            bodyT.setSize(hitboxWidth, hitboxHeight)
            bodyT.setOffset((top.width - hitboxWidth) / 2, (top.height - hitboxHeight) / 2)
            bodyT.updateFromGameObject()
            this.platforms.add(top)
            
            // Mark cells as occupied
            occupiedCells.add(`${Math.floor((currentX + (i - 1) * tileSize) / tileSize)}-${topLevelIndex}`)
          }
        }
        currentX += minSpacing + 50
      } else if (structureType < 0.85) {
        // Gap (no structure)
        currentX += Phaser.Math.Between(150, 250)
      } else {
        // Spike trap on ground level (always at Y=650)
        const spikeWidth = Phaser.Math.Between(2, 4)
        const groundLevelIndex = yLevels.length - 1
        console.log(`Creating spike trap at X:${currentX}, width:${spikeWidth}`)
        
        let canPlace = true
        // Check if ground position is occupied
        for (let i = 0; i < spikeWidth; i++) {
          const cellKey = `${Math.floor((currentX + i * tileSize) / tileSize)}-${groundLevelIndex}`
          if (occupiedCells.has(cellKey)) {
            canPlace = false
            break
          }
        }
        
        if (canPlace) {
          for (let i = 0; i < spikeWidth; i++) {
            // Create platform block underneath
            const block = this.add.sprite(currentX + i * tileSize + tileSize/2, floorY, floorTile)
            block.setOrigin(0.5, 0.5)
            this.physics.add.existing(block, true)
            const blockBody = block.body as Phaser.Physics.Arcade.StaticBody
            const hitboxSize = tileSize * 0.95
            blockBody.setSize(hitboxSize, hitboxSize)
            blockBody.setOffset((block.width - hitboxSize) / 2, (block.height - hitboxSize) / 2)
            blockBody.updateFromGameObject()
            this.platforms.add(block)
            
            // Place spikes on top of the block
            const spikeX = currentX + i * tileSize + tileSize/2
            const spikeY = floorY - tileSize/2
            console.log(`  Spike ${i} at X:${spikeX}, Y:${spikeY}`)
            
            if (!this.textures.exists('spikes')) {
              console.error('Spikes texture does not exist!')
            }
            
            const spike = this.spikes.create(spikeX, spikeY, 'spikes')
            spike.setOrigin(0.5, 1) // Bottom-center origin
            spike.setSize(68, 28) // Hitbox for spike tips only
            spike.setOffset(2, 4) // Offset to hit only the pointy parts
            spike.refreshBody()
            
            // Mark cell as occupied
            occupiedCells.add(`${Math.floor((currentX + i * tileSize) / tileSize)}-${groundLevelIndex}`)
          }
          
          // Track spike position for coin spawn prevention
          this.spikePositions.push({
            x: currentX,
            y: floorY - tileSize/2,
            width: spikeWidth * tileSize
          })
        }
        currentX += minSpacing
      }
    }
  }

  private getBiomeFloorTile(): string {
    switch (this.currentBiome) {
      case 'metal': return 'metalMid'
      case 'stone': return 'stoneCaveBottom'
      case 'dirt': return 'dirtCaveBottom'
    }
  }

  private getBiomePlatformTile(): string {
    switch (this.currentBiome) {
      case 'metal': return 'metalPlatform'
      case 'stone': return 'stoneCaveTop'
      case 'dirt': return 'dirtCaveTop'
    }
  }

  private getBiomeWallTile(): string {
    switch (this.currentBiome) {
      case 'metal': return 'metalCenter'
      case 'stone': return 'stoneCaveTop'
      case 'dirt': return 'dirtCaveTop'
    }
  }

  private switchBiome() {
    const biomes: Array<'metal' | 'stone' | 'dirt'> = ['metal', 'stone', 'dirt']
    const otherBiomes = biomes.filter(b => b !== this.currentBiome)
    this.currentBiome = otherBiomes[Math.floor(Math.random() * otherBiomes.length)]
    this.biomeLength = Phaser.Math.Between(1500, 3000)
  }

  private spawnCoinsInArea(startX: number, endX: number) {
    const numCoins = Phaser.Math.Between(2, 4)
    for (let i = 0; i < numCoins; i++) {
      let x = Phaser.Math.Between(startX + 100, endX - 100)
      let y = Phaser.Math.Between(400, 900)
      
      // Check if coin would spawn on spikes, retry if so
      let retries = 0
      while (retries < 5 && this.isOnSpikes(x, y)) {
        x = Phaser.Math.Between(startX + 100, endX - 100)
        y = Phaser.Math.Between(400, 900)
        retries++
      }
      
      // Skip if still on spikes after retries
      if (this.isOnSpikes(x, y)) continue
      
      const coin = this.coins.create(x, y, 'coin')
      coin.setScale(0.5)
      coin.setBounce(0.3)
      coin.setCollideWorldBounds(true)
      
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
    }
  }

  private spawnEnemiesInArea(startX: number, endX: number) {
    // Don't spawn enemies on the starting platform (first 500 pixels)
    if (startX < 500) return
    
    // Scale difficulty based on level
    const difficultyMultiplier = this.gameMode === 'endless' 
      ? 1 + Math.floor(this.player.x / 5000) * 0.2 
      : 1 + (this.currentLevel - 1) * 0.3
    
    const baseEnemies = 2
    const maxEnemies = Math.min(5, baseEnemies + Math.floor(difficultyMultiplier))
    const numEnemies = Phaser.Math.Between(baseEnemies, maxEnemies)
    
    for (let i = 0; i < numEnemies; i++) {
      const x = Phaser.Math.Between(startX + 100, endX - 100)
      const y = Phaser.Math.Between(200, 900)
      
      this.spawnRandomEnemy(x, y, difficultyMultiplier)
    }
  }

  private spawnRandomEnemy(x: number, y: number, difficultyMultiplier: number) {
    // Randomly select enemy size with weighted probability
    const rand = Math.random()
    let enemyType: string
    let enemySize: 'small' | 'medium' | 'large'
    let scale: number
    let baseHealth: number
    let coinReward: number
    
    if (rand < 0.4) {
      // Small enemies (40% chance) - flies or bees
      enemyType = Math.random() < 0.5 ? 'fly' : 'bee'
      enemySize = 'small'
      scale = 0.6
      baseHealth = 2
      coinReward = 5
    } else if (rand < 0.8) {
      // Medium enemies (40% chance) - slimes
      enemyType = Math.random() < 0.5 ? 'slimeGreen' : 'slimeBlue'
      enemySize = 'medium'
      scale = 1.0
      baseHealth = 4
      coinReward = 10
    } else {
      // Large enemies (20% chance) - worms
      enemyType = Math.random() < 0.5 ? 'wormGreen' : 'wormPink'
      enemySize = 'large'
      scale = 1.3
      baseHealth = 8
      coinReward = 15
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
    enemy.setData('wanderDirection', Phaser.Math.Between(-1, 1))
    enemy.setData('wanderTimer', 0)
    enemy.setData('idleTimer', 0)
    enemy.setData('health', Math.floor(baseHealth * difficultyMultiplier))
    enemy.setData('maxHealth', Math.floor(baseHealth * difficultyMultiplier))
    enemy.setData('spawnX', x)
    enemy.setData('spawnY', y)
    
    enemy.body!.setSize(enemy.width * 0.7, enemy.height * 0.7)
    enemy.body!.setOffset(enemy.width * 0.15, enemy.height * 0.15)
    enemy.body!.setMass(1)
    enemy.setPushable(true)
    enemy.body!.setMaxVelocity(200, 600)
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
    this.playBossSound()
    
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
      const attackType = Math.random() < 0.5 ? '360' : 'homing'
      this.bossAttack(attackType)
      this.boss.setData('lastAttack', this.time.now)
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
    this.playBossAttackSound()
    
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
    
    // Damage boss (rockets do 3x damage: 30 instead of 10)
    const damage = isRocket ? 30 : 10
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
      this.scene.restart({ gameMode: 'levels', level: this.currentLevel + 1 })
    })
  }

  private checkLevelComplete() {
    if (!this.levelEndMarker) return
    if (this.levelCompleteShown) return // Prevent multiple triggers
    
    // Check if player reached the end
    if (this.player.x >= this.levelLength) {
      this.levelCompleteShown = true
      this.showLevelComplete()
    }
  }

  private showLevelComplete() {
    this.playerIsDead = true // Stop player movement
    
    // Stop player
    this.player.setVelocity(0, 0)
    
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
    
    // Input handlers
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.tweens.killAll()
      this.scene.restart({ gameMode: 'levels', level: this.currentLevel + 1 })
    })
    
    this.input.keyboard!.once('keydown-E', () => {
      this.tweens.killAll()
      this.scene.restart({ gameMode: 'endless', level: 1 })
    })
    
    this.input.keyboard!.once('keydown-M', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })
  }

  update() {
    // CONTINUOUS DEBUGGING - log every 60 frames (about once per second)
    if (this.time.now % 1000 < 20) {  // Log roughly once per second
      const body = this.player.body as Phaser.Physics.Arcade.Body
      console.log('Player Y:', Math.round(this.player.y), 'VelocityY:', Math.round(body.velocity.y), 'Touching.down:', body.touching.down, 'Blocked.down:', body.blocked.down)
    }
    
    // Track farthest X position player has reached
    if (this.player.x > this.farthestPlayerX) {
      this.farthestPlayerX = this.player.x
    }
    
    // Player movement
    this.handlePlayerMovement()
    
    // Update shield sprite position if active
    if (this.hasShield && this.shieldSprite) {
      this.shieldSprite.setPosition(this.player.x, this.player.y)
    }
    
    // Generate new world chunks as player moves forward
    if (this.player.x > this.lastGeneratedX - 1600) {
      // Check if we need to stop generation (levels mode only)
      const shouldGenerate = this.gameMode === 'endless' || this.worldGenerationX < this.levelLength
      
      if (shouldGenerate) {
        this.generateChunk(this.worldGenerationX)
        this.worldGenerationX += 800
        this.lastGeneratedX = this.worldGenerationX
        
        // Spawn coins in new area
        this.spawnCoinsInArea(this.worldGenerationX - 800, this.worldGenerationX)
        
        // Spawn enemies in new area with difficulty scaling
        this.spawnEnemiesInArea(this.worldGenerationX - 800, this.worldGenerationX)
      } else if (!this.levelEndMarker) {
        // Create level end marker
        this.createLevelEndMarker()
      }
      
      // Generate checkpoints every 20 meters
      if (this.player.x > this.lastCheckpointX + this.checkpointInterval) {
        this.createCheckpoint(this.lastCheckpointX + this.checkpointInterval)
        this.lastCheckpointX += this.checkpointInterval
      }
    }
    
    // Update gun position and aiming
    this.handleGunAiming()
    
    // Handle shooting
    this.handleShooting()
    
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
    
    // Update health bar
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
    this.livesText.setText(`Lives: ${this.playerLives}`)
    
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

    // Horizontal movement (A/D or Arrow keys)
    const moveSpeed = this.debugMode ? speed * 2 : speed  // 2x speed in debug mode
    if (this.wasd.a.isDown || this.cursors.left!.isDown) {
      this.player.setVelocityX(-moveSpeed)
      this.player.setFlipX(true)
      if (onGround) {
        this.player.play('player_walk', true)
      }
    } else if (this.wasd.d.isDown || this.cursors.right!.isDown) {
      this.player.setVelocityX(moveSpeed)
      this.player.setFlipX(false)
      if (onGround) {
        this.player.play('player_walk', true)
      }
    } else {
      this.player.setVelocityX(0)
      if (onGround) {
        this.player.play('player_idle', true)
      }
    }

    // Jump (W or Up arrow) - or fly up in debug mode
    if (this.debugMode && this.wasd.w.isDown) {
      // Debug flight mode - fly up
      this.player.setVelocityY(-400)
    } else if (Phaser.Input.Keyboard.JustDown(this.wasd.w) || Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      console.log('Jump pressed! onGround:', onGround, 'canDoubleJump:', this.canDoubleJump, 'hasDoubleJumped:', this.hasDoubleJumped)
      
      if (onGround) {
        // First jump from ground
        console.log('Ground jump!')
        this.player.setVelocityY(jumpVelocity)
        this.player.play('player_jump', true)
        this.playJumpSound()
        this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
        this.stompStartY = this.player.y
        this.canDoubleJump = true // Enable double jump after first jump
        this.hasDoubleJumped = false
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // Double jump - can be used at any height after first jump
        console.log('Double jump!')
        this.player.setVelocityY(jumpVelocity)
        this.player.play('player_jump', true)
        this.playJumpSound(true)
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

      if (distance < detectionRange) {
        // Enemy detected player - move towards player
        const direction = this.player.x > enemy.x ? 1 : -1
        const enemyOnGround = enemy.body!.touching.down
        const horizontalDistance = Math.abs(this.player.x - enemy.x)
        
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

        // Check if player is above enemy and enemy is on ground - make enemy jump
        const playerAbove = this.player.y < enemy.y - 50 // Player is at least 50px higher

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
        
        // Change wander direction every 2-4 seconds
        if (wanderTimer > Phaser.Math.Between(2, 4)) {
          wanderDirection = Phaser.Math.Between(-1, 1) // -1 (left), 0 (idle), or 1 (right)
          enemy.setData('wanderDirection', wanderDirection)
          wanderTimer = 0
        }
        
        // Force movement if idle for more than 1 second
        if (idleTimer > 1 && wanderDirection === 0) {
          wanderDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1
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
    this.playDamageSound()
    
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

    // Skip if player is already dead
    if (this.playerIsDead) return

    // Check if player has invincibility frames
    const lastHitTime = playerSprite.getData('lastHitTime') || 0
    const currentTime = this.time.now
    const invincibilityDuration = 1000 // 1 second of invincibility

    if (currentTime - lastHitTime < invincibilityDuration) {
      return // Player is still invincible
    }
    
    // Debug mode god mode - no damage
    if (this.debugMode) {
      return
    }

    // Check if player has shield - absorb damage and destroy shield
    if (this.hasShield) {
      // Shield absorbs the hit
      this.hasShield = false
      
      // Visual feedback - shield breaking
      if (this.shieldSprite) {
        // Flash and destroy shield
        this.tweens.add({
          targets: this.shieldSprite,
          scale: 2,
          alpha: 0,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            if (this.shieldSprite) {
              this.shieldSprite.destroy()
              this.shieldSprite = null
            }
          }
        })
      }
      
      // Bounce enemy away
      const bounceDirection = enemySprite.x > playerSprite.x ? 1 : -1
      enemySprite.setVelocityX(bounceDirection * 300)
      enemySprite.setVelocityY(-300)
      
      // No damage to player
      return
    }

    // Player takes damage
    this.playerHealth -= 20
    playerSprite.setData('lastHitTime', currentTime)

    // Check if player died
    if (this.playerHealth <= 0) {
      this.playerHealth = 0
      this.handlePlayerDeath()
      return
    }

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

  private handlePlayerDeath() {
    this.playerIsDead = true
    
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
    this.playDeathSound()
    
    // Create particle burst
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
    this.livesText.setText(`Lives: ${this.playerLives}`)
    
    // Flash camera white
    this.cameras.main.flash(500, 255, 255, 255)
  }

  private showGameOver() {
    console.log('🎮🎮🎮 GAME OVER TRIGGERED 🎮🎮🎮')
    console.log('Current Score:', this.score)
    console.log('Current Coins:', this.coinCount)
    console.log('Enemies Defeated:', this.enemiesDefeated)
    
    this.physics.pause()
    
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
    const gameOverText = this.add.text(640, 180, 'GAME OVER', {
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
    const statsText = this.add.text(640, 280, 
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
    const restartBtn = this.add.rectangle(540, 420, 200, 60, 0x00aa00)
    restartBtn.setStrokeStyle(3, 0x00ff00)
    restartBtn.setScrollFactor(0)
    restartBtn.setDepth(2002)
    restartBtn.setInteractive({ useHandCursor: true })
    
    const restartText = this.add.text(540, 420, 'RESTART', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    restartText.setOrigin(0.5)
    restartText.setScrollFactor(0)
    restartText.setDepth(2003)
    
    // Home Button
    const homeBtn = this.add.rectangle(740, 420, 200, 60, 0x0066cc)
    homeBtn.setStrokeStyle(3, 0x0099ff)
    homeBtn.setScrollFactor(0)
    homeBtn.setDepth(2002)
    homeBtn.setInteractive({ useHandCursor: true })
    
    const homeText = this.add.text(740, 420, 'MENU', {
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
      this.scene.restart()
    })
    
    homeBtn.on('pointerdown', () => {
      this.tweens.killAll()
      this.scene.start('MenuScene')
    })
    
    // Keyboard shortcuts
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.tweens.killAll()
      this.scene.restart()
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

  private handleGunAiming() {
    // Skip if player is dead
    if (this.playerIsDead) return
    
    // Get mouse position in world coordinates
    const pointer = this.input.activePointer
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    
    // Calculate angle to mouse first
    const angleToMouse = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      worldPoint.x,
      worldPoint.y
    )
    
    // For sword, position 23 degrees ahead of player relative to mouse direction
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
    
    const pointer = this.input.activePointer
    const currentTime = this.time.now
    
    // Right mouse button for special attack (sword blade throw)
    if (pointer.rightButtonDown() && this.equippedWeapon === 'sword' && currentTime - this.lastShotTime > 2000) {
      this.throwSwordBlade()
      this.lastShotTime = currentTime
      return // Skip normal attack
    }
    
    // Weapon-specific cooldowns and behavior
    let shootCooldown = 1000 // Default raygun cooldown
    let bulletSpeed = 600
    
    if (this.equippedWeapon === 'laserGun') {
      shootCooldown = 300 // Laser gun fires 3x faster
      bulletSpeed = 800 // Faster bullets too
    } else if (this.equippedWeapon === 'sword') {
      shootCooldown = 500 // Sword swings moderately fast
      // Sword will use melee attack instead of bullets
    } else if (this.equippedWeapon === 'bazooka') {
      shootCooldown = 2000 // Very slow fire rate
      bulletSpeed = 400 // Slower rockets
    }
    
    // Check for mouse button press (not held down)
    if (pointer.isDown && currentTime - this.lastShotTime > shootCooldown) {
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
              const coinReward = enemySprite.getData('coinReward')
              const scale = enemySprite.scaleX
              
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
              
              // Respawn after 5 seconds only if location is ahead of player's progress
              this.time.delayedCall(5000, () => {
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
        this.playMeleeSound()
      } else {
        // Ranged weapons: shoot bullets
        // Play shoot sound
        this.playShootSound()
        
        // Calculate gun tip position at the moment of firing
        const gunLength = 40 // Length from gun origin to tip
        const gunAngle = this.gun.rotation
        const bulletStartX = this.gun.x + Math.cos(gunAngle) * gunLength
        const bulletStartY = this.gun.y + Math.sin(gunAngle) * gunLength
        
        // Choose bullet texture based on weapon
        let bulletTexture = 'laserBlue'
        let isRocket = false
        if (this.equippedWeapon === 'laserGun') {
          bulletTexture = 'laserGreen'
        } else if (this.equippedWeapon === 'bazooka') {
          bulletTexture = 'rocket'
          isRocket = true
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
          
          // Disable physics for this bullet - use data to track movement
          bullet.body!.setEnable(false)
          
          // Store bullet direction and speed locked at time of firing
          bullet.setData('velocityX', Math.cos(gunAngle) * bulletSpeed)
          bullet.setData('velocityY', Math.sin(gunAngle) * bulletSpeed)
          bullet.setData('createdTime', currentTime)
          bullet.setData('initialScaleX', 0.5)
          bullet.setData('angle', gunAngle)
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

  private updateBullets() {
    const currentTime = this.time.now
    const bulletLifetime = 3000 // 3 seconds
    const fadeStartTime = 2500 // Start fading at 2.5 seconds
    
    this.bullets.children.entries.forEach((bullet: any) => {
      if (!bullet.active) return
      
      const sprite = bullet as Phaser.Physics.Arcade.Sprite
      const createdTime = sprite.getData('createdTime')
      const age = currentTime - createdTime
      
      // Move bullet manually
      const velX = sprite.getData('velocityX')
      const velY = sprite.getData('velocityY')
      sprite.x += velX * 0.016 // Assuming ~60fps
      sprite.y += velY * 0.016
      
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
    
    // Damage enemy (rockets do 5x damage to 2-shot worms)
    const damage = isRocket ? 5 : 1
    let health = enemySprite.getData('health')
    health -= damage
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
      
      // Respawn after 5 seconds only if location is ahead of player's progress
      this.time.delayedCall(5000, () => {
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
  
  // ========== SOUND EFFECTS ==========
  
  private playJumpSound(doubleJump: boolean = false) {
    if (!this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'square'
    oscillator.frequency.value = doubleJump ? 600 : 400
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.1)
  }
  
  private playShootSound() {
    if (!this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.05)
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.05)
  }
  
  private playMeleeSound() {
    if (!this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    const noiseNode = this.audioContext.createBufferSource()
    
    // Create white noise buffer
    const bufferSize = this.audioContext.sampleRate * 0.1
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    noiseNode.buffer = buffer
    
    oscillator.connect(gainNode)
    noiseNode.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'square'
    oscillator.frequency.value = 150
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
    
    oscillator.start(this.audioContext.currentTime)
    noiseNode.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.1)
    noiseNode.stop(this.audioContext.currentTime + 0.1)
  }
  
  private playCoinSound() {
    if (!this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.05)
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.15)
  }
  
  private playDamageSound() {
    if (!this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2)
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.2)
  }
  
  private playDeathSound() {
    if (!this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5)
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.5)
  }
  
  private playBossSound() {
    if (!this.audioContext?.createOscillator) return
    
    // Deep rumble for boss spawn
    const oscillator1 = this.audioContext.createOscillator()
    const oscillator2 = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator1.type = 'sine'
    oscillator2.type = 'sawtooth'
    oscillator1.frequency.value = 80
    oscillator2.frequency.value = 120
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0)
    
    oscillator1.start(this.audioContext.currentTime)
    oscillator2.start(this.audioContext.currentTime)
    oscillator1.stop(this.audioContext.currentTime + 1.0)
    oscillator2.stop(this.audioContext.currentTime + 1.0)
  }
  
  private playBossAttackSound() {
    if (!this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime)
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.15)
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
    // Create Speed Power-up (Yellow Lightning Bolt)
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
    
    // Create Shield Power-up (Blue Shield)
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
    
    // Create Life Power-up (Green Heart)
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
    
    // Create Coin (Gold Circle with shine)
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
    
    // Create Spikes (Red triangular spikes)
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
  
  private updateScore(points: number) {
    this.score += points
    this.scoreText.setText(`Score: ${this.score}`)
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score
      this.highScoreText.setText(`Best: ${this.highScore}`)
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
    this.debugText = this.add.text(16, 16, 'DEBUG MODE [F3]', {
      fontSize: '20px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    })
    this.debugText.setScrollFactor(0)
    this.debugText.setDepth(10000)
    this.debugText.setVisible(false)
    
    // FPS counter
    this.fpsText = this.add.text(16, 46, 'FPS: 60', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    })
    this.fpsText.setScrollFactor(0)
    this.fpsText.setDepth(10000)
    this.fpsText.setVisible(false)
    
    // Coordinates
    this.coordText = this.add.text(16, 76, 'X: 0, Y: 0', {
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
    
    // Toggle debug graphics
    if (this.debugMode) {
      this.physics.world.createDebugGraphic()
      this.debugText?.setVisible(true)
      this.fpsText?.setVisible(true)
      this.coordText?.setVisible(true)
      console.log('Debug mode enabled - showing physics bodies')
    } else {
      this.physics.world.debugGraphic?.clear()
      this.physics.world.debugGraphic?.destroy()
      this.debugText?.setVisible(false)
      this.fpsText?.setVisible(false)
      this.coordText?.setVisible(false)
      console.log('Debug mode disabled')
    }
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
}
