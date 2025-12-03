/**
 * @fileoverview WorldGenerator - Procedural level generation for endless mode
 * 
 * Generates infinite side-scrolling platformer levels with:
 * - Multiple biomes (metal, stone, dirt)
 * - Platform placement with gaps and obstacles
 * - Spike hazards with collision detection
 * - Dynamic chunk generation as player progresses
 * - Safe spawn area at level start
 * 
 * @module utils/WorldGenerator
 */

import Phaser from 'phaser'

/**
 * Procedural world generator for endless platformer levels
 * Creates platforms, hazards, and biome transitions dynamically
 */
export class WorldGenerator {
  /** Reference to the Phaser scene */
  private scene: Phaser.Scene
  /** Static group for platform tiles */
  private platforms: Phaser.Physics.Arcade.StaticGroup
  /** Static group for spike hazards */
  private spikes: Phaser.Physics.Arcade.StaticGroup
  /** Array tracking spike positions for collision */
  private spikePositions: Array<{x: number, y: number, width: number}>
  /** Current X position for world generation */
  private worldGenerationX: number
  /** Last X position where generation occurred */
  private lastGeneratedX: number
  /** Seed for deterministic random generation */
  private seed: number
  /** Current state of the seeded RNG */
  private rngState: number

  constructor(
    scene: Phaser.Scene,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    spikes: Phaser.Physics.Arcade.StaticGroup,
    spikePositions: Array<{x: number, y: number, width: number}>,
    seed?: number
  ) {
    this.scene = scene
    this.platforms = platforms
    this.spikes = spikes
    this.spikePositions = spikePositions
    this.worldGenerationX = 0
    this.lastGeneratedX = 0
    // Initialize seeded random - use provided seed or generate random one
    // Ensure seed is an integer to prevent floating point drift
    this.seed = Math.floor(seed ?? Math.floor(Math.random() * 1000000))
    this.rngState = this.seed
    console.log('🌱 WorldGenerator initialized with seed:', this.seed)
  }

