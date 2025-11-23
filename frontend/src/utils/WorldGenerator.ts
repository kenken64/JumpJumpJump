import Phaser from 'phaser'

export class WorldGenerator {
  private scene: Phaser.Scene
  private platforms: Phaser.Physics.Arcade.StaticGroup
  private spikes: Phaser.Physics.Arcade.StaticGroup
  private spikePositions: Array<{x: number, y: number, width: number}>
  private currentBiome: 'metal' | 'stone' | 'dirt'
  private biomeLength: number
  private worldGenerationX: number
  private lastGeneratedX: number

  constructor(
    scene: Phaser.Scene,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    spikes: Phaser.Physics.Arcade.StaticGroup,
    spikePositions: Array<{x: number, y: number, width: number}>
  ) {
    this.scene = scene
    this.platforms = platforms
    this.spikes = spikes
    this.spikePositions = spikePositions
    this.currentBiome = 'metal'
    this.biomeLength = 0
    this.worldGenerationX = 0
    this.lastGeneratedX = 0
  }

  generateWorld(): number {
    const tileSize = 70
    const floorY = 650
    
    console.log('=== Generating World ===')
    console.log('Floor Y:', floorY, 'Tile size:', tileSize)
    
    // Create safe spawn platform (500 pixels wide, no enemies)
    const spawnPlatformWidth = 500
    for (let x = 0; x < spawnPlatformWidth; x += tileSize) {
      const posX = x + tileSize/2
      
      // Create sprite first
      const tile = this.scene.add.sprite(posX, floorY, 'metalMid')
      tile.setOrigin(0.5, 0.5)
      
      // Add static physics body
      this.scene.physics.add.existing(tile, true)
      
      // Get the body and configure it to match texture dimensions
      const body = tile.body as Phaser.Physics.Arcade.StaticBody
      // Use 95% of texture size for more accurate hitbox
      const hitboxSize = tileSize * 0.95
      body.setSize(hitboxSize, hitboxSize)
      body.setOffset((tile.width - hitboxSize) / 2, (tile.height - hitboxSize) / 2)
      body.updateFromGameObject()
      
      // Add to platforms group AFTER physics is set up
      this.platforms.add(tile)
    }
    
    // Add decorative pillars on spawn platform edges
    for (let i = 0; i < 3; i++) {
      const pillar1 = this.scene.add.sprite(tileSize/2, floorY - (i + 1) * tileSize, 'metalCenter')
      pillar1.setOrigin(0.5, 0.5)
      this.scene.physics.add.existing(pillar1, true)
      const body1 = pillar1.body as Phaser.Physics.Arcade.StaticBody
      body1.setSize(tileSize, tileSize)
      body1.updateFromGameObject()
      this.platforms.add(pillar1)
      
      const pillar2 = this.scene.add.sprite(spawnPlatformWidth - tileSize/2, floorY - (i + 1) * tileSize, 'metalCenter')
      pillar2.setOrigin(0.5, 0.5)
      this.scene.physics.add.existing(pillar2, true)
      const body2 = pillar2.body as Phaser.Physics.Arcade.StaticBody
      body2.setSize(tileSize, tileSize)
      body2.updateFromGameObject()
      this.platforms.add(pillar2)
    }
    
    // Choose initial biome for rest of world
    const biomes: Array<'metal' | 'stone' | 'dirt'> = ['metal', 'stone', 'dirt']
    this.currentBiome = biomes[Math.floor(Math.random() * biomes.length)]
    this.biomeLength = Phaser.Math.Between(1500, 3000)
    this.worldGenerationX = spawnPlatformWidth
    
    // Generate initial world chunks after spawn platform
    for (let i = 0; i < 5; i++) {
      this.generateChunk(this.worldGenerationX)
      this.worldGenerationX += 800
    }
    
    this.lastGeneratedX = this.worldGenerationX
    
    return this.worldGenerationX
  }

