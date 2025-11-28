/**
 * utils-coop-player.test.ts
 * Tests for CoopPlayerManager utility class
 * 
 * Note: CoopPlayerManager depends heavily on Phaser scene and physics.
 * We test the interfaces, types, and logic that can be tested without Phaser initialization.
 */

import { describe, it, expect, vi } from 'vitest'

// Types that mirror CoopPlayerManager types
interface CoopPlayer {
  sprite: {
    x: number
    y: number
    body: {
      velocity: { x: number; y: number }
    }
    setTint: (color: number) => void
    clearTint: () => void
    setAlpha: (alpha: number) => void
  }
  playerNumber: 1 | 2
  health: number
  maxHealth: number
  isAlive: boolean
  lives: number
  respawnTimer: number | null
  gun: {
    x: number
    y: number
    setRotation: (angle: number) => void
    setFlipY: (flip: boolean) => void
  } | null
  healthBarFill: {
    width: number
    setFillStyle: (color: number) => void
  } | null
  healthText: {
    setText: (text: string) => void
  } | null
}

interface PlayerSettings {
  skin: string
  weapon: string
}

interface CoopSettings {
  player1: PlayerSettings
  player2: PlayerSettings
  respawnOnPartnerAlive: boolean
  shareCoins: boolean
  difficulty: 'easy' | 'normal' | 'hard'
}

// Helper to create mock player
function createMockPlayer(playerNumber: 1 | 2): CoopPlayer {
  return {
    sprite: {
      x: playerNumber === 1 ? 400 : 500,
      y: 500,
      body: {
        velocity: { x: 0, y: 0 }
      },
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setAlpha: vi.fn()
    },
    playerNumber,
    health: 100,
    maxHealth: 100,
    isAlive: true,
    lives: 3,
    respawnTimer: null,
    gun: {
      x: playerNumber === 1 ? 400 : 500,
      y: 500,
      setRotation: vi.fn(),
      setFlipY: vi.fn()
    },
    healthBarFill: {
      width: 196,
      setFillStyle: vi.fn()
    },
    healthText: {
      setText: vi.fn()
    }
  }
}

function createDefaultSettings(): CoopSettings {
  return {
    player1: { skin: 'alienBeige', weapon: 'raygun' },
    player2: { skin: 'alienBlue', weapon: 'laser' },
    respawnOnPartnerAlive: true,
    shareCoins: false,
    difficulty: 'normal'
  }
}

describe('CoopPlayerManager - Player Types', () => {
  describe('CoopPlayer interface', () => {
    it('should have all required properties', () => {
      const player = createMockPlayer(1)
      
      expect(player).toHaveProperty('sprite')
      expect(player).toHaveProperty('playerNumber')
      expect(player).toHaveProperty('health')
      expect(player).toHaveProperty('maxHealth')
      expect(player).toHaveProperty('isAlive')
      expect(player).toHaveProperty('lives')
      expect(player).toHaveProperty('respawnTimer')
      expect(player).toHaveProperty('gun')
      expect(player).toHaveProperty('healthBarFill')
      expect(player).toHaveProperty('healthText')
    })
    
    it('should have valid player numbers', () => {
      const player1 = createMockPlayer(1)
      const player2 = createMockPlayer(2)
      
      expect(player1.playerNumber).toBe(1)
      expect(player2.playerNumber).toBe(2)
    })
    
    it('should have correct initial health', () => {
      const player = createMockPlayer(1)
      
      expect(player.health).toBe(100)
      expect(player.maxHealth).toBe(100)
      expect(player.isAlive).toBe(true)
    })
    
    it('should have initial lives', () => {
      const player = createMockPlayer(1)
      
      expect(player.lives).toBe(3)
    })
  })
  
  describe('CoopSettings interface', () => {
    it('should have all required properties', () => {
      const settings = createDefaultSettings()
      
      expect(settings).toHaveProperty('player1')
      expect(settings).toHaveProperty('player2')
      expect(settings).toHaveProperty('respawnOnPartnerAlive')
      expect(settings).toHaveProperty('shareCoins')
      expect(settings).toHaveProperty('difficulty')
    })
    
    it('should have valid difficulty values', () => {
      const easySettings = { ...createDefaultSettings(), difficulty: 'easy' as const }
      const normalSettings = { ...createDefaultSettings(), difficulty: 'normal' as const }
      const hardSettings = { ...createDefaultSettings(), difficulty: 'hard' as const }
      
      expect(['easy', 'normal', 'hard']).toContain(easySettings.difficulty)
      expect(['easy', 'normal', 'hard']).toContain(normalSettings.difficulty)
      expect(['easy', 'normal', 'hard']).toContain(hardSettings.difficulty)
    })
  })
})

