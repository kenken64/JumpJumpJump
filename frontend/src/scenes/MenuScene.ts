import Phaser from 'phaser'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
  }

  preload() {
    // Load UI assets
    this.load.image('coin', '/assets/kenney_platformer-art-requests/Tiles/shieldGold.png')
    this.load.image('alienBeige_stand', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_stand.png')
  }

  create() {
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
    
    // Add play button text
    const playButton = this.add.text(640, 500, 'PRESS SPACE TO START', {
      fontSize: '32px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    })
    playButton.setOrigin(0.5)
    
    // Blinking animation
    this.tweens.add({
      targets: playButton,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Add controls text
    const controls = this.add.text(640, 580, 'WASD/Arrows: Move | W/Up: Jump | Click: Shoot', {
      fontSize: '18px',
      color: '#aaaaaa'
    })
    controls.setOrigin(0.5)
    
    // Add credits
    const credits = this.add.text(640, 680, 'Assets by Kenney.nl', {
      fontSize: '16px',
      color: '#666666'
    })
    credits.setOrigin(0.5)
    
    // Start game on spacebar or click
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.scene.start('GameScene')
    })
    
    this.input.on('pointerdown', () => {
      this.scene.start('GameScene')
    })
  }
}
