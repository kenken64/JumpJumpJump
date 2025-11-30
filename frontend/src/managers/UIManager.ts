/**
 * @fileoverview UIManager - Manages all HUD and UI elements during gameplay
 * 
 * Handles all UI-related functionality:
 * - Health bar with color-coded fill
 * - Lives counter display
 * - Score and high score tracking
 * - Coin counter with icon
 * - Level indicator
 * - Weapon reload bar
 * - AI status indicator
 * - Debug overlays (FPS, coordinates)
 * - Game over and level complete screens
 * 
 * Supports both single player and co-op UI layouts.
 * 
 * @module managers/UIManager
 */

import Phaser from 'phaser'
import { UIElements, DebugUIElements, GameMode } from '../types/GameTypes'

export interface UIConfig {
  screenWidth: number
  screenHeight: number
  isCoopMode: boolean
}

export class UIManager {
  private scene: Phaser.Scene
  private config: UIConfig
  
  // UI Elements
  private elements!: UIElements
  private debugElements: DebugUIElements = {
    debugText: null,
    fpsText: null,
    coordText: null
  }
  
  // State tracking for UI
  private debugMode: boolean = false
  private currentLevel: number = 1
  private gameMode: GameMode = 'levels'

  constructor(scene: Phaser.Scene, config: Partial<UIConfig> = {}) {
    this.scene = scene
    this.config = {
      screenWidth: 1280,
      screenHeight: 720,
      isCoopMode: false,
      ...config
    }
  }

  // ==================== INITIALIZATION ====================

  create(level: number, mode: GameMode): void {
    this.currentLevel = level
    this.gameMode = mode
    
    this.createHealthBar()
    this.createLivesDisplay()
    this.createScoreDisplay()
    this.createCoinDisplay()
    this.createLevelDisplay()
    this.createReloadBar()
    this.createAIStatusText()
  }

