import Phaser from 'phaser'
import type GameScene from '../scenes/GameScene'

export interface AIDecision {
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
  shoot: boolean
  aimX: number
  aimY: number
}

export class AIPlayer {
  private scene: GameScene
  private updateInterval: number = 100 // AI thinks every 100ms
  private lastUpdateTime: number = 0
  private currentDecision: AIDecision = {
    moveLeft: false,
    moveRight: false,
    jump: false,
    shoot: false,
    aimX: 0,
    aimY: 0
  }
  
  // AI parameters
  private sightRange: number = 600
  private combatRange: number = 400
  private dangerRange: number = 150

  constructor(scene: GameScene) {
    this.scene = scene
  }

  public getDecision(currentTime: number): AIDecision {
    // Update AI thinking at intervals
    if (currentTime - this.lastUpdateTime > this.updateInterval) {
      this.think()
      this.lastUpdateTime = currentTime
    }
    
    return this.currentDecision
  }

  private think(): void {
    // Reset decision
    this.currentDecision = {
      moveLeft: false,
      moveRight: false,
      jump: false,
      shoot: false,
      aimX: 0,
      aimY: 0
    }

    const player = this.getPlayer()
    if (!player || !player.body) return

    const playerX = player.x
    const playerY = player.y

    // 1. Assess threats (enemies, spikes)
    const nearestThreat = this.findNearestThreat(playerX, playerY)
    
    // 2. Find opportunities (coins, power-ups)
    const nearestCoin = this.findNearestCoin(playerX, playerY)
    
    // 3. Check for nearest enemy to attack
    const nearestEnemy = this.findNearestEnemy(playerX, playerY)

    // Decision priority:
    // 1. Avoid immediate danger
    // 2. Attack nearby enemies
    // 3. Collect coins/power-ups
    // 4. Move forward to progress

    if (nearestThreat && nearestThreat.distance < this.dangerRange) {
      this.handleDanger(playerX, playerY, nearestThreat)
    } else if (nearestEnemy && nearestEnemy.distance < this.combatRange) {
      this.handleCombat(playerX, playerY, nearestEnemy)
    } else if (nearestCoin && nearestCoin.distance < this.sightRange) {
      this.moveToward(playerX, playerY, nearestCoin.x, nearestCoin.y)
    } else {
      // Default: move right to progress
      this.currentDecision.moveRight = true
    }

    // Always check for jumps needed
    this.checkJumpNeeded(playerX, playerY)
  }

  private handleDanger(playerX: number, _playerY: number, threat: { x: number, y: number, type: string }): void {
    // Move away from threat
    if (threat.x < playerX) {
      this.currentDecision.moveRight = true
    } else {
      this.currentDecision.moveLeft = true
    }

    // Jump to avoid ground threats
    if (threat.type === 'spike' && Math.abs(threat.x - playerX) < 80) {
      this.currentDecision.jump = true
    }
  }

  private handleCombat(playerX: number, _playerY: number, enemy: { x: number, y: number, health: number }): void {
    // Aim at enemy
    this.currentDecision.aimX = enemy.x
    this.currentDecision.aimY = enemy.y
    
    // Shoot at enemy
    this.currentDecision.shoot = true

    // Keep optimal distance (not too close, not too far)
    const distance = Math.abs(enemy.x - playerX)
    const optimalDistance = 200

    if (distance < optimalDistance - 50) {
      // Too close, back away
      if (enemy.x < playerX) {
        this.currentDecision.moveRight = true
      } else {
        this.currentDecision.moveLeft = true
      }
    } else if (distance > optimalDistance + 50) {
      // Too far, move closer
      if (enemy.x < playerX) {
        this.currentDecision.moveLeft = true
      } else {
        this.currentDecision.moveRight = true
      }
    }
  }

  private moveToward(playerX: number, _playerY: number, targetX: number, targetY: number): void {
    // Move horizontally toward target
    if (targetX < playerX - 20) {
      this.currentDecision.moveLeft = true
    } else if (targetX > playerX + 20) {
      this.currentDecision.moveRight = true
    }

    // Aim toward target
    this.currentDecision.aimX = targetX
    this.currentDecision.aimY = targetY
  }

  private checkJumpNeeded(playerX: number, playerY: number): void {
    const player = this.getPlayer()
    if (!player || !player.body) return

    const onGround = (player.body as Phaser.Physics.Arcade.Body).touching.down

    // Jump if there's a gap ahead or platform above
    if (onGround) {
      const lookAheadDistance = this.currentDecision.moveRight ? 100 : -100
      const hasGroundAhead = this.checkGroundAhead(playerX + lookAheadDistance, playerY)
      
      if (!hasGroundAhead) {
        // Gap ahead, jump over it
        this.currentDecision.jump = true
      }
    }
  }

  private checkGroundAhead(x: number, y: number): boolean {
    // Check if there's a platform near the position
    const platforms = this.getPlatforms()
    if (!platforms) return false

    const checkY = y + 100 // Look a bit below

    for (const platform of platforms.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!platform.active) continue
      
      const bounds = platform.getBounds()
      if (x >= bounds.left && x <= bounds.right &&
          checkY >= bounds.top && checkY <= bounds.bottom + 50) {
        return true
      }
    }

    return false
  }

  private findNearestThreat(playerX: number, playerY: number): { x: number, y: number, distance: number, type: string } | null {
    let nearest: { x: number, y: number, distance: number, type: string } | null = null
    let minDistance = this.dangerRange

    // Check spikes
    const spikes = this.getSpikes()
    if (spikes) {
      for (const spike of spikes.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!spike.active) continue
        
        const distance = Phaser.Math.Distance.Between(playerX, playerY, spike.x, spike.y)
        if (distance < minDistance) {
          minDistance = distance
          nearest = { x: spike.x, y: spike.y, distance, type: 'spike' }
        }
      }
    }

    return nearest
  }

  private findNearestEnemy(playerX: number, playerY: number): { x: number, y: number, health: number, distance: number } | null {
    let nearest: { x: number, y: number, health: number, distance: number } | null = null
    let minDistance = this.combatRange

    const enemies = this.getEnemies()
    if (enemies) {
      for (const enemy of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!enemy.active) continue
        
        const distance = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y)
        if (distance < minDistance) {
          const health = enemy.getData('health') || 100
          minDistance = distance
          nearest = { x: enemy.x, y: enemy.y, health, distance }
        }
      }
    }

    return nearest
  }

  private findNearestCoin(playerX: number, playerY: number): { x: number, y: number, distance: number } | null {
    let nearest: { x: number, y: number, distance: number } | null = null
    let minDistance = this.sightRange

    const coins = this.getCoins()
    if (coins) {
      for (const coin of coins.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!coin.active) continue
        
        const distance = Phaser.Math.Distance.Between(playerX, playerY, coin.x, coin.y)
        if (distance < minDistance) {
          minDistance = distance
          nearest = { x: coin.x, y: coin.y, distance }
        }
      }
    }

    return nearest
  }

  // Helper methods to access GameScene state
  private getPlayer(): Phaser.Physics.Arcade.Sprite | null {
    return (this.scene as any).player || null
  }

  private getPlatforms(): Phaser.Physics.Arcade.StaticGroup | null {
    return (this.scene as any).platforms || null
  }

  private getSpikes(): Phaser.Physics.Arcade.StaticGroup | null {
    return (this.scene as any).spikes || null
  }

  private getEnemies(): Phaser.Physics.Arcade.Group | null {
    return (this.scene as any).enemies || null
  }

  private getCoins(): Phaser.Physics.Arcade.Group | null {
    return (this.scene as any).coins || null
  }
}
