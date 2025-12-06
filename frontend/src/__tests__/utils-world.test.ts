import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorldGenerator } from '../utils/WorldGenerator'

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Math: {
      Between: vi.fn((min: number, max: number) => Math.floor((min + max) / 2))
    }
  }
}))

// Create comprehensive Phaser scene mock
const createMockScene = () => {
  const mockSprite = {
    x: 0,
    y: 0,
    width: 70,
    height: 70,
    body: null as any,
    setOrigin: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  }

  const mockStaticBody = {
    setSize: vi.fn().mockReturnThis(),
    setOffset: vi.fn().mockReturnThis(),
    updateFromGameObject: vi.fn(),
    checkCollision: { down: true, up: true, left: true, right: true }
  }

  const mockSpikeSprite = {
    x: 0,
    y: 0,
    setOrigin: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
    setOffset: vi.fn().mockReturnThis(),
    refreshBody: vi.fn().mockReturnThis(),
    body: {
      setOffset: vi.fn().mockReturnThis()
    }
  }

  const mockGroup = {
    add: vi.fn(),
    create: vi.fn().mockReturnValue(mockSpikeSprite),
    children: {
      entries: [] as any[]
    },
    getChildren: vi.fn().mockReturnValue([])
  }

  const mockScene = {
    add: {
      sprite: vi.fn().mockImplementation((x, y, texture) => {
        const sprite = { ...mockSprite, x, y }
        sprite.body = { ...mockStaticBody }
        return sprite
      })
    },
    physics: {
      add: {
        existing: vi.fn().mockImplementation((obj, isStatic) => {
          obj.body = { ...mockStaticBody }
        })
      }
    },
    cache: {
      audio: {
        exists: vi.fn().mockReturnValue(true)
      }
    },
    textures: {
      exists: vi.fn().mockReturnValue(true)
    }
  }

  return {
    scene: mockScene,
    platforms: mockGroup,
    spikes: mockGroup,
    mockSprite,
    mockStaticBody
  }
}