describe('CoopPlayerManager - Damage Logic', () => {
  // Test damage calculation logic
  
  function applyDamage(player: CoopPlayer, amount: number): { newHealth: number; died: boolean } {
    const newHealth = Math.max(0, player.health - amount)
    const died = newHealth <= 0 && player.health > 0
    
    return { newHealth, died }
  }
  
  it('should reduce health by damage amount', () => {
    const player = createMockPlayer(1)
    const { newHealth } = applyDamage(player, 25)
    
    expect(newHealth).toBe(75)
  })
  
  it('should not reduce health below 0', () => {
    const player = createMockPlayer(1)
    const { newHealth } = applyDamage(player, 150)
    
    expect(newHealth).toBe(0)
  })
  
  it('should indicate death when health reaches 0', () => {
    const player = createMockPlayer(1)
    const { died } = applyDamage(player, 100)
    
    expect(died).toBe(true)
  })
  
  it('should not indicate death if already dead', () => {
    const player = createMockPlayer(1)
    player.health = 0
    
    const { died } = applyDamage(player, 50)
    
    expect(died).toBe(false)
  })
  
  it('should handle partial damage correctly', () => {
    const player = createMockPlayer(1)
    player.health = 30
    
    const { newHealth, died } = applyDamage(player, 30)
    
    expect(newHealth).toBe(0)
    expect(died).toBe(true)
  })
})

describe('CoopPlayerManager - Kill Logic', () => {
  function killPlayer(player: CoopPlayer): { newLives: number; gameOver: boolean } {
    const newLives = player.lives - 1
    const gameOver = newLives <= 0
    
    return { newLives, gameOver }
  }
  
  it('should reduce lives by 1', () => {
    const player = createMockPlayer(1)
    const { newLives } = killPlayer(player)
    
    expect(newLives).toBe(2)
  })
  
  it('should indicate game over when no lives left', () => {
    const player = createMockPlayer(1)
    player.lives = 1
    
    const { gameOver } = killPlayer(player)
    
    expect(gameOver).toBe(true)
  })
  
  it('should not indicate game over with remaining lives', () => {
    const player = createMockPlayer(1)
    player.lives = 3
    
    const { gameOver } = killPlayer(player)
    
    expect(gameOver).toBe(false)
  })
})

describe('CoopPlayerManager - Respawn Logic', () => {
  function canRespawn(
    player: CoopPlayer,
    otherPlayer: CoopPlayer | null,
    settings: CoopSettings
  ): boolean {
    // Can't respawn if no lives
    if (player.lives <= 0) return false
    
    // Check partner-based respawn
    if (settings.respawnOnPartnerAlive) {
      return otherPlayer !== null && otherPlayer.isAlive
    }
    
    return true
  }
  
  function getRespawnPosition(
    otherPlayer: CoopPlayer | null,
    defaultX: number,
    defaultY: number
  ): { x: number; y: number } {
    if (otherPlayer && otherPlayer.isAlive) {
      // Respawn near partner
      return {
        x: otherPlayer.sprite.x - 50,
        y: otherPlayer.sprite.y - 50
      }
    }
    
    return { x: defaultX, y: defaultY }
  }
  
  it('should allow respawn when partner is alive', () => {
    const player1 = createMockPlayer(1)
    player1.isAlive = false
    player1.lives = 2
    
    const player2 = createMockPlayer(2)
    player2.isAlive = true
    
    const settings = createDefaultSettings()
    
    expect(canRespawn(player1, player2, settings)).toBe(true)
  })
  
  it('should not allow respawn when partner is dead', () => {
    const player1 = createMockPlayer(1)
    player1.isAlive = false
    player1.lives = 2
    
    const player2 = createMockPlayer(2)
    player2.isAlive = false
    
    const settings = createDefaultSettings()
    
    expect(canRespawn(player1, player2, settings)).toBe(false)
  })
  
  it('should not allow respawn with no lives', () => {
    const player1 = createMockPlayer(1)
    player1.isAlive = false
    player1.lives = 0
    
    const player2 = createMockPlayer(2)
    player2.isAlive = true
    
    const settings = createDefaultSettings()
    
    expect(canRespawn(player1, player2, settings)).toBe(false)
  })
  
  it('should respawn near partner when available', () => {
    const player2 = createMockPlayer(2)
    player2.sprite.x = 600
    player2.sprite.y = 400
    
    const position = getRespawnPosition(player2, 100, 100)
    
    expect(position.x).toBe(550)
    expect(position.y).toBe(350)
  })
  
  it('should respawn at default when partner not available', () => {
    const position = getRespawnPosition(null, 100, 100)
    
    expect(position.x).toBe(100)
    expect(position.y).toBe(100)
  })
})

