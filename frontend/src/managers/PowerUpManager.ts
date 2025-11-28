/**
 * PowerUpManager.ts
 * Manages power-up spawning, collection, effects, and timers
 * Extracted from the monolithic GameScene.ts
 */

import Phaser from 'phaser'
import { PowerUpType, GAME_EVENTS, POWERUP_CONFIGS } from '../types/GameTypes'

export interface PowerUpState {
  hasSpeedBoost: boolean
  hasShield: boolean
  speedBoostTimeRemaining: number
  shieldTimeRemaining: number
}

export class PowerUpManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene
  
  // Power-up group
  public powerUps!: Phaser.Physics.Arcade.Group
  
  // Active power-up states
  private hasSpeedBoost: boolean = false
  private hasShield: boolean = false
  private shieldSprite: Phaser.GameObjects.Sprite | null = null
  
  // Timers
  private speedBoostTimer: Phaser.Time.TimerEvent | null = null
  private shieldTimer: Phaser.Time.TimerEvent | null = null

  constructor(scene: Phaser.Scene) {
    super()
    this.scene = scene
  }

  // ==================== INITIALIZATION ====================

  create(): void {
    this.powerUps = this.scene.physics.add.group({
      runChildUpdate: true
    })
  }

  // ==================== SPAWNING ====================

  spawnPowerUpsInArea(startX: number, endX: number, platformY: number = 500): void {
    const powerUpTypes: PowerUpType[] = ['powerSpeed', 'powerShield', 'powerLife', 'powerHealth']
    const numPowerUps = Phaser.Math.Between(1, 3)

    for (let i = 0; i < numPowerUps; i++) {
      const x = Phaser.Math.Between(startX + 100, endX - 100)
      const y = platformY - 50 // Above platform
      const type = Phaser.Math.RND.pick(powerUpTypes)

      this.spawnPowerUp(x, y, type)
    }
  }

  spawnPowerUp(x: number, y: number, type: PowerUpType): Phaser.Physics.Arcade.Sprite {
    const powerUp = this.powerUps.create(x, y, type) as Phaser.Physics.Arcade.Sprite
    
    powerUp.setScale(0.6)
    powerUp.setBounce(0.2)
    powerUp.setCollideWorldBounds(true)
    powerUp.setData('type', type)

    // Add floating animation
    this.scene.tweens.add({
      targets: powerUp,
      y: y - 15,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Add glow effect
    this.scene.tweens.add({
      targets: powerUp,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    return powerUp
  }

  spawnInitialPowerUps(): void {
    // Spawn initial power-ups across the starting area
    const powerUpTypes: PowerUpType[] = ['powerSpeed', 'powerShield', 'powerLife', 'powerHealth', 'powerHealth']
    const numPowerUps = 10

    for (let i = 0; i < numPowerUps; i++) {
      const x = Phaser.Math.Between(1000, 8000)
      const y = 500
      const type = Phaser.Math.RND.pick(powerUpTypes)

      this.spawnPowerUp(x, y, type)
    }
  }

  // ==================== COLLECTION ====================

  collectPowerUp(
    player: Phaser.Physics.Arcade.Sprite,
    powerUp: Phaser.Physics.Arcade.Sprite
  ): void {
    const type = powerUp.getData('type') as PowerUpType
    const config = POWERUP_CONFIGS[type]

    // Remove power-up
    powerUp.destroy()

    // Apply effect based on type
    switch (type) {
      case 'powerSpeed':
        this.applySpeedBoost(player)
        break
      case 'powerShield':
        this.applyShield(player)
        break
      case 'powerHealth':
        this.applyHealthRestore(player, config?.value || 30)
        break
      case 'powerLife':
        this.applyExtraLife(player)
        break
    }

    // Emit collection event
    this.emit(GAME_EVENTS.POWERUP_COLLECTED, {
      type,
      x: powerUp.x,
      y: powerUp.y
    })
  }

  // ==================== POWER-UP EFFECTS ====================

  private applySpeedBoost(player: Phaser.Physics.Arcade.Sprite): void {
    this.hasSpeedBoost = true

    // Show notification
    this.showPowerUpNotification(player.x, player.y, 'SPEED BOOST!', '#ffff00')

    // Emit event for player speed modification
    this.emit(GAME_EVENTS.SPEED_BOOST_START)

    // Clear existing timer
    if (this.speedBoostTimer) {
      this.speedBoostTimer.remove()
    }

    // Set duration timer (10 seconds)
    this.speedBoostTimer = this.scene.time.delayedCall(10000, () => {
      this.hasSpeedBoost = false
      this.emit(GAME_EVENTS.SPEED_BOOST_END)
    })
  }

  private applyShield(player: Phaser.Physics.Arcade.Sprite): void {
    this.hasShield = true

    // Create shield sprite that follows player
    if (this.shieldSprite) {
      this.shieldSprite.destroy()
    }

    this.shieldSprite = this.scene.add.sprite(player.x, player.y, 'powerShield')
    this.shieldSprite.setScale(1.5)
    this.shieldSprite.setAlpha(0.6)
    this.shieldSprite.setDepth(5)

    // Shield rotation animation
    this.scene.tweens.add({
      targets: this.shieldSprite,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    })

    // Show notification
    this.showPowerUpNotification(player.x, player.y, 'SHIELD ACTIVE!', '#00ffff')

    // Emit event
    this.emit(GAME_EVENTS.SHIELD_START)

    // Clear existing timer
    if (this.shieldTimer) {
      this.shieldTimer.remove()
    }

    // Set duration timer (15 seconds)
    this.shieldTimer = this.scene.time.delayedCall(15000, () => {
      this.hasShield = false
      if (this.shieldSprite) {
        this.shieldSprite.destroy()
        this.shieldSprite = null
      }
      this.emit(GAME_EVENTS.SHIELD_END)
    })
  }

  private applyHealthRestore(player: Phaser.Physics.Arcade.Sprite, amount: number): void {
    // Show notification
    this.showPowerUpNotification(player.x, player.y, `+${amount} HEALTH!`, '#00ff00')

    // Emit event for health restoration
    this.emit(GAME_EVENTS.HEALTH_RESTORED, { amount })
  }

  private applyExtraLife(player: Phaser.Physics.Arcade.Sprite): void {
    // Show notification
    this.showPowerUpNotification(player.x, player.y, '+1 LIFE!', '#00ff00')

    // Emit event for extra life
    this.emit(GAME_EVENTS.EXTRA_LIFE_GAINED)
  }

  // ==================== UPDATE ====================

  update(playerX: number, playerY: number): void {
    // Update shield position to follow player
    if (this.shieldSprite && this.shieldSprite.active) {
      this.shieldSprite.setPosition(playerX, playerY)
    }
  }

  // ==================== UI ====================

  private showPowerUpNotification(x: number, y: number, message: string, color: string): void {
    const text = this.scene.add.text(x, y - 50, message, {
      fontSize: '24px',
      color: color
    })
    text.setOrigin(0.5)

    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => text.destroy()
    })
  }

  // ==================== GETTERS ====================

  hasActiveSpeedBoost(): boolean {
    return this.hasSpeedBoost
  }

  hasActiveShield(): boolean {
    return this.hasShield
  }

  getState(): PowerUpState {
    return {
      hasSpeedBoost: this.hasSpeedBoost,
      hasShield: this.hasShield,
      speedBoostTimeRemaining: this.speedBoostTimer?.getRemaining() || 0,
      shieldTimeRemaining: this.shieldTimer?.getRemaining() || 0
    }
  }

  getShieldSprite(): Phaser.GameObjects.Sprite | null {
    return this.shieldSprite
  }

  // ==================== CLEANUP ====================

  cleanupPowerUpsBeforeX(x: number): void {
    this.powerUps.getChildren().forEach((powerUpObj) => {
      const powerUp = powerUpObj as Phaser.Physics.Arcade.Sprite
      if (powerUp.x < x - 500) {
        powerUp.destroy()
      }
    })
  }

  reset(): void {
    this.hasSpeedBoost = false
    this.hasShield = false
    
    if (this.speedBoostTimer) {
      this.speedBoostTimer.remove()
      this.speedBoostTimer = null
    }
    
    if (this.shieldTimer) {
      this.shieldTimer.remove()
      this.shieldTimer = null
    }
    
    if (this.shieldSprite) {
      this.shieldSprite.destroy()
      this.shieldSprite = null
    }
  }

  destroy(): void {
    this.reset()
    this.powerUps?.destroy(true)
    this.removeAllListeners()
  }
}
