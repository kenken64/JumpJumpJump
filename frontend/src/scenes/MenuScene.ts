import Phaser from 'phaser'
import { GameAPI } from '../services/api'

export default class MenuScene extends Phaser.Scene {
  private coinCount: number = 0
  private apiStatusText?: Phaser.GameObjects.Text

  constructor() {
    super('MenuScene')
  }

  preload() {
    // Load UI assets
    this.load.image('coin', '/assets/kenney_platformer-art-requests/Tiles/shieldGold.png')
    
    // Load all alien skins
    this.load.image('alienBeige_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_stand.png')
    this.load.image('alienBlue_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBlue_stand.png')
    this.load.image('alienGreen_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienGreen_stand.png')
    this.load.image('alienPink_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienPink_stand.png')
    this.load.image('alienYellow_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienYellow_stand.png')
  }

  async create() {
    // Load coin count from localStorage
    const savedCoins = localStorage.getItem('playerCoins')
    this.coinCount = savedCoins ? parseInt(savedCoins) : 0

    // Check API connection status
    this.checkAPIConnection()
    
    // Set background to black
    this.cameras.main.setBackgroundColor('#000000')
    
    // Add game title
    const title = this.add.text(640, 150, 'JUMP JUMP JUMP', {
      fontSize: '72px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    })
    title.setOrigin(0.5)
    
    // Add subtitle
    const subtitle = this.add.text(640, 230, 'A Platformer Adventure', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'italic'
    })
    subtitle.setOrigin(0.5)
    
    // Get equipped skin from inventory
    const equippedSkin = localStorage.getItem('equippedSkin') || 'alienBeige'
    
    // Add player character preview with equipped skin
    const playerPreview = this.add.image(640, 360, `${equippedSkin}_stand`)
    playerPreview.setScale(2)
    
    // Floating animation for player
    this.tweens.add({
      targets: playerPreview,
      y: 340,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Add coin decorations
    const coin1 = this.add.image(450, 360, 'coin')
    const coin2 = this.add.image(830, 360, 'coin')
    coin1.setScale(0.6)
    coin2.setScale(0.6)
    
    // Rotating coins
    this.tweens.add({
      targets: [coin1, coin2],
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    })
    
    // Create Level Mode Button
    const levelButton = this.add.rectangle(640, 470, 300, 60, 0x00aa00)
    levelButton.setInteractive({ useHandCursor: true })
    levelButton.on('pointerover', () => levelButton.setFillStyle(0x00ff00))
    levelButton.on('pointerout', () => levelButton.setFillStyle(0x00aa00))
    levelButton.on('pointerdown', () => {
      this.scene.start('GameScene', { gameMode: 'levels', level: 1 })
    })
    
    const levelText = this.add.text(640, 470, 'LEVEL MODE', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    levelText.setOrigin(0.5)
    
    // Create Endless Mode Button
    const endlessButton = this.add.rectangle(640, 550, 300, 60, 0x0088aa)
    endlessButton.setInteractive({ useHandCursor: true })
    endlessButton.on('pointerover', () => endlessButton.setFillStyle(0x00ccff))
    endlessButton.on('pointerout', () => endlessButton.setFillStyle(0x0088aa))
    endlessButton.on('pointerdown', () => {
      this.scene.start('GameScene', { gameMode: 'endless', level: 1 })
    })
    
    const endlessText = this.add.text(640, 550, 'ENDLESS MODE', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    endlessText.setOrigin(0.5)
    
    // Create Shop Button
    const shopButton = this.add.rectangle(400, 630, 220, 60, 0xaa00aa)
    shopButton.setInteractive({ useHandCursor: true })
    shopButton.on('pointerover', () => shopButton.setFillStyle(0xff00ff))
    shopButton.on('pointerout', () => shopButton.setFillStyle(0xaa00aa))
    shopButton.on('pointerdown', () => {
      this.scene.start('ShopScene', { coins: this.coinCount })
    })
    
    const shopText = this.add.text(400, 630, 'SHOP', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    shopText.setOrigin(0.5)
    
    // Create Inventory Button
    const inventoryButton = this.add.rectangle(640, 630, 220, 60, 0xaa6600)
    inventoryButton.setInteractive({ useHandCursor: true })
    inventoryButton.on('pointerover', () => inventoryButton.setFillStyle(0xffaa00))
    inventoryButton.on('pointerout', () => inventoryButton.setFillStyle(0xaa6600))
    inventoryButton.on('pointerdown', () => {
      this.scene.start('InventoryScene')
    })
    
    const inventoryText = this.add.text(640, 630, 'INVENTORY', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    inventoryText.setOrigin(0.5)
    
    // Create Leaderboard Button
    const leaderboardButton = this.add.rectangle(880, 630, 220, 60, 0x0066cc)
    leaderboardButton.setInteractive({ useHandCursor: true })
    leaderboardButton.on('pointerover', () => leaderboardButton.setFillStyle(0x0099ff))
    leaderboardButton.on('pointerout', () => leaderboardButton.setFillStyle(0x0066cc))
    leaderboardButton.on('pointerdown', () => {
      this.scene.start('LeaderboardScene')
    })
    
    const leaderboardText = this.add.text(880, 630, 'LEADERBOARD', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    leaderboardText.setOrigin(0.5)
    
    // Create Tutorial Button (small button in bottom left)
    const tutorialButton = this.add.rectangle(120, 680, 180, 40, 0x444444)
    tutorialButton.setInteractive({ useHandCursor: true })
    tutorialButton.on('pointerover', () => tutorialButton.setFillStyle(0x666666))
    tutorialButton.on('pointerout', () => tutorialButton.setFillStyle(0x444444))
    tutorialButton.on('pointerdown', () => {
      this.showTutorial()
    })
    
    const tutorialText = this.add.text(120, 680, 'HOW TO PLAY', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    tutorialText.setOrigin(0.5)
    
    // Check if this is the first time playing
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial')
    if (!hasSeenTutorial) {
      // Show tutorial automatically on first launch
      this.time.delayedCall(500, () => {
        this.showTutorial()
        localStorage.setItem('hasSeenTutorial', 'true')
      })
    }
    
    // Add coin display in top right
    this.add.image(1150, 50, 'coin').setScale(0.5)
    this.add.text(1200, 50, `${this.coinCount}`, {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5)
    
    // Add controls text (moved up)
    const controls = this.add.text(640, 260, 'WASD/Arrows: Move | W/Up: Jump | Click: Shoot', {
      fontSize: '18px',
      color: '#aaaaaa'
    })
    controls.setOrigin(0.5)
    
    // Add credits
    const credits = this.add.text(640, 700, 'Assets by Kenney.nl', {
      fontSize: '16px',
      color: '#666666'
    })
    credits.setOrigin(0.5)
  }
  
  private showTutorial() {
    // Create dark overlay
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85)
    overlay.setDepth(100)
    overlay.setInteractive() // Block clicks to menu
    
    // Create tutorial panel
    const panel = this.add.rectangle(640, 360, 900, 550, 0x222222, 1)
    panel.setDepth(101)
    panel.setStrokeStyle(4, 0x00ff00)
    
    // Tutorial title
    const title = this.add.text(640, 140, 'HOW TO PLAY', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    })
    title.setOrigin(0.5)
    title.setDepth(102)
    
    // Controls section
    const controlsY = 220
    const lineHeight = 40
    
    const controls = [
      { key: 'WASD / Arrow Keys', action: 'Move left and right' },
      { key: 'W / Up Arrow', action: 'Jump (press twice for double jump)' },
      { key: 'S / Down Arrow', action: 'Duck / Stomp while jumping' },
      { key: 'Mouse / Click', action: 'Aim and shoot' },
      { key: 'Home Button (in-game)', action: 'Return to main menu' }
    ]
    
    const controlTexts: Phaser.GameObjects.Text[] = []
    
    controls.forEach((control, index) => {
      const y = controlsY + (index * lineHeight)
      
      const keyText = this.add.text(300, y, control.key, {
        fontSize: '20px',
        color: '#ffff00',
        fontStyle: 'bold'
      })
      keyText.setOrigin(0, 0.5)
      keyText.setDepth(102)
      controlTexts.push(keyText)
      
      const actionText = this.add.text(600, y, control.action, {
        fontSize: '20px',
        color: '#ffffff'
      })
      actionText.setOrigin(0, 0.5)
      actionText.setDepth(102)
      controlTexts.push(actionText)
    })
    
    // Tips section
    const tipsY = 470
    const tips = this.add.text(640, tipsY, 'TIPS:\n• Collect coins to buy weapons and skins in the shop\n• Power-ups: Speed (yellow), Shield (blue), Extra Life (green)\n• Boss fights appear every 5 levels\n• Use checkpoints to save your progress', {
      fontSize: '18px',
      color: '#aaaaaa',
      align: 'center',
      lineSpacing: 8
    })
    tips.setOrigin(0.5)
    tips.setDepth(102)
    
    // Close button
    const closeButton = this.add.rectangle(640, 600, 200, 50, 0x00aa00)
    closeButton.setDepth(102)
    closeButton.setInteractive({ useHandCursor: true })
    closeButton.on('pointerover', () => closeButton.setFillStyle(0x00ff00))
    closeButton.on('pointerout', () => closeButton.setFillStyle(0x00aa00))
    closeButton.on('pointerdown', () => {
      // Remove all tutorial elements
      overlay.destroy()
      panel.destroy()
      title.destroy()
      tips.destroy()
      closeButton.destroy()
      closeText.destroy()
      
      // Destroy all control texts
      controlTexts.forEach(text => text.destroy())
    })
    
    const closeText = this.add.text(640, 600, 'GOT IT!', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    closeText.setOrigin(0.5)
    closeText.setDepth(102)
  }

  private async checkAPIConnection() {
    // Add API status indicator in bottom right
    this.apiStatusText = this.add.text(1200, 690, '● Checking API...', {
      fontSize: '14px',
      color: '#ffaa00'
    })
    this.apiStatusText.setOrigin(1, 1)

    try {
      const isConnected = await GameAPI.checkConnection()
      if (isConnected) {
        this.apiStatusText.setText('● API Connected')
        this.apiStatusText.setColor('#00ff00')
      } else {
        this.apiStatusText.setText('● API Offline')
        this.apiStatusText.setColor('#ff0000')
      }
    } catch (error) {
      this.apiStatusText.setText('● API Error')
      this.apiStatusText.setColor('#ff0000')
      console.error('API connection check failed:', error)
    }
  }
}

