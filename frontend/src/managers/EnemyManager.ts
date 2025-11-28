/**
 * EnemyManager.ts
 * Manages enemy spawning, AI behavior, and collision handling
 * Extracted from the monolithic GameScene.ts
 */

import Phaser from 'phaser'
import { EnemyConfig, EnemySize, EnemyType, GAME_EVENTS } from '../types/GameTypes'
import { AudioManager } from '../utils/AudioManager'

export class EnemyManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene
  private audioManager: AudioManager
  
  // Enemy groups
  public enemies!: Phaser.Physics.Arcade.Group
  
  // Tracking
  private enemiesDefeated: number = 0

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    super()
    this.scene = scene
    this.audioManager = audioManager
  }

  // ==================== INITIALIZATION ====================

  create(): void {
    this.enemies = this.scene.physics.add.group({
      runChildUpdate: true
    })

    this.createAnimations()
  }

  private createAnimations(): void {
    const enemyTypes: Array<{ type: EnemyType; frames: string[] }> = [
      { type: 'fly', frames: ['fly', 'fly_fly'] },
      { type: 'bee', frames: ['bee', 'bee_fly'] },
      { type: 'slimeGreen', frames: ['slimeGreen', 'slimeGreen_walk'] },
      { type: 'slimeBlue', frames: ['slimeBlue', 'slimeBlue_walk'] },
      { type: 'wormGreen', frames: ['wormGreen', 'wormGreen_walk'] },
      { type: 'wormPink', frames: ['wormPink', 'wormPink_walk'] }
    ]

    enemyTypes.forEach(({ type, frames }) => {
      const idleKey = `${type}_idle`
      const walkKey = `${type}_walk`

      if (!this.scene.anims.exists(idleKey)) {
        this.scene.anims.create({
          key: idleKey,
          frames: [{ key: frames[0] }],
          frameRate: 1,
          repeat: -1
        })
      }

      if (!this.scene.anims.exists(walkKey) && frames.length > 1) {
        this.scene.anims.create({
          key: walkKey,
          frames: frames.map(f => ({ key: f })),
          frameRate: 6,
          repeat: -1
        })
      }
    })
  }

  // ==================== SPAWNING ====================

  spawnEnemiesInArea(startX: number, endX: number, difficultyMultiplier: number = 1): void {
    // Don't spawn enemies on the starting platform (first 500 pixels)
    if (startX < 500) return

    const baseEnemies = 2
    const maxEnemies = Math.min(5, baseEnemies + Math.floor(difficultyMultiplier))
    const numEnemies = Phaser.Math.Between(baseEnemies, maxEnemies)

    for (let i = 0; i < numEnemies; i++) {
      const x = Phaser.Math.Between(startX + 100, endX - 100)
      const y = Phaser.Math.Between(200, 600)
      this.spawnRandomEnemy(x, y, difficultyMultiplier)
    }
  }

  spawnRandomEnemy(x: number, y: number, difficultyMultiplier: number = 1): Phaser.Physics.Arcade.Sprite {
    // Randomly select enemy size with weighted probability
    const rand = Math.random()
    let config: EnemyConfig

    if (rand < 0.4) {
      // Small enemies (40% chance)
      config = this.createSmallEnemyConfig(x, y, difficultyMultiplier)
    } else if (rand < 0.8) {
      // Medium enemies (40% chance)
      config = this.createMediumEnemyConfig(x, y, difficultyMultiplier)
    } else {
      // Large enemies (20% chance)
      config = this.createLargeEnemyConfig(x, y, difficultyMultiplier)
    }

    return this.createEnemy(config)
  }

  private createSmallEnemyConfig(x: number, y: number, difficulty: number): EnemyConfig {
    const type: EnemyType = Math.random() < 0.5 ? 'fly' : 'bee'
    return {
      type,
      size: 'small',
      x,
      y,
      health: Math.floor(2 * difficulty),
      maxHealth: Math.floor(2 * difficulty),
      speed: 80 + (difficulty - 1) * 20,
      coinReward: 5,
      detectionRange: 300,
      scale: 0.6
    }
  }

  private createMediumEnemyConfig(x: number, y: number, difficulty: number): EnemyConfig {
    const type: EnemyType = Math.random() < 0.5 ? 'slimeGreen' : 'slimeBlue'
    return {
      type,
      size: 'medium',
      x,
      y,
      health: Math.floor(4 * difficulty),
      maxHealth: Math.floor(4 * difficulty),
      speed: 80 + (difficulty - 1) * 20,
      coinReward: 10,
      detectionRange: 300,
      scale: 1.0
    }
  }

  private createLargeEnemyConfig(x: number, y: number, difficulty: number): EnemyConfig {
    const type: EnemyType = Math.random() < 0.5 ? 'wormGreen' : 'wormPink'
    return {
      type,
      size: 'large',
      x,
      y,
      health: Math.floor(8 * difficulty),
      maxHealth: Math.floor(8 * difficulty),
      speed: 80 + (difficulty - 1) * 20,
      coinReward: 15,
      detectionRange: 300,
      scale: 1.3
    }
  }

  private createEnemy(config: EnemyConfig): Phaser.Physics.Arcade.Sprite {
    const enemy = this.enemies.create(config.x, config.y, config.type) as Phaser.Physics.Arcade.Sprite
    
    enemy.setScale(config.scale)
    enemy.setBounce(0.3)
    enemy.setCollideWorldBounds(true)
    enemy.clearTint()
    enemy.play(`${config.type}_idle`)

    // Store enemy data
    enemy.setData('enemyType', config.type)
    enemy.setData('enemySize', config.size)
    enemy.setData('coinReward', config.coinReward)
    enemy.setData('detectionRange', config.detectionRange)
    enemy.setData('speed', config.speed)
    enemy.setData('wanderDirection', Phaser.Math.Between(-1, 1))
    enemy.setData('wanderTimer', 0)
    enemy.setData('idleTimer', 0)
    enemy.setData('health', config.health)
    enemy.setData('maxHealth', config.maxHealth)
    enemy.setData('spawnX', config.x)
    enemy.setData('spawnY', config.y)

    // Setup physics body
    const body = enemy.body as Phaser.Physics.Arcade.Body
    body.setSize(enemy.width * 0.7, enemy.height * 0.7)
    body.setOffset(enemy.width * 0.15, enemy.height * 0.15)
    body.setMass(1)
    enemy.setPushable(true)
    body.setMaxVelocity(200, 600)

    return enemy
  }

  // ==================== UPDATE ====================

  update(playerX: number, playerY: number, delta: number): void {
    this.enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite
      if (!enemy.active) return

      this.updateEnemyAI(enemy, playerX, playerY, delta)
    })
  }

  private updateEnemyAI(
    enemy: Phaser.Physics.Arcade.Sprite,
    playerX: number,
    playerY: number,
    delta: number
  ): void {
    const enemyType = enemy.getData('enemyType') as EnemyType
    const speed = enemy.getData('speed') || 80
    const detectionRange = enemy.getData('detectionRange') || 300

    // Calculate distance to player
    const distanceToPlayer = Phaser.Math.Distance.Between(
      enemy.x, enemy.y,
      playerX, playerY
    )

    // Flying enemies (fly, bee) have different behavior
    if (enemyType === 'fly' || enemyType === 'bee') {
      this.updateFlyingEnemyAI(enemy, playerX, playerY, distanceToPlayer, detectionRange, speed)
    } else {
      // Ground enemies (slimes, worms)
      this.updateGroundEnemyAI(enemy, playerX, distanceToPlayer, detectionRange, speed, delta)
    }
  }

  private updateFlyingEnemyAI(
    enemy: Phaser.Physics.Arcade.Sprite,
    playerX: number,
    playerY: number,
    distanceToPlayer: number,
    detectionRange: number,
    speed: number
  ): void {
    if (distanceToPlayer < detectionRange) {
      // Chase player
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerX, playerY)
      enemy.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.5
      )
      enemy.setFlipX(playerX < enemy.x)
    } else {
      // Hover/wander
      const time = this.scene.time.now
      enemy.setVelocityY(Math.sin(time / 500) * 30)
      
      // Slow horizontal drift
      const wanderDir = enemy.getData('wanderDirection') || 0
      enemy.setVelocityX(wanderDir * 20)
    }
  }

  private updateGroundEnemyAI(
    enemy: Phaser.Physics.Arcade.Sprite,
    playerX: number,
    distanceToPlayer: number,
    detectionRange: number,
    speed: number,
    delta: number
  ): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down || body.touching.down

    if (!onGround) return // Don't move if in air

    if (distanceToPlayer < detectionRange) {
      // Chase player
      if (playerX < enemy.x) {
        enemy.setVelocityX(-speed)
        enemy.setFlipX(true)
      } else {
        enemy.setVelocityX(speed)
        enemy.setFlipX(false)
      }
      
      const enemyType = enemy.getData('enemyType')
      enemy.play(`${enemyType}_walk`, true)
    } else {
      // Wander behavior
      let wanderTimer = enemy.getData('wanderTimer') || 0
      wanderTimer += delta

      if (wanderTimer > 2000) {
        // Change direction every 2 seconds
        const newDirection = Phaser.Math.Between(-1, 1)
        enemy.setData('wanderDirection', newDirection)
        enemy.setData('wanderTimer', 0)
      } else {
        enemy.setData('wanderTimer', wanderTimer)
      }

      const wanderDir = enemy.getData('wanderDirection')
      if (wanderDir !== 0) {
        enemy.setVelocityX(wanderDir * speed * 0.3)
        enemy.setFlipX(wanderDir < 0)
        const enemyType = enemy.getData('enemyType')
        enemy.play(`${enemyType}_walk`, true)
      } else {
        enemy.setVelocityX(0)
        const enemyType = enemy.getData('enemyType')
        enemy.play(`${enemyType}_idle`, true)
      }
    }
  }

  // ==================== DAMAGE & DEATH ====================

  damageEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number): boolean {
    let health = enemy.getData('health') || 1
    health -= damage
    enemy.setData('health', health)

    // Visual feedback
    enemy.setTint(0xff0000)
    this.scene.time.delayedCall(100, () => {
      if (enemy.active) enemy.clearTint()
    })

    // Knockback
    const knockbackDirection = enemy.flipX ? 1 : -1
    enemy.setVelocityX(knockbackDirection * 200)
    enemy.setVelocityY(-100)

    if (health <= 0) {
      this.killEnemy(enemy)
      return true // Enemy died
    }

    return false // Enemy still alive
  }

  killEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    const coinReward = enemy.getData('coinReward') || 5
    const enemySize = enemy.getData('enemySize') as EnemySize
    const x = enemy.x
    const y = enemy.y

    // Calculate score
    let scoreReward = 50
    if (enemySize === 'medium') scoreReward = 100
    if (enemySize === 'large') scoreReward = 200

    this.enemiesDefeated++

    // Death animation
    enemy.setVelocity(0, 0)
    enemy.setTint(0xff0000)

    this.scene.tweens.add({
      targets: enemy,
      alpha: 0,
      y: enemy.y + 20,
      duration: 500,
      onComplete: () => {
        enemy.destroy()
      }
    })

    // Emit event for coin drop and score
    this.emit(GAME_EVENTS.ENEMY_KILLED, {
      x,
      y,
      coinReward,
      scoreReward,
      enemySize
    })

    this.audioManager.playDamageSound()
  }

  // Stomp mechanic - player jumps on enemy
  handleStomp(
    player: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite
  ): boolean {
    const playerBody = player.body as Phaser.Physics.Arcade.Body

    // Check if player is above enemy and moving downward
    const playerBottom = player.y + player.height / 2
    const isAbove = playerBottom < enemy.y
    const isMovingDown = playerBody.velocity.y > 0

    if (isAbove && isMovingDown) {
      // Stomp successful
      this.killEnemy(enemy)
      
      // Bounce player up
      playerBody.setVelocityY(-300)
      
      return true
    }

    return false
  }

  // ==================== CLEANUP ====================

  cleanupEnemiesBeforeX(x: number): void {
    this.enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite
      if (enemy.x < x - 500) {
        enemy.destroy()
      }
    })
  }

  // ==================== GETTERS ====================

  getEnemiesDefeated(): number {
    return this.enemiesDefeated
  }

  getActiveEnemies(): Phaser.Physics.Arcade.Sprite[] {
    return this.enemies.getChildren().filter(e => e.active) as Phaser.Physics.Arcade.Sprite[]
  }

  getNearestEnemy(x: number, y: number): { enemy: Phaser.Physics.Arcade.Sprite | null; distance: number } {
    let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null
    let nearestDistance = Infinity

    this.enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite
      if (!enemy.active) return

      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    })

    return { enemy: nearestEnemy, distance: nearestDistance }
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    this.enemies?.destroy(true)
    this.removeAllListeners()
  }
}
