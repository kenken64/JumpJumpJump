/**
 * @fileoverview LeaderboardScene - Displays high scores from the backend
 * 
 * Features:
 * - Fetches scores from FastAPI backend
 * - Pagination for browsing many scores
 * - Filter by game mode (all, levels, endless)
 * - Shows rank, player name, score, level, coins, enemies
 * 
 * @module scenes/LeaderboardScene
 */

import Phaser from 'phaser'
import { GameAPI, type ScoreResponse } from '../services/api'

/**
 * Scene displaying high score leaderboard with filtering and pagination
 * @extends Phaser.Scene
 */
export default class LeaderboardScene extends Phaser.Scene {
  private leaderboardData: ScoreResponse[] = []
  private selectedMode: 'all' | 'levels' | 'endless' = 'all'
  private currentPage: number = 1
  private itemsPerPage: number = 6
  private prevButton?: Phaser.GameObjects.Rectangle
  private nextButton?: Phaser.GameObjects.Rectangle
  private prevButtonText?: Phaser.GameObjects.Text
  private nextButtonText?: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'LeaderboardScene' })
  }

  async create() {
    // Background
    this.cameras.main.setBackgroundColor('#0a0a1a')

    // Reset page to 1 on scene start
    this.currentPage = 1

    // Title
    const title = this.add.text(640, 50, 'LEADERBOARD', {
      fontSize: '64px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    })
    title.setOrigin(0.5)

    // Loading text
    const loadingText = this.add.text(640, 360, 'Loading scores...', {
      fontSize: '32px',
      color: '#ffffff'
    })
    loadingText.setOrigin(0.5)

    // Load leaderboard data
    try {
      this.leaderboardData = await GameAPI.getLeaderboard(100) // Load more to support pagination
      loadingText.destroy()
      this.displayLeaderboard()
    } catch (error) {
      loadingText.setText('Failed to load leaderboard.\nBackend may be offline.')
      loadingText.setColor('#ff0000')
    }

    // Mode filter buttons
    this.createFilterButtons()

    // Pagination controls
    this.createPaginationControls()

    // Back button
    this.createBackButton()
  }

  private createFilterButtons() {
    const buttonY = 130
    const modes: Array<{ key: 'all' | 'levels' | 'endless', label: string, x: number }> = [
      { key: 'all', label: 'ALL', x: 440 },
      { key: 'levels', label: 'LEVELS', x: 640 },
      { key: 'endless', label: 'ENDLESS', x: 840 }
    ]

    modes.forEach(mode => {
      const isSelected = this.selectedMode === mode.key
      const btn = this.add.rectangle(mode.x, buttonY, 160, 50, isSelected ? 0x00aa00 : 0x444444)
      btn.setStrokeStyle(3, isSelected ? 0x00ff00 : 0x666666)
      btn.setInteractive({ useHandCursor: true })

      const btnText = this.add.text(mode.x, buttonY, mode.label, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      btnText.setOrigin(0.5)

      btn.on('pointerover', () => {
        if (this.selectedMode !== mode.key) {
          btn.setFillStyle(0x666666)
        }
      })

      btn.on('pointerout', () => {
        if (this.selectedMode !== mode.key) {
          btn.setFillStyle(0x444444)
        }
      })

      btn.on('pointerdown', async () => {
        this.selectedMode = mode.key
        this.scene.restart()
      })
    })
  }

  private async displayLeaderboard() {
    const startY = 200
    const lineHeight = 50

    // Clear any existing details tooltip first
    const existingDetails = this.children.getByName('details')
    if (existingDetails) {
      existingDetails.destroy()
    }

    // Clear previous leaderboard display including header
    this.children.each((child) => {
      if (child.getData('leaderboardItem')) {
        // Remove all event listeners before destroying
        if (child instanceof Phaser.GameObjects.Text && child.input) {
          child.removeAllListeners()
        }
        child.destroy()
      }
    })

    // Header - must be recreated each time
    const header = this.add.text(150, startY, 'RANK   PLAYER                SCORE      LEVEL    MODE', {
      fontSize: '20px',
      color: '#ffaa00',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    })
    header.setData('leaderboardItem', true)

    // Load data based on selected mode
    try {
      const mode = this.selectedMode === 'all' ? undefined : this.selectedMode
      this.leaderboardData = await GameAPI.getLeaderboard(100, mode)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      return
    }

    // Calculate pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    const pageData = this.leaderboardData.slice(startIndex, endIndex)

    // Display each score for current page
    pageData.forEach((score, index) => {
      const y = startY + 40 + (index * lineHeight)
      
      // Rank color based on position
      let rankColor = '#ffffff'
      if (score.rank === 1) rankColor = '#ffd700' // Gold
      else if (score.rank === 2) rankColor = '#c0c0c0' // Silver
      else if (score.rank === 3) rankColor = '#cd7f32' // Bronze

      // Format player name (truncate if too long)
      const playerName = score.player_name.length > 15 
        ? score.player_name.substring(0, 15) + '...'
        : score.player_name.padEnd(18)

      const scoreText = `${String(score.rank).padStart(4)}   ${playerName}   ${String(score.score).padStart(8)}     ${String(score.level).padStart(3)}     ${score.game_mode.toUpperCase()}`

      const text = this.add.text(150, y, scoreText, {
        fontSize: '18px',
        color: rankColor,
        fontFamily: 'monospace'
      })
      text.setData('leaderboardItem', true)

      // Hover effect
      text.setInteractive({ useHandCursor: true })
      text.on('pointerover', () => {
        text.setScale(1.05)
        text.setColor('#00ff00')
        
        // Show detailed stats
        const detailsText = this.add.text(640, 600, 
          `Coins: ${score.coins} | Enemies: ${score.enemies_defeated} | Distance: ${score.distance}m`, {
          fontSize: '20px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 10, y: 5 }
        })
        detailsText.setOrigin(0.5)
        detailsText.setName('details')
        detailsText.setData('leaderboardItem', true)
      })

      text.on('pointerout', () => {
        text.setScale(1)
        text.setColor(rankColor)
        
        // Remove details
        const details = this.children.getByName('details')
        if (details) details.destroy()
      })
    })

    // Show empty state if no scores
    if (this.leaderboardData.length === 0) {
      const emptyText = this.add.text(640, 400, 'No scores yet. Be the first!', {
        fontSize: '32px',
        color: '#888888'
      }).setOrigin(0.5)
      emptyText.setData('leaderboardItem', true)
    }

    // Update pagination buttons state
    this.updatePaginationButtons()
  }

  private createPaginationControls() {
    const buttonY = 580
    const buttonWidth = 120
    const buttonHeight = 50

    // Previous button
    this.prevButton = this.add.rectangle(440, buttonY, buttonWidth, buttonHeight, 0x444444)
    this.prevButton.setStrokeStyle(3, 0x666666)
    this.prevButton.setInteractive({ useHandCursor: true })

    this.prevButtonText = this.add.text(440, buttonY, '< PREV', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.prevButtonText.setOrigin(0.5)

    this.prevButton.on('pointerover', () => {
      if (this.currentPage > 1) {
        this.prevButton!.setFillStyle(0x666666)
      }
    })

    this.prevButton.on('pointerout', () => {
      const isDisabled = this.currentPage <= 1
      this.prevButton!.setFillStyle(isDisabled ? 0x222222 : 0x444444)
    })

    this.prevButton.on('pointerdown', () => {
      if (this.currentPage > 1) {
        this.currentPage--
        this.displayLeaderboard()
      }
    })

    // Next button
    this.nextButton = this.add.rectangle(840, buttonY, buttonWidth, buttonHeight, 0x444444)
    this.nextButton.setStrokeStyle(3, 0x666666)
    this.nextButton.setInteractive({ useHandCursor: true })

    this.nextButtonText = this.add.text(840, buttonY, 'NEXT >', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.nextButtonText.setOrigin(0.5)

    this.nextButton.on('pointerover', () => {
      const totalPages = Math.ceil(this.leaderboardData.length / this.itemsPerPage)
      if (this.currentPage < totalPages) {
        this.nextButton!.setFillStyle(0x666666)
      }
    })

    this.nextButton.on('pointerout', () => {
      const totalPages = Math.ceil(this.leaderboardData.length / this.itemsPerPage)
      const isDisabled = this.currentPage >= totalPages
      this.nextButton!.setFillStyle(isDisabled ? 0x222222 : 0x444444)
    })

    this.nextButton.on('pointerdown', () => {
      const totalPages = Math.ceil(this.leaderboardData.length / this.itemsPerPage)
      if (this.currentPage < totalPages) {
        this.currentPage++
        this.displayLeaderboard()
      }
    })

    // Page indicator
    const pageText = this.add.text(640, buttonY, 'Page 1 / 1', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    pageText.setOrigin(0.5)
    pageText.setName('pageIndicator')
    pageText.setData('leaderboardItem', true)
  }

  private updatePaginationButtons() {
    const totalPages = Math.ceil(this.leaderboardData.length / this.itemsPerPage)
    
    // Update button states
    if (this.prevButton && this.prevButtonText) {
      const prevDisabled = this.currentPage <= 1
      this.prevButton.setFillStyle(prevDisabled ? 0x222222 : 0x444444)
      this.prevButtonText.setAlpha(prevDisabled ? 0.5 : 1)
    }

    if (this.nextButton && this.nextButtonText) {
      const nextDisabled = this.currentPage >= totalPages
      this.nextButton.setFillStyle(nextDisabled ? 0x222222 : 0x444444)
      this.nextButtonText.setAlpha(nextDisabled ? 0.5 : 1)
    }

    // Update page indicator - destroy old one and create new one to ensure clean display
    const oldPageIndicator = this.children.getByName('pageIndicator')
    if (oldPageIndicator) {
      oldPageIndicator.destroy()
    }
    
    const pageText = this.add.text(640, 580, `Page ${this.currentPage} / ${totalPages}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    pageText.setOrigin(0.5)
    pageText.setName('pageIndicator')
    pageText.setData('leaderboardItem', true)
  }

  private createBackButton() {
    const backBtn = this.add.rectangle(640, 650, 200, 60, 0x0066cc)
    backBtn.setStrokeStyle(3, 0x0099ff)
    backBtn.setInteractive({ useHandCursor: true })

    const backText = this.add.text(640, 650, 'BACK', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    backText.setOrigin(0.5)

    backBtn.on('pointerover', () => {
      backBtn.setFillStyle(0x0099ff)
      backBtn.setScale(1.05)
    })

    backBtn.on('pointerout', () => {
      backBtn.setFillStyle(0x0066cc)
      backBtn.setScale(1)
    })

    backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene')
    })
    
    // ESC key to return to menu
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      this.scene.start('MenuScene')
    })
  }
}
