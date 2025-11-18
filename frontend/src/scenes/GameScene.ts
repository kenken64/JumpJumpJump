import Phaser from 'phaser'

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
  private playerSpawnY: number = 300
  private healthBarBackground!: Phaser.GameObjects.Rectangle
  private healthBarFill!: Phaser.GameObjects.Rectangle
  private livesText!: Phaser.GameObjects.Text
  private reloadBarBackground!: Phaser.GameObjects.Rectangle
  private reloadBarFill!: Phaser.GameObjects.Rectangle
  private coins!: Phaser.Physics.Arcade.Group
  private coinCount: number = 0
  private coinText!: Phaser.GameObjects.Text
  private coinIcon!: Phaser.GameObjects.Image
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
  private distanceText!: Phaser.GameObjects.Text
  private gameModeText!: Phaser.GameObjects.Text

  constructor() {
    super('GameScene')
  }

  preload() {
    // Load alien sprites (using alienBeige as the player)
    this.load.image('alienBeige_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_stand.png')
    this.load.image('alienBeige_walk1', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_walk1.png')
    this.load.image('alienBeige_walk2', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_walk2.png')
    this.load.image('alienBeige_jump', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_jump.png')
    this.load.image('alienBeige_hurt', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_hurt.png')
    this.load.image('alienBeige_duck', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_duck.png')

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
  }

  create() {
    // Get game mode and level from scene data (passed from menu)
    const data = this.scene.settings.data as any
    this.gameMode = data?.gameMode || 'levels'
    this.currentLevel = data?.level || 1
    
    // Reset all state variables
    this.playerIsDead = false
    this.playerHealth = 100
    this.playerLives = 3
    
    // Load coin count from localStorage
    const savedCoins = localStorage.getItem('playerCoins')
    this.coinCount = savedCoins ? parseInt(savedCoins) : 0
    
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
    
    // Set world bounds (infinite to the right)
    this.physics.world.setBounds(0, 0, 100000, 1200)
    this.cameras.main.setBounds(0, 0, 100000, 1200)

    // Set world gravity (microgravity)
    this.physics.world.gravity.y = 400

    // Create platforms with procedural generation
    this.platforms = this.physics.add.staticGroup()
    this.spikes = this.physics.add.staticGroup()
    this.generateWorld()

    // Create player animations FIRST before creating the player sprite
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'alienBeige_stand' }],
      frameRate: 1,
      repeat: -1
    })

    this.anims.create({
      key: 'player_walk',
      frames: [
        { key: 'alienBeige_walk1' },
        { key: 'alienBeige_walk2' }
      ],
      frameRate: 8,
      repeat: -1
    })

    this.anims.create({
      key: 'player_jump',
      frames: [{ key: 'alienBeige_jump' }],
      frameRate: 1
    })

    // Create player
    this.player = this.physics.add.sprite(400, 300, 'alienBeige_stand')
    this.player.setBounce(0.1)
    this.player.setCollideWorldBounds(true)
    this.player.setGravityY(200)
    this.player.play('player_idle') // Start with idle animation

    // Create gun (visual representation using raygun sprite)
    this.gun = this.add.image(0, 0, 'raygun')
    this.gun.setOrigin(0, 0.5) // Pivot from the base of the gun
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

    // Setup collisions
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.enemies, this.enemies) // Enemies collide with each other
    this.physics.add.collider(this.blockFragments, this.platforms)
    this.physics.add.collider(this.bullets, this.platforms, this.handleBulletPlatformCollision, undefined, this)
    this.physics.add.collider(this.coins, this.platforms)
    
    // Setup player-enemy collision with overlap detection
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this)
    
    // Setup bullet-enemy collision
    this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyCollision, undefined, this)
    
    // Setup coin collection
    this.physics.add.overlap(this.player, this.coins, this.collectCoin as any, undefined, this)
    
    // No collider with spikes - we'll handle manually in update

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    
    // Create UI elements
    this.createUI()
  }

  private createUI() {
    const startX = this.cameras.main.width - 20
    const startY = 20
    
    // Create game mode indicator (top left)
    this.gameModeText = this.add.text(20, 20, this.gameMode === 'endless' ? 'MODE: ENDLESS' : `LEVEL ${this.currentLevel}`, {
      fontSize: '28px',
      color: this.gameMode === 'endless' ? '#00ffff' : '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    this.gameModeText.setScrollFactor(0)
    
    // Create distance tracker (below mode)
    this.distanceText = this.add.text(20, 55, 'Distance: 0m', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.distanceText.setScrollFactor(0)
    
    // Create lives counter (top right)
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
    
    // Create coin counter UI (top-left)
    this.coinIcon = this.add.image(30, 20, 'coin')
    this.coinIcon.setScrollFactor(0)
    this.coinIcon.setScale(0.4)
    
    this.coinText = this.add.text(55, 10, '0', {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    this.coinText.setScrollFactor(0)
    
    // Create home button (top-right)
    const homeButton = this.add.image(1230, 30, 'homeIcon')
    homeButton.setScrollFactor(0)
    homeButton.setScale(0.8)
    homeButton.setInteractive({ useHandCursor: true })
    homeButton.on('pointerover', () => homeButton.setScale(0.9))
    homeButton.on('pointerout', () => homeButton.setScale(0.8))
    homeButton.on('pointerdown', () => {
      // Save coins before returning to menu
      localStorage.setItem('playerCoins', this.coinCount.toString())
      this.scene.start('MenuScene')
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
    // Spawn coins at various positions throughout the world
    const coinPositions = [
      { x: 600, y: 800 },
      { x: 1000, y: 600 },
      { x: 1400, y: 500 },
      { x: 1800, y: 700 },
      { x: 2200, y: 600 },
      { x: 2600, y: 800 },
      { x: 3000, y: 500 },
      { x: 800, y: 400 },
      { x: 1200, y: 900 },
      { x: 1600, y: 400 },
      { x: 2000, y: 800 },
      { x: 2400, y: 500 },
      { x: 2800, y: 700 },
      { x: 500, y: 600 },
      { x: 1100, y: 450 }
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
    
    // Save coins to localStorage
    localStorage.setItem('playerCoins', this.coinCount.toString())
    
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

  private dropCoins(x: number, y: number, count: number) {
    // Drop coins at the enemy's position
    for (let i = 0; i < count; i++) {
      // Spawn coin with slight delay and spread
      this.time.delayedCall(i * 50, () => {
        const offsetX = Phaser.Math.Between(-30, 30)
        const offsetY = Phaser.Math.Between(-20, 0)
        const coin = this.coins.create(x + offsetX, y + offsetY, 'coinGold')
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
    
    // Create safe spawn platform (500 pixels wide, no enemies)
    const spawnPlatformWidth = 500
    for (let x = 0; x < spawnPlatformWidth; x += tileSize) {
      const tile = this.platforms.create(x, floorY, 'metalMid')
      tile.setOrigin(0, 0.5)
      tile.refreshBody()
    }
    
    // Add decorative pillars on spawn platform edges
    for (let i = 0; i < 3; i++) {
      const leftPillar = this.platforms.create(0, floorY - (i + 1) * tileSize, 'metalCenter')
      leftPillar.setOrigin(0, 0.5)
      leftPillar.refreshBody()
      
      const rightPillar = this.platforms.create(spawnPlatformWidth - tileSize, floorY - (i + 1) * tileSize, 'metalCenter')
      rightPillar.setOrigin(0, 0.5)
      rightPillar.refreshBody()
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
      const tile = this.platforms.create(x, floorY, floorTile)
      tile.setOrigin(0, 0.5)
      tile.refreshBody()
      
      // Check if we need to switch biome
      if (x - (this.worldGenerationX - this.lastGeneratedX) >= this.biomeLength) {
        this.switchBiome()
      }
    }
    
    // Generate structures within chunk
    let currentX = startX + 100
    const maxX = startX + chunkWidth - 100
    
    while (currentX < maxX) {
      const structureType = Math.random()
      
      if (structureType < 0.3) {
        // Floating platform
        const platformWidth = Phaser.Math.Between(2, 4)
        const platformY = Phaser.Math.Between(400, 550)
        for (let i = 0; i < platformWidth; i++) {
          const platform = this.platforms.create(currentX + i * tileSize, platformY, platformTile)
          platform.setOrigin(0, 0.5)
          platform.refreshBody()
        }
        currentX += Phaser.Math.Between(150, 300)
      } else if (structureType < 0.5) {
        // Staircase
        const steps = Phaser.Math.Between(4, 7)
        let stepY = 580
        for (let i = 0; i < steps; i++) {
          const step = this.platforms.create(currentX + i * tileSize, stepY, platformTile)
          step.setOrigin(0, 0.5)
          step.refreshBody()
          stepY -= tileSize
        }
        currentX += Phaser.Math.Between(300, 500)
      } else if (structureType < 0.7) {
        // Pillar
        const pillarHeight = Phaser.Math.Between(3, 6)
        const pillarTopY = Phaser.Math.Between(400, 550)
        for (let i = 0; i < pillarHeight; i++) {
          const block = this.platforms.create(currentX, pillarTopY + i * tileSize, wallTile)
          block.setOrigin(0, 0.5)
          block.refreshBody()
        }
        // Platform on top
        for (let i = 0; i < 3; i++) {
          const platform = this.platforms.create(currentX + (i - 1) * tileSize, pillarTopY, platformTile)
          platform.setOrigin(0, 0.5)
          platform.refreshBody()
        }
        currentX += Phaser.Math.Between(200, 350)
      } else if (structureType < 0.85) {
        // Gap (no structure)
        currentX += Phaser.Math.Between(150, 250)
      } else {
        // Spike trap on floor
        const spikeWidth = Phaser.Math.Between(2, 4)
        for (let i = 0; i < spikeWidth; i++) {
          const spike = this.spikes.create(currentX + i * tileSize, floorY - tileSize, 'spikes')
          spike.setOrigin(0, 0.5)
          spike.refreshBody()
        }
        // Track spike position for coin spawn prevention
        this.spikePositions.push({
          x: currentX,
          y: floorY - tileSize,
          width: spikeWidth * tileSize
        })
        currentX += Phaser.Math.Between(150, 300)
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
    
    // Check if player reached the end
    if (this.player.x >= this.levelLength) {
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
    
    const nextText = this.add.text(640, 520, 'Press SPACE for Next Level\nPress E for Endless Mode\nPress M for Menu', {
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
    // Player movement
    this.handlePlayerMovement()
    
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
  }

  private updateUI() {
    // Update distance
    const distanceMeters = Math.floor(this.player.x / 100)
    this.distanceText.setText(`Distance: ${distanceMeters}m`)
    
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
    const shootCooldown = 1000 // Same as shooting cooldown
    
    // Calculate reload progress (0 to 1)
    const reloadProgress = Math.min(timeSinceLastShot / shootCooldown, 1)
    
    // Update reload bar width
    const reloadBarMaxWidth = 60
    this.reloadBarFill.width = reloadBarMaxWidth * reloadProgress
  }

  private handlePlayerMovement() {
    // Skip if player is dead
    if (this.playerIsDead) return
    
    const speed = 200
    const jumpVelocity = -500 // Higher jump due to microgravity

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
    if (this.wasd.a.isDown || this.cursors.left!.isDown) {
      this.player.setVelocityX(-speed)
      this.player.setFlipX(true)
      if (onGround) {
        this.player.play('player_walk', true)
      }
    } else if (this.wasd.d.isDown || this.cursors.right!.isDown) {
      this.player.setVelocityX(speed)
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

    // Jump (W or Up arrow)
    if (Phaser.Input.Keyboard.JustDown(this.wasd.w) || Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      console.log('Jump pressed! onGround:', onGround, 'canDoubleJump:', this.canDoubleJump, 'hasDoubleJumped:', this.hasDoubleJumped)
      
      if (onGround) {
        // First jump from ground
        console.log('Ground jump!')
        this.player.setVelocityY(jumpVelocity)
        this.player.play('player_jump', true)
        this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
        this.stompStartY = this.player.y
        this.canDoubleJump = true // Enable double jump after first jump
        this.hasDoubleJumped = false
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // Double jump - can be used at any height after first jump
        console.log('Double jump!')
        this.player.setVelocityY(jumpVelocity)
        this.player.play('player_jump', true)
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

    // Stomp (S key - Easter egg)
    if (Phaser.Input.Keyboard.JustDown(this.wasd.s) && !onGround && !this.isStomping) {
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
        
        enemy.play('enemy_walk', true)
        
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
          enemy.play('enemy_walk', true)
          idleTimer = 0 // Reset idle timer when moving
        } else {
          enemy.setVelocityX(0)
          enemy.play('enemy_idle', true)
        }
        
        // Save updated timers
        enemy.setData('idleTimer', idleTimer)
        enemy.setData('wanderTimer', wanderTimer)
      }
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
    
    // Hide gun
    this.gun.setVisible(false)
    
    // Change to duck/sit sprite (sad pose)
    this.player.setTexture('alienBeige_duck')
    
    // Turn player red
    this.player.setTint(0xff0000)
    
    // Fade out player
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 1500,
      ease: 'Linear',
      onComplete: () => {
        // Lose a life
        this.playerLives--
        
        if (this.playerLives <= 0) {
          // Game Over
          this.showGameOver()
        } else {
          // Respawn with full health
          this.respawnPlayer()
        }
      }
    })
  }

  private respawnPlayer() {
    // Reset player position to last checkpoint
    const checkpointX = this.checkpoints[this.currentCheckpoint]?.x || this.playerSpawnX
    this.player.setPosition(checkpointX, this.playerSpawnY)
    this.player.setAlpha(1)
    this.player.setTexture('alienBeige_stand')
    this.player.setGravityY(200)
    this.player.body!.enable = true
    this.player.play('player_idle')
    this.player.clearTint()
    
    // Reset health to full
    this.playerHealth = this.maxHealth
    this.playerIsDead = false
    this.gun.setVisible(true)
    this.lastShotTime = 0
    
    // Flash camera
    this.cameras.main.flash(500, 255, 255, 255)
  }

  private showGameOver() {
    // Create game over text
    const gameOverText = this.add.text(640, 300, 'GAME OVER', {
      fontSize: '72px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    })
    gameOverText.setOrigin(0.5)
    gameOverText.setScrollFactor(0)
    
    // Show final score
    const scoreText = this.add.text(640, 400, `Coins Collected: ${this.coinCount}`, {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    scoreText.setOrigin(0.5)
    scoreText.setScrollFactor(0)
    
    // Restart prompt
    const restartText = this.add.text(640, 500, 'Press SPACE to Restart', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    })
    restartText.setOrigin(0.5)
    restartText.setScrollFactor(0)
    
    // Blinking animation
    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    })
    
    // Restart on space
    this.input.keyboard!.once('keydown-SPACE', () => {
      // Clear all tweens before restart
      this.tweens.killAll()
      this.scene.restart()
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
    
    // Position gun around player center with distance
    const distanceFromPlayer = 30 // Distance from player center
    const gunX = this.player.x + Math.cos(angleToMouse) * distanceFromPlayer
    const gunY = this.player.y + Math.sin(angleToMouse) * distanceFromPlayer
    this.gun.setPosition(gunX, gunY)
    
    // Flip gun sprite vertically if pointing upward to prevent upside-down appearance
    if (angleToMouse > Math.PI / 2 || angleToMouse < -Math.PI / 2) {
      this.gun.setScale(1.0, -1.0) // Flip Y
    } else {
      this.gun.setScale(1.0, 1.0) // Normal
    }
    
    // Apply rotation directly without any clamping
    this.gun.setRotation(angleToMouse)
  }

  private handleShooting() {
    // Skip if player is dead
    if (this.playerIsDead) return
    
    const pointer = this.input.activePointer
    const currentTime = this.time.now
    const shootCooldown = 1000 // 1000ms (1 second) between shots
    
    // Check for mouse button press (not held down)
    if (pointer.isDown && currentTime - this.lastShotTime > shootCooldown) {
      this.lastShotTime = currentTime
      
      // Calculate gun tip position at the moment of firing
      const gunLength = 40 // Length from gun origin to tip
      const gunAngle = this.gun.rotation
      const bulletStartX = this.gun.x + Math.cos(gunAngle) * gunLength
      const bulletStartY = this.gun.y + Math.sin(gunAngle) * gunLength
      
      // Create bullet at gun mouth
      const bullet = this.bullets.get(bulletStartX, bulletStartY, 'laserBlue')
      
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setScale(0.5, 0.5)
        bullet.setRotation(gunAngle)
        bullet.setAlpha(1)
        
        // Disable physics for this bullet - use data to track movement
        bullet.body!.setEnable(false)
        
        // Store bullet direction and speed locked at time of firing
        const bulletSpeed = 600
        bullet.setData('velocityX', Math.cos(gunAngle) * bulletSpeed)
        bullet.setData('velocityY', Math.sin(gunAngle) * bulletSpeed)
        bullet.setData('createdTime', currentTime)
        bullet.setData('initialScaleX', 0.5)
        bullet.setData('angle', gunAngle)
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
      
      // After 2.5 seconds, start shrinking and fading
      if (age >= fadeStartTime) {
        const fadeProgress = (age - fadeStartTime) / (bulletLifetime - fadeStartTime)
        sprite.setAlpha(1 - fadeProgress)
        sprite.setScale(sprite.getData('initialScaleX') * (1 - fadeProgress * 0.7), 0.5)
      }
      
      // Destroy after lifetime
      if (age >= bulletLifetime) {
        sprite.setActive(false)
        sprite.setVisible(false)
      }
    })
  }

  private handleBulletPlatformCollision(bullet: any) {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite
    bulletSprite.setActive(false)
    bulletSprite.setVisible(false)
  }

  private handleBulletEnemyCollision(bullet: any, enemy: any) {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite
    
    // Destroy bullet
    bulletSprite.setActive(false)
    bulletSprite.setVisible(false)
    
    // Damage enemy
    let health = enemySprite.getData('health')
    health -= 1
    enemySprite.setData('health', health)
    
    // Flash red to show damage
    enemySprite.setTint(0xff0000)
    this.time.delayedCall(100, () => {
      enemySprite.clearTint()
    })
    
    // Check if enemy is dead
    if (health <= 0) {
      const spawnX = enemySprite.getData('spawnX')
      const spawnY = enemySprite.getData('spawnY')
      const enemyType = enemySprite.getData('enemyType')
      const coinReward = enemySprite.getData('coinReward')
      const scale = enemySprite.scaleX
      
      // Drop coins
      this.dropCoins(enemySprite.x, enemySprite.y, coinReward)
      
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
      
      // Respawn after 5 seconds with same type
      this.time.delayedCall(5000, () => {
        const difficultyMultiplier = this.gameMode === 'endless' 
          ? 1 + Math.floor(this.player.x / 5000) * 0.2 
          : 1 + (this.currentLevel - 1) * 0.3
        this.spawnRandomEnemy(spawnX, spawnY, difficultyMultiplier)
      })
    }
  }
}