  /**
   * Seeded random number generator (mulberry32 algorithm)
   * Returns a number between 0 and 1, deterministic based on seed
   */
  private seededRandom(): number {
    this.rngState += 0x6D2B79F5
    let t = this.rngState
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Seeded random integer between min and max (inclusive)
   */
  private seededBetween(min: number, max: number): number {
    return Math.floor(this.seededRandom() * (max - min + 1)) + min
  }

  /**
   * Reset RNG state for a specific chunk X position
   * This ensures deterministic generation regardless of chunk order
   */
  resetRngForChunk(chunkX: number): void {
    // Reset RNG state based on seed + chunk position for determinism
    this.rngState = this.seed + Math.floor(chunkX / 800) * 7919  // 7919 is a prime number
  }

  /**
   * Get deterministic biome for a world X position
   * Biomes change every ~2000 units, determined purely by X position
   */
  private getBiomeForX(x: number): 'metal' | 'stone' | 'dirt' {
    const biomes: Array<'metal' | 'stone' | 'dirt'> = ['metal', 'stone', 'dirt']
    const biomeWidth = 2000 // Each biome is ~2000 units wide
    const biomeIndex = Math.floor(x / biomeWidth) % biomes.length
    // Use seed to offset which biome is first
    const offsetIndex = (biomeIndex + (this.seed % biomes.length)) % biomes.length
    return biomes[offsetIndex]
  }

  /**
   * Get the seed used for world generation
   */
  getSeed(): number {
    return this.seed
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
    
    // Biomes are now determined by X position, no state needed
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
    // Reset RNG for this chunk to ensure deterministic generation
    this.resetRngForChunk(startX)
    const chunkIndex = Math.floor(startX / 800)
    const currentBiome = this.getBiomeForX(startX)
    console.log(`🗺️ Generating chunk ${chunkIndex} at X=${startX}, biome=${currentBiome}, RNG state: ${this.rngState}`)
    
    const tileSize = 70
    const chunkWidth = 800
    const floorY = 650
    
    // Get biome-specific tiles based on X position
    const floorTile = this.getBiomeFloorTileForBiome(currentBiome)
    const platformTile = this.getBiomePlatformTileForBiome(currentBiome)
    const wallTile = this.getBiomeWallTileForBiome(currentBiome)
    
    // Create floor for this chunk
    for (let x = startX; x < startX + chunkWidth; x += tileSize) {
      // Get biome for this specific X position (allows smooth transitions)
      const tileBiome = this.getBiomeForX(x)
      const tileFloorTexture = this.getBiomeFloorTileForBiome(tileBiome)
      
      const floor = this.scene.add.sprite(x + tileSize/2, floorY, tileFloorTexture)
      floor.setOrigin(0.5, 0.5)
      this.scene.physics.add.existing(floor, true)
      const body = floor.body as Phaser.Physics.Arcade.StaticBody
      // Ground platform hitbox - align to top surface
      const hitboxWidth = tileSize * 0.95
      const hitboxHeight = tileSize * 0.3  // Thin hitbox on top surface
      body.setSize(hitboxWidth, hitboxHeight)
      body.setOffset((floor.width - hitboxWidth) / 2, 0)  // Align to top
      this.platforms.add(floor)
    }
    
    // Define Y levels for platform spawning (above ground at Y=650)
    // Spacing increased to 100px to accommodate 80px tall player character
    // Start at Y=350 to avoid blocking top of screen for player navigation
    const yLevels = [350, 450, 550] // 3 levels above ground, safe jump height range
    
    // Track occupied grid cells to prevent overlap
    const occupiedCells = new Set<string>()
    const minSpacing = 200 // Minimum X distance between structures
    
    // Generate structures within chunk
    let currentX = startX + 100
    const maxX = startX + chunkWidth - 100
    
    while (currentX < maxX) {
      const structureType = this.seededRandom()
      
      if (structureType < 0.3) {
        // Floating platform
        const platformWidth = this.seededBetween(2, 4)
        const levelIndex = this.seededBetween(0, yLevels.length - 2) // Don't use ground level
        const platformY = yLevels[levelIndex]
        
        // Check if this position is occupied
        const cellKey = `${Math.floor(currentX / tileSize)}-${levelIndex}`
        if (!occupiedCells.has(cellKey)) {
          for (let i = 0; i < platformWidth; i++) {
            const plat = this.scene.add.sprite(currentX + i * tileSize + tileSize/2, platformY, platformTile)
            plat.setOrigin(0.5, 0.5)
            this.scene.physics.add.existing(plat, true)
            const body = plat.body as Phaser.Physics.Arcade.StaticBody
            // Floating platform hitbox - minimal to allow player through gaps and horizontal movement
            const hitboxWidth = plat.width * 0.2  // 20% width - thin to avoid blocking horizontal movement
            const hitboxHeight = plat.height * 0.05  // 5% height - minimal surface
            body.setSize(hitboxWidth, hitboxHeight)
            // Align hitbox to TOP of platform sprite
            body.setOffset((plat.width - hitboxWidth) / 2, 0)
            this.platforms.add(plat)
            
            // Mark cells as occupied
            occupiedCells.add(`${Math.floor((currentX + i * tileSize) / tileSize)}-${levelIndex}`)
          }
        }
        currentX += minSpacing
      } else if (structureType < 0.5) {
        // Staircase - uses multiple levels
        const steps = this.seededBetween(4, 7)
        const startLevelIndex = this.seededBetween(2, yLevels.length - steps - 1)
        
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
            // Staircase platform hitbox - minimal to allow player through gaps and horizontal movement
            const hitboxWidth = step.width * 0.2  // 20% width - thin to avoid blocking horizontal movement
            const hitboxHeight = step.height * 0.05  // 5% height - minimal surface
            body.setSize(hitboxWidth, hitboxHeight)
            // Align hitbox to TOP of platform sprite
            body.setOffset((step.width - hitboxWidth) / 2, 0)
            this.platforms.add(step)
            
            // Mark cell as occupied
            occupiedCells.add(`${Math.floor((currentX + i * tileSize) / tileSize)}-${levelIndex}`)
          }
        }
        currentX += minSpacing + 100
      } else if (structureType < 0.7) {
        // Pillar with platform on top
        const pillarHeight = this.seededBetween(3, 6)
        const topLevelIndex = this.seededBetween(0, yLevels.length - pillarHeight - 1)
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
        currentX += this.seededBetween(150, 250)
      } else {
        // Spike trap on ground level (always at Y=650)
        const spikeWidth = this.seededBetween(2, 4)
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

  private getBiomeFloorTileForBiome(biome: 'metal' | 'stone' | 'dirt'): string {
    switch (biome) {
      case 'metal': return 'metalMid'
      case 'stone': return 'stoneCaveBottom'
      case 'dirt': return 'dirtCaveBottom'
    }
  }

  private getBiomePlatformTileForBiome(biome: 'metal' | 'stone' | 'dirt'): string {
    switch (biome) {
      case 'metal': return 'metalPlatform'
      case 'stone': return 'stoneCaveTop'
      case 'dirt': return 'dirtCaveTop'
    }
  }

  private getBiomeWallTileForBiome(biome: 'metal' | 'stone' | 'dirt'): string {
    switch (biome) {
      case 'metal': return 'metalCenter'
      case 'stone': return 'stoneCaveTop'
      case 'dirt': return 'dirtCaveTop'
    }
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
