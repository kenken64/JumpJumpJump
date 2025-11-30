/**
 * @fileoverview ShopScene - In-game shop for purchasing weapons and skins
 * 
 * Features:
 * - Browse available weapons and alien skins
 * - Purchase items with collected coins
 * - Paginated shop display
 * - Persistent purchases via localStorage
 * - Procedurally generated weapon icons
 * 
 * @module scenes/ShopScene
 */

import Phaser from 'phaser'

/**
 * Shop item data structure
 */
interface ShopItem {
  /** Unique item identifier */
  id: string
  /** Display name */
  name: string
  /** Item category */
  type: 'weapon' | 'skin'
  /** Cost in coins */
  price: number
  /** Texture key for display */
  icon: string
  /** Item description text */
  description: string
}

/**
 * Scene for purchasing weapons and skins with coins
 * @extends Phaser.Scene
 */
export default class ShopScene extends Phaser.Scene {
  private coinCount: number = 0
  private coinText!: Phaser.GameObjects.Text
  private shopItems: ShopItem[] = []
  private purchasedItems: Set<string> = new Set()
  private currentPage: number = 0
  private itemsPerPage: number = 6
  private totalPages: number = 0
  private shopCards: Phaser.GameObjects.GameObject[] = []
  private pageText?: Phaser.GameObjects.Text
  private prevButton?: Phaser.GameObjects.Rectangle
  private nextButton?: Phaser.GameObjects.Rectangle
  private prevButtonText?: Phaser.GameObjects.Text
  private nextButtonText?: Phaser.GameObjects.Text

  constructor() {
    super('ShopScene')
  }

  init(data: { coins?: number }) {
    this.coinCount = data.coins || this.loadCoins()
    this.loadPurchasedItems()
    this.currentPage = 0
    this.shopCards = []
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
    
    // Create bazooka icon
    const bazookaGraphics = this.make.graphics({ x: 0, y: 0 })
    
    // Brown/orange bazooka body
    bazookaGraphics.fillStyle(0x884400, 1)
    bazookaGraphics.fillRect(10, 25, 55, 18) // Main tube
    
    // Barrel opening
    bazookaGraphics.fillStyle(0x663300, 1)
    bazookaGraphics.fillCircle(10, 34, 10)
    
    // Handle
    bazookaGraphics.fillStyle(0x663300, 1)
    bazookaGraphics.fillRect(50, 40, 10, 18)
    
    // Details
    bazookaGraphics.fillStyle(0xff6600, 1)
    bazookaGraphics.fillRect(15, 28, 45, 12)
    
    // Scope
    bazookaGraphics.fillStyle(0x00ffff, 1)
    bazookaGraphics.fillCircle(35, 22, 4)
    
    bazookaGraphics.generateTexture('bazooka', 80, 80)
    bazookaGraphics.destroy()
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
        id: 'bazooka',
        name: 'Bazooka',
        type: 'weapon',
        price: 150,
        icon: 'bazooka',
        description: 'Explosive rocket launcher with splash damage'
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

    // Calculate total pages
    this.totalPages = Math.ceil(this.shopItems.length / this.itemsPerPage)

    // Display first page
    this.displayShopPage()

    // Create pagination controls
    this.createPaginationControls()
  }

  private displayShopPage() {
    // Clear existing shop cards
    this.shopCards.forEach(obj => obj.destroy())
    this.shopCards = []

    // Calculate which items to show
    const startIndex = this.currentPage * this.itemsPerPage
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.shopItems.length)
    const pageItems = this.shopItems.slice(startIndex, endIndex)

    // Display items in a 3x2 grid (6 items per page)
    const startX = 280
    const startY = 220
    const spacingX = 380
    const spacingY = 280

    pageItems.forEach((item, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      const x = startX + col * spacingX
      const y = startY + row * spacingY

      this.createShopItem(item, x, y)
    })

    // Update page text
    if (this.pageText && this.pageText.scene) {
      this.pageText.setText(`Page ${this.currentPage + 1} / ${this.totalPages}`)
    }

    // Update button states
    this.updateButtonStates()
  }

  private createShopItem(item: ShopItem, x: number, y: number) {
    const isPurchased = this.purchasedItems.has(item.id)
    const canAfford = this.coinCount >= item.price

    // Item background
    const bg = this.add.rectangle(x, y, 120, 180, 0x2a2a3e, 0.8)
    this.shopCards.push(bg)

    // Item icon
    const icon = this.add.image(x, y - 40, item.icon)
    icon.setScale(0.8)
    icon.displayHeight = Math.min(icon.displayHeight, 60)
    icon.scaleX = icon.scaleY
    this.shopCards.push(icon)

    // Item name
    const nameText = this.add.text(x, y + 20, item.name, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5)
    this.shopCards.push(nameText)

    // Price or purchased status
    if (isPurchased) {
      const ownedText = this.add.text(x, y + 70, 'OWNED', {
        fontSize: '18px',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      this.shopCards.push(ownedText)
    } else {
      // Price display (above buy button)
      const priceContainer = this.add.container(x, y + 45)
      const coinIcon = this.add.image(-15, 0, 'coin').setScale(0.25)
      const priceText = this.add.text(5, 0, `${item.price}`, {
        fontSize: '20px',
        color: '#FFD700',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5)
      priceContainer.add([coinIcon, priceText])
      this.shopCards.push(priceContainer)

      // Buy button (below price)
      const buttonColor = canAfford ? 0x00aa00 : 0x444444
      const buyButton = this.add.rectangle(x, y + 75, 100, 30, buttonColor)
        .setInteractive({ useHandCursor: canAfford })
      this.shopCards.push(buyButton)

      if (canAfford) {
        buyButton
          .on('pointerover', () => buyButton.setFillStyle(0x00cc00))
          .on('pointerout', () => buyButton.setFillStyle(0x00aa00))
          .on('pointerdown', () => this.purchaseItem(item))
      }

      const buyText = this.add.text(x, y + 75, 'BUY', {
        fontSize: '16px',
        color: canAfford ? '#ffffff' : '#666666',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      this.shopCards.push(buyText)
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
        this.displayShopPage()
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
        this.displayShopPage()
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

      // Refresh current page display
      this.displayShopPage()
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
