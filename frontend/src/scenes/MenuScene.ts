import Phaser from 'phaser'
import { GameAPI } from '../services/api'
import { MLAIPlayer } from '../utils/MLAIPlayer'

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
    
    // Set background to black with blackhole effect
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.createBlackholeBackground()
    
    // Add player name button in top-left corner
    const playerName = localStorage.getItem('player_name') || 'Guest'
    const nameButton = this.add.rectangle(120, 50, 200, 50, 0x0066cc, 0.8)
    nameButton.setStrokeStyle(2, 0xffffff)
    nameButton.setInteractive({ useHandCursor: true })
    nameButton.on('pointerover', () => nameButton.setFillStyle(0x0099ff, 0.9))
    nameButton.on('pointerout', () => nameButton.setFillStyle(0x0066cc, 0.8))
    nameButton.on('pointerdown', () => {
      this.showNameInputDialog()
    })
    
    const nameLabel = this.add.text(120, 40, 'PLAYER:', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontStyle: 'bold'
    })
    nameLabel.setOrigin(0.5)
    
    const nameText = this.add.text(120, 60, playerName, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    nameText.setOrigin(0.5)
    nameText.setName('playerNameText') // Store reference for updates
    
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
    const subtitle = this.add.text(640, 230, 'A Sci-Fi Platformer Adventure', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'italic'
    })
    subtitle.setOrigin(0.5)
    
    // Get equipped skin from inventory
    const equippedSkin = localStorage.getItem('equippedSkin') || 'alienBeige'
    
    // Add version number in bottom-right corner (moved from bottom-left to avoid button overlap)
    const version = this.add.text(1260, 700, 'v1.0.0', {
      fontSize: '16px',
      color: '#888888',
      fontStyle: 'bold'
    })
    version.setOrigin(1, 1)
    
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
    const shopButton = this.add.rectangle(320, 630, 180, 60, 0xaa00aa)
    shopButton.setInteractive({ useHandCursor: true })
    shopButton.on('pointerover', () => shopButton.setFillStyle(0xff00ff))
    shopButton.on('pointerout', () => shopButton.setFillStyle(0xaa00aa))
    shopButton.on('pointerdown', () => {
      this.scene.start('ShopScene', { coins: this.coinCount })
    })
    
    const shopText = this.add.text(320, 630, 'SHOP', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    shopText.setOrigin(0.5)
    
    // Create Inventory Button
    const inventoryButton = this.add.rectangle(520, 630, 180, 60, 0xaa6600)
    inventoryButton.setInteractive({ useHandCursor: true })
    inventoryButton.on('pointerover', () => inventoryButton.setFillStyle(0xffaa00))
    inventoryButton.on('pointerout', () => inventoryButton.setFillStyle(0xaa6600))
    inventoryButton.on('pointerdown', () => {
      this.scene.start('InventoryScene')
    })
    
    const inventoryText = this.add.text(520, 630, 'INVENTORY', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    inventoryText.setOrigin(0.5)
    
    // Create Bosses Button
    const bossesButton = this.add.rectangle(720, 630, 180, 60, 0xcc0000)
    bossesButton.setInteractive({ useHandCursor: true })
    bossesButton.on('pointerover', () => bossesButton.setFillStyle(0xff0000))
    bossesButton.on('pointerout', () => bossesButton.setFillStyle(0xcc0000))
    bossesButton.on('pointerdown', () => {
      this.scene.start('BossGalleryScene')
    })
    
    const bossesText = this.add.text(720, 630, 'BOSSES', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    bossesText.setOrigin(0.5)
    
    // Create Leaderboard Button
    const leaderboardButton = this.add.rectangle(920, 630, 180, 60, 0x0066cc)
    leaderboardButton.setInteractive({ useHandCursor: true })
    leaderboardButton.on('pointerover', () => leaderboardButton.setFillStyle(0x0099ff))
    leaderboardButton.on('pointerout', () => leaderboardButton.setFillStyle(0x0066cc))
    leaderboardButton.on('pointerdown', () => {
      this.scene.start('LeaderboardScene')
    })
    
    const leaderboardText = this.add.text(920, 630, 'LEADERBOARD', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    leaderboardText.setOrigin(0.5)
    
    // Create Tutorial Button (small button in bottom left)
    const tutorialButton = this.add.rectangle(100, 680, 150, 40, 0x444444)
    tutorialButton.setInteractive({ useHandCursor: true })
    tutorialButton.on('pointerover', () => tutorialButton.setFillStyle(0x666666))
    tutorialButton.on('pointerout', () => tutorialButton.setFillStyle(0x444444))
    tutorialButton.on('pointerdown', () => {
      this.showTutorial()
    })
    
    const tutorialText = this.add.text(100, 680, 'HOW TO PLAY', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    tutorialText.setOrigin(0.5)
    
    // Create Credits Button (bottom right, above Settings)
    const creditsButton = this.add.rectangle(1150, 600, 150, 40, 0x444444)
    creditsButton.setInteractive({ useHandCursor: true })
    creditsButton.on('pointerover', () => creditsButton.setFillStyle(0x666666))
    creditsButton.on('pointerout', () => creditsButton.setFillStyle(0x444444))
    creditsButton.on('pointerdown', () => {
      this.scene.start('CreditScene')
    })
    
    const creditsText = this.add.text(1150, 600, 'CREDITS', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    creditsText.setOrigin(0.5)
    
    // Create Train ML AI Button (above Settings)
    const mlButton = this.add.rectangle(1150, 550, 180, 40, 0x00aa00)
    mlButton.setInteractive({ useHandCursor: true })
    mlButton.on('pointerover', () => mlButton.setFillStyle(0x00cc00))
    mlButton.on('pointerout', () => mlButton.setFillStyle(0x00aa00))
    mlButton.on('pointerdown', () => {
      this.showMLTraining()
    })
    
    const mlText = this.add.text(1150, 550, '🧠 TRAIN ML AI', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    mlText.setOrigin(0.5)
    
    // Create Settings Button (bottom right, above API status)
    const settingsButton = this.add.rectangle(1150, 650, 150, 40, 0x444444)
    settingsButton.setInteractive({ useHandCursor: true })
    settingsButton.on('pointerover', () => settingsButton.setFillStyle(0x666666))
    settingsButton.on('pointerout', () => settingsButton.setFillStyle(0x444444))
    settingsButton.on('pointerdown', () => {
      this.showSettings()
    })
    
    const settingsText = this.add.text(1150, 650, 'SETTINGS', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    settingsText.setOrigin(0.5)
    
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
      { key: 'ESC / Home Button', action: 'Return to main menu' }
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
    const tipsY = 450
    const tips = this.add.text(640, tipsY, 'TIPS:\n• Collect coins to buy weapons and skins in the shop\n• Power-ups: Speed (yellow), Shield (blue), Extra Life (green)\n• Boss fights appear every 5 levels\n• Use checkpoints to save your progress', {
      fontSize: '18px',
      color: '#aaaaaa',
      align: 'center',
      lineSpacing: 8
    })
    tips.setOrigin(0.5)
    tips.setDepth(102)
    
    // Cheat codes section
    const cheatsY = 560
    const cheats = this.add.text(640, cheatsY, 'CHEAT CODES:\nF3: Toggle Debug Mode | F4: Jump to Boss Level | F5: Reset Defeated Bosses', {
      fontSize: '16px',
      color: '#ff6600',
      align: 'center',
      lineSpacing: 6,
      fontStyle: 'italic'
    })
    cheats.setOrigin(0.5)
    cheats.setDepth(102)
    
    // Close button
    const closeButton = this.add.rectangle(640, 620, 200, 50, 0x00aa00)
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
      cheats.destroy()
      closeButton.destroy()
      closeText.destroy()
      
      // Destroy all control texts
      controlTexts.forEach(text => text.destroy())
    })
    
    const closeText = this.add.text(640, 620, 'GOT IT!', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    closeText.setOrigin(0.5)
    closeText.setDepth(102)
  }

  private showNameInputDialog() {
    // Create dark overlay
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85)
    overlay.setInteractive()
    overlay.setDepth(1000)
    
    // Create dialog box
    const dialogBox = this.add.rectangle(640, 360, 600, 300, 0x222222)
    dialogBox.setStrokeStyle(4, 0x00ffff)
    dialogBox.setDepth(1001)
    
    // Title
    const title = this.add.text(640, 260, 'ENTER YOUR NAME', {
      fontSize: '32px',
      color: '#00ffff',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    title.setDepth(1002)
    
    // Instructions
    const instructions = this.add.text(640, 310, 'Type your name and press ENTER', {
      fontSize: '18px',
      color: '#aaaaaa'
    })
    instructions.setOrigin(0.5)
    instructions.setDepth(1002)
    
    // Input box background
    const inputBox = this.add.rectangle(640, 370, 400, 50, 0x000000)
    inputBox.setStrokeStyle(2, 0xffffff)
    inputBox.setDepth(1002)
    
    // Current name display
    const currentName = localStorage.getItem('player_name') || ''
    let inputText = currentName
    const inputDisplay = this.add.text(640, 370, inputText || '|', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    inputDisplay.setOrigin(0.5)
    inputDisplay.setDepth(1003)
    
    // Blinking cursor
    let showCursor = true
    const cursorTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        showCursor = !showCursor
        inputDisplay.setText(inputText + (showCursor ? '|' : ''))
      },
      loop: true
    })
    
    // Cancel button
    const cancelButton = this.add.rectangle(540, 450, 150, 50, 0x880000)
    cancelButton.setStrokeStyle(2, 0xff0000)
    cancelButton.setInteractive({ useHandCursor: true })
    cancelButton.setDepth(1002)
    cancelButton.on('pointerover', () => cancelButton.setFillStyle(0xcc0000))
    cancelButton.on('pointerout', () => cancelButton.setFillStyle(0x880000))
    cancelButton.on('pointerdown', () => {
      cursorTimer.remove()
      overlay.destroy()
      dialogBox.destroy()
      title.destroy()
      instructions.destroy()
      inputBox.destroy()
      inputDisplay.destroy()
      cancelButton.destroy()
      cancelText.destroy()
      saveButton.destroy()
      saveText.destroy()
      this.input.keyboard?.off('keydown')
    })
    
    const cancelText = this.add.text(540, 450, 'CANCEL', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    cancelText.setOrigin(0.5)
    cancelText.setDepth(1003)
    
    // Save button
    const saveButton = this.add.rectangle(740, 450, 150, 50, 0x008800)
    saveButton.setStrokeStyle(2, 0x00ff00)
    saveButton.setInteractive({ useHandCursor: true })
    saveButton.setDepth(1002)
    saveButton.on('pointerover', () => saveButton.setFillStyle(0x00cc00))
    saveButton.on('pointerout', () => saveButton.setFillStyle(0x008800))
    
    const saveText = this.add.text(740, 450, 'SAVE', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    saveText.setOrigin(0.5)
    saveText.setDepth(1003)
    
    const saveName = () => {
      if (inputText.trim().length > 0) {
        localStorage.setItem('player_name', inputText.trim())
        console.log('✅ Player name saved:', inputText.trim())
        
        // Update name display on menu
        const nameTextObj = this.children.getByName('playerNameText') as Phaser.GameObjects.Text
        if (nameTextObj) {
          nameTextObj.setText(inputText.trim())
        }
        
        // Show confirmation
        const confirm = this.add.text(640, 510, '✓ Name saved!', {
          fontSize: '18px',
          color: '#00ff00',
          fontStyle: 'bold'
        })
        confirm.setOrigin(0.5)
        confirm.setDepth(1003)
        
        this.time.delayedCall(1000, () => {
          cursorTimer.remove()
          overlay.destroy()
          dialogBox.destroy()
          title.destroy()
          instructions.destroy()
          inputBox.destroy()
          inputDisplay.destroy()
          cancelButton.destroy()
          cancelText.destroy()
          saveButton.destroy()
          saveText.destroy()
          confirm.destroy()
          this.input.keyboard?.off('keydown')
        })
      }
    }
    
    saveButton.on('pointerdown', saveName)
    
    // Handle keyboard input
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        saveName()
      } else if (event.key === 'Escape') {
        cancelButton.emit('pointerdown')
      } else if (event.key === 'Backspace') {
        inputText = inputText.slice(0, -1)
        inputDisplay.setText(inputText + '|')
      } else if (event.key.length === 1 && inputText.length < 20) {
        // Only add printable characters, max 20 chars
        inputText += event.key
        inputDisplay.setText(inputText + '|')
      }
    })
  }

  private createBlackholeBackground() {
    // Create a single centered blackhole for the menu
    const centerX = 640
    const centerY = 360
    const scale = 1.5
    
    // Create the blackhole core (event horizon)
    const core = this.add.circle(centerX, centerY, 60 * scale, 0x000000, 1)
    core.setDepth(-100)
    
    // Create the inner shadow/gradient ring
    const innerRing = this.add.circle(centerX, centerY, 90 * scale, 0x1a0a2e, 0.9)
    innerRing.setDepth(-99)
    
    // Create accretion disk rings (multiple layers for depth)
    const diskLayers = [
      { radius: 120, color: 0x8b2ff4, alpha: 0.6 },
      { radius: 150, color: 0x6b1fd4, alpha: 0.5 },
      { radius: 180, color: 0x4a0fb4, alpha: 0.4 },
      { radius: 210, color: 0x2a0594, alpha: 0.3 },
      { radius: 240, color: 0x1a0474, alpha: 0.2 }
    ]
    
    diskLayers.forEach(layer => {
      const ring = this.add.circle(centerX, centerY, layer.radius * scale, layer.color, layer.alpha)
      ring.setDepth(-98)
      
      // Add rotation animation to disk
      this.tweens.add({
        targets: ring,
        angle: 360,
        duration: 20000 - (layer.radius * 50), // Inner rings rotate faster
        repeat: -1,
        ease: 'Linear'
      })
    })
    
    // Create gravitational lensing effect using graphics
    const graphics = this.add.graphics()
    graphics.setDepth(-97)
    
    // Draw light distortion rings
    for (let i = 0; i < 5; i++) {
      const radius = 270 + (i * 40)
      graphics.lineStyle(2 - (i * 0.3), 0xff6b2f, 0.15 - (i * 0.02))
      graphics.strokeCircle(centerX, centerY, radius * scale)
    }
    
    // Create particle emitter for matter being pulled in
    const particles = this.add.particles(centerX, centerY, 'coin', {
      speed: { min: 30, max: 60 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 3000,
      frequency: 80,
      angle: { min: 0, max: 360 },
      tint: [0x8b2ff4, 0x6b1fd4, 0xff6b2f, 0xffa500],
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, 300 * scale),
        quantity: 48
      },
      moveToX: centerX,
      moveToY: centerY
    })
    particles.setDepth(-96)
    
    // Add pulsing glow effect to core
    this.tweens.add({
      targets: [core, innerRing],
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Add some energy jets shooting out from poles (like a real blackhole)
    const jetGraphics = this.add.graphics()
    jetGraphics.setDepth(-95)
    
    // Top jet
    jetGraphics.fillStyle(0x4a88ff, 0.3)
    jetGraphics.fillRect(centerX - 15 * scale, centerY - 300 * scale, 30 * scale, 240 * scale)
    jetGraphics.fillStyle(0x88bbff, 0.4)
    jetGraphics.fillRect(centerX - 9 * scale, centerY - 300 * scale, 18 * scale, 240 * scale)
    
    // Bottom jet
    jetGraphics.fillStyle(0x4a88ff, 0.3)
    jetGraphics.fillRect(centerX - 15 * scale, centerY + 60 * scale, 30 * scale, 240 * scale)
    jetGraphics.fillStyle(0x88bbff, 0.4)
    jetGraphics.fillRect(centerX - 9 * scale, centerY + 60 * scale, 18 * scale, 240 * scale)
    
    // Animate jet intensity
    this.tweens.add({
      targets: jetGraphics,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Add some stars in the background
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, 1280)
      const y = Phaser.Math.Between(0, 720)
      const size = Phaser.Math.Between(1, 3)
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.9))
      star.setDepth(-101)
      
      // Twinkle effect
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.9),
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
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

  private showSettings() {
    // Load current settings from localStorage
    const musicEnabled = localStorage.getItem('musicEnabled') !== 'false' // Default true
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false' // Default true
    const musicVolume = parseFloat(localStorage.getItem('musicVolume') || '0.5')
    const soundVolume = parseFloat(localStorage.getItem('soundVolume') || '0.5')

    // Create dark overlay
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85)
    overlay.setDepth(100)
    overlay.setInteractive() // Block clicks to menu

    // Create settings panel
    const panel = this.add.rectangle(640, 360, 700, 500, 0x222222, 1)
    panel.setDepth(101)
    panel.setStrokeStyle(4, 0x00aaff)

    // Settings title
    const title = this.add.text(640, 140, 'SETTINGS', {
      fontSize: '48px',
      color: '#00aaff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    })
    title.setOrigin(0.5)
    title.setDepth(102)

    const startY = 220
    const lineHeight = 80

    // Music Toggle
    const musicLabel = this.add.text(360, startY, 'Music:', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    musicLabel.setOrigin(0, 0.5)
    musicLabel.setDepth(102)

    const musicToggle = this.add.rectangle(720, startY, 100, 40, musicEnabled ? 0x00aa00 : 0xaa0000)
    musicToggle.setDepth(102)
    musicToggle.setInteractive({ useHandCursor: true })
    
    const musicToggleText = this.add.text(720, startY, musicEnabled ? 'ON' : 'OFF', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    musicToggleText.setOrigin(0.5)
    musicToggleText.setDepth(102)

    // Music Volume Slider
    const musicVolumeLabel = this.add.text(360, startY + 35, `Volume: ${Math.round(musicVolume * 100)}%`, {
      fontSize: '18px',
      color: '#aaaaaa'
    })
    musicVolumeLabel.setOrigin(0, 0.5)
    musicVolumeLabel.setDepth(102)

    const musicSliderBg = this.add.rectangle(640, startY + 35, 200, 10, 0x444444)
    musicSliderBg.setDepth(102)
    
    const musicSliderFill = this.add.rectangle(640 - 100 + musicVolume * 200, startY + 35, musicVolume * 200, 10, 0x00aaff)
    musicSliderFill.setOrigin(0, 0.5)
    musicSliderFill.setDepth(102)

    const musicSliderHandle = this.add.circle(540 + musicVolume * 200, startY + 35, 12, 0xffffff)
    musicSliderHandle.setDepth(103)
    musicSliderHandle.setInteractive({ useHandCursor: true, draggable: true })

    // Sound Toggle
    const soundLabel = this.add.text(360, startY + lineHeight, 'Sound:', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    soundLabel.setOrigin(0, 0.5)
    soundLabel.setDepth(102)

    const soundToggle = this.add.rectangle(720, startY + lineHeight, 100, 40, soundEnabled ? 0x00aa00 : 0xaa0000)
    soundToggle.setDepth(102)
    soundToggle.setInteractive({ useHandCursor: true })
    
    const soundToggleText = this.add.text(720, startY + lineHeight, soundEnabled ? 'ON' : 'OFF', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    soundToggleText.setOrigin(0.5)
    soundToggleText.setDepth(102)

    // Sound Volume Slider
    const soundVolumeLabel = this.add.text(360, startY + lineHeight + 35, `Volume: ${Math.round(soundVolume * 100)}%`, {
      fontSize: '18px',
      color: '#aaaaaa'
    })
    soundVolumeLabel.setOrigin(0, 0.5)
    soundVolumeLabel.setDepth(102)

    const soundSliderBg = this.add.rectangle(640, startY + lineHeight + 35, 200, 10, 0x444444)
    soundSliderBg.setDepth(102)
    
    const soundSliderFill = this.add.rectangle(640 - 100 + soundVolume * 200, startY + lineHeight + 35, soundVolume * 200, 10, 0x00aaff)
    soundSliderFill.setOrigin(0, 0.5)
    soundSliderFill.setDepth(102)

    const soundSliderHandle = this.add.circle(540 + soundVolume * 200, startY + lineHeight + 35, 12, 0xffffff)
    soundSliderHandle.setDepth(103)
    soundSliderHandle.setInteractive({ useHandCursor: true, draggable: true })

    // Controls Button
    const controlsButton = this.add.rectangle(640, startY + lineHeight * 2 + 20, 300, 50, 0x444444)
    controlsButton.setDepth(102)
    controlsButton.setInteractive({ useHandCursor: true })
    controlsButton.on('pointerover', () => controlsButton.setFillStyle(0x666666))
    controlsButton.on('pointerout', () => controlsButton.setFillStyle(0x444444))
    controlsButton.on('pointerdown', () => {
      // Close settings menu first
      overlay.destroy()
      panel.destroy()
      title.destroy()
      musicLabel.destroy()
      musicToggle.destroy()
      musicToggleText.destroy()
      musicVolumeLabel.destroy()
      musicSliderBg.destroy()
      musicSliderFill.destroy()
      musicSliderHandle.destroy()
      soundLabel.destroy()
      soundToggle.destroy()
      soundToggleText.destroy()
      soundVolumeLabel.destroy()
      soundSliderBg.destroy()
      soundSliderFill.destroy()
      soundSliderHandle.destroy()
      controlsButton.destroy()
      controlsButtonText.destroy()
      closeButton.destroy()
      closeText.destroy()
      this.input.off('drag')
      
      // Open controls menu
      this.showControlSettings()
    })

    const controlsButtonText = this.add.text(640, startY + lineHeight * 2 + 20, 'CONFIGURE CONTROLS', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    controlsButtonText.setOrigin(0.5)
    controlsButtonText.setDepth(102)

    // Music toggle functionality
    let currentMusicEnabled = musicEnabled
    musicToggle.on('pointerdown', () => {
      currentMusicEnabled = !currentMusicEnabled
      musicToggle.setFillStyle(currentMusicEnabled ? 0x00aa00 : 0xaa0000)
      musicToggleText.setText(currentMusicEnabled ? 'ON' : 'OFF')
      localStorage.setItem('musicEnabled', currentMusicEnabled.toString())
    })

    // Sound toggle functionality
    let currentSoundEnabled = soundEnabled
    soundToggle.on('pointerdown', () => {
      currentSoundEnabled = !currentSoundEnabled
      soundToggle.setFillStyle(currentSoundEnabled ? 0x00aa00 : 0xaa0000)
      soundToggleText.setText(currentSoundEnabled ? 'ON' : 'OFF')
      localStorage.setItem('soundEnabled', currentSoundEnabled.toString())
    })

    // Music volume slider drag
    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
      if (gameObject === musicSliderHandle) {
        const clampedX = Phaser.Math.Clamp(dragX, 540, 740)
        musicSliderHandle.x = clampedX
        const volume = (clampedX - 540) / 200
        musicSliderFill.width = volume * 200
        musicSliderFill.x = 540
        musicVolumeLabel.setText(`Volume: ${Math.round(volume * 100)}%`)
        localStorage.setItem('musicVolume', volume.toString())
      } else if (gameObject === soundSliderHandle) {
        const clampedX = Phaser.Math.Clamp(dragX, 540, 740)
        soundSliderHandle.x = clampedX
        const volume = (clampedX - 540) / 200
        soundSliderFill.width = volume * 200
        soundSliderFill.x = 540
        soundVolumeLabel.setText(`Volume: ${Math.round(volume * 100)}%`)
        localStorage.setItem('soundVolume', volume.toString())
      }
    })

    // Close button
    const closeButton = this.add.rectangle(640, 520, 200, 50, 0x00aaff)
    closeButton.setDepth(102)
    closeButton.setInteractive({ useHandCursor: true })
    closeButton.on('pointerover', () => closeButton.setFillStyle(0x00ddff))
    closeButton.on('pointerout', () => closeButton.setFillStyle(0x00aaff))
    closeButton.on('pointerdown', () => {
      // Destroy all settings UI elements
      overlay.destroy()
      panel.destroy()
      title.destroy()
      musicLabel.destroy()
      musicToggle.destroy()
      musicToggleText.destroy()
      musicVolumeLabel.destroy()
      musicSliderBg.destroy()
      musicSliderFill.destroy()
      musicSliderHandle.destroy()
      soundLabel.destroy()
      soundToggle.destroy()
      soundToggleText.destroy()
      soundVolumeLabel.destroy()
      soundSliderBg.destroy()
      soundSliderFill.destroy()
      soundSliderHandle.destroy()
      controlsButton.destroy()
      controlsButtonText.destroy()
      closeButton.destroy()
      closeText.destroy()
      this.input.off('drag')
    })

    const closeText = this.add.text(640, 520, 'CLOSE', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    closeText.setOrigin(0.5)
    closeText.setDepth(102)
  }

  private async showMLTraining() {
    // Get training data info
    const trainingDataStr = localStorage.getItem('ml_training_data')
    const frameCount = trainingDataStr ? JSON.parse(trainingDataStr).length : 0
    
    // Get model info
    const modelMetadata = localStorage.getItem('ml-model-metadata')
    let modelInfo = { trained: false, epochs: 0, timestamp: 0 }
    if (modelMetadata) {
      try {
        modelInfo = JSON.parse(modelMetadata)
      } catch (e) {
        console.error('Failed to parse model metadata')
      }
    }

    // Create dark overlay
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.9)
    overlay.setDepth(100)
    overlay.setInteractive() // Block clicks to menu

    // Create panel with rounded corners effect (gradient border)
    const panelBorder = this.add.rectangle(640, 360, 700, 550, 0x00aaff, 1)
    panelBorder.setDepth(101)
    
    const panel = this.add.rectangle(640, 360, 690, 540, 0x1a1a1a, 1)
    panel.setDepth(101)

    // Close button (top right corner)
    const closeButton = this.add.rectangle(890, 115, 70, 35, 0x333333)
    closeButton.setDepth(102)
    closeButton.setInteractive({ useHandCursor: true })
    closeButton.on('pointerover', () => closeButton.setFillStyle(0xaa0000))
    closeButton.on('pointerout', () => closeButton.setFillStyle(0x333333))
    closeButton.on('pointerdown', () => {
      overlay.destroy()
      panelBorder.destroy()
      panel.destroy()
      title.destroy()
      dataPanel.destroy()
      frameInfo.destroy()
      statusText.destroy()
      modelStatusText.destroy()
      instructionBox.destroy()
      instructions.destroy()
      progressBg.destroy()
      progressFill.destroy()
      progressText.destroy()
      trainButton.destroy()
      trainButtonText.destroy()
      clearButton.destroy()
      clearButtonText.destroy()
      closeButton.destroy()
      closeText.destroy()
    })

    const closeText = this.add.text(890, 115, '✕', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    closeText.setOrigin(0.5)
    closeText.setDepth(102)

    // Title
    const title = this.add.text(640, 130, '🧠 ML AI TRAINING', {
      fontSize: '36px',
      color: '#00aaff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    title.setOrigin(0.5)
    title.setDepth(102)

    // Data info panel
    const dataPanel = this.add.rectangle(640, 200, 640, 80, 0x252525, 1)
    dataPanel.setDepth(102)
    dataPanel.setStrokeStyle(2, frameCount >= 100 ? 0x00ff00 : 0xff9900)

    const frameInfo = this.add.text(640, 185, `${frameCount} frames recorded`, {
      fontSize: '24px',
      color: frameCount >= 100 ? '#00ff00' : '#ff9900',
      fontStyle: 'bold'
    })
    frameInfo.setOrigin(0.5)
    frameInfo.setDepth(102)

    const statusText = this.add.text(640, 210, frameCount >= 100 ? '✓ Ready to train!' : '⚠ Need 100+ frames (press R in-game)', {
      fontSize: '15px',
      color: '#cccccc'
    })
    statusText.setOrigin(0.5)
    statusText.setDepth(102)
    
    // Model status
    const modelStatusText = this.add.text(640, 228, 
      modelInfo.trained 
        ? `Model: Trained (${modelInfo.epochs} epochs, ${new Date(modelInfo.timestamp).toLocaleDateString()})` 
        : 'Model: Not trained yet',
      {
        fontSize: '13px',
        color: modelInfo.trained ? '#00aaff' : '#999999'
      }
    )
    modelStatusText.setOrigin(0.5)
    modelStatusText.setDepth(102)

    // Instructions box
    const instructionBox = this.add.rectangle(640, 305, 640, 140, 0x252525, 1)
    instructionBox.setDepth(102)
    instructionBox.setStrokeStyle(2, 0x333333)

    const instructions = this.add.text(640, 305, 
      '1. Play normally  2. Press R to record  3. Record 200+ frames\n' +
      '4. Click TRAIN MODEL below  5. Use O in-game for ML AI',
      {
        fontSize: '15px',
        color: '#999999',
        align: 'center',
        lineSpacing: 6
      }
    )
    instructions.setOrigin(0.5)
    instructions.setDepth(102)

    // Progress bar background
    const progressBg = this.add.rectangle(640, 400, 620, 45, 0x333333)
    progressBg.setDepth(102)
    progressBg.setVisible(false)

    // Progress bar fill
    const progressFill = this.add.rectangle(330, 400, 0, 35, 0x00aa00)
    progressFill.setOrigin(0, 0.5)
    progressFill.setDepth(102)
    progressFill.setVisible(false)

    // Progress text
    const progressText = this.add.text(640, 400, 'Initializing...', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    progressText.setOrigin(0.5)
    progressText.setDepth(103)
    progressText.setVisible(false)

    // Train button
    const trainButton = this.add.rectangle(640, 470, 300, 55, frameCount >= 100 ? 0x00aa00 : 0x444444)
    trainButton.setDepth(102)
    trainButton.setStrokeStyle(3, frameCount >= 100 ? 0x00ff00 : 0x666666)
    if (frameCount >= 100) {
      trainButton.setInteractive({ useHandCursor: true })
      trainButton.on('pointerover', () => {
        trainButton.setFillStyle(0x00cc00)
        trainButton.setStrokeStyle(3, 0x00ff00)
      })
      trainButton.on('pointerout', () => {
        trainButton.setFillStyle(0x00aa00)
        trainButton.setStrokeStyle(3, 0x00ff00)
      })
      trainButton.on('pointerdown', async () => {
        trainButton.disableInteractive()
        trainButton.setFillStyle(0x555555)
        trainButton.setStrokeStyle(3, 0x777777)
        trainButtonText.setText('🔄 TRAINING...')
        instructionBox.setVisible(false)
        instructions.setVisible(false)

        // Show progress bar
        progressBg.setVisible(true)
        progressFill.setVisible(true)
        progressText.setVisible(true)

        try {
          // Create a temporary ML AI player for training
          const mlAI = new MLAIPlayer(this as any)
          
          // Train with progress callbacks (100 epochs now)
          await mlAI.train((epoch: number, logs: any) => {
            progressFill.width = (620 * epoch) / 100
            const loss = logs?.loss || logs?.['loss'] || 0
            const percent = Math.round((epoch / 100) * 100)
            progressText.setText(`Training: ${percent}% (Epoch ${epoch}/100 - Loss: ${loss.toFixed(3)})`)
          })

          trainButtonText.setText('✓ TRAINING COMPLETE!')
          trainButton.setFillStyle(0x00aa00)
          trainButton.setStrokeStyle(3, 0x00ff00)
          progressText.setText('✓ Model trained! Press O in-game to enable ML AI')
          progressFill.setFillStyle(0x00ff00)
          
          // Auto-close after 3 seconds
          this.time.delayedCall(3000, () => {
            overlay.destroy()
            panelBorder.destroy()
            panel.destroy()
            title.destroy()
            dataPanel.destroy()
            frameInfo.destroy()
            statusText.destroy()
            modelStatusText.destroy()
            instructionBox.destroy()
            instructions.destroy()
            progressBg.destroy()
            progressFill.destroy()
            progressText.destroy()
            trainButton.destroy()
            trainButtonText.destroy()
            clearButton.destroy()
            clearButtonText.destroy()
            closeButton.destroy()
            closeText.destroy()
          })
        } catch (error) {
          console.error('Training failed:', error)
          trainButtonText.setText('✕ TRAINING FAILED')
          trainButton.setFillStyle(0xaa0000)
          trainButton.setStrokeStyle(3, 0xff0000)
          progressText.setText('Error: ' + (error as Error).message)
          progressFill.setFillStyle(0xaa0000)
        }
      })
    }

    const trainButtonText = this.add.text(640, 470, frameCount >= 100 ? '▶ TRAIN MODEL' : '⚠ NEED MORE DATA', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    trainButtonText.setOrigin(0.5)
    trainButtonText.setDepth(102)

    // Clear data button
    const clearButton = this.add.rectangle(640, 540, 240, 45, 0x444444)
    clearButton.setDepth(102)
    clearButton.setStrokeStyle(2, 0x666666)
    clearButton.setInteractive({ useHandCursor: true })
    clearButton.on('pointerover', () => {
      clearButton.setFillStyle(0xaa0000)
      clearButton.setStrokeStyle(2, 0xff0000)
    })
    clearButton.on('pointerout', () => {
      clearButton.setFillStyle(0x444444)
      clearButton.setStrokeStyle(2, 0x666666)
    })
    clearButton.on('pointerdown', () => {
      localStorage.removeItem('ml_training_data')
      frameInfo.setText('0 frames recorded')
      frameInfo.setColor('#ff9900')
      statusText.setText('⚠ Need 100+ frames (press R in-game)')
      statusText.setColor('#cccccc')
      dataPanel.setStrokeStyle(2, 0xff9900)
      trainButton.disableInteractive()
      trainButton.setFillStyle(0x444444)
      trainButton.setStrokeStyle(3, 0x666666)
      trainButtonText.setText('⚠ NEED MORE DATA')
    })

    const clearButtonText = this.add.text(640, 540, '🗑 CLEAR DATA', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    clearButtonText.setOrigin(0.5)
    clearButtonText.setDepth(102)
  }

  private showControlSettings() {
    // Import ControlManager dynamically
    import('../utils/ControlManager').then(({ ControlManager }) => {
      const currentSettings = ControlManager.getControlSettings()
      let inputMethod = currentSettings.inputMethod
      let gamepadMapping = { ...currentSettings.gamepadMapping }
      let waitingForButton: 'jump' | 'shoot' | null = null

      // Create dark overlay
      const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85)
      overlay.setDepth(100)
      overlay.setInteractive()

      // Create settings panel
      const panel = this.add.rectangle(640, 360, 750, 600, 0x222222, 1)
      panel.setDepth(101)
      panel.setStrokeStyle(4, 0x00aaff)

      // Title
      const title = this.add.text(640, 100, 'CONTROL SETTINGS', {
        fontSize: '42px',
        color: '#00aaff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      })
      title.setOrigin(0.5)
      title.setDepth(102)

      const startY = 180
      const lineHeight = 70

      // Input Method Selection
      const methodLabel = this.add.text(320, startY, 'Input Method:', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      methodLabel.setOrigin(0, 0.5)
      methodLabel.setDepth(102)

      const keyboardButton = this.add.rectangle(580, startY, 150, 45, inputMethod === 'keyboard' ? 0x00aa00 : 0x444444)
      keyboardButton.setDepth(102)
      keyboardButton.setInteractive({ useHandCursor: true })

      const keyboardText = this.add.text(580, startY, 'KEYBOARD', {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      keyboardText.setOrigin(0.5)
      keyboardText.setDepth(102)

      const gamepadButton = this.add.rectangle(750, startY, 150, 45, inputMethod === 'gamepad' ? 0x00aa00 : 0x444444)
      gamepadButton.setDepth(102)
      gamepadButton.setInteractive({ useHandCursor: true })

      const gamepadText = this.add.text(750, startY, 'GAMEPAD', {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      gamepadText.setOrigin(0.5)
      gamepadText.setDepth(102)

      // Gamepad mapping section (only visible when gamepad is selected)
      const mappingContainer: Phaser.GameObjects.GameObject[] = []

      const createMappingUI = () => {
        // Clear previous mapping UI
        mappingContainer.forEach(obj => obj.destroy())
        mappingContainer.length = 0

        if (inputMethod !== 'gamepad') return

        // Jump info (D-pad Up is always used for jump)
        const jumpLabel = this.add.text(320, startY + lineHeight, 'Jump:', {
          fontSize: '22px',
          color: '#ffffff'
        })
        jumpLabel.setOrigin(0, 0.5)
        jumpLabel.setDepth(102)
        mappingContainer.push(jumpLabel)

        const jumpInfoText = this.add.text(700, startY + lineHeight, 'D-Pad Up', {
          fontSize: '18px',
          color: '#88ff88'
        })
        jumpInfoText.setOrigin(0.5)
        jumpInfoText.setDepth(102)
        mappingContainer.push(jumpInfoText)

        // Shoot button mapping
        const shootLabel = this.add.text(320, startY + lineHeight * 2, 'Shoot Button:', {
          fontSize: '22px',
          color: '#ffffff'
        })
        shootLabel.setOrigin(0, 0.5)
        shootLabel.setDepth(102)
        mappingContainer.push(shootLabel)

        const shootButtonBg = this.add.rectangle(700, startY + lineHeight * 2, 200, 40, 0x444444)
        shootButtonBg.setDepth(102)
        shootButtonBg.setInteractive({ useHandCursor: true })
        mappingContainer.push(shootButtonBg)

        const shootButtonText = this.add.text(700, startY + lineHeight * 2, 
          waitingForButton === 'shoot' ? 'Press a button...' : ControlManager.getButtonName(gamepadMapping.shoot), {
          fontSize: '18px',
          color: waitingForButton === 'shoot' ? '#ffaa00' : '#ffffff'
        })
        shootButtonText.setOrigin(0.5)
        shootButtonText.setDepth(102)
        mappingContainer.push(shootButtonText)

        shootButtonBg.on('pointerdown', () => {
          waitingForButton = 'shoot'
          shootButtonText.setText('Press a button...')
          shootButtonText.setColor('#ffaa00')
        })

        // Info text
        const infoText = this.add.text(640, startY + lineHeight * 3 + 20, 
          'Click a button field above, then press\nthe gamepad button you want to use', {
          fontSize: '16px',
          color: '#aaaaaa',
          align: 'center'
        })
        infoText.setOrigin(0.5)
        infoText.setDepth(102)
        mappingContainer.push(infoText)

        // Gamepad button listener
        const gamepadListener = () => {
          if (waitingForButton && this.input.gamepad && this.input.gamepad.total > 0) {
            const pad = this.input.gamepad.getPad(0)
            if (pad) {
              for (let i = 0; i < pad.buttons.length; i++) {
                if (pad.buttons[i].pressed) {
                  if (waitingForButton === 'shoot') {
                    gamepadMapping.shoot = i
                    shootButtonText.setText(ControlManager.getButtonName(i))
                    shootButtonText.setColor('#ffffff')
                  }
                  waitingForButton = null
                  return
                }
              }
            }
          }
        }

        this.events.on('update', gamepadListener)
        mappingContainer.push({ destroy: () => this.events.off('update', gamepadListener) } as any)
      }

      // Input method toggle
      keyboardButton.on('pointerdown', () => {
        inputMethod = 'keyboard'
        keyboardButton.setFillStyle(0x00aa00)
        gamepadButton.setFillStyle(0x444444)
        createMappingUI()
      })

      gamepadButton.on('pointerdown', () => {
        inputMethod = 'gamepad'
        keyboardButton.setFillStyle(0x444444)
        gamepadButton.setFillStyle(0x00aa00)
        createMappingUI()
      })

      // Create initial mapping UI
      createMappingUI()

      // Save & Close button
      const saveButton = this.add.rectangle(640, 580, 200, 50, 0x00aa00)
      saveButton.setDepth(102)
      saveButton.setInteractive({ useHandCursor: true })
      saveButton.on('pointerover', () => saveButton.setFillStyle(0x00dd00))
      saveButton.on('pointerout', () => saveButton.setFillStyle(0x00aa00))
      saveButton.on('pointerdown', () => {
        // Save settings
        ControlManager.saveControlSettings({
          inputMethod,
          gamepadMapping
        })

        // Cleanup
        overlay.destroy()
        panel.destroy()
        title.destroy()
        methodLabel.destroy()
        keyboardButton.destroy()
        keyboardText.destroy()
        gamepadButton.destroy()
        gamepadText.destroy()
        mappingContainer.forEach(obj => obj.destroy())
        saveButton.destroy()
        saveText.destroy()

        // Show confirmation
        const confirmText = this.add.text(640, 360, 'Settings Saved!', {
          fontSize: '32px',
          color: '#00ff00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 6
        })
        confirmText.setOrigin(0.5)
        confirmText.setDepth(102)

        this.tweens.add({
          targets: confirmText,
          alpha: 0,
          y: 320,
          duration: 1500,
          onComplete: () => confirmText.destroy()
        })
      })

      const saveText = this.add.text(640, 580, 'SAVE', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      saveText.setOrigin(0.5)
      saveText.setDepth(102)
    })
  }
}

