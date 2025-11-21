import Phaser from 'phaser'

interface ShopItem {
  id: string
  name: string
  type: 'weapon' | 'skin'
  price: number
  icon: string
  description: string
}

export default class ShopScene extends Phaser.Scene {
  private coinCount: number = 0
  private coinText!: Phaser.GameObjects.Text
  private shopItems: ShopItem[] = []
  private purchasedItems: Set<string> = new Set()

  constructor() {
    super('ShopScene')
  }

  init(data: { coins?: number }) {
    this.coinCount = data.coins || this.loadCoins()
    this.loadPurchasedItems()
  }

  preload() {
    // Create procedural textures for missing assets
    this.createBackArrow()
    this.createWeaponIcons()
    
    // Load skin previews (using different alien colors)
    this.load.image('skinBlue', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBlue_stand.png')
    this.load.image('skinGreen', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienGreen_stand.png')
    this.load.image('skinPink', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienPink_stand.png')
    this.load.image('skinYellow', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienYellow_stand.png')
    
    // Load coin icon
    this.load.image('coin', '/assets/kenney_platformer-art-requests/Tiles/coinGold.png')
  }

  private createBackArrow() {
    const graphics = this.make.graphics({ x: 0, y: 0 })
    
    // Blue background circle
    graphics.fillStyle(0x0066ff, 1)
    graphics.fillCircle(50, 50, 45)
    
    // White arrow pointing left
    graphics.fillStyle(0xffffff, 1)
    graphics.beginPath()
    graphics.moveTo(30, 50) // Arrow point
    graphics.lineTo(50, 35) // Top
    graphics.lineTo(50, 45) // Top inner
    graphics.lineTo(65, 45) // Top right
    graphics.lineTo(65, 55) // Bottom right
    graphics.lineTo(50, 55) // Bottom inner
    graphics.lineTo(50, 65) // Bottom
    graphics.closePath()
    graphics.fillPath()
    
    graphics.generateTexture('backArrow', 100, 100)
    graphics.destroy()
  }

  private createWeaponIcons() {
    // Create laser gun icon
    const laserGunGraphics = this.make.graphics({ x: 0, y: 0 })
    
    // Green laser gun
    laserGunGraphics.fillStyle(0x00ff00, 1)
    laserGunGraphics.fillRect(10, 35, 50, 15) // Barrel
    laserGunGraphics.fillRect(5, 40, 10, 10) // Tip
    laserGunGraphics.fillRect(55, 30, 15, 25) // Handle
    laserGunGraphics.fillRect(60, 55, 10, 10) // Grip
    
    // Energy core (cyan glow)
    laserGunGraphics.fillStyle(0x00ffff, 1)
    laserGunGraphics.fillCircle(60, 42, 5)
    
    laserGunGraphics.generateTexture('laserGun', 80, 80)
    laserGunGraphics.destroy()
    
    // Create sword icon
    const swordGraphics = this.make.graphics({ x: 0, y: 0 })
    
    // Purple energy sword blade
    swordGraphics.fillStyle(0xff00ff, 1)
    swordGraphics.fillRect(15, 5, 10, 50) // Blade
    swordGraphics.fillRect(10, 0, 20, 8) // Blade tip (pointed)
    
    // Bright glow
    swordGraphics.fillStyle(0xffaaff, 0.8)
    swordGraphics.fillRect(17, 7, 6, 46)
    
    // Handle/hilt
    swordGraphics.fillStyle(0x888888, 1)
    swordGraphics.fillRect(18, 55, 4, 15) // Grip
    swordGraphics.fillRect(12, 52, 16, 5) // Guard
    swordGraphics.fillRect(16, 70, 8, 5) // Pommel
    
    swordGraphics.generateTexture('sword', 40, 80)
    swordGraphics.destroy()
  }

  create() {
    // Shop items catalog
    this.shopItems = [
      {
        id: 'laserGun',
        name: 'Laser Gun',
        type: 'weapon',
        price: 50,
        icon: 'laserGun',
        description: 'Rapid fire laser weapon'
      },
      {
        id: 'sword',
        name: 'Energy Sword',
        type: 'weapon',
        price: 50,
        icon: 'sword',
        description: 'Melee weapon for close combat'
      },
      {
        id: 'skinBlue',
        name: 'Blue Alien',
        type: 'skin',
        price: 50,
        icon: 'skinBlue',
        description: 'Cool blue alien skin'
      },
      {
        id: 'skinGreen',
        name: 'Green Alien',
        type: 'skin',
        price: 50,
        icon: 'skinGreen',
        description: 'Mysterious green alien skin'
      },
      {
        id: 'skinPink',
        name: 'Pink Alien',
        type: 'skin',
        price: 50,
        icon: 'skinPink',
        description: 'Cute pink alien skin'
      },
      {
        id: 'skinYellow',
        name: 'Yellow Alien',
        type: 'skin',
        price: 50,
        icon: 'skinYellow',
        description: 'Bright yellow alien skin'
      }
    ]

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Title
    this.add.text(640, 50, 'SHOP', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Coin display (top-right)
    this.add.image(1150, 50, 'coin').setScale(0.5)
    this.coinText = this.add.text(1200, 50, `${this.coinCount}`, {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)
    
    // Back arrow button (top-left)
    const backArrow = this.add.image(50, 50, 'backArrow')
    backArrow.setScale(0.6)
    backArrow.setInteractive({ useHandCursor: true })
    backArrow.on('pointerover', () => backArrow.setScale(0.7))
    backArrow.on('pointerout', () => backArrow.setScale(0.6))
    backArrow.on('pointerdown', () => {
      this.saveCoins()
      this.scene.start('MenuScene')
    })
    
    // ESC key to return to menu
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      this.saveCoins()
      this.scene.start('MenuScene')
    })

    // Create shop grid
    const startX = 200
    const startY = 200
    const spacing = 400
    const rowSpacing = 250

    this.shopItems.forEach((item, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      const x = startX + col * spacing
      const y = startY + row * rowSpacing

      this.createShopItem(item, x, y)
    })
  }

  private createShopItem(item: ShopItem, x: number, y: number) {
    const isPurchased = this.purchasedItems.has(item.id)
    const canAfford = this.coinCount >= item.price

    // Item background
    const bg = this.add.rectangle(x, y, 120, 180, 0x2a2a3e, 0.8)

    // Item icon
    const icon = this.add.image(x, y - 40, item.icon)
    icon.setScale(0.8)
    icon.displayHeight = Math.min(icon.displayHeight, 60)
    icon.scaleX = icon.scaleY

    // Item name
    this.add.text(x, y + 20, item.name, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5)

    // Price or purchased status
    if (isPurchased) {
      this.add.text(x, y + 60, 'OWNED', {
        fontSize: '18px',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    } else {
      // Price display
      const priceContainer = this.add.container(x, y + 60)
      const coinIcon = this.add.image(0, 0, 'coin').setScale(0.2)
      const priceText = this.add.text(15, 0, `${item.price}`, {
        fontSize: '18px',
        color: canAfford ? '#FFD700' : '#888888',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5)
      priceContainer.add([coinIcon, priceText])

      // Buy button
      const buttonColor = canAfford ? 0x00aa00 : 0x444444
      const buyButton = this.add.rectangle(x, y + 60, 100, 30, buttonColor)
        .setInteractive({ useHandCursor: canAfford })

      if (canAfford) {
        buyButton
          .on('pointerover', () => buyButton.setFillStyle(0x00cc00))
          .on('pointerout', () => buyButton.setFillStyle(0x00aa00))
          .on('pointerdown', () => this.purchaseItem(item))
      }

      this.add.text(x, y + 60, 'BUY', {
        fontSize: '16px',
        color: canAfford ? '#ffffff' : '#666666',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    }

    // Description tooltip on hover
    bg.setInteractive({ useHandCursor: false })
      .on('pointerover', () => {
        this.showTooltip(item.description, x, y + 100)
      })
      .on('pointerout', () => {
        this.hideTooltip()
      })
  }

  private tooltipText?: Phaser.GameObjects.Text
  private tooltipBg?: Phaser.GameObjects.Rectangle

  private showTooltip(text: string, x: number, y: number) {
    this.hideTooltip()
    
    this.tooltipBg = this.add.rectangle(x, y, 200, 40, 0x000000, 0.9)
    this.tooltipText = this.add.text(x, y, text, {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 180 }
    }).setOrigin(0.5)
  }

  private hideTooltip() {
    if (this.tooltipText) {
      this.tooltipText.destroy()
      this.tooltipText = undefined
    }
    if (this.tooltipBg) {
      this.tooltipBg.destroy()
      this.tooltipBg = undefined
    }
  }

  private purchaseItem(item: ShopItem) {
    if (this.coinCount >= item.price && !this.purchasedItems.has(item.id)) {
      this.coinCount -= item.price
      this.purchasedItems.add(item.id)
      
      // Update display
      this.coinText.setText(`${this.coinCount}`)
      
      // Save purchases
      this.saveCoins()
      this.savePurchasedItems()
      
      // Show success message
      const successText = this.add.text(640, 300, `${item.name} Purchased!`, {
        fontSize: '32px',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5)

      this.tweens.add({
        targets: successText,
        alpha: 0,
        y: 250,
        duration: 2000,
        onComplete: () => successText.destroy()
      })

      // Refresh shop display
      this.scene.restart({ coins: this.coinCount })
    }
  }

  private loadCoins(): number {
    const saved = localStorage.getItem('playerCoins')
    return saved ? parseInt(saved) : 0
  }

  private saveCoins() {
    localStorage.setItem('playerCoins', this.coinCount.toString())
  }

  private loadPurchasedItems() {
    const saved = localStorage.getItem('purchasedItems')
    if (saved) {
      this.purchasedItems = new Set(JSON.parse(saved))
    }
  }

  private savePurchasedItems() {
    localStorage.setItem('purchasedItems', JSON.stringify(Array.from(this.purchasedItems)))
  }
}
