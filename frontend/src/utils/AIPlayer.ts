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

    // 1. Check for portal (highest priority - win condition!)
    const portal = this.findPortal()
    
    // 2. Assess threats (enemies, spikes)
    const nearestThreat = this.findNearestThreat(playerX, playerY)
    
    // 3. Find opportunities (coins, power-ups)
    const nearestCoin = this.findNearestCoin(playerX, playerY)
    
    // 4. Check for nearest enemy to attack
    const nearestEnemy = this.findNearestEnemy(playerX, playerY)

    // Decision priority:
    // 1. Enter portal to win level (TOP PRIORITY)
    // 2. Avoid immediate danger
    // 3. Attack nearby enemies
    // 4. Collect coins/power-ups
    // 5. Move forward to progress

    if (portal && portal.distance < 800) {
      // Portal is nearby - go straight to it!
      this.moveToward(playerX, playerY, portal.x, portal.y)
      console.log('🤖 AI: Moving to portal at', portal.x, portal.y)
    } else if (nearestThreat && nearestThreat.distance < this.dangerRange) {
      this.handleDanger(playerX, playerY, nearestThreat)
    } else if (nearestEnemy && nearestEnemy.distance < this.combatRange) {
      this.handleCombat(playerX, playerY, nearestEnemy)
    } else if (nearestCoin && nearestCoin.distance < this.sightRange) {
      this.moveToward(playerX, playerY, nearestCoin.x, nearestCoin.y)
    } else {
      // Default: move right to progress
      this.currentDecision.moveRight = true
    }

    // Always check for jumps needed (including double jumps)
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

    const body = player.body as Phaser.Physics.Arcade.Body
    const onGround = body.touching.down
    const velocityX = Math.abs(body.velocity.x)

    // Jump if there's a gap ahead or obstacle
    if (onGround) {
      const lookAheadDistance = this.currentDecision.moveRight ? 120 : -120
      const hasGroundAhead = this.checkGroundAhead(playerX + lookAheadDistance, playerY)
      
      if (!hasGroundAhead) {
        // Gap ahead, jump over it
        this.currentDecision.jump = true
        console.log('🤖 AI: Jumping over gap')
      }
    } 
    // Use double jump if stuck in air or need extra height
    else {
      // If moving horizontally but going nowhere (stuck on wall/obstacle)
      const isStuck = (this.currentDecision.moveLeft || this.currentDecision.moveRight) && velocityX < 10
      
      // Check if we can still double jump
      const canDoubleJump = (this.scene as any).canDoubleJump && !(this.scene as any).hasDoubleJumped
      
      if (isStuck && canDoubleJump) {
        this.currentDecision.jump = true
        console.log('🤖 AI: Double jump to overcome obstacle')
      }
      
      // Also jump if falling and need to reach a platform ahead
      if (body.velocity.y > 0 && canDoubleJump) {
        const lookAheadDistance = this.currentDecision.moveRight ? 150 : -150
        const hasPlatformAhead = this.checkGroundAhead(playerX + lookAheadDistance, playerY - 100)
        
        if (hasPlatformAhead) {
          this.currentDecision.jump = true
          console.log('🤖 AI: Double jump to reach platform')
        }
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

  private findPortal(): { x: number, y: number, distance: number } | null {
    const portal = (this.scene as any).portal
    if (!portal || !portal.active) return null
    
    const player = this.getPlayer()
    if (!player) return null
    
    const distance = Phaser.Math.Distance.Between(player.x, player.y, portal.x, portal.y)
    return { x: portal.x, y: portal.y, distance }
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