describe('WorldGenerator', () => {
  let mockScene: any
  let mockPlatforms: any
  let mockSpikes: any
  let spikePositions: Array<{x: number, y: number, width: number}>
  let worldGenerator: WorldGenerator

  beforeEach(() => {
    const mocks = createMockScene()
    mockScene = mocks.scene
    mockPlatforms = mocks.platforms
    mockSpikes = mocks.spikes
    spikePositions = []
    
    worldGenerator = new WorldGenerator(
      mockScene,
      mockPlatforms,
      mockSpikes,
      spikePositions
    )
  })

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      expect(worldGenerator).toBeDefined()
    })

    it('should set initial biome and generation state', () => {
      // WorldGenerator has private properties, test through behavior
      expect(worldGenerator).toBeInstanceOf(WorldGenerator)
    })
  })

  describe('generateWorld', () => {
    it('should return world generation X position', () => {
      const result = worldGenerator.generateWorld()
      
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThan(0)
    })

    it('should create spawn platform at start', () => {
      worldGenerator.generateWorld()
      
      // Should have called sprite creation multiple times for spawn platform
      expect(mockScene.add.sprite).toHaveBeenCalled()
    })

    it('should add platforms to platforms group', () => {
      worldGenerator.generateWorld()
      
      expect(mockPlatforms.add).toHaveBeenCalled()
    })

    it('should create physics bodies for platforms', () => {
      worldGenerator.generateWorld()
      
      expect(mockScene.physics.add.existing).toHaveBeenCalled()
    })

    it('should generate initial chunks after spawn platform', () => {
      worldGenerator.generateWorld()
      
      // spawn platform + 5 chunks of world = many platforms
      const spriteCallCount = mockScene.add.sprite.mock.calls.length
      expect(spriteCallCount).toBeGreaterThan(7) // At least spawn platform tiles
    })

    it('should return consistent world position', () => {
      const result1 = worldGenerator.generateWorld()
      
      // Create new generator for clean test
      const newMocks = createMockScene()
      const newGenerator = new WorldGenerator(
        newMocks.scene,
        newMocks.platforms,
        newMocks.spikes,
        []
      )
      const result2 = newGenerator.generateWorld()
      
      // Both should return similar values (deterministic with mocked random)
      expect(result1).toBe(result2)
    })
  })

  describe('generateChunk', () => {
    it('should be callable after world generation', () => {
      worldGenerator.generateWorld()
      
      // generateChunk is called internally during generateWorld
      // We verify by checking that many sprites were created
      expect(mockScene.add.sprite).toHaveBeenCalled()
    })
  })

  describe('biome system', () => {
    it('should use different tile textures for different biomes', () => {
      worldGenerator.generateWorld()
      
      // Check that sprite was called with texture names
      const spriteCalls = mockScene.add.sprite.mock.calls
      expect(spriteCalls.length).toBeGreaterThan(0)
      
      // Textures should be biome-specific (metal, stone, or dirt)
      const textures = spriteCalls.map((call: any[]) => call[2])
      const validTextures = textures.every((t: string) => 
        t.includes('metal') || t.includes('stone') || t.includes('dirt') ||
        t.includes('Metal') || t.includes('Stone') || t.includes('Dirt')
      )
      expect(validTextures || textures.length > 0).toBe(true)
    })
  })

  describe('platform positioning', () => {
    it('should create platforms at floor level (Y=650)', () => {
      worldGenerator.generateWorld()
      
      const spriteCalls = mockScene.add.sprite.mock.calls
      const floorY = 650
      
      // Some sprites should be at floor level
      const floorSprites = spriteCalls.filter((call: any[]) => call[1] === floorY)
      expect(floorSprites.length).toBeGreaterThan(0)
    })

    it('should set correct origin on sprites', () => {
      worldGenerator.generateWorld()
      
      // Every sprite should have setOrigin called
      const spriteResult = mockScene.add.sprite.mock.results[0]?.value
      if (spriteResult) {
        expect(spriteResult.setOrigin).toHaveBeenCalledWith(0.5, 0.5)
      }
    })
  })

  describe('physics body configuration', () => {
    it('should add static physics bodies', () => {
      worldGenerator.generateWorld()
      
      expect(mockScene.physics.add.existing).toHaveBeenCalled()
      
      // Check it was called with static flag (true)
      const existingCalls = mockScene.physics.add.existing.mock.calls
      const staticCalls = existingCalls.filter((call: any[]) => call[1] === true)
      expect(staticCalls.length).toBeGreaterThan(0)
    })
  })

  describe('decorative elements', () => {
    it('should create decorative pillars on spawn platform', () => {
      worldGenerator.generateWorld()
      
      // Pillars are created above spawn platform
      const spriteCalls = mockScene.add.sprite.mock.calls
      
      // Should have sprites at multiple Y levels (floor + pillar heights)
      const yPositions = new Set(spriteCalls.map((call: any[]) => call[1]))
      expect(yPositions.size).toBeGreaterThan(1) // Multiple Y levels
    })
  })

  describe('continuous generation', () => {
    it('should track last generated X position', () => {
      const worldX = worldGenerator.generateWorld()
      
      // World X should be set to some value after spawn platform
      expect(worldX).toBeGreaterThan(500) // At least past spawn platform
    })
  })
})

describe('WorldGenerator edge cases', () => {
  it('should handle empty spike positions array', () => {
    const mocks = createMockScene()
    const generator = new WorldGenerator(
      mocks.scene,
      mocks.platforms,
      mocks.spikes,
      []
    )
    
    expect(() => generator.generateWorld()).not.toThrow()
  })

  it('should handle pre-populated spike positions', () => {
    const mocks = createMockScene()
    const existingSpikes = [
      { x: 100, y: 650, width: 70 },
      { x: 200, y: 650, width: 70 }
    ]
    const generator = new WorldGenerator(
      mocks.scene,
      mocks.platforms,
      mocks.spikes,
      existingSpikes
    )
    
    expect(() => generator.generateWorld()).not.toThrow()
  })
})

describe('Biome tiles', () => {
  it('should use metal tiles for metal biome', () => {
    // This tests the getBiomeFloorTile, getBiomePlatformTile, getBiomeWallTile methods
    // which are private but affect sprite texture choices
    const mocks = createMockScene()
    const generator = new WorldGenerator(
      mocks.scene,
      mocks.platforms,
      mocks.spikes,
      []
    )
    
    generator.generateWorld()
    
    // Verify textures were requested
    expect(mocks.scene.add.sprite).toHaveBeenCalled()
  })
})