  generateChunk(startX: number) {
    const tileSize = 70
    const chunkWidth = 800
    const floorY = 650
    
    // Get biome-specific tiles
    const floorTile = this.getBiomeFloorTile()
    const platformTile = this.getBiomePlatformTile()
    const wallTile = this.getBiomeWallTile()
    
    // Create floor for this chunk
    for (let x = startX; x < startX + chunkWidth; x += tileSize) {
      const floor = this.scene.add.sprite(x + tileSize/2, floorY, floorTile)
      floor.setOrigin(0.5, 0.5)
      this.scene.physics.add.existing(floor, true)
      const body = floor.body as Phaser.Physics.Arcade.StaticBody
      // Ground platform hitbox - align to top surface
      const hitboxWidth = tileSize * 0.95
      const hitboxHeight = tileSize * 0.3  // Thin hitbox on top surface
      body.setSize(hitboxWidth, hitboxHeight)
      body.setOffset((floor.width - hitboxWidth) / 2, 0)  // Align to top
      body.updateFromGameObject()
      this.platforms.add(floor)
      
      // Check if we need to switch biome
      if (x - (this.worldGenerationX - this.lastGeneratedX) >= this.biomeLength) {
        this.switchBiome()
      }
    }
    
    // Define 7 fixed Y levels for platform spawning (from top to ground)
    const yLevels = [300, 370, 440, 510, 580, 650] // 6 levels above ground + ground at 650
    
    // Track occupied grid cells to prevent overlap
    const occupiedCells = new Set<string>()
    const minSpacing = 200 // Minimum X distance between structures
    
    // Generate structures within chunk
    let currentX = startX + 100
    const maxX = startX + chunkWidth - 100
    
    while (currentX < maxX) {
      const structureType = Math.random()
      
      if (structureType < 0.3) {
        // Floating platform
        const platformWidth = Phaser.Math.Between(2, 4)
        const levelIndex = Phaser.Math.Between(0, yLevels.length - 2) // Don't use ground level
        const platformY = yLevels[levelIndex]
        
        // Check if this position is occupied
        const cellKey = `${Math.floor(currentX / tileSize)}-${levelIndex}`
        if (!occupiedCells.has(cellKey)) {
          for (let i = 0; i < platformWidth; i++) {
            const plat = this.scene.add.sprite(currentX + i * tileSize + tileSize/2, platformY, platformTile)
            plat.setOrigin(0.5, 0.5)
            this.scene.physics.add.existing(plat, true)
            const body = plat.body as Phaser.Physics.Arcade.StaticBody
            // Floating platform hitbox - very thin to prevent blocking
            const hitboxWidth = plat.width * 0.7  // 70% width
            const hitboxHeight = plat.height * 0.2  // 20% height - very thin
            body.setSize(hitboxWidth, hitboxHeight)
            // Align hitbox to TOP of platform sprite
            body.setOffset((plat.width - hitboxWidth) / 2, 0)
            body.updateFromGameObject()
            this.platforms.add(plat)
            
            // Mark cells as occupied
            occupiedCells.add(`${Math.floor((currentX + i * tileSize) / tileSize)}-${levelIndex}`)
          }
        }
        currentX += minSpacing
      } else if (structureType < 0.5) {
        // Staircase - uses multiple levels
        const steps = Phaser.Math.Between(4, 7)
        const startLevelIndex = Phaser.Math.Between(2, yLevels.length - steps - 1)
        
        let canPlace = true
        // Check if any step position is occupied
        for (let i = 0; i < steps; i++) {
          const cellKey = `${Math.floor((currentX + i * tileSize) / tileSize)}-${startLevelIndex + i}`
          if (occupiedCells.has(cellKey)) {
            canPlace = false
            break
          }
        }
        
        if (canPlace) {
          for (let i = 0; i < steps; i++) {
            const levelIndex = startLevelIndex + i
            const stepY = yLevels[levelIndex]
            const step = this.scene.add.sprite(currentX + i * tileSize + tileSize/2, stepY, platformTile)
            step.setOrigin(0.5, 0.5)
            this.scene.physics.add.existing(step, true)
            const body = step.body as Phaser.Physics.Arcade.StaticBody
            // Staircase platform hitbox - very thin to prevent blocking
            const hitboxWidth = step.width * 0.7  // 70% width
            const hitboxHeight = step.height * 0.2  // 20% height - very thin
            body.setSize(hitboxWidth, hitboxHeight)
            // Align hitbox to TOP of platform sprite
            body.setOffset((step.width - hitboxWidth) / 2, 0)
            body.updateFromGameObject()
            this.platforms.add(step)
            
            // Mark cell as occupied
            occupiedCells.add(`${Math.floor((currentX + i * tileSize) / tileSize)}-${levelIndex}`)
          }
        }
        currentX += minSpacing + 100
      } else if (structureType < 0.7) {
        // Pillar with platform on top
        const pillarHeight = Phaser.Math.Between(3, 6)
        const topLevelIndex = Phaser.Math.Between(0, yLevels.length - pillarHeight - 1)
        const pillarTopY = yLevels[topLevelIndex]
        
        const cellKey = `${Math.floor(currentX / tileSize)}-${topLevelIndex}`
        if (!occupiedCells.has(cellKey)) {
          // Create pillar blocks
          for (let i = 0; i < pillarHeight; i++) {
            const levelIndex = topLevelIndex + i
            const pillar = this.scene.add.sprite(currentX + tileSize/2, yLevels[levelIndex], wallTile)
            pillar.setOrigin(0.5, 0.5)
            this.scene.physics.add.existing(pillar, true)
            const bodyP = pillar.body as Phaser.Physics.Arcade.StaticBody
            const hitboxSize = tileSize * 0.95
            bodyP.setSize(hitboxSize, hitboxSize)
            bodyP.setOffset((pillar.width - hitboxSize) / 2, (pillar.height - hitboxSize) / 2)
            bodyP.updateFromGameObject()
            this.platforms.add(pillar)
            
            // Mark cell as occupied
            occupiedCells.add(`${Math.floor(currentX / tileSize)}-${levelIndex}`)
          }
          
          // Platform on top (3 tiles wide)
          for (let i = 0; i < 3; i++) {
            const top = this.scene.add.sprite(currentX + (i - 1) * tileSize + tileSize/2, pillarTopY, platformTile)
            top.setOrigin(0.5, 0.5)
            this.scene.physics.add.existing(top, true)
            const bodyT = top.body as Phaser.Physics.Arcade.StaticBody
            const hitboxWidth = top.width * 0.95
            const hitboxHeight = top.height * 0.8
            bodyT.setSize(hitboxWidth, hitboxHeight)
            bodyT.setOffset((top.width - hitboxWidth) / 2, (top.height - hitboxHeight) / 2)
            bodyT.updateFromGameObject()
            this.platforms.add(top)
            
            // Mark cells as occupied
            occupiedCells.add(`${Math.floor((currentX + (i - 1) * tileSize) / tileSize)}-${topLevelIndex}`)
          }
        }
        currentX += minSpacing + 50
      } else if (structureType < 0.85) {
        // Gap (no structure)
        currentX += Phaser.Math.Between(150, 250)
      } else {
        // Spike trap on ground level (always at Y=650)
        const spikeWidth = Phaser.Math.Between(2, 4)
        const groundLevelIndex = yLevels.length - 1
        console.log(`Creating spike trap at X:${currentX}, width:${spikeWidth}`)
        
        let canPlace = true
        // Check if ground position is occupied
        for (let i = 0; i < spikeWidth; i++) {
          const cellKey = `${Math.floor((currentX + i * tileSize) / tileSize)}-${groundLevelIndex}`
          if (occupiedCells.has(cellKey)) {
            canPlace = false
            break
          }
        }
        
        if (canPlace) {
          for (let i = 0; i < spikeWidth; i++) {
            // Create platform block underneath
            const block = this.scene.add.sprite(currentX + i * tileSize + tileSize/2, floorY, floorTile)
            block.setOrigin(0.5, 0.5)
            this.scene.physics.add.existing(block, true)
            const blockBody = block.body as Phaser.Physics.Arcade.StaticBody
            const hitboxSize = tileSize * 0.95
            blockBody.setSize(hitboxSize, hitboxSize)
            blockBody.setOffset((block.width - hitboxSize) / 2, (block.height - hitboxSize) / 2)
            blockBody.updateFromGameObject()
            this.platforms.add(block)
            
            // Place spikes on top of the block
            const spikeX = currentX + i * tileSize + tileSize/2
            const spikeY = floorY - tileSize/2
            console.log(`  Spike ${i} at X:${spikeX}, Y:${spikeY}`)
            
            if (!this.scene.textures.exists('spikes')) {
              console.error('Spikes texture does not exist!')
            }
            
            const spike = this.spikes.create(spikeX, spikeY, 'spikes')
            spike.setOrigin(0.5, 1) // Bottom-center origin
            spike.setSize(68, 28) // Hitbox for spike tips only
            spike.setOffset(2, 4) // Offset to hit only the pointy parts
            spike.refreshBody()
            
            // Mark cell as occupied
            occupiedCells.add(`${Math.floor((currentX + i * tileSize) / tileSize)}-${groundLevelIndex}`)
          }
          
          // Track spike position for coin spawn prevention
          this.spikePositions.push({
            x: currentX,
            y: floorY - tileSize/2,
            width: spikeWidth * tileSize
          })
        }
        currentX += minSpacing
      }
    }
  }