  private createHealthBar(): void {
    const x = this.config.isCoopMode ? 90 : 20
    const y = 20
    const width = 200
    const height = 25

    // Background
    this.elements = {} as UIElements
    this.elements.healthBarBg = this.scene.add.rectangle(x, y, width, height, 0x333333)
    this.elements.healthBarBg.setOrigin(0, 0)
    this.elements.healthBarBg.setScrollFactor(0)
    this.elements.healthBarBg.setDepth(100)
    this.elements.healthBarBg.setStrokeStyle(2, 0x000000)

    // Fill
    this.elements.healthBarFill = this.scene.add.rectangle(x + 2, y + 2, width - 4, height - 4, 0x00ff00)
    this.elements.healthBarFill.setOrigin(0, 0)
    this.elements.healthBarFill.setScrollFactor(0)
    this.elements.healthBarFill.setDepth(101)

    // Label
    const label = this.scene.add.text(x, y - 18, this.config.isCoopMode ? 'P1 HP' : 'HP', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    label.setScrollFactor(0)
    label.setDepth(102)
  }

  private createLivesDisplay(): void {
    const x = this.config.isCoopMode ? 90 : 20
    const y = 55

    this.elements.livesText = this.scene.add.text(x, y, 'Lives: 3', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.elements.livesText.setScrollFactor(0)
    this.elements.livesText.setDepth(100)
  }

  private createScoreDisplay(): void {
    const centerX = this.config.screenWidth / 2

    // Current score
    this.elements.scoreText = this.scene.add.text(centerX, 20, 'Score: 0', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    this.elements.scoreText.setOrigin(0.5, 0)
    this.elements.scoreText.setScrollFactor(0)
    this.elements.scoreText.setDepth(100)

    // High score
    const highScore = parseInt(localStorage.getItem('highScore') || '0')
    this.elements.highScoreText = this.scene.add.text(centerX, 55, `High Score: ${highScore}`, {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    })
    this.elements.highScoreText.setOrigin(0.5, 0)
    this.elements.highScoreText.setScrollFactor(0)
    this.elements.highScoreText.setDepth(100)
  }

  private createCoinDisplay(): void {
    const x = this.config.screenWidth - 150
    const y = 20

    // Coin icon
    this.elements.coinIcon = this.scene.add.image(x, y + 12, 'coin')
    this.elements.coinIcon.setScale(0.4)
    this.elements.coinIcon.setScrollFactor(0)
    this.elements.coinIcon.setDepth(100)

    // Coin text
    this.elements.coinText = this.scene.add.text(x + 25, y, '0', {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.elements.coinText.setScrollFactor(0)
    this.elements.coinText.setDepth(100)
  }

  private createLevelDisplay(): void {
    const x = this.config.screenWidth - 150
    const y = 55

    const levelLabel = this.gameMode === 'endless' ? 'ENDLESS' : `Level ${this.currentLevel}`
    
    this.elements.levelText = this.scene.add.text(x, y, levelLabel, {
      fontSize: '20px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.elements.levelText.setScrollFactor(0)
    this.elements.levelText.setDepth(100)
  }

  private createReloadBar(): void {
    const x = 20
    const y = 85
    const width = 60
    const height = 8

    // Background
    this.elements.reloadBarBg = this.scene.add.rectangle(x, y, width, height, 0x333333)
    this.elements.reloadBarBg.setOrigin(0, 0)
    this.elements.reloadBarBg.setScrollFactor(0)
    this.elements.reloadBarBg.setDepth(100)

    // Fill
    this.elements.reloadBarFill = this.scene.add.rectangle(x, y, width, height, 0x00aaff)
    this.elements.reloadBarFill.setOrigin(0, 0)
    this.elements.reloadBarFill.setScrollFactor(0)
    this.elements.reloadBarFill.setDepth(101)
  }

  private createAIStatusText(): void {
    // AI status will be shown in bottom-left when AI is active
    // Created dynamically when needed
  }

  // ==================== UPDATE METHODS ====================

  updateHealth(health: number, maxHealth: number): void {
    const healthPercent = health / maxHealth
    const maxWidth = 196 // 200 - 4 for border

    this.elements.healthBarFill.width = maxWidth * healthPercent

    // Color based on health
    if (healthPercent > 0.6) {
      this.elements.healthBarFill.setFillStyle(0x00ff00) // Green
    } else if (healthPercent > 0.3) {
      this.elements.healthBarFill.setFillStyle(0xffaa00) // Orange
    } else {
      this.elements.healthBarFill.setFillStyle(0xff0000) // Red
    }
  }

  updateLives(lives: number): void {
    if (this.config.isCoopMode) {
      this.elements.livesText.setText(`x${lives}`)
    } else {
      this.elements.livesText.setText(`Lives: ${lives}`)
    }
  }

  updateScore(score: number): void {
    this.elements.scoreText.setText(`Score: ${score}`)
    
    // Check for new high score
    const highScore = parseInt(localStorage.getItem('highScore') || '0')
    if (score > highScore) {
      localStorage.setItem('highScore', score.toString())
      this.elements.highScoreText.setText(`High Score: ${score}`)
      this.elements.highScoreText.setColor('#00ff00') // Highlight new high score
    }
  }

  updateCoins(coins: number): void {
    this.elements.coinText.setText(coins.toString())
  }

  updateLevel(level: number): void {
    this.currentLevel = level
    if (this.gameMode !== 'endless') {
      this.elements.levelText.setText(`Level ${level}`)
    }
  }

  updateReloadBar(progress: number): void {
    // progress: 0 to 1
    this.elements.reloadBarFill.width = 60 * Math.min(progress, 1)
  }

  // ==================== DEBUG MODE ====================

  enableDebugMode(): void {
    if (this.debugMode) return
    this.debugMode = true

    const x = 20
    const baseY = 120

    this.debugElements.debugText = this.scene.add.text(x, baseY, '🔧 DEBUG MODE', {
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    })
    this.debugElements.debugText.setScrollFactor(0)
    this.debugElements.debugText.setDepth(200)

    this.debugElements.fpsText = this.scene.add.text(x, baseY + 25, 'FPS: 60', {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    })
    this.debugElements.fpsText.setScrollFactor(0)
    this.debugElements.fpsText.setDepth(200)

    this.debugElements.coordText = this.scene.add.text(x, baseY + 48, 'X: 0, Y: 0', {
      fontSize: '14px',
      color: '#00ffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    })
    this.debugElements.coordText.setScrollFactor(0)
    this.debugElements.coordText.setDepth(200)
  }

  disableDebugMode(): void {
    if (!this.debugMode) return
    this.debugMode = false

    this.debugElements.debugText?.destroy()
    this.debugElements.fpsText?.destroy()
    this.debugElements.coordText?.destroy()
    
    this.debugElements = {
      debugText: null,
      fpsText: null,
      coordText: null
    }
  }

  updateDebugInfo(playerX: number, playerY: number): void {
    if (!this.debugMode) return

    const fps = Math.round(this.scene.game.loop.actualFps)
    this.debugElements.fpsText?.setText(`FPS: ${fps}`)
    this.debugElements.coordText?.setText(`X: ${Math.round(playerX)}, Y: ${Math.round(playerY)}`)
  }

  isDebugMode(): boolean {
    return this.debugMode
  }

  // ==================== SPECIAL UI ELEMENTS ====================

  showTip(message: string, duration: number = 3000): void {
    const tip = this.scene.add.text(
      this.config.screenWidth / 2,
      this.config.screenHeight - 100,
      message,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }
    )
    tip.setOrigin(0.5)
    tip.setScrollFactor(0)
    tip.setDepth(500)
    tip.setAlpha(0)

    // Fade in
    this.scene.tweens.add({
      targets: tip,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Fade out after duration
        this.scene.time.delayedCall(duration - 600, () => {
          this.scene.tweens.add({
            targets: tip,
            alpha: 0,
            duration: 300,
            onComplete: () => tip.destroy()
          })
        })
      }
    })
  }

  showAIStatus(aiType: string, isActive: boolean): void {
    const statusText = this.scene.add.text(20, this.config.screenHeight - 40, '', {
      fontSize: '16px',
      color: isActive ? '#00ff00' : '#ff0000',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    })
    statusText.setText(`${aiType}: ${isActive ? 'ON' : 'OFF'}`)
    statusText.setScrollFactor(0)
    statusText.setDepth(100)

    // Auto-hide after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: statusText,
        alpha: 0,
        duration: 500,
        onComplete: () => statusText.destroy()
      })
    })
  }

  showDamageNumber(x: number, y: number, damage: number): void {
    const damageText = this.scene.add.text(x, y - 20, `-${damage}`, {
      fontSize: '20px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    })
    damageText.setOrigin(0.5)
    damageText.setDepth(150)

    this.scene.tweens.add({
      targets: damageText,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => damageText.destroy()
    })
  }

  showScorePopup(x: number, y: number, score: number): void {
    const scoreText = this.scene.add.text(x, y - 20, `+${score}`, {
      fontSize: '18px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    })
    scoreText.setOrigin(0.5)
    scoreText.setDepth(150)

    this.scene.tweens.add({
      targets: scoreText,
      y: y - 50,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => scoreText.destroy()
    })
  }

  // ==================== BOSS UI ====================

  createBossHealthBar(bossName: string, _maxHealth: number): {
    bg: Phaser.GameObjects.Rectangle,
    fill: Phaser.GameObjects.Rectangle,
    text: Phaser.GameObjects.Text
  } {
    const centerX = this.config.screenWidth / 2
    const y = 80
    const width = 500
    const height = 30

    const bg = this.scene.add.rectangle(centerX, y, width, height, 0x000000, 0.7)
    bg.setScrollFactor(0)
    bg.setDepth(999)

    const fill = this.scene.add.rectangle(centerX, y, width, height, 0xff0000, 1)
    fill.setScrollFactor(0)
    fill.setDepth(1000)

    const text = this.scene.add.text(centerX, y, bossName, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    text.setOrigin(0.5)
    text.setScrollFactor(0)
    text.setDepth(1001)

    return { bg, fill, text }
  }

  updateBossHealthBar(
    fill: Phaser.GameObjects.Rectangle,
    health: number,
    maxHealth: number
  ): void {
    const healthPercent = health / maxHealth
    const maxWidth = 500
    const newWidth = maxWidth * healthPercent
    
    fill.setSize(newWidth, 30)
    fill.x = (this.config.screenWidth / 2) - (maxWidth - newWidth) / 2
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    Object.values(this.elements).forEach(element => element?.destroy())
    Object.values(this.debugElements).forEach(element => element?.destroy())
  }
}
