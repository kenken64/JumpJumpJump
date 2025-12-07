import Phaser from 'phaser'

export class VirtualGamepad {
  private scene: Phaser.Scene
  private leftBtn!: Phaser.GameObjects.Container
  private rightBtn!: Phaser.GameObjects.Container
  private jumpBtn!: Phaser.GameObjects.Container
  private shootBtn!: Phaser.GameObjects.Container
  
  private isLeft: boolean = false
  private isRight: boolean = false
  private isJump: boolean = false
  private isShoot: boolean = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createControls()
  }

  private createControls() {
    const { width, height } = this.scene.scale

    // Left/Right controls (D-pad style) on the left side
    const dpadY = height - 150
    const dpadX = 150

    // Left Button
    this.leftBtn = this.createButton(dpadX - 60, dpadY, '◀', 0x888888)
    this.leftBtn.setInteractive()
    this.leftBtn.on('pointerdown', () => { this.isLeft = true })
    this.leftBtn.on('pointerup', () => { this.isLeft = false })
    this.leftBtn.on('pointerout', () => { this.isLeft = false })

    // Right Button
    this.rightBtn = this.createButton(dpadX + 60, dpadY, '▶', 0x888888)
    this.rightBtn.setInteractive()
    this.rightBtn.on('pointerdown', () => { this.isRight = true })
    this.rightBtn.on('pointerup', () => { this.isRight = false })
    this.rightBtn.on('pointerout', () => { this.isRight = false })

    // Action buttons on the right side
    const actionY = height - 150
    const actionX = width - 150

    // Jump Button (A)
    this.jumpBtn = this.createButton(actionX, actionY + 60, 'JUMP', 0x00aa00, 40)
    this.jumpBtn.setInteractive()
    this.jumpBtn.on('pointerdown', () => { this.isJump = true })
    this.jumpBtn.on('pointerup', () => { this.isJump = false })
    this.jumpBtn.on('pointerout', () => { this.isJump = false })

    // Shoot Button (B)
    this.shootBtn = this.createButton(actionX + 80, actionY - 20, 'SHOOT', 0xaa0000, 40)
    this.shootBtn.setInteractive()
    this.shootBtn.on('pointerdown', () => { this.isShoot = true })
    this.shootBtn.on('pointerup', () => { this.isShoot = false })
    this.shootBtn.on('pointerout', () => { this.isShoot = false })
  }

  private createButton(x: number, y: number, label: string, color: number, radius: number = 35): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y)
    container.setScrollFactor(0)
    container.setDepth(1000)

    const circle = this.scene.add.circle(0, 0, radius, color, 0.5)
    circle.setStrokeStyle(2, 0xffffff, 0.8)
    
    const text = this.scene.add.text(0, 0, label, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    })
    text.setOrigin(0.5)

    container.add([circle, text])
    
    // Make the container interactive, but we need a hit area
    container.setSize(radius * 2, radius * 2)
    container.setInteractive({ useHandCursor: true })

    return container
  }

  public getLeft(): boolean {
    return this.isLeft
  }

  public getRight(): boolean {
    return this.isRight
  }

  public getJump(): boolean {
    return this.isJump
  }

  public getShoot(): boolean {
    return this.isShoot
  }

  public setVisible(visible: boolean) {
    this.leftBtn.setVisible(visible)
    this.rightBtn.setVisible(visible)
    this.jumpBtn.setVisible(visible)
    this.shootBtn.setVisible(visible)
  }

  public resize() {
    // Re-position controls on resize
    const { width, height } = this.scene.scale
    
    const dpadY = height - 150
    const dpadX = 150
    this.leftBtn.setPosition(dpadX - 60, dpadY)
    this.rightBtn.setPosition(dpadX + 60, dpadY)

    const actionY = height - 150
    const actionX = width - 150
    this.jumpBtn.setPosition(actionX, actionY + 60)
    this.shootBtn.setPosition(actionX + 80, actionY - 20)
  }
}