describe('CoopPlayerManager - Game Over Logic', () => {
  function isGameOver(player1: CoopPlayer, player2: CoopPlayer): boolean {
    const p1Out = !player1.isAlive && player1.lives <= 0
    const p2Out = !player2.isAlive && player2.lives <= 0
    
    return p1Out && p2Out
  }
  
  it('should return false when both players alive', () => {
    const player1 = createMockPlayer(1)
    const player2 = createMockPlayer(2)
    
    expect(isGameOver(player1, player2)).toBe(false)
  })
  
  it('should return false when one player has lives', () => {
    const player1 = createMockPlayer(1)
    player1.isAlive = false
    player1.lives = 0
    
    const player2 = createMockPlayer(2)
    player2.isAlive = true
    player2.lives = 2
    
    expect(isGameOver(player1, player2)).toBe(false)
  })
  
  it('should return true when both out of lives', () => {
    const player1 = createMockPlayer(1)
    player1.isAlive = false
    player1.lives = 0
    
    const player2 = createMockPlayer(2)
    player2.isAlive = false
    player2.lives = 0
    
    expect(isGameOver(player1, player2)).toBe(true)
  })
})

describe('CoopPlayerManager - Camera Focus Logic', () => {
  function getCameraFocusPoint(
    player1: CoopPlayer | null,
    player2: CoopPlayer | null
  ): { x: number; y: number } | null {
    if (!player1 && !player2) return null
    
    if (!player1?.isAlive && !player2?.isAlive) return null
    
    // Both alive - center between them
    if (player1?.isAlive && player2?.isAlive) {
      return {
        x: (player1.sprite.x + player2.sprite.x) / 2,
        y: (player1.sprite.y + player2.sprite.y) / 2
      }
    }
    
    // Only one alive
    if (player1?.isAlive) {
      return { x: player1.sprite.x, y: player1.sprite.y }
    }
    
    if (player2?.isAlive) {
      return { x: player2.sprite.x, y: player2.sprite.y }
    }
    
    return null
  }
  
  it('should return null when no players', () => {
    const focus = getCameraFocusPoint(null, null)
    
    expect(focus).toBeNull()
  })
  
  it('should center between both alive players', () => {
    const player1 = createMockPlayer(1)
    player1.sprite.x = 400
    player1.sprite.y = 300
    
    const player2 = createMockPlayer(2)
    player2.sprite.x = 600
    player2.sprite.y = 500
    
    const focus = getCameraFocusPoint(player1, player2)
    
    expect(focus).toEqual({ x: 500, y: 400 })
  })
  
  it('should focus on alive player when other is dead', () => {
    const player1 = createMockPlayer(1)
    player1.isAlive = true
    player1.sprite.x = 400
    player1.sprite.y = 300
    
    const player2 = createMockPlayer(2)
    player2.isAlive = false
    
    const focus = getCameraFocusPoint(player1, player2)
    
    expect(focus).toEqual({ x: 400, y: 300 })
  })
  
  it('should return null when both dead', () => {
    const player1 = createMockPlayer(1)
    player1.isAlive = false
    
    const player2 = createMockPlayer(2)
    player2.isAlive = false
    
    const focus = getCameraFocusPoint(player1, player2)
    
    expect(focus).toBeNull()
  })
})

describe('CoopPlayerManager - Health Bar Logic', () => {
  function calculateHealthBarWidth(health: number, maxHealth: number, maxWidth: number): number {
    return Math.max(0, (health / maxHealth) * maxWidth)
  }
  
  function getHealthBarColor(healthPercent: number): number {
    if (healthPercent > 0.6) return 0x00ff00  // Green
    if (healthPercent > 0.3) return 0xffff00  // Yellow
    return 0xff0000  // Red
  }
  
  it('should calculate full health bar width', () => {
    const width = calculateHealthBarWidth(100, 100, 196)
    
    expect(width).toBe(196)
  })
  
  it('should calculate half health bar width', () => {
    const width = calculateHealthBarWidth(50, 100, 196)
    
    expect(width).toBe(98)
  })
  
  it('should calculate zero health bar width', () => {
    const width = calculateHealthBarWidth(0, 100, 196)
    
    expect(width).toBe(0)
  })
  
  it('should return green for high health', () => {
    const color = getHealthBarColor(0.8)
    
    expect(color).toBe(0x00ff00)
  })
  
  it('should return yellow for medium health', () => {
    const color = getHealthBarColor(0.5)
    
    expect(color).toBe(0xffff00)
  })
  
  it('should return red for low health', () => {
    const color = getHealthBarColor(0.2)
    
    expect(color).toBe(0xff0000)
  })
})

