import Phaser from 'phaser'

interface InventoryItem {
  id: string
  name: string
  type: 'weapon' | 'skin'
  icon: string
  equipped: boolean
}

export default class InventoryScene extends Phaser.Scene {
  private inventory: InventoryItem[] = []
  private equippedWeapon: string = 'raygun'
  private equippedSkin: string = 'alienBeige'

  constructor() {
    super('InventoryScene')
  }

  init() {
    this.loadInventory()
    this.loadEquippedItems()
  }

  preload() {
    // Create back arrow
    this.createBackArrow()
    
    // Load weapon icons (create procedural textures)
    this.createWeaponIcons()
    
    // Load skin previews
    this.load.image('skinBeige', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_stand.png')
    this.load.image('skinBlue', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBlue_stand.png')
    this.load.image('skinGreen', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienGreen_stand.png')
    this.load.image('skinPink', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienPink_stand.png')
    this.load.image('skinYellow', '/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienYellow_stand.png')
  }

  private createBackArrow() {
    const graphics = this.make.graphics({ x: 0, y: 0 })
    graphics.fillStyle(0x0066ff, 1)
    graphics.fillCircle(50, 50, 45)
    graphics.fillStyle(0xffffff, 1)
    graphics.beginPath()
    graphics.moveTo(30, 50)
    graphics.lineTo(50, 35)
    graphics.lineTo(50, 45)
    graphics.lineTo(65, 45)
    graphics.lineTo(65, 55)
    graphics.lineTo(50, 55)
    graphics.lineTo(50, 65)
    graphics.closePath()
    graphics.fillPath()
    graphics.generateTexture('backArrow', 100, 100)
    graphics.destroy()
  }

  private createWeaponIcons() {
    // Raygun (default weapon)
    const raygunGraphics = this.make.graphics({ x: 0, y: 0 })
    raygunGraphics.fillStyle(0x0099ff, 1)
    raygunGraphics.fillRect(10, 35, 45, 12)
    raygunGraphics.fillRect(50, 30, 15, 22)
    raygunGraphics.fillRect(55, 52, 10, 8)
    raygunGraphics.fillStyle(0x00ffff, 1)
    raygunGraphics.fillCircle(57, 41, 5)
    raygunGraphics.generateTexture('weaponRaygun', 80, 80)
    raygunGraphics.destroy()

    // Laser gun
    const laserGunGraphics = this.make.graphics({ x: 0, y: 0 })
    laserGunGraphics.fillStyle(0x00ff00, 1)
    laserGunGraphics.fillRect(10, 35, 50, 15)
    laserGunGraphics.fillRect(5, 40, 10, 10)
    laserGunGraphics.fillRect(55, 30, 15, 25)
    laserGunGraphics.fillRect(60, 55, 10, 10)
    laserGunGraphics.fillStyle(0x00ffff, 1)
    laserGunGraphics.fillCircle(60, 42, 5)
    laserGunGraphics.generateTexture('weaponLaserGun', 80, 80)
    laserGunGraphics.destroy()

    // Sword
    const swordGraphics = this.make.graphics({ x: 0, y: 0 })
    
    // Purple energy sword blade
    swordGraphics.fillStyle(0xff00ff, 1)
    swordGraphics.fillRect(30, 5, 10, 45) // Main blade
    swordGraphics.beginPath()
    swordGraphics.moveTo(35, 0) // Tip point
    swordGraphics.lineTo(30, 5)
    swordGraphics.lineTo(40, 5)
    swordGraphics.closePath()
    swordGraphics.fillPath()
    
    // Bright glow
    swordGraphics.fillStyle(0xffaaff, 0.7)
    swordGraphics.fillRect(32, 7, 6, 41)
    
    // Handle/hilt (gray)
    swordGraphics.fillStyle(0x888888, 1)
    swordGraphics.fillRect(33, 50, 4, 15) // Grip
    swordGraphics.fillRect(27, 47, 16, 5) // Guard
    swordGraphics.fillRect(31, 65, 8, 5) // Pommel
    
    swordGraphics.generateTexture('weaponSword', 70, 75)
    swordGraphics.destroy()
  }

  create() {
    this.cameras.main.setBackgroundColor('#000033')

    // Title
    const title = this.add.text(640, 60, 'INVENTORY', {
      fontSize: '48px',
      color: '#00ffff',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)

    // Back button
    const backButton = this.add.image(80, 60, 'backArrow')
    backButton.setScale(0.6)
    backButton.setInteractive({ useHandCursor: true })
    backButton.on('pointerover', () => backButton.setTint(0xaaaaaa))
    backButton.on('pointerout', () => backButton.clearTint())
    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene')
    })
    
    // ESC key to return to menu
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      this.scene.start('MenuScene')
    })

    // Section headers
    this.add.text(200, 130, 'WEAPONS', {
      fontSize: '32px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(640, 130, 'SKINS', {
      fontSize: '32px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Display weapons
    this.displayWeapons()

    // Display skins
    this.displaySkins()

    // Instructions
    this.add.text(640, 650, 'Click on items to equip them', {
      fontSize: '20px',
      color: '#888888',
      fontStyle: 'italic'
    }).setOrigin(0.5)
  }

  private displayWeapons() {
    const weapons = [
      { id: 'raygun', name: 'Raygun', icon: 'weaponRaygun', default: true },
      { id: 'laserGun', name: 'Laser Gun', icon: 'weaponLaserGun', default: false },
      { id: 'sword', name: 'Energy Sword', icon: 'weaponSword', default: false }
    ]

    let y = 220
    weapons.forEach(weapon => {
      const owned = weapon.default || this.inventory.some(item => item.id === weapon.id)
      const equipped = this.equippedWeapon === weapon.id

      if (owned) {
        // Background panel
        const panel = this.add.rectangle(200, y, 320, 100, equipped ? 0x00aa00 : 0x222222, 1)
        panel.setStrokeStyle(2, equipped ? 0x00ff00 : 0x666666)
        
        if (!weapon.default) {
          panel.setInteractive({ useHandCursor: true })
          panel.on('pointerover', () => {
            if (!equipped) panel.setFillStyle(0x333333)
          })
          panel.on('pointerout', () => {
            if (!equipped) panel.setFillStyle(0x222222)
          })
          panel.on('pointerdown', () => {
            this.equipWeapon(weapon.id)
          })
        }

        // Icon
        const icon = this.add.image(100, y, weapon.icon)
        icon.setScale(0.8)

        // Name
        this.add.text(200, y - 20, weapon.name, {
          fontSize: '24px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0, 0.5)

        // Status
        const status = equipped ? 'EQUIPPED' : (weapon.default ? 'DEFAULT' : 'OWNED')
        this.add.text(200, y + 15, status, {
          fontSize: '16px',
          color: equipped ? '#00ff00' : '#aaaaaa'
        }).setOrigin(0, 0.5)

        y += 120
      }
    })
  }

  private displaySkins() {
    const skins = [
      { id: 'alienBeige', name: 'Beige Alien', icon: 'skinBeige', default: true },
      { id: 'skinBlue', name: 'Blue Alien', icon: 'skinBlue', default: false },
      { id: 'skinGreen', name: 'Green Alien', icon: 'skinGreen', default: false },
      { id: 'skinPink', name: 'Pink Alien', icon: 'skinPink', default: false },
      { id: 'skinYellow', name: 'Yellow Alien', icon: 'skinYellow', default: false }
    ]

    let x = 480
    let y = 220
    skins.forEach((skin, index) => {
      const owned = skin.default || this.inventory.some(item => item.id === skin.id)
      // Check equipped status - convert game skin ID to shop ID for comparison
      let equippedCheck = this.equippedSkin === skin.id
      if (skin.id === 'skinBlue') equippedCheck = this.equippedSkin === 'alienBlue'
      else if (skin.id === 'skinGreen') equippedCheck = this.equippedSkin === 'alienGreen'
      else if (skin.id === 'skinPink') equippedCheck = this.equippedSkin === 'alienPink'
      else if (skin.id === 'skinYellow') equippedCheck = this.equippedSkin === 'alienYellow'
      const equipped = equippedCheck

      if (owned) {
        // Background panel
        const panel = this.add.rectangle(x, y, 140, 180, equipped ? 0x00aa00 : 0x222222, 1)
        panel.setStrokeStyle(2, equipped ? 0x00ff00 : 0x666666)
        
        if (!skin.default) {
          panel.setInteractive({ useHandCursor: true })
          panel.on('pointerover', () => {
            if (!equipped) panel.setFillStyle(0x333333)
          })
          panel.on('pointerout', () => {
            if (!equipped) panel.setFillStyle(0x222222)
          })
          panel.on('pointerdown', () => {
            this.equipSkin(skin.id)
          })
        }

        // Icon
        const icon = this.add.image(x, y - 30, skin.icon)
        icon.setScale(1.2)

        // Name
        this.add.text(x, y + 50, skin.name, {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5)

        // Status
        const status = equipped ? 'EQUIPPED' : (skin.default ? 'DEFAULT' : 'OWNED')
        this.add.text(x, y + 75, status, {
          fontSize: '12px',
          color: equipped ? '#00ff00' : '#aaaaaa'
        }).setOrigin(0.5)

        x += 160
        if ((index + 1) % 3 === 0) {
          x = 480
          y += 200
        }
      }
    })
  }

  private equipWeapon(weaponId: string) {
    this.equippedWeapon = weaponId
    localStorage.setItem('equippedWeapon', weaponId)
    
    // Refresh display
    this.scene.restart()
  }

  private equipSkin(skinId: string) {
    // Convert shop skin IDs (skinBlue) to game skin IDs (alienBlue)
    let gameSkinId = skinId
    if (skinId === 'skinBlue') gameSkinId = 'alienBlue'
    else if (skinId === 'skinGreen') gameSkinId = 'alienGreen'
    else if (skinId === 'skinPink') gameSkinId = 'alienPink'
    else if (skinId === 'skinYellow') gameSkinId = 'alienYellow'
    
    this.equippedSkin = gameSkinId
    localStorage.setItem('equippedSkin', gameSkinId)
    
    // Refresh display
    this.scene.restart()
  }

  private loadInventory() {
    const purchased = localStorage.getItem('purchasedItems')
    if (purchased) {
      const purchasedIds = JSON.parse(purchased)
      this.inventory = purchasedIds.map((id: string) => {
        let type: 'weapon' | 'skin' = 'weapon'
        let icon = ''
        let name = ''

        if (id === 'laserGun') {
          type = 'weapon'
          icon = 'weaponLaserGun'
          name = 'Laser Gun'
        } else if (id === 'sword') {
          type = 'weapon'
          icon = 'weaponSword'
          name = 'Energy Sword'
        } else if (id === 'skinBlue') {
          type = 'skin'
          icon = 'skinBlue'
          name = 'Blue Alien'
        } else if (id === 'skinGreen') {
          type = 'skin'
          icon = 'skinGreen'
          name = 'Green Alien'
        } else if (id === 'skinPink') {
          type = 'skin'
          icon = 'skinPink'
          name = 'Pink Alien'
        } else if (id === 'skinYellow') {
          type = 'skin'
          icon = 'skinYellow'
          name = 'Yellow Alien'
        }

        return {
          id,
          name,
          type,
          icon,
          equipped: false
        }
      })
    }
  }

  private loadEquippedItems() {
    const weapon = localStorage.getItem('equippedWeapon')
    const skin = localStorage.getItem('equippedSkin')
    
    if (weapon) this.equippedWeapon = weapon
    if (skin) this.equippedSkin = skin
  }
}
