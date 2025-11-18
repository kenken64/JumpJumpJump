import Phaser from 'phaser'

export default class MenuScene extends Phaser.Scene {
  private coinCount: number = 0

  constructor() {
    super('MenuScene')
  }

  preload() {
    // Load UI assets
    this.load.image('coin', '/assets/kenney_platformer-art-requests/Tiles/shieldGold.png')
    this.load.image('alienBeige_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_stand.png')
  }

  create() {
    // Load coin count from localStorage
    const savedCoins = localStorage.getItem('playerCoins')
    this.coinCount = savedCoins ? parseInt(savedCoins) : 0
    
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
    
    // Add player character preview
    const playerPreview = this.add.image(640, 360, 'alienBeige_stand')
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
    const shopButton = this.add.rectangle(640, 630, 300, 60, 0xaa00aa)
    shopButton.setInteractive({ useHandCursor: true })
    shopButton.on('pointerover', () => shopButton.setFillStyle(0xff00ff))
    shopButton.on('pointerout', () => shopButton.setFillStyle(0xaa00aa))
    shopButton.on('pointerdown', () => {
      this.scene.start('ShopScene', { coins: this.coinCount })
    })
    
    const shopText = this.add.text(640, 630, 'SHOP', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    shopText.setOrigin(0.5)
    
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
}