  private getBiomeFloorTile(): string {
    switch (this.currentBiome) {
      case 'metal': return 'metalMid'
      case 'stone': return 'stoneCaveBottom'
      case 'dirt': return 'dirtCaveBottom'
    }
  }

  private getBiomePlatformTile(): string {
    switch (this.currentBiome) {
      case 'metal': return 'metalPlatform'
      case 'stone': return 'stoneCaveTop'
      case 'dirt': return 'dirtCaveTop'
    }
  }

  private getBiomeWallTile(): string {
    switch (this.currentBiome) {
      case 'metal': return 'metalCenter'
      case 'stone': return 'stoneCaveTop'
      case 'dirt': return 'dirtCaveTop'
    }
  }

  private switchBiome() {
    const biomes: Array<'metal' | 'stone' | 'dirt'> = ['metal', 'stone', 'dirt']
    const otherBiomes = biomes.filter(b => b !== this.currentBiome)
    this.currentBiome = otherBiomes[Math.floor(Math.random() * otherBiomes.length)]
    this.biomeLength = Phaser.Math.Between(1500, 3000)
  }

  // Getters for state that GameScene needs to track
  getWorldGenerationX(): number {
    return this.worldGenerationX
  }

  setWorldGenerationX(value: number) {
    this.worldGenerationX = value
  }

  getLastGeneratedX(): number {
    return this.lastGeneratedX
  }

  setLastGeneratedX(value: number) {
    this.lastGeneratedX = value
  }
}
