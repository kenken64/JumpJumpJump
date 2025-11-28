/**
 * PlayerManager.ts
 * Manages player state, movement, combat, and health
 * Extracted from the monolithic GameScene.ts
 */

import Phaser from 'phaser'
import {
  PlayerState,
  PlayerConfig,
  PlayerInput,
  WeaponType,
  WEAPON_CONFIGS,
  GAME_EVENTS
} from '../types/GameTypes'
import { AudioManager } from '../utils/AudioManager'

export class PlayerManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene
  private audioManager: AudioManager
  
  // Player sprite and components
  public player!: Phaser.Physics.Arcade.Sprite
  public gun!: Phaser.GameObjects.Image
  public bullets!: Phaser.Physics.Arcade.Group
  public shieldSprite: Phaser.GameObjects.Sprite | null = null
  
  // State
  private state: PlayerState
  private config: PlayerConfig
  private lastShotTime: number = 0
  
  // Particles
  private jumpParticles!: Phaser.GameObjects.Particles.ParticleEmitter
  private landParticles!: Phaser.GameObjects.Particles.ParticleEmitter
  private wasOnGround: boolean = false

  constructor(
    scene: Phaser.Scene,
    audioManager: AudioManager,
    config: Partial<PlayerConfig> = {}
  ) {
    super()
    this.scene = scene
    this.audioManager = audioManager
    
    // Default config
    this.config = {
      spawnX: 400,
      spawnY: 550,
      speed: 200,
      jumpVelocity: -500,
      equippedSkin: localStorage.getItem('equippedSkin') || 'alienBeige',
      equippedWeapon: localStorage.getItem('equippedWeapon') || 'raygun',
      ...config
    }
    
    // Initial state
    this.state = {
      health: 100,
      maxHealth: 100,
      lives: 3,
      score: 0,
      coins: parseInt(localStorage.getItem('playerCoins') || '0'),
      isDead: false,
      canDoubleJump: true,
      hasDoubleJumped: false,
      isStomping: false,
      hasSpeedBoost: false,
      hasShield: false
    }
  }

  // ==================== INITIALIZATION ====================

  create(platforms: Phaser.Physics.Arcade.StaticGroup): void {
    this.createAnimations()
    this.createPlayer()
    this.createGun()
    this.createBullets()
    this.createParticles()
    this.setupCollisions(platforms)
  }

  private createAnimations(): void {
    const skin = this.config.equippedSkin
    
    // Idle animation
    if (!this.scene.anims.exists('player_idle')) {
      this.scene.anims.create({
        key: 'player_idle',
        frames: [{ key: `${skin}_stand` }],
        frameRate: 1,
        repeat: -1
      })
    }

    // Walk animation
    if (!this.scene.anims.exists('player_walk')) {
      this.scene.anims.create({
        key: 'player_walk',
        frames: [
          { key: `${skin}_walk1` },
          { key: `${skin}_walk2` }
        ],
        frameRate: 8,
        repeat: -1
      })
    }

    // Jump animation
    if (!this.scene.anims.exists('player_jump')) {
      this.scene.anims.create({
        key: 'player_jump',
        frames: [{ key: `${skin}_jump` }],
        frameRate: 1
      })
    }
  }

  private createPlayer(): void {
    this.player = this.scene.physics.add.sprite(
      this.config.spawnX,
      this.config.spawnY,
      `${this.config.equippedSkin}_stand`
    )
    
    this.player.setCollideWorldBounds(false)
    this.player.setDepth(5)
    this.player.play('player_idle')
    
    // Setup physics body
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setSize(this.player.width * 0.6, this.player.height * 0.9)
    body.setOffset(this.player.width * 0.2, this.player.height * 0.1)
    body.setMaxVelocity(400, 800)
  }

  private createGun(): void {
    this.gun = this.scene.add.image(
      this.player.x + 20,
      this.player.y,
      this.config.equippedWeapon
    )
    this.gun.setOrigin(0.2, 0.5)
    this.gun.setDepth(6)
  }

  private createBullets(): void {
    this.bullets = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 50,
      runChildUpdate: true
    })
  }

  private createParticles(): void {
    // Jump particles
    this.jumpParticles = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 300,
      gravityY: 200
    })
    this.jumpParticles.stop()

    // Land particles
    this.landParticles = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 200,
      angle: { min: -150, max: -30 }
    })
    this.landParticles.stop()
  }

  private setupCollisions(platforms: Phaser.Physics.Arcade.StaticGroup): void {
    this.scene.physics.add.collider(this.player, platforms)
  }

  // ==================== UPDATE LOOP ====================

  update(input: PlayerInput, debugMode: boolean = false): void {
    if (this.state.isDead) return

    this.handleMovement(input, debugMode)
    this.handleJump(input, debugMode)
    this.handleGunAiming(input)
    this.handleShooting(input)
    this.detectLanding()
  }

  private handleMovement(input: PlayerInput, debugMode: boolean): void {
    let speed = this.config.speed
    if (this.state.hasSpeedBoost) speed *= 1.5
    if (debugMode) speed *= 2

    const body = this.player.body as Phaser.Physics.Arcade.Body
    const onGround = body.touching.down || body.blocked.down

    if (input.moveLeft) {
      body.setVelocityX(-speed)
      this.player.setFlipX(true)
      if (onGround) this.player.play('player_walk', true)
    } else if (input.moveRight) {
      body.setVelocityX(speed)
      this.player.setFlipX(false)
      if (onGround) this.player.play('player_walk', true)
    } else {
      body.setVelocityX(0)
      if (onGround) this.player.play('player_idle', true)
    }
  }

  private handleJump(input: PlayerInput, debugMode: boolean): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const onGround = body.touching.down || body.blocked.down

    // Reset double jump when on ground
    if (onGround) {
      this.state.canDoubleJump = true
      this.state.hasDoubleJumped = false
      this.state.isStomping = false
    }

    // Debug flight mode
    if (debugMode && input.jump) {
      body.setVelocityY(-400)
      return
    }

    if (input.jump) {
      if (onGround) {
        // First jump
        body.setVelocityY(this.config.jumpVelocity)
        this.player.play('player_jump', true)
        this.audioManager.playJumpSound()
        this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
        this.state.canDoubleJump = true
        this.state.hasDoubleJumped = false
      } else if (this.state.canDoubleJump && !this.state.hasDoubleJumped) {
        // Double jump
        body.setVelocityY(this.config.jumpVelocity)
        this.player.play('player_jump', true)
        this.audioManager.playJumpSound(true)
        this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 30)
        this.state.hasDoubleJumped = true

        // Spin effect
        this.scene.tweens.add({
          targets: this.player,
          angle: 360,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => this.player.setAngle(0)
        })
      }
    }
  }

  private handleGunAiming(input: PlayerInput): void {
    let aimX = input.aimX ?? this.player.x + (this.player.flipX ? -100 : 100)
    let aimY = input.aimY ?? this.player.y

    const angleToAim = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      aimX,
      aimY
    )

    // Adjust for sword
    let gunAngle = angleToAim
    if (this.config.equippedWeapon === 'sword') {
      gunAngle += Phaser.Math.DegToRad(23)
    }

    // Position gun
    const distanceFromPlayer = 30
    const gunX = this.player.x + Math.cos(gunAngle) * distanceFromPlayer
    const gunY = this.player.y + Math.sin(gunAngle) * distanceFromPlayer
    this.gun.setPosition(gunX, gunY)

    // Flip gun if pointing backward
    if (gunAngle > Math.PI / 2 || gunAngle < -Math.PI / 2) {
      this.gun.setScale(1.0, -1.0)
    } else {
      this.gun.setScale(1.0, 1.0)
    }

    this.gun.setRotation(gunAngle)
  }

  private handleShooting(input: PlayerInput): void {
    if (!input.shoot) return

    const weaponConfig = WEAPON_CONFIGS[this.config.equippedWeapon as WeaponType]
    const currentTime = this.scene.time.now

    if (currentTime - this.lastShotTime < weaponConfig.cooldown) return

    this.lastShotTime = currentTime
    this.fireBullet(weaponConfig)
  }

  private fireBullet(weaponConfig: typeof WEAPON_CONFIGS[WeaponType]): void {
    const bullet = this.bullets.get(this.gun.x, this.gun.y, weaponConfig.projectileKey)
    if (!bullet) return

    bullet.setActive(true)
    bullet.setVisible(true)
    bullet.setDepth(4)

    const angle = this.gun.rotation
    const velocity = weaponConfig.projectileSpeed
    
    bullet.setVelocity(
      Math.cos(angle) * velocity,
      Math.sin(angle) * velocity
    )
    bullet.setRotation(angle)
    bullet.setData('damage', weaponConfig.damage)

    // Physics body
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)

    // Auto-destroy after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.setActive(false)
        bullet.setVisible(false)
      }
    })

    this.audioManager.playShootSound()
  }

  private detectLanding(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const onGround = body.touching.down || body.blocked.down

    if (onGround && !this.wasOnGround) {
      this.landParticles.emitParticleAt(this.player.x, this.player.y + 30)
    }
    this.wasOnGround = onGround
  }

  // ==================== DAMAGE & HEALTH ====================

  damage(amount: number): void {
    if (this.state.isDead || this.state.hasShield) return

    this.state.health = Math.max(0, this.state.health - amount)
    this.emit(GAME_EVENTS.PLAYER_DAMAGED, { health: this.state.health, damage: amount })

    // Visual feedback
    this.player.setTint(0xff0000)
    this.scene.time.delayedCall(200, () => {
      if (this.player.active) this.player.clearTint()
    })

    // Knockback
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-200)

    this.audioManager.playDamageSound()

    if (this.state.health <= 0) {
      this.die()
    }
  }

  heal(amount: number): void {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount)
  }

  private die(): void {
    this.state.lives--
    this.state.isDead = true

    this.emit(GAME_EVENTS.PLAYER_DIED, { lives: this.state.lives })

    // Death animation
    this.player.play('player_hurt', true)
    this.player.setVelocity(0, -300)
    
    this.scene.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        if (this.state.lives > 0) {
          this.respawn()
        } else {
          this.emit(GAME_EVENTS.GAME_OVER, { score: this.state.score })
        }
      }
    })
  }

  respawn(): void {
    this.state.isDead = false
    this.state.health = this.state.maxHealth
    
    this.player.setPosition(this.config.spawnX, this.config.spawnY)
    this.player.setAlpha(1)
    this.player.setVelocity(0, 0)
    this.player.clearTint()
    this.player.play('player_idle')

    this.emit(GAME_EVENTS.PLAYER_RESPAWNED, { lives: this.state.lives })
  }

  // ==================== POWER-UPS ====================

  activateSpeedBoost(duration: number): void {
    this.state.hasSpeedBoost = true
    this.scene.time.delayedCall(duration, () => {
      this.state.hasSpeedBoost = false
    })
  }

  activateShield(duration: number): void {
    this.state.hasShield = true
    
    // Create shield visual
    if (!this.shieldSprite) {
      this.shieldSprite = this.scene.add.sprite(this.player.x, this.player.y, 'powerShield')
      this.shieldSprite.setScale(1.5)
      this.shieldSprite.setAlpha(0.5)
      this.shieldSprite.setDepth(7)
    }

    this.scene.time.delayedCall(duration, () => {
      this.state.hasShield = false
      if (this.shieldSprite) {
        this.shieldSprite.destroy()
        this.shieldSprite = null
      }
    })
  }

  addLife(): void {
    this.state.lives++
  }

  // ==================== SCORE & COINS ====================

  addScore(amount: number): void {
    this.state.score += amount
  }

  addCoins(amount: number): void {
    this.state.coins += amount
    localStorage.setItem('playerCoins', this.state.coins.toString())
    this.emit(GAME_EVENTS.COIN_COLLECTED, { coins: this.state.coins, amount })
  }

  // ==================== GETTERS ====================

  getState(): PlayerState {
    return { ...this.state }
  }

  getPosition(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y }
  }

  getVelocity(): { x: number; y: number } {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    return { x: body.velocity.x, y: body.velocity.y }
  }

  isOnGround(): boolean {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    return body.touching.down || body.blocked.down
  }

  // ==================== SETTERS ====================

  setLives(lives: number): void {
    this.state.lives = lives
  }

  setScore(score: number): void {
    this.state.score = score
  }

  setSpawnPoint(x: number, y: number): void {
    this.config.spawnX = x
    this.config.spawnY = y
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    this.player?.destroy()
    this.gun?.destroy()
    this.bullets?.destroy(true)
    this.shieldSprite?.destroy()
    this.jumpParticles?.destroy()
    this.landParticles?.destroy()
    this.removeAllListeners()
  }
}
