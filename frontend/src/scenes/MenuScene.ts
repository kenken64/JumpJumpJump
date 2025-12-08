/**
 * @fileoverview MenuScene - Main menu and navigation hub for JumpJumpJump
 * 
 * This scene serves as the primary entry point for the game, providing:
 * - Game mode selection (Level Mode, Endless Mode, Local Co-op)
 * - Player name management
 * - Navigation to Shop, Inventory, Bosses, Leaderboard, Credits
 * - Settings configuration (audio, controls)
 * - DQN AI Training launcher
 * - Tutorial/How to Play
 * 
 * Features a visually stunning blackhole background effect with particle animations.
 * 
 * @module scenes/MenuScene
 */

import Phaser from 'phaser'
import { GameAPI } from '../services/api'

/**
 * Main menu scene handling game navigation and settings
 * @extends Phaser.Scene
 */
export default class MenuScene extends Phaser.Scene {
  /** Current player's coin balance loaded from localStorage */
  private coinCount: number = 0
  /** Text element displaying coin count */
  private coinText?: Phaser.GameObjects.Text
  /** Text element displaying API connection status */
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
    console.log('💰 MenuScene loaded coins:', savedCoins)
    this.coinCount = savedCoins ? parseInt(savedCoins) : 0

    // Mobile detection - Auto fullscreen on touch
    const isMobile = !this.sys.game.device.os.desktop
    if (isMobile) {
      this.input.once('pointerdown', () => {
        if (!this.scale.isFullscreen) {
          this.scale.startFullscreen()
        }
      })
    }

    // Check API connection status
    this.checkAPIConnection()

