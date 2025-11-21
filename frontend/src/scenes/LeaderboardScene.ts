import Phaser from 'phaser'
import { GameAPI, type ScoreResponse } from '../services/api'

export default class LeaderboardScene extends Phaser.Scene {
  private leaderboardData: ScoreResponse[] = []
  private selectedMode: 'all' | 'levels' | 'endless' = 'all'

  constructor() {
    super({ key: 'LeaderboardScene' })
  }

  async create() {
    // Background
    this.cameras.main.setBackgroundColor('#0a0a1a')

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
      this.leaderboardData = await GameAPI.getLeaderboard(10)
      loadingText.destroy()
      this.displayLeaderboard()
    } catch (error) {
      loadingText.setText('Failed to load leaderboard.\nBackend may be offline.')
      loadingText.setColor('#ff0000')
    }

    // Mode filter buttons
    this.createFilterButtons()

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

    // Header
    this.add.text(150, startY, 'RANK   PLAYER                SCORE      LEVEL    MODE', {
      fontSize: '20px',
      color: '#ffaa00',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    })

    // Load data based on selected mode
    try {
      const mode = this.selectedMode === 'all' ? undefined : this.selectedMode
      this.leaderboardData = await GameAPI.getLeaderboard(10, mode)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      return
    }

    // Display each score
    this.leaderboardData.forEach((score, index) => {
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

      // Hover effect
      text.setInteractive({ useHandCursor: true })
      text.on('pointerover', () => {
        text.setScale(1.05)
        text.setColor('#00ff00')
        
        // Show detailed stats
        const detailsText = this.add.text(640, 650, 
          `Coins: ${score.coins} | Enemies: ${score.enemies_defeated} | Distance: ${score.distance}m`, {
          fontSize: '20px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 10, y: 5 }
        })
        detailsText.setOrigin(0.5)
        detailsText.setName('details')
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
      this.add.text(640, 400, 'No scores yet. Be the first!', {
        fontSize: '32px',
        color: '#888888'
      }).setOrigin(0.5)
    }
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
