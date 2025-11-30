/**
 * @fileoverview CoopPlayerManager - Manages both players in local co-op mode
 * 
 * Handles all aspects of 2-player gameplay:
 * - Player sprite creation with unique skins
 * - Independent health bars and lives display
 * - Gamepad input processing for each player
 * - Collision handling and damage
 * - Respawn logic when partner is alive
 * - Gun/bullet management per player
 * 
 * @module utils/CoopPlayerManager
 */

import Phaser from 'phaser'
import { LocalCoopManager, PlayerState } from './LocalCoopManager'

/**
 * Complete state for a single co-op player including sprite, UI, and input
 */
export interface CoopPlayer {
  sprite: Phaser.Physics.Arcade.Sprite
  gun: Phaser.GameObjects.Image
  bullets: Phaser.Physics.Arcade.Group
  gamepad: Phaser.Input.Gamepad.Gamepad | null
  state: PlayerState
  canDoubleJump: boolean
  hasDoubleJumped: boolean
  lastShotTime: number
  wasOnGround: boolean
  isDead: boolean
  isInvincible: boolean
  lastHitTime: number
  // UI elements
  healthBarBg: Phaser.GameObjects.Rectangle
  healthBarFill: Phaser.GameObjects.Rectangle
  livesText: Phaser.GameObjects.Text
  playerLabel: Phaser.GameObjects.Text
  shieldSprite: Phaser.GameObjects.Sprite | null
}

/**
 * Manages creation and control of both players in co-op mode
 * Handles input, movement, combat, and UI for two players simultaneously
 */
export class CoopPlayerManager {
  /** Reference to the Phaser scene */
  private scene: Phaser.Scene
  /** Reference to co-op state manager */
  private coopManager: LocalCoopManager
  /** Player 1 data and state */
  private player1: CoopPlayer | null = null
  /** Player 2 data and state */
  private player2: CoopPlayer | null = null
  constructor(
    scene: Phaser.Scene,
    _platforms: Phaser.Physics.Arcade.StaticGroup
  ) {
    this.scene = scene
    this.coopManager = LocalCoopManager.getInstance()
  }

  /**
   * Create both players
   */
  createPlayers(
    spawnX: number,
    spawnY: number,
    bulletGroup1: Phaser.Physics.Arcade.Group,
    bulletGroup2: Phaser.Physics.Arcade.Group
  ): void {
    const settings = this.coopManager.getSettings()

    // Create player 1 (offset left)
    this.player1 = this.createPlayer(
      1,
      spawnX - 50,
      spawnY,
      settings.player1.skin,
      settings.player1.weapon,
      bulletGroup1,
      0
    )

    // Create player 2 (offset right)
    this.player2 = this.createPlayer(
      2,
      spawnX + 50,
      spawnY,
      settings.player2.skin,
      settings.player2.weapon,
      bulletGroup2,
      1
    )
  }

