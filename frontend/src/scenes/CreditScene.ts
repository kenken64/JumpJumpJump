import Phaser from 'phaser'

export default class CreditScene extends Phaser.Scene {
  constructor() {
    super('CreditScene')
  }

  create() {
    const { width, height } = this.cameras.main

    // Create blackhole background effect (same as MenuScene)
    this.createBlackholeBackground()

    // Title
    const titleText = this.add.text(width / 2, 100, 'CREDITS', {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true
      }
    })
    titleText.setOrigin(0.5)

    // Credits text - tighter spacing
    const creditsY = 200
    const lineHeight = 70

    // Developer
    this.add.text(width / 2, creditsY, 'Developer', {
      fontSize: '30px',
      fontFamily: 'Arial',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, creditsY + 35, 'Aiden Phang Rui Yin', {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    // AI Copilot
    this.add.text(width / 2, creditsY + lineHeight + 35, 'AI Copilot', {
      fontSize: '30px',
      fontFamily: 'Arial',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, creditsY + lineHeight + 70, 'GitHub Copilot', {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Lead Tester
    this.add.text(width / 2, creditsY + (lineHeight * 2) + 70, 'Lead Tester', {
      fontSize: '30px',
      fontFamily: 'Arial',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, creditsY + (lineHeight * 2) + 105, 'Mommy', {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Infrastructure Engineer
    this.add.text(width / 2, creditsY + (lineHeight * 3) + 105, 'Infrastructure Engineer', {
      fontSize: '30px',
      fontFamily: 'Arial',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, creditsY + (lineHeight * 3) + 140, 'Daddy', {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Back button
    const backButton = this.add.text(width / 2, height - 80, 'BACK', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    })
    backButton.setOrigin(0.5)
    backButton.setInteractive({ useHandCursor: true })

    // Hover effect
    backButton.on('pointerover', () => {
      backButton.setScale(1.1)
      backButton.setColor('#ffaa00')
    })

    backButton.on('pointerout', () => {
      backButton.setScale(1)
      backButton.setColor('#ffffff')
    })

    // Click handler
    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene')
    })
  }

  private createBlackholeBackground() {
    const { width, height } = this.cameras.main

    // Create multiple blackholes
    const blackholePositions = [
      { x: width * 0.25, y: height * 0.3, scale: 1.0 },
      { x: width * 0.75, y: height * 0.5, scale: 0.8 },
      { x: width * 0.5, y: height * 0.7, scale: 1.2 }
    ]

    blackholePositions.forEach((pos) => {
      // Create the blackhole core (event horizon)
      const core = this.add.circle(pos.x, pos.y, 40 * pos.scale, 0x000000, 1)
      core.setDepth(-100)

      // Create the inner shadow/gradient ring
      const innerRing = this.add.circle(pos.x, pos.y, 60 * pos.scale, 0x1a0a2e, 0.9)
      innerRing.setDepth(-99)

      // Create the accretion disk glow
      const glowRing = this.add.circle(pos.x, pos.y, 90 * pos.scale, 0x4a1a8e, 0.6)
      glowRing.setDepth(-98)

      // Outer glow
      const outerGlow = this.add.circle(pos.x, pos.y, 130 * pos.scale, 0x7a2ace, 0.3)
      outerGlow.setDepth(-97)

      // Add rotation animation to the rings
      this.tweens.add({
        targets: [innerRing, glowRing, outerGlow],
        angle: 360,
        duration: 20000 / pos.scale,
        repeat: -1,
        ease: 'Linear'
      })

      // Pulsing effect
      this.tweens.add({
        targets: [glowRing, outerGlow],
        alpha: 0.3,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    })
  }
}