    // Check for saved game
    this.checkSaveGame()

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
    const title = this.add.text(640, 85, 'JUMP JUMP JUMP', {
      fontSize: '72px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    })
    title.setOrigin(0.5)

    // Add subtitle
    const subtitle = this.add.text(640, 145, 'A Sci-Fi Platformer Adventure', {
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
    const playerPreview = this.add.image(640, 260, `${equippedSkin}_stand`)
    playerPreview.setScale(2)

    // Floating animation for player
    this.tweens.add({
      targets: playerPreview,
      y: 240,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Add coin decorations
    const coin1 = this.add.image(450, 260, 'coin')
    const coin2 = this.add.image(830, 260, 'coin')
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
    const levelButton = this.add.rectangle(640, 430, 300, 60, 0x00aa00)
    levelButton.setInteractive({ useHandCursor: true })
    levelButton.on('pointerover', () => levelButton.setFillStyle(0x00ff00))
    levelButton.on('pointerout', () => levelButton.setFillStyle(0x00aa00))
    levelButton.on('pointerdown', () => {
      this.scene.start('GameScene', { gameMode: 'levels', level: 1 })
    })

    const levelText = this.add.text(640, 430, 'LEVEL MODE', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    levelText.setOrigin(0.5)

    // Create Local Co-op Button
    const coopButton = this.add.rectangle(500, 500, 220, 60, 0xff6600)
    coopButton.setInteractive({ useHandCursor: true })
    coopButton.on('pointerover', () => coopButton.setFillStyle(0xff9933))
    coopButton.on('pointerout', () => coopButton.setFillStyle(0xff6600))
    coopButton.on('pointerdown', () => {
      this.scene.start('CoopLobbyScene')
    })

    const coopText = this.add.text(500, 500, '🎮 LOCAL CO-OP', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    coopText.setOrigin(0.5)

    // Create Online Co-op Button
    const onlineButton = this.add.rectangle(780, 500, 250, 60, 0x9900ff)
    onlineButton.setInteractive({ useHandCursor: true })
    onlineButton.on('pointerover', () => onlineButton.setFillStyle(0xbb33ff))
    onlineButton.on('pointerout', () => onlineButton.setFillStyle(0x9900ff))
    onlineButton.on('pointerdown', () => {
      this.scene.start('OnlineLobbyScene')
    })

    const onlineText = this.add.text(780, 500, '🌐 ONLINE CO-OP', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    onlineText.setOrigin(0.5)

    // Create Endless Mode Button
    const endlessButton = this.add.rectangle(640, 570, 300, 60, 0x0088aa)
    endlessButton.setInteractive({ useHandCursor: true })
    endlessButton.on('pointerover', () => endlessButton.setFillStyle(0x00ccff))
    endlessButton.on('pointerout', () => endlessButton.setFillStyle(0x0088aa))
    endlessButton.on('pointerdown', () => {
      this.scene.start('GameScene', { gameMode: 'endless', level: 1 })
    })

    const endlessText = this.add.text(640, 570, 'ENDLESS MODE', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    endlessText.setOrigin(0.5)

    // Create Shop Button
    const shopButton = this.add.rectangle(280, 640, 160, 50, 0xaa00aa)
    shopButton.setInteractive({ useHandCursor: true })
    shopButton.on('pointerover', () => shopButton.setFillStyle(0xff00ff))
    shopButton.on('pointerout', () => shopButton.setFillStyle(0xaa00aa))
    shopButton.on('pointerdown', () => {
      this.scene.start('ShopScene', { coins: this.coinCount })
    })

    const shopText = this.add.text(280, 640, 'SHOP', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    shopText.setOrigin(0.5)

    // Create Inventory Button
    const inventoryButton = this.add.rectangle(460, 640, 160, 50, 0xaa6600)
    inventoryButton.setInteractive({ useHandCursor: true })
    inventoryButton.on('pointerover', () => inventoryButton.setFillStyle(0xffaa00))
    inventoryButton.on('pointerout', () => inventoryButton.setFillStyle(0xaa6600))
    inventoryButton.on('pointerdown', () => {
      this.scene.start('InventoryScene')
    })

    const inventoryText = this.add.text(460, 640, 'INVENTORY', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    inventoryText.setOrigin(0.5)

    // Create Bosses Button
    const bossesButton = this.add.rectangle(640, 640, 160, 50, 0xcc0000)
    bossesButton.setInteractive({ useHandCursor: true })
    bossesButton.on('pointerover', () => bossesButton.setFillStyle(0xff0000))
    bossesButton.on('pointerout', () => bossesButton.setFillStyle(0xcc0000))
    bossesButton.on('pointerdown', () => {
      this.scene.start('BossGalleryScene')
    })

    const bossesText = this.add.text(640, 640, 'BOSSES', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    bossesText.setOrigin(0.5)

    // Create Leaderboard Button
    const leaderboardButton = this.add.rectangle(820, 640, 160, 50, 0x0066cc)
    leaderboardButton.setInteractive({ useHandCursor: true })
    leaderboardButton.on('pointerover', () => leaderboardButton.setFillStyle(0x0099ff))
    leaderboardButton.on('pointerout', () => leaderboardButton.setFillStyle(0x0066cc))
    leaderboardButton.on('pointerdown', () => {
      this.scene.start('LeaderboardScene')
    })

    const leaderboardText = this.add.text(820, 640, 'LEADERBOARD', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    leaderboardText.setOrigin(0.5)

    // Create Tutorial Button (small button in bottom left)
    const tutorialButton = this.add.rectangle(100, 700, 150, 35, 0x444444)
    tutorialButton.setInteractive({ useHandCursor: true })
    tutorialButton.on('pointerover', () => tutorialButton.setFillStyle(0x666666))
    tutorialButton.on('pointerout', () => tutorialButton.setFillStyle(0x444444))
    tutorialButton.on('pointerdown', () => {
      this.showTutorial()
    })

    const tutorialText = this.add.text(100, 700, 'HOW TO PLAY', {
      fontSize: '16px',
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

    // Create DQN AI Training Button (above Settings)
    const mlButton = this.add.rectangle(1150, 550, 180, 40, 0x00aa00)
    mlButton.setInteractive({ useHandCursor: true })
    mlButton.on('pointerover', () => mlButton.setFillStyle(0x00cc00))
    mlButton.on('pointerout', () => mlButton.setFillStyle(0x00aa00))
    mlButton.on('pointerdown', () => {
      this.showMLTraining()
    })

    const mlText = this.add.text(1150, 550, '🤖 DQN AI TRAIN', {
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
    // Move left to accommodate large numbers (e.g. 100,000+)
    this.add.image(1050, 50, 'coin').setScale(0.5)
    this.coinText = this.add.text(1100, 50, `${this.coinCount}`, {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    this.coinText.setOrigin(0, 0.5)

    // Add controls text (moved up)
    const controls = this.add.text(640, 180, 'WASD/Arrows: Move | W/Up: Jump | Click: Shoot', {
      fontSize: '18px',
      color: '#aaaaaa'
    })
    controls.setOrigin(0.5)

    // Add Kenney attribution at bottom center
    const kenney = this.add.text(640, 705, 'Assets by Kenny.nl', {
      fontSize: '16px',
      color: '#888888',
      fontStyle: 'italic'
    })
    kenney.setOrigin(0.5, 1)

    // Refresh data when scene wakes up (returns from game)
    this.events.on('wake', () => {
      const savedCoins = localStorage.getItem('playerCoins')
      this.coinCount = savedCoins ? parseInt(savedCoins) : 0
      if (this.coinText) {
        this.coinText.setText(`${this.coinCount}`)
      }
    })
  }

  /**
   * Displays the tutorial/how-to-play overlay with game controls and tips
   * Shows automatically on first launch, can be accessed from menu button
   * @private
   */
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

  /**
   * Shows dialog for player to enter/change their name
   * Saves to localStorage and updates display when confirmed
   * @private
   */
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

  /**
   * Creates the animated blackhole background effect
   * Includes accretion disk, gravitational lensing, energy jets, and star field
   * @private
   */
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

  /**
   * Checks backend API connection status and updates indicator
   * Shows green for connected, red for offline/error
   * @private
   * @async
   */
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

  /**
   * Opens the settings panel with audio controls and access to control configuration
   * Includes music/sound toggles and volume sliders
   * @private
   */
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

    const musicSliderFill = this.add.rectangle(540, startY + 35, musicVolume * 200, 10, 0x00aaff)
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

    const soundSliderFill = this.add.rectangle(540, startY + lineHeight + 35, soundVolume * 200, 10, 0x00aaff)
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

  /**
   * Shows the DQN AI Training launcher panel
   * Allows selection of game mode (endless/levels) before starting AI training
   * @private
   * @async
   */
  private async showMLTraining() {
    // Create semi-transparent overlay (allows game to be visible behind)
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7)
    overlay.setDepth(100)
    overlay.setInteractive() // Block clicks to menu

    // Create left panel for game preview
    const gamePreviewBorder = this.add.rectangle(280, 360, 480, 680, 0x00aaff, 1)
    gamePreviewBorder.setDepth(101)
    
    const gamePreviewPanel = this.add.rectangle(280, 360, 470, 670, 0x000000, 1)
    gamePreviewPanel.setDepth(101)
    
    const previewTitle = this.add.text(280, 40, 'GAME PREVIEW', {
      fontSize: '20px',
      color: '#00aaff',
      fontStyle: 'bold'
    })
    previewTitle.setOrigin(0.5)
    previewTitle.setDepth(102)

    // Create right panel for controls and stats
    const panelBorder = this.add.rectangle(900, 360, 660, 680, 0x00aaff, 1)
    panelBorder.setDepth(101)

    const panel = this.add.rectangle(900, 360, 650, 670, 0x1a1a1a, 1)
    panel.setDepth(101)

    // Title at top
    const title = this.add.text(640, 25, '🤖 DQN AI Training', {
      fontSize: '32px',
      color: '#00aaff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    title.setOrigin(0.5)
    title.setDepth(102)
    
    // Subtitle
    const subtitle = this.add.text(900, 80, 'Training Statistics:', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    subtitle.setOrigin(0.5)
    subtitle.setDepth(102)

    // Stats display
    const statsStartY = 120
    const statsLineHeight = 45
    
    const statsLabels = [
      { label: 'Epsilon:', value: '0.1765', color: '#00ff00' },
      { label: 'Buffer:', value: '445 / ✓', color: '#00ff00' },
      { label: 'Training Steps:', value: '346', color: '#00ff00' },
      { label: 'Episodes:', value: '0', color: '#ffaa00' },
      { label: 'Avg Reward:', value: '0.00', color: '#00aaff' }
    ]
    
    const statTexts: { [key: string]: Phaser.GameObjects.Text } = {}
    
    statsLabels.forEach((stat, index) => {
      const labelText = this.add.text(620, statsStartY + index * statsLineHeight, stat.label, {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      labelText.setOrigin(0, 0.5)
      labelText.setDepth(102)
      labelText.setName(`statLabel_${stat.label}`)
      
      const valueText = this.add.text(1180, statsStartY + index * statsLineHeight, stat.value, {
        fontSize: '22px',
        color: stat.color,
        fontStyle: 'bold'
      })
      valueText.setOrigin(1, 0.5)
      valueText.setDepth(102)
      valueText.setName(`statValue_${stat.label}`)
      statTexts[stat.label] = valueText
    })

    // Status display
    const statusBg = this.add.rectangle(900, 360, 620, 80, 0x252525, 1)
    statusBg.setDepth(102)
    statusBg.setStrokeStyle(2, 0xffaa00)
    statusBg.setName('statusBg')
    
    const statusLabel = this.add.text(900, 345, 'Status:', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    statusLabel.setOrigin(0.5)
    statusLabel.setDepth(102)
    statusLabel.setName('statusLabel')
    
    const statusText = this.add.text(900, 375, '● PAUSED', {
      fontSize: '28px',
      color: '#ffaa00',
      fontStyle: 'bold'
    })
    statusText.setOrigin(0.5)
    statusText.setDepth(102)
    statusText.setName('statusText')
    
    // Episode and step info
    const episodeLabel = this.add.text(900, 450, 'Episode: 1', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    episodeLabel.setOrigin(0.5)
    episodeLabel.setDepth(102)
    episodeLabel.setName('episodeLabel')
    
    const stepLabel = this.add.text(900, 485, 'Step: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    stepLabel.setOrigin(0.5)
    stepLabel.setDepth(102)
    stepLabel.setName('stepLabel')
    
    const speedLabel = this.add.text(900, 520, 'Speed: 1x', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    speedLabel.setOrigin(0.5)
    speedLabel.setDepth(102)
    speedLabel.setName('speedLabel')
    
    const autoRestartLabel = this.add.text(900, 555, 'Auto-Restart: ON', {
      fontSize: '20px',
      color: '#00ff00',
      fontStyle: 'bold'
    })
    autoRestartLabel.setOrigin(0.5)
    autoRestartLabel.setDepth(102)
    autoRestartLabel.setName('autoRestartLabel')
    
    // Current and last reward
    const currentRewardLabel = this.add.text(900, 595, 'Current Reward: 0.00', {
      fontSize: '18px',
      color: '#ffaa00',
      fontStyle: 'bold'
    })
    currentRewardLabel.setOrigin(0.5)
    currentRewardLabel.setDepth(102)
    currentRewardLabel.setName('currentRewardLabel')
    
    const lastRewardLabel = this.add.text(900, 625, 'Last Reward: 0.00', {
      fontSize: '18px',
      color: '#ffaa00',
      fontStyle: 'bold'
    })
    lastRewardLabel.setOrigin(0.5)
    lastRewardLabel.setDepth(102)
    lastRewardLabel.setName('lastRewardLabel')
    
    // Controls hint - positioned at bottom of right panel
    const controlsHint = this.add.text(900, 660, 'SPACE: Start/Pause | R: Reset | S: Save | L: Load\n1-5: Speed | A: Auto-Restart | ESC: Menu', {
      fontSize: '12px',
      color: '#666666',
      align: 'center'
    })
    controlsHint.setOrigin(0.5, 0.5)
    controlsHint.setDepth(102)
    controlsHint.setName('controlsHint')

    // Game mode selection
    let selectedMode: 'endless' | 'levels' = 'endless'
    
    const modeLabel = this.add.text(280, 610, 'Select Mode:', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    modeLabel.setOrigin(0.5)
    modeLabel.setDepth(102)

    // Endless Mode Button
    const endlessButton = this.add.rectangle(180, 645, 150, 40, 0x00aaff)
    endlessButton.setDepth(102)
    endlessButton.setStrokeStyle(3, 0x00ffff)
    endlessButton.setInteractive({ useHandCursor: true })

    const endlessText = this.add.text(180, 645, 'ENDLESS', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    endlessText.setOrigin(0.5)
    endlessText.setDepth(102)

    // Levels Mode Button
    const levelsButton = this.add.rectangle(380, 645, 150, 40, 0x444444)
    levelsButton.setDepth(102)
    levelsButton.setStrokeStyle(2, 0x666666)
    levelsButton.setInteractive({ useHandCursor: true })

    const levelsText = this.add.text(380, 645, 'LEVELS', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    levelsText.setOrigin(0.5)
    levelsText.setDepth(102)

    // Mode button handlers
    endlessButton.on('pointerdown', () => {
      selectedMode = 'endless'
      endlessButton.setFillStyle(0x00aaff)
      endlessButton.setStrokeStyle(3, 0x00ffff)
      levelsButton.setFillStyle(0x444444)
      levelsButton.setStrokeStyle(2, 0x666666)
    })

    levelsButton.on('pointerdown', () => {
      selectedMode = 'levels'
      levelsButton.setFillStyle(0x00aaff)
      levelsButton.setStrokeStyle(3, 0x00ffff)
      endlessButton.setFillStyle(0x444444)
      endlessButton.setStrokeStyle(2, 0x666666)
    })

    // Start Training button - launches game with DQN agent
    const startButton = this.add.rectangle(280, 695, 460, 50, 0x00aa00)
    startButton.setDepth(102)
    startButton.setStrokeStyle(3, 0x00ff00)
    startButton.setInteractive({ useHandCursor: true })
    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x00cc00)
    })
    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x00aa00)
    })
    startButton.on('pointerdown', () => {
      // Launch game in DQN training mode
      console.log(`🤖 Starting DQN training session (${selectedMode} mode)...`)
      this.scene.start('GameScene', { 
        gameMode: selectedMode, 
        level: 1,
        dqnTraining: true  // Flag to enable DQN agent
      })
    })

    const startButtonText = this.add.text(280, 695, '▶ START AI', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    startButtonText.setOrigin(0.5)
    startButtonText.setDepth(102)
  }

  /**
   * Shows control configuration panel for keyboard/gamepad selection
   * Detects connected gamepads and displays mapping information
   * @private
   */
  private showControlSettings() {
    // Import ControlManager dynamically
    import('../utils/ControlManager').then(({ ControlManager }) => {
      const currentSettings = ControlManager.getControlSettings()
      let inputMethod = currentSettings.inputMethod
      const gamepadMapping = { ...currentSettings.gamepadMapping }
      // Gamepad plugin is already initialized via game config

      // Function to count actual connected gamepads
      const getGamepadCount = (silent: boolean = true): number => {
        if (!this.input.gamepad) {
          console.log('⚠️ this.input.gamepad is null/undefined')
          return 0
        }

        // Check browser's native gamepad API and filter out nulls
        const nativeGamepads = navigator.getGamepads ? navigator.getGamepads() : []

        if (!silent) {
          console.log('🎮 Raw navigator.getGamepads():', nativeGamepads)
          console.log('🎮 Array length:', nativeGamepads.length)

          // Log each index
          for (let i = 0; i < nativeGamepads.length; i++) {
            if (nativeGamepads[i]) {
              console.log(`  [${i}] ${nativeGamepads[i]!.id} (connected: ${nativeGamepads[i]!.connected})`)
            } else {
              console.log(`  [${i}] null`)
            }
          }
        }

        const activeGamepads = Array.from(nativeGamepads).filter(gp => gp !== null && gp !== undefined)
        const count = activeGamepads.length

        if (!silent) {
          console.log(`🎮 Active gamepad count: ${count}`)
          if (count > 0) {
            activeGamepads.forEach((gp) => {
              console.log(`  - Gamepad at index ${gp!.index}: ${gp!.id}`)
            })
          }
        }

        return count
      }

      // Detect connected gamepads (verbose first check)
      let gamepadCount = getGamepadCount(false)

      console.log(`🎮 Final detected gamepad count: ${gamepadCount}`)

      // Create dark overlay
      const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85)
      overlay.setDepth(100)
      overlay.setInteractive()

      // Create settings panel (taller if 2 gamepads detected)
      const panelHeight = gamepadCount >= 2 ? 700 : 600
      const panel = this.add.rectangle(640, 360, 750, panelHeight, 0x222222, 1)
      panel.setDepth(101)
      panel.setStrokeStyle(4, 0x00aaff)

      // Title
      const titleText = gamepadCount >= 2 ? 'CONTROL SETTINGS (2 GAMEPADS)' : 'CONTROL SETTINGS'
      const title = this.add.text(640, 100, titleText, {
        fontSize: gamepadCount >= 2 ? '36px' : '42px',
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

        // Show gamepad connection status
        const statusText = this.add.text(640, startY + lineHeight - 20,
          gamepadCount === 0 ? '⚠️ No gamepads detected' :
            gamepadCount === 1 ? '🎮 1 gamepad connected' :
              '🎮 2 gamepads connected', {
          fontSize: '18px',
          color: gamepadCount === 0 ? '#ffaa00' : '#88ff88',
          align: 'center'
        })
        statusText.setOrigin(0.5)
        statusText.setDepth(102)
        mappingContainer.push(statusText)

        if (gamepadCount === 0) {
          const helpText = this.add.text(640, startY + lineHeight + 20,
            'Press any button on your gamepad to detect it', {
            fontSize: '18px',
            color: '#ffaa00',
            align: 'center',
            fontStyle: 'bold'
          })
          helpText.setOrigin(0.5)
          helpText.setDepth(102)
          mappingContainer.push(helpText)
          return
        }

        // Jump info (Left stick up or A button for jump)
        const jumpLabel = this.add.text(320, startY + lineHeight, 'Jump:', {
          fontSize: '22px',
          color: '#ffffff'
        })
        jumpLabel.setOrigin(0, 0.5)
        jumpLabel.setDepth(102)
        mappingContainer.push(jumpLabel)

        const jumpInfoText = this.add.text(700, startY + lineHeight, 'Left Stick Up / A', {
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

        const shootInfoText = this.add.text(700, startY + lineHeight * 2, 'Right Trigger (RT/R2)', {
          fontSize: '18px',
          color: '#88ff88'
        })
        shootInfoText.setOrigin(0.5)
        shootInfoText.setDepth(102)
        mappingContainer.push(shootInfoText)

        // Aim info
        const aimLabel = this.add.text(320, startY + lineHeight * 3, 'Aim:', {
          fontSize: '22px',
          color: '#ffffff'
        })
        aimLabel.setOrigin(0, 0.5)
        aimLabel.setDepth(102)
        mappingContainer.push(aimLabel)

        const aimInfoText = this.add.text(700, startY + lineHeight * 3, 'Right Stick', {
          fontSize: '18px',
          color: '#88ff88'
        })
        aimInfoText.setOrigin(0.5)
        aimInfoText.setDepth(102)
        mappingContainer.push(aimInfoText)

        // Info text for dual gamepad
        let infoTextContent = 'Move: Left Stick | Jump: Left Stick Up / A Button\nShoot: Right Trigger (RT/R2) | Aim: Right Stick'
        if (gamepadCount >= 2) {
          infoTextContent += '\n\nBoth gamepads use the same controls for co-op mode'
        }

        const infoText = this.add.text(640, startY + lineHeight * 4 + 20, infoTextContent, {
          fontSize: '14px',
          color: '#aaaaaa',
          align: 'center'
        })
        infoText.setOrigin(0.5)
        infoText.setDepth(102)
        mappingContainer.push(infoText)

        // Gamepad test listener - show active gamepad inputs
        let pollCount = 0
        const gamepadListener = () => {
          pollCount++
          // Log every 60 frames (about 1 second)
          const verbose = pollCount % 60 === 0

          if (verbose) {
            console.log('🔍 Polling gamepads...')
          }

          // Update gamepad count dynamically using native API
          const newCount = getGamepadCount(verbose)

          if (newCount !== gamepadCount) {
            // Gamepad connection changed, refresh UI
            const oldCount = gamepadCount
            gamepadCount = newCount
            console.log(`🎮 Gamepad count changed from ${oldCount} to ${newCount}!`)
            createMappingUI()
          }
        }

        // Add window event listener for gamepad connection
        const connectionHandler = (e: GamepadEvent) => {
          console.log('🎮 Gamepad connected event fired:', e.gamepad)
          const gp = e.gamepad
          console.log(`Gamepad connected at index ${gp.index}: ${gp.id}. ${gp.buttons.length} buttons, ${gp.axes.length} axes.`)
          gamepadListener()
        }

        const disconnectionHandler = (e: GamepadEvent) => {
          console.log('🎮 Gamepad disconnected event fired:', e.gamepad)
          gamepadListener()
        }

        window.addEventListener('gamepadconnected', connectionHandler)
        window.addEventListener('gamepaddisconnected', disconnectionHandler)

        this.events.on('update', gamepadListener)

        // Cleanup function
        mappingContainer.push({
          destroy: () => {
            this.events.off('update', gamepadListener)
            window.removeEventListener('gamepadconnected', connectionHandler)
            window.removeEventListener('gamepaddisconnected', disconnectionHandler)
          }
        } as any)
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

      // Save & Close button (adjust position based on panel height)
      const saveButtonY = gamepadCount >= 2 ? 630 : 580
      const saveButton = this.add.rectangle(640, saveButtonY, 200, 50, 0x00aa00)
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

      const saveText = this.add.text(640, saveButtonY, 'SAVE', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      saveText.setOrigin(0.5)
      saveText.setDepth(102)
    })
  }

  /**
   * Check if a saved game exists for the current player
   */
  private async checkSaveGame() {
    const playerName = localStorage.getItem('player_name') || 'Guest'
    try {
      const save = await GameAPI.loadGame(playerName)
      if (save) {
        this.createLoadGameButton(save)
      }
    } catch (e) {
      // No save found or API error, ignore
      console.log('No saved game found or API unavailable')
    }
  }

  /**
   * Create the "Load Game" button
   */
  private createLoadGameButton(save: any) {
    // Create button above Level Mode
    const loadButton = this.add.rectangle(640, 360, 300, 50, 0x00aa00)
    loadButton.setInteractive({ useHandCursor: true })
    loadButton.on('pointerover', () => loadButton.setFillStyle(0x00cc00))
    loadButton.on('pointerout', () => loadButton.setFillStyle(0x00aa00))
    loadButton.on('pointerdown', () => {
      this.scene.start('GameScene', { 
        gameMode: 'levels', 
        level: save.level,
        score: save.score,
        lives: save.lives,
        health: save.health,
        coins: save.coins,
        weapon: save.weapon,
        isLoadedGame: true
      })
    })

    const loadText = this.add.text(640, 360, `CONTINUE: LEVEL ${save.level}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    loadText.setOrigin(0.5)
  }
}

