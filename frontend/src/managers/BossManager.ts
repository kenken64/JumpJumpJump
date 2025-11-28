/**
 * BossManager.ts
 * Manages boss encounters, attacks, phases, and defeat logic
 * Extracted from the monolithic GameScene.ts
 */

import Phaser from 'phaser'
import { GAME_EVENTS } from '../types/GameTypes'
import { AudioManager } from '../utils/AudioManager'
import { GameAPI } from '../services/api'

export class BossManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene
  private audioManager: AudioManager
  
  // Boss state
  public boss: Phaser.Physics.Arcade.Sprite | null = null
  public bossActive: boolean = false
  
  // Boss UI elements
  private bossHealthBar: Phaser.GameObjects.Rectangle | null = null
  private bossHealthBarBg: Phaser.GameObjects.Rectangle | null = null
  private bossNameText: Phaser.GameObjects.Text | null = null
  
  // Boss projectiles
  private bossProjectiles!: Phaser.Physics.Arcade.Group
  
  // Tracking
  private defeatedBossLevels: Set<number> = new Set()
  private currentLevel: number = 1

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    super()
    this.scene = scene
    this.audioManager = audioManager
    
    // Load defeated bosses from storage
    const saved = localStorage.getItem('defeatedBossLevels')
    if (saved) {
      this.defeatedBossLevels = new Set(JSON.parse(saved))
    }
  }

  // ==================== INITIALIZATION ====================

  create(): void {
    this.bossProjectiles = this.scene.physics.add.group({
      runChildUpdate: true
    })
  }

  setCurrentLevel(level: number): void {
    this.currentLevel = level
  }

  // ==================== BOSS SPAWNING ====================

  /**
   * Find next undefeated boss for current player (cycles through all 24 bosses)
   */
  findNextUndefeatedBoss(startIndex: number): number {
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

  async spawnBoss(x: number, forcedBossIndex?: number): Promise<void> {
    if (this.bossActive || this.boss) return

    this.bossActive = true
    const bossY = 350 // Higher position to hover above ground

    // Emit tip event
    this.emit(GAME_EVENTS.BOSS_SPAWNED, {
      message: '⚠️ BOSS FIGHT! Shoot the boss to defeat it and earn 100 coins!'
    })

    // Play boss spawn sound
    this.audioManager.playBossSound()

    // Calculate which boss to use based on level
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
    this.boss = this.scene.physics.add.sprite(x, bossY, bossKey)

    // Scale boss to appropriate size (around 200-250px)
    const targetSize = 250
    const scale = Math.min(targetSize / this.boss.width, targetSize / this.boss.height)
    this.boss.setScale(scale)

    this.boss.setDepth(10) // In front of player and enemies
    this.boss.setCollideWorldBounds(true)
    this.boss.setData('bossKey', bossKey)

    // Set hitbox for hovering boss (no gravity)
    if (this.boss.body) {
      const body = this.boss.body as Phaser.Physics.Arcade.Body
      body.setSize(128, 180)
      body.setOffset(64, 38)
      body.setAllowGravity(false) // Boss hovers
      body.setImmovable(false)
    }

    // Boss stats - scale with level
    const bossMaxHealth = 50 + (this.currentLevel * 20)
    this.boss.setData('health', bossMaxHealth)
    this.boss.setData('maxHealth', bossMaxHealth)
    this.boss.setData('lastAttack', 0)
    this.boss.setData('attackCooldown', 2000)
    this.boss.setData('phase', 1)
    this.boss.setData('bossIndex', bossIndex)

    // Create boss health bar UI
    this.createBossHealthBar(bossName)
  }

  private createBossHealthBar(bossName: string): void {
    // Background bar
    this.bossHealthBarBg = this.scene.add.rectangle(640, 80, 500, 30, 0x000000, 0.7)
    this.bossHealthBarBg.setScrollFactor(0)
    this.bossHealthBarBg.setDepth(999)

    // Health bar
    this.bossHealthBar = this.scene.add.rectangle(640, 80, 500, 30, 0xff0000, 1)
    this.bossHealthBar.setScrollFactor(0)
    this.bossHealthBar.setDepth(1000)

    // Boss name text
    this.bossNameText = this.scene.add.text(640, 80, bossName, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.bossNameText.setOrigin(0.5)
    this.bossNameText.setScrollFactor(0)
    this.bossNameText.setDepth(1001)
  }

  // ==================== UPDATE ====================

  update(playerX: number, playerY: number): void {
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
    }

    // Boss AI - hovers and follows player horizontally
    const lastAttack = this.boss.getData('lastAttack')
    const attackCooldown = this.boss.getData('attackCooldown')

    const horizontalDistance = playerX - this.boss.x
    const moveSpeed = 120

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
    const hoverY = 350 + Math.sin(this.scene.time.now / 1000) * 30
    this.boss.setVelocityY((hoverY - this.boss.y) * 2)

    // Attack patterns - alternate between 360 spray and homing
    if (this.scene.time.now - lastAttack > attackCooldown) {
      const attackType = Math.random() < 0.5 ? '360' : 'homing'
      this.bossAttack(attackType, playerX, playerY)
      this.boss.setData('lastAttack', this.scene.time.now)
    }
  }

  // ==================== ATTACKS ====================

  private bossAttack(attackType: string, playerX: number, playerY: number): void {
    if (!this.boss) return

    // Play attack animation if exists
    const attackKey = this.boss.getData('attackKey')
    if (attackKey && this.scene.anims.exists(attackKey)) {
      this.boss.play(attackKey)
    }

    // Play boss attack sound
    this.audioManager.playBossAttackSound()

    if (attackType === '360') {
      this.attack360Spray()
    } else {
      this.attackHoming(playerX, playerY)
    }
  }

  private attack360Spray(): void {
    if (!this.boss) return

    // 360-degree spray attack - 12 projectiles in a circle
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12

      const projectile = this.scene.physics.add.sprite(
        this.boss.x, 
        this.boss.y, 
        'laserBlue'
      )
      projectile.setTint(0xff0000)
      projectile.setScale(1.5)
      projectile.setVelocity(
        Math.cos(angle) * 250,
        Math.sin(angle) * 250
      )
      projectile.setRotation(angle)
      projectile.setData('attackType', '360')
      projectile.setData('damage', 15)

      // Disable gravity for projectiles
      if (projectile.body) {
        projectile.body.setAllowGravity(false)
        const body = projectile.body as Phaser.Physics.Arcade.Body
        body.setSize(0, 0) // Disable collision with world
      }

      this.bossProjectiles.add(projectile)

      // Destroy after 4 seconds
      this.scene.time.delayedCall(4000, () => {
        if (projectile.active) projectile.destroy()
      })
    }
  }

  private attackHoming(playerX: number, playerY: number): void {
    if (!this.boss) return

    // Homing attack - 3 projectiles that follow the player
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 300, () => {
        if (!this.boss) return

        const projectile = this.scene.physics.add.sprite(
          this.boss.x, 
          this.boss.y, 
          'laserBlue'
        )
        projectile.setTint(0xff00ff) // Purple for homing
        projectile.setScale(1.8)
        projectile.setData('attackType', 'homing')
        projectile.setData('spawnTime', this.scene.time.now)
        projectile.setData('damage', 20)

        this.bossProjectiles.add(projectile)

        // Destroy after 5 seconds
        this.scene.time.delayedCall(5000, () => {
          if (projectile.active) projectile.destroy()
        })

        // Update homing projectile movement
        const updateHomingEvent = this.scene.time.addEvent({
          delay: 50,
          callback: () => {
            if (projectile.active) {
              // Emit event to get player position
              const playerPos = { x: playerX, y: playerY }
              this.emit(GAME_EVENTS.REQUEST_PLAYER_POSITION)
              
              const angle = Phaser.Math.Angle.Between(
                projectile.x, projectile.y,
                playerPos.x, playerPos.y
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

  // ==================== DAMAGE ====================

  damageBoss(damage: number): boolean {
    if (!this.boss || !this.boss.active) return false

    let health = this.boss.getData('health')
    health -= damage
    this.boss.setData('health', health)

    // Flash effect
    this.boss.setTint(0xff0000)
    this.scene.time.delayedCall(100, () => {
      if (this.boss && this.boss.active) {
        this.boss.clearTint()
      }
    })

    // Check if boss defeated
    if (health <= 0) {
      this.defeatBoss()
      return true
    }

    return false
  }

  private defeatBoss(): void {
    if (!this.boss) return

    this.bossActive = false

    // Get player name and boss index
    const playerName = localStorage.getItem('player_name') || 'Guest'
    const bossIndex = this.boss.getData('bossIndex') || 0
    const bossKey = `${playerName}_boss_${bossIndex}`

    // Save defeated boss with player-specific key
    localStorage.setItem(bossKey, 'defeated')
    console.log('💾 Boss defeated by', playerName, '- Boss Index:', bossIndex)

    // Track in current session
    this.defeatedBossLevels.add(this.currentLevel)
    localStorage.setItem('defeatedBossLevels', JSON.stringify(Array.from(this.defeatedBossLevels)))

    const bossX = this.boss.x
    const bossY = this.boss.y

    // Death animation
    this.scene.tweens.add({
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
    this.cleanupBossUI()

    // Emit defeat event with rewards
    this.emit(GAME_EVENTS.BOSS_DEFEATED, {
      x: bossX,
      y: bossY,
      coinReward: 100,
      scoreReward: 1000
    })
  }

  private cleanupBossUI(): void {
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
  }

  // ==================== EXPLOSION ====================

  createExplosion(x: number, y: number): void {
    const explosionRadius = 80

    // Orange flash circle
    const flash = this.scene.add.circle(x, y, explosionRadius, 0xff6600, 1)
    flash.setDepth(1000)

    // Explosion particles
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i
      const particle = this.scene.add.circle(x, y, 8, 0xff4400, 1)
      particle.setDepth(1000)

      this.scene.tweens.add({
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
    this.scene.tweens.add({
      targets: flash,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    })

    // Emit event for splash damage
    this.emit(GAME_EVENTS.EXPLOSION_CREATED, {
      x,
      y,
      radius: explosionRadius * 1.2,
      damage: 3
    })
  }

  // ==================== GETTERS ====================

  getBoss(): Phaser.Physics.Arcade.Sprite | null {
    return this.boss
  }

  isBossActive(): boolean {
    return this.bossActive
  }

  getBossProjectiles(): Phaser.Physics.Arcade.Group {
    return this.bossProjectiles
  }

  isBossDefeatedForLevel(level: number): boolean {
    return this.defeatedBossLevels.has(level)
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    this.cleanupBossUI()
    this.bossProjectiles?.destroy(true)
    if (this.boss) {
      this.boss.destroy()
      this.boss = null
    }
    this.removeAllListeners()
  }
}