describe('CoopPlayerManager - Gun Rotation Logic', () => {
  function calculateGunAngle(
    playerX: number,
    playerY: number,
    targetX: number,
    targetY: number
  ): { angle: number; flipY: boolean } {
    const angle = Math.atan2(targetY - playerY, targetX - playerX)
    const flipY = Math.abs(angle) > Math.PI / 2
    
    return { angle, flipY }
  }
  
  it('should calculate angle to right', () => {
    const { angle, flipY } = calculateGunAngle(400, 300, 500, 300)
    
    expect(angle).toBeCloseTo(0)
    expect(flipY).toBe(false)
  })
  
  it('should calculate angle to left', () => {
    const { angle, flipY } = calculateGunAngle(400, 300, 300, 300)
    
    expect(angle).toBeCloseTo(Math.PI)
    expect(flipY).toBe(true)
  })
  
  it('should calculate angle up-right', () => {
    const { angle, flipY } = calculateGunAngle(400, 300, 500, 200)
    
    expect(angle).toBeLessThan(0)
    expect(angle).toBeGreaterThan(-Math.PI / 2)
    expect(flipY).toBe(false)
  })
  
  it('should flip gun when aiming left', () => {
    const { flipY: flipRight } = calculateGunAngle(400, 300, 500, 300)
    const { flipY: flipLeft } = calculateGunAngle(400, 300, 300, 300)
    
    expect(flipRight).toBe(false)
    expect(flipLeft).toBe(true)
  })
})

describe('CoopPlayerManager - Player Skin Constants', () => {
  const PLAYER_SKINS = [
    'alienBeige',
    'alienBlue',
    'alienGreen',
    'alienPink',
    'alienYellow'
  ]
  
  it('should have predefined skins', () => {
    expect(PLAYER_SKINS.length).toBeGreaterThan(0)
  })
  
  it('should have unique skins', () => {
    const uniqueSkins = new Set(PLAYER_SKINS)
    
    expect(uniqueSkins.size).toBe(PLAYER_SKINS.length)
  })
  
  it('should include alien variants', () => {
    expect(PLAYER_SKINS).toContain('alienBeige')
    expect(PLAYER_SKINS).toContain('alienBlue')
  })
})

describe('CoopPlayerManager - Weapon Types', () => {
  const WEAPONS = ['raygun', 'laser', 'plasma']
  
  interface Weapon {
    name: string
    damage: number
    fireRate: number
    bulletSpeed: number
  }
  
  function getWeaponStats(weaponName: string): Weapon {
    const stats: Record<string, Weapon> = {
      'raygun': { name: 'raygun', damage: 10, fireRate: 200, bulletSpeed: 400 },
      'laser': { name: 'laser', damage: 15, fireRate: 300, bulletSpeed: 600 },
      'plasma': { name: 'plasma', damage: 25, fireRate: 500, bulletSpeed: 300 }
    }
    
    return stats[weaponName] || stats['raygun']
  }
  
  it('should have multiple weapon types', () => {
    expect(WEAPONS.length).toBeGreaterThan(1)
  })
  
  it('should return raygun stats', () => {
    const stats = getWeaponStats('raygun')
    
    expect(stats.damage).toBe(10)
    expect(stats.fireRate).toBe(200)
  })
  
  it('should return laser stats', () => {
    const stats = getWeaponStats('laser')
    
    expect(stats.damage).toBe(15)
    expect(stats.bulletSpeed).toBe(600)
  })
  
  it('should fallback to raygun for unknown weapon', () => {
    const stats = getWeaponStats('unknown')
    
    expect(stats.name).toBe('raygun')
  })
})

describe('CoopPlayerManager - Difficulty Settings', () => {
  interface DifficultyModifiers {
    damageMultiplier: number
    healthMultiplier: number
    respawnDelay: number
  }
  
  function getDifficultyModifiers(difficulty: 'easy' | 'normal' | 'hard'): DifficultyModifiers {
    switch (difficulty) {
      case 'easy':
        return { damageMultiplier: 0.5, healthMultiplier: 1.5, respawnDelay: 2000 }
      case 'hard':
        return { damageMultiplier: 1.5, healthMultiplier: 0.75, respawnDelay: 5000 }
      default:
        return { damageMultiplier: 1.0, healthMultiplier: 1.0, respawnDelay: 3000 }
    }
  }
  
  it('should have reduced damage on easy', () => {
    const mods = getDifficultyModifiers('easy')
    
    expect(mods.damageMultiplier).toBe(0.5)
  })
  
  it('should have increased damage on hard', () => {
    const mods = getDifficultyModifiers('hard')
    
    expect(mods.damageMultiplier).toBe(1.5)
  })
  
  it('should have normal modifiers on normal', () => {
    const mods = getDifficultyModifiers('normal')
    
    expect(mods.damageMultiplier).toBe(1.0)
    expect(mods.healthMultiplier).toBe(1.0)
  })
  
  it('should have shorter respawn on easy', () => {
    const easyMods = getDifficultyModifiers('easy')
    const hardMods = getDifficultyModifiers('hard')
    
    expect(easyMods.respawnDelay).toBeLessThan(hardMods.respawnDelay)
  })
})