  private createPlayer(
    playerNumber: 1 | 2,
    x: number,
    y: number,
    skin: string,
    weapon: string,
    bulletGroup: Phaser.Physics.Arcade.Group,
    gamepadIndex: number
  ): CoopPlayer {
    const playerState = playerNumber === 1
      ? this.coopManager.getPlayer1State()
      : this.coopManager.getPlayer2State()

    // Create sprite
    const sprite = this.scene.physics.add.sprite(x, y, `${skin}_stand`)
    sprite.setBounce(0.1)
    sprite.setCollideWorldBounds(true)
    sprite.setGravityY(0) // Start with no gravity
    sprite.setDepth(10)

    if (sprite.body) {
      const body = sprite.body as Phaser.Physics.Arcade.Body
      body.enable = true
      body.setSize(50, 80)
      body.setOffset(10, 10)
    }

    // Play idle animation
    sprite.play('player_idle')

    // Enable gravity after delay
    this.scene.time.delayedCall(100, () => {
      if (sprite && sprite.body) {
        sprite.setGravityY(200)
      }
    })

    // Create gun
    const gun = this.scene.add.image(x + 20, y, weapon === 'laser' ? 'laserGun' : 'raygun')
    gun.setScale(0.5)
    gun.setOrigin(0, 0.5)
    gun.setDepth(9)

    // Get gamepad
    const gamepads = this.scene.input.gamepad?.gamepads || []
    const gamepad = gamepads.length > gamepadIndex ? gamepads[gamepadIndex] : null

    // Create UI elements
    const uiY = playerNumber === 1 ? 30 : 70
    const uiX = 150

    const healthBarBg = this.scene.add.rectangle(uiX, uiY, 200, 20, 0x000000, 0.7)
    healthBarBg.setOrigin(0, 0.5)
    healthBarBg.setScrollFactor(0)
    healthBarBg.setDepth(100)

    const healthBarFill = this.scene.add.rectangle(uiX + 2, uiY, 196, 16, playerNumber === 1 ? 0x00ff00 : 0x00ffff)
    healthBarFill.setOrigin(0, 0.5)
    healthBarFill.setScrollFactor(0)
    healthBarFill.setDepth(101)

    const livesText = this.scene.add.text(uiX + 210, uiY, `x ${playerState.lives}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    livesText.setOrigin(0, 0.5)
    livesText.setScrollFactor(0)
    livesText.setDepth(100)

    const playerLabel = this.scene.add.text(uiX - 120, uiY, `P${playerNumber}`, {
      fontSize: '28px',
      color: playerNumber === 1 ? '#00ff00' : '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    playerLabel.setOrigin(0, 0.5)
    playerLabel.setScrollFactor(0)
    playerLabel.setDepth(100)

    // Create spawn shield
    const shieldSprite = this.scene.add.sprite(x, y, 'powerShield')
    shieldSprite.setScale(1.5)
    shieldSprite.setAlpha(0.6)
    shieldSprite.setDepth(15)

    this.scene.tweens.add({
      targets: shieldSprite,
      angle: 360,
      duration: 3000,
      repeat: 0
    })

    // Remove spawn shield after 1 second
    this.scene.time.delayedCall(1000, () => {
      if (shieldSprite) {
        this.scene.tweens.add({
          targets: shieldSprite,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => {
            shieldSprite.destroy()
          }
        })
      }
    })

    return {
      sprite,
      gun,
      bullets: bulletGroup,
      gamepad,
      state: playerState,
      canDoubleJump: true,
      hasDoubleJumped: false,
      lastShotTime: 0,
      wasOnGround: false,
      isDead: false,
      isInvincible: true, // Start with spawn invincibility
      lastHitTime: this.scene.time.now,
      healthBarBg,
      healthBarFill,
      livesText,
      playerLabel,
      shieldSprite
    }
  }

  getPlayer1(): CoopPlayer | null {
    return this.player1
  }

  getPlayer2(): CoopPlayer | null {
    return this.player2
  }

  getBothPlayers(): CoopPlayer[] {
    const players: CoopPlayer[] = []
    if (this.player1) players.push(this.player1)
    if (this.player2) players.push(this.player2)
    return players
  }

  /**
   * Update player UI (health bars, lives)
   */
  updatePlayerUI(player: CoopPlayer): void {
    // Update health bar
    const healthPercentage = player.state.health / 100
    player.healthBarFill.width = 196 * healthPercentage

    // Update color based on health
    if (healthPercentage > 0.5) {
      player.healthBarFill.setFillStyle(player.state.playerNumber === 1 ? 0x00ff00 : 0x00ffff)
    } else if (healthPercentage > 0.25) {
      player.healthBarFill.setFillStyle(0xffaa00)
    } else {
      player.healthBarFill.setFillStyle(0xff0000)
    }

    // Update lives text
    player.livesText.setText(`x ${player.state.lives}`)
  }

  /**
   * Update gun position and rotation for a player
   */
  updateGun(player: CoopPlayer, aimX: number, aimY: number): void {
    if (!player.sprite.body) return

    const playerX = player.sprite.x
    const playerY = player.sprite.y

    // Calculate angle to aim point
    const angle = Phaser.Math.Angle.Between(playerX, playerY, aimX, aimY)

    // Position gun near player
    const gunOffset = 20
    player.gun.x = playerX + Math.cos(angle) * gunOffset
    player.gun.y = playerY + Math.sin(angle) * gunOffset
    player.gun.setRotation(angle)

    // Flip gun if aiming left
    if (aimX < playerX) {
      player.gun.setFlipY(true)
    } else {
      player.gun.setFlipY(false)
    }
  }

  /**
   * Damage a player
   */
  damagePlayer(player: CoopPlayer, damage: number): void {
    if (player.isInvincible || player.isDead) return

    player.state.health -= damage
    this.coopManager.updatePlayerState(player.state.playerNumber, { health: player.state.health })

    // Make player invincible for a short time
    player.isInvincible = true
    player.lastHitTime = this.scene.time.now

    // Flash effect
    this.scene.tweens.add({
      targets: player.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        player.sprite.setAlpha(1)
        player.isInvincible = false
      }
    })

    if (player.state.health <= 0) {
      this.killPlayer(player)
    }

    this.updatePlayerUI(player)
  }

  /**
   * Kill a player (lose a life)
   */
  killPlayer(player: CoopPlayer): void {
    if (player.isDead) return

    player.isDead = true
    player.state.lives--
    player.state.isAlive = false
    this.coopManager.updatePlayerState(player.state.playerNumber, {
      lives: player.state.lives,
      isAlive: false
    })

    // Death animation
    player.sprite.setTint(0xff0000)
    this.scene.tweens.add({
      targets: player.sprite,
      alpha: 0,
      angle: 180,
      y: player.sprite.y - 100,
      duration: 1000,
      onComplete: () => {
        if (player.state.lives > 0) {
          this.respawnPlayer(player)
        }
      }
    })

    this.updatePlayerUI(player)
  }

  /**
   * Respawn a player
   */
  respawnPlayer(player: CoopPlayer): void {
    const settings = this.coopManager.getSettings()

    // Check if we should respawn
    if (!settings.respawnOnPartnerAlive) {
      // In non-respawn mode, player stays dead
      return
    }

    // Find other player
    const otherPlayer = player === this.player1 ? this.player2 : this.player1

    // Respawn near other player if alive
    if (otherPlayer && otherPlayer.state.isAlive) {
      player.sprite.setPosition(otherPlayer.sprite.x + 50, otherPlayer.sprite.y)
    } else {
      // Respawn at checkpoint
      player.sprite.setPosition(400, 550)
    }

    player.sprite.setAlpha(1)
    player.sprite.clearTint()
    player.sprite.setAngle(0)
    player.isDead = false
    player.state.health = 100
    player.state.isAlive = true
    player.isInvincible = true
    player.lastHitTime = this.scene.time.now

    this.coopManager.updatePlayerState(player.state.playerNumber, {
      health: 100,
      isAlive: true
    })

    // Spawn shield
    const shield = this.scene.add.sprite(player.sprite.x, player.sprite.y, 'powerShield')
    shield.setScale(1.5)
    shield.setAlpha(0.6)
    shield.setDepth(15)
    player.shieldSprite = shield

    this.scene.tweens.add({
      targets: shield,
      angle: 360,
      duration: 2000,
      onComplete: () => {
        player.isInvincible = false
        if (shield) {
          shield.destroy()
          player.shieldSprite = null
        }
      }
    })

    this.updatePlayerUI(player)
  }

  /**
   * Check if game is over (both players dead)
   */
  isGameOver(): boolean {
    return (this.coopManager.areBothPlayersDead() ?? false) ||
      (!!this.player1 && this.player1.state.lives <= 0 &&
        !!this.player2 && this.player2.state.lives <= 0)
  }

  /**
   * Get camera focus point (center between both players)
   */
  getCameraFocusPoint(): { x: number, y: number } {
    const players = this.getBothPlayers().filter(p => !p.isDead)

    if (players.length === 0) {
      return { x: 640, y: 360 }
    }

    if (players.length === 1) {
      return { x: players[0].sprite.x, y: players[0].sprite.y }
    }

    const avgX = (players[0].sprite.x + players[1].sprite.x) / 2
    const avgY = (players[0].sprite.y + players[1].sprite.y) / 2

    return { x: avgX, y: avgY }
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.player1) {
      this.player1.sprite.destroy()
      this.player1.gun.destroy()
      this.player1.healthBarBg.destroy()
      this.player1.healthBarFill.destroy()
      this.player1.livesText.destroy()
      this.player1.playerLabel.destroy()
    }
    if (this.player2) {
      this.player2.sprite.destroy()
      this.player2.gun.destroy()
      this.player2.healthBarBg.destroy()
      this.player2.healthBarFill.destroy()
      this.player2.livesText.destroy()
      this.player2.playerLabel.destroy()
    }
  }
}
