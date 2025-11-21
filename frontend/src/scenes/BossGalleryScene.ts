import Phaser from 'phaser'
import { GameAPI, type Boss } from '../services/api'

export default class BossGalleryScene extends Phaser.Scene {
  private bosses: Boss[] = []
  private currentPage: number = 0
  private bossesPerPage: number = 8
  private totalPages: number = 0
  private bossCards: Phaser.GameObjects.GameObject[] = []
  private pageText?: Phaser.GameObjects.Text
  private prevButton?: Phaser.GameObjects.Rectangle
  private nextButton?: Phaser.GameObjects.Rectangle
  private prevButtonText?: Phaser.GameObjects.Text
  private nextButtonText?: Phaser.GameObjects.Text

  constructor() {
    super('BossGalleryScene')
  }

  preload() {
    // Reset state when entering scene
    this.currentPage = 0
    this.bossCards = []
    
    // Always reload the spritesheet to ensure it's available
    this.load.spritesheet('geminiBoss', '/assets/gemini-boss-spritesheet.png', {
      frameWidth: 256,
      frameHeight: 256
    })
  }

  async create() {
    // Set background
    this.cameras.main.setBackgroundColor('#000000')

    // Title
    const title = this.add.text(640, 50, 'BOSS GALLERY', {
      fontSize: '56px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    })
    title.setOrigin(0.5)

    // Subtitle
    const subtitle = this.add.text(640, 80, 'The Notorious Bosses of the Galaxy', {
      fontSize: '20px',
      color: '#ffcc00',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 3
    })
    subtitle.setOrigin(0.5)

    // Loading text
    const loadingText = this.add.text(640, 360, 'Loading bosses...', {
      fontSize: '24px',
      color: '#ffffff'
    })
    loadingText.setOrigin(0.5)

    try {
      // Fetch boss data from backend
      this.bosses = await GameAPI.getAllBosses()
      
      // Check if loadingText still exists before destroying
      if (loadingText && loadingText.scene) {
        loadingText.destroy()
      }

      // Calculate total pages
      this.totalPages = Math.ceil(this.bosses.length / this.bossesPerPage)

      // Display first page
      this.displayBossPage()

      // Create pagination controls
      this.createPaginationControls()

    } catch (error) {
      // Check if loadingText still exists before updating
      if (loadingText && loadingText.scene) {
        loadingText.setText('Failed to load bosses. Check backend connection.')
        loadingText.setColor('#ff0000')
      }
      console.error('Failed to fetch bosses:', error)
    }

    // Back button
    const backButton = this.add.rectangle(640, 680, 200, 50, 0x444444)
    backButton.setInteractive({ useHandCursor: true })
    backButton.on('pointerover', () => backButton.setFillStyle(0x666666))
    backButton.on('pointerout', () => backButton.setFillStyle(0x444444))
    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene')
    })

    const backText = this.add.text(640, 680, 'BACK TO MENU', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    backText.setOrigin(0.5)

    // ESC key to return
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      this.scene.start('MenuScene')
    })
  }

  private displayBossPage() {
    // Clear existing boss cards
    this.bossCards.forEach(obj => obj.destroy())
    this.bossCards = []

    // Calculate which bosses to show
    const startIndex = this.currentPage * this.bossesPerPage
    const endIndex = Math.min(startIndex + this.bossesPerPage, this.bosses.length)
    const pageBosses = this.bosses.slice(startIndex, endIndex)

    // Display bosses in a 4x2 grid (8 bosses per page)
    const startX = 240
    const startY = 220
    const spacingX = 270
    const spacingY = 270

    pageBosses.forEach((boss, index) => {
      const col = index % 4
      const row = Math.floor(index / 4)
      const x = startX + col * spacingX
      const y = startY + row * spacingY

      // Boss card background
      const card = this.add.rectangle(x, y, 240, 240, 0x111111, 0.8)
      card.setInteractive({ useHandCursor: true })
      this.bossCards.push(card)

      // Boss sprite
      const bossSprite = this.add.sprite(x, y - 30, 'geminiBoss', boss.boss_index)
      bossSprite.setScale(0.7)
      this.bossCards.push(bossSprite)

      // Boss name
      const nameText = this.add.text(x, y + 70, boss.boss_name, {
        fontSize: '16px',
        color: '#ff0000',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 220 }
      })
      nameText.setOrigin(0.5)
      this.bossCards.push(nameText)

      // Notorious title
      const titleText = this.add.text(x, y + 95, boss.notorious_title, {
        fontSize: '12px',
        color: '#ffaa00',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: 220 }
      })
      titleText.setOrigin(0.5)
      this.bossCards.push(titleText)

      // Hover effect
      card.on('pointerover', () => {
        card.setFillStyle(0x222222, 0.9)
        bossSprite.setScale(0.75)
        this.tweens.add({
          targets: bossSprite,
          angle: 360,
          duration: 500,
          ease: 'Power2'
        })
      })

      card.on('pointerout', () => {
        card.setFillStyle(0x111111, 0.8)
        bossSprite.setScale(0.7)
        bossSprite.setAngle(0)
      })
    })

    // Update page text
    if (this.pageText && this.pageText.scene) {
      this.pageText.setText(`Page ${this.currentPage + 1} / ${this.totalPages}`)
    }

    // Update button states using the new method
    this.updateButtonStates()
  }

  private createPaginationControls() {
    // Clear existing pagination elements if they exist
    if (this.pageText && this.pageText.scene) {
      this.pageText.destroy()
    }
    this.pageText = undefined
    
    if (this.prevButton && this.prevButton.scene) {
      this.prevButton.destroy()
    }
    this.prevButton = undefined
    
    if (this.prevButtonText && this.prevButtonText.scene) {
      this.prevButtonText.destroy()
    }
    this.prevButtonText = undefined
    
    if (this.nextButton && this.nextButton.scene) {
      this.nextButton.destroy()
    }
    this.nextButton = undefined
    
    if (this.nextButtonText && this.nextButtonText.scene) {
      this.nextButtonText.destroy()
    }
    this.nextButtonText = undefined
    
    // Page indicator
    this.pageText = this.add.text(640, 630, `Page ${this.currentPage + 1} / ${this.totalPages}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.pageText.setOrigin(0.5)

    // Previous button
    this.prevButton = this.add.rectangle(400, 630, 150, 50, 0x333333)
    this.prevButton.setInteractive({ useHandCursor: true })
    this.prevButton.on('pointerover', () => this.prevButton!.setFillStyle(0x555555))
    this.prevButton.on('pointerout', () => this.prevButton!.setFillStyle(0x333333))
    this.prevButton.on('pointerdown', () => {
      if (this.currentPage > 0) {
        this.currentPage--
        this.displayBossPage()
      }
    })

    this.prevButtonText = this.add.text(400, 630, '◀ PREV', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.prevButtonText.setOrigin(0.5)

    // Next button
    this.nextButton = this.add.rectangle(880, 630, 150, 50, 0x333333)
    this.nextButton.setInteractive({ useHandCursor: true })
    this.nextButton.on('pointerover', () => this.nextButton!.setFillStyle(0x555555))
    this.nextButton.on('pointerout', () => this.nextButton!.setFillStyle(0x333333))
    this.nextButton.on('pointerdown', () => {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++
        this.displayBossPage()
      }
    })

    this.nextButtonText = this.add.text(880, 630, 'NEXT ▶', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.nextButtonText.setOrigin(0.5)

    // Update button states after controls are created
    this.updateButtonStates()
  }

  private updateButtonStates() {
    // Update button states based on current page
    if (this.prevButton && this.prevButton.scene) {
      if (this.currentPage === 0) {
        this.prevButton.setAlpha(0.3)
        if (this.prevButtonText) this.prevButtonText.setAlpha(0.3)
        this.prevButton.disableInteractive()
      } else {
        this.prevButton.setAlpha(1)
        if (this.prevButtonText) this.prevButtonText.setAlpha(1)
        this.prevButton.setInteractive({ useHandCursor: true })
      }
    }

    if (this.nextButton && this.nextButton.scene) {
      if (this.currentPage === this.totalPages - 1) {
        this.nextButton.setAlpha(0.3)
        if (this.nextButtonText) this.nextButtonText.setAlpha(0.3)
        this.nextButton.disableInteractive()
      } else {
        this.nextButton.setAlpha(1)
        if (this.nextButtonText) this.nextButtonText.setAlpha(1)
        this.nextButton.setInteractive({ useHandCursor: true })
      }
    }
  }
}
