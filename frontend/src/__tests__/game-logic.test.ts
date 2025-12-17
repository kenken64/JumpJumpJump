import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  compressState,
  decompressState,
  calculateEnemyScoreReward,
  calculateEnemyDamage,
  calculatePlayerDamage,
  shouldTriggerStomp,
  isInvincible,
  calculateStompFragmentPositions,
  calculateFragmentVelocity,
  calculateBounceDirection,
  calculateCoinReward,
  calculateEnemySeparationForce,
  clamp,
  lerp,
  distance,
  isPointInRect,
  doRectsOverlap,
  randomInt,
  randomElement,
  calculateRespawnX,
  isLevelComplete,
  calculateDQNReward,
  SeededRandom,
  calculateCoinDropPositions,
  calculateEnemySpawnPosition,
  selectWeightedEnemyType,
  calculatePowerUpEffect,
  calculateRespawnPosition,
  shouldPlayerDie,
  isOnlineGameOver,
  calculateBossDefeatRewards,
  FullState,
  CompressedState,
  EnemySize
} from '../utils/GameLogic'

describe('GameLogic', () => {
  describe('compressState', () => {
    it('should compress a full state into abbreviated format', () => {
      const fullState: FullState = {
        playerX: 100.6,
        playerY: 200.4,
        velocityX: 150.35,
        velocityY: -200.78,
        onGround: true,
        nearestPlatformX: 300.7,
        nearestPlatformY: 400.2,
        nearestEnemyX: 500.9,
        nearestEnemyY: 600.1,
        nearestSpikeX: 700.3,
        bossActive: true,
        bossDistance: 800.5,
        bossHealth: 900.8
      }

      const compressed = compressState(fullState)

      expect(compressed.px).toBe(101)
      expect(compressed.py).toBe(200)
      expect(compressed.vx).toBe(150.4)
      expect(compressed.vy).toBe(-200.8)
      expect(compressed.og).toBe(1)
      expect(compressed.np).toBe(301)
      expect(compressed.npy).toBe(400)
      expect(compressed.ne).toBe(501)
      expect(compressed.ney).toBe(600)
      expect(compressed.ns).toBe(700)
      expect(compressed.ba).toBe(1)
      expect(compressed.bd).toBe(801)
      expect(compressed.bh).toBe(901)
    })

    it('should handle zero values', () => {
      const fullState: FullState = {
        playerX: 0,
        playerY: 0,
        velocityX: 0,
        velocityY: 0,
        onGround: false,
        nearestPlatformX: 0,
        nearestPlatformY: 0,
        nearestEnemyX: 0,
        nearestEnemyY: 0,
        nearestSpikeX: 0,
        bossActive: false,
        bossDistance: 0,
        bossHealth: 0
      }

      const compressed = compressState(fullState)

      expect(compressed.px).toBe(0)
      expect(compressed.og).toBe(0)
      expect(compressed.ba).toBe(0)
    })

    it('should handle negative values', () => {
      const fullState: FullState = {
        playerX: -100.5,
        playerY: -200.5,
        velocityX: -50.25,
        velocityY: 100.75,
        onGround: true,
        nearestPlatformX: -300,
        nearestPlatformY: -400,
        nearestEnemyX: -500,
        nearestEnemyY: -600,
        nearestSpikeX: -700,
        bossActive: false,
        bossDistance: -100,
        bossHealth: -50
      }

      const compressed = compressState(fullState)

      expect(compressed.px).toBe(-100)
      expect(compressed.py).toBe(-200)
      expect(compressed.vx).toBe(-50.2)
    })
  })

  describe('decompressState', () => {
    it('should decompress a compressed state back to full format', () => {
      const compressed: CompressedState = {
        px: 100,
        py: 200,
        vx: 150.5,
        vy: -200.3,
        og: 1,
        np: 300,
        npy: 400,
        ne: 500,
        ney: 600,
        ns: 700,
        ba: 1,
        bd: 800,
        bh: 900
      }

      const full = decompressState(compressed)

      expect(full.playerX).toBe(100)
      expect(full.playerY).toBe(200)
      expect(full.velocityX).toBe(150.5)
      expect(full.velocityY).toBe(-200.3)
      expect(full.onGround).toBe(true)
      expect(full.nearestPlatformX).toBe(300)
      expect(full.nearestPlatformY).toBe(400)
      expect(full.nearestEnemyX).toBe(500)
      expect(full.nearestEnemyY).toBe(600)
      expect(full.nearestSpikeX).toBe(700)
      expect(full.bossActive).toBe(true)
      expect(full.bossDistance).toBe(800)
      expect(full.bossHealth).toBe(900)
    })

    it('should correctly handle boolean conversion from 0', () => {
      const compressed: CompressedState = {
        px: 0, py: 0, vx: 0, vy: 0,
        og: 0, np: 0, npy: 0, ne: 0, ney: 0, ns: 0,
        ba: 0, bd: 0, bh: 0
      }

      const full = decompressState(compressed)

      expect(full.onGround).toBe(false)
      expect(full.bossActive).toBe(false)
    })

    it('should be reversible with compressState', () => {
      const original: FullState = {
        playerX: 150,
        playerY: 250,
        velocityX: 100,
        velocityY: -50,
        onGround: true,
        nearestPlatformX: 350,
        nearestPlatformY: 450,
        nearestEnemyX: 550,
        nearestEnemyY: 650,
        nearestSpikeX: 750,
        bossActive: false,
        bossDistance: 850,
        bossHealth: 950
      }

      const roundTripped = decompressState(compressState(original))

      expect(roundTripped.playerX).toBe(original.playerX)
      expect(roundTripped.onGround).toBe(original.onGround)
      expect(roundTripped.bossActive).toBe(original.bossActive)
    })
  })

  describe('calculateEnemyScoreReward', () => {
    it('should return 50 for small enemies', () => {
      expect(calculateEnemyScoreReward('small')).toBe(50)
    })

    it('should return 100 for medium enemies', () => {
      expect(calculateEnemyScoreReward('medium')).toBe(100)
    })

    it('should return 200 for large enemies', () => {
      expect(calculateEnemyScoreReward('large')).toBe(200)
    })

    it('should return 50 as default for unknown size', () => {
      // Cast to bypass TypeScript for edge case testing
      expect(calculateEnemyScoreReward('unknown' as EnemySize)).toBe(50)
    })
  })

  describe('calculateEnemyDamage', () => {
    it('should reduce enemy health by base damage', () => {
      expect(calculateEnemyDamage(25, false, 100)).toBe(75)
    })

    it('should one-shot enemy with rocket', () => {
      expect(calculateEnemyDamage(25, true, 100)).toBe(0)
      expect(calculateEnemyDamage(1, true, 9999)).toBe(0)
    })

    it('should not go below 0 health', () => {
      expect(calculateEnemyDamage(150, false, 100)).toBe(0)
    })

    it('should handle exact health reduction', () => {
      expect(calculateEnemyDamage(100, false, 100)).toBe(0)
    })

    it('should handle small damage values', () => {
      expect(calculateEnemyDamage(1, false, 100)).toBe(99)
    })
  })

  describe('calculatePlayerDamage', () => {
    it('should reduce player health by damage amount', () => {
      const result = calculatePlayerDamage(100, 20, false)
      expect(result.newHealth).toBe(80)
      expect(result.shieldConsumed).toBe(false)
      expect(result.isDead).toBe(false)
    })

    it('should absorb damage with shield', () => {
      const result = calculatePlayerDamage(100, 50, true)
      expect(result.newHealth).toBe(100)
      expect(result.shieldConsumed).toBe(true)
      expect(result.isDead).toBe(false)
    })

    it('should mark player as dead when health reaches 0', () => {
      const result = calculatePlayerDamage(20, 20, false)
      expect(result.newHealth).toBe(0)
      expect(result.isDead).toBe(true)
    })

    it('should not go below 0 health', () => {
      const result = calculatePlayerDamage(10, 100, false)
      expect(result.newHealth).toBe(0)
      expect(result.isDead).toBe(true)
    })

    it('should handle full health with shield', () => {
      const result = calculatePlayerDamage(100, 999, true)
      expect(result.newHealth).toBe(100)
      expect(result.shieldConsumed).toBe(true)
      expect(result.isDead).toBe(false)
    })
  })

  describe('shouldTriggerStomp', () => {
    it('should trigger stomp when player is above enemy and falling fast', () => {
      expect(shouldTriggerStomp(100, 100, 200)).toBe(true)
    })

    it('should not trigger stomp when player is below enemy', () => {
      expect(shouldTriggerStomp(200, 100, 100)).toBe(false)
    })

    it('should not trigger stomp when player is not falling fast enough', () => {
      expect(shouldTriggerStomp(100, 30, 200)).toBe(false)
    })

    it('should not trigger stomp when moving up', () => {
      expect(shouldTriggerStomp(100, -100, 200)).toBe(false)
    })

    it('should respect custom threshold', () => {
      expect(shouldTriggerStomp(100, 40, 200, 30)).toBe(true)
      expect(shouldTriggerStomp(100, 40, 200, 50)).toBe(false)
    })

    it('should handle edge case at threshold boundary', () => {
      expect(shouldTriggerStomp(100, 50, 200, 50)).toBe(false)
      expect(shouldTriggerStomp(100, 51, 200, 50)).toBe(true)
    })
  })

  describe('isInvincible', () => {
    it('should return true during invincibility window', () => {
      expect(isInvincible(1000, 1500, 1000)).toBe(true)
    })

    it('should return false after invincibility expires', () => {
      expect(isInvincible(1000, 2500, 1000)).toBe(false)
    })

    it('should return false exactly at expiration', () => {
      expect(isInvincible(1000, 2000, 1000)).toBe(false)
    })

    it('should handle custom duration', () => {
      expect(isInvincible(0, 500, 2000)).toBe(true)
      expect(isInvincible(0, 2500, 2000)).toBe(false)
    })

    it('should handle same timestamp', () => {
      expect(isInvincible(1000, 1000, 1000)).toBe(true)
    })
  })

  describe('calculateStompFragmentPositions', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should generate correct number of fragments', () => {
      const positions = calculateStompFragmentPositions(100, 200, 8)
      expect(positions.length).toBe(8)
    })

    it('should respect custom fragment count', () => {
      const positions = calculateStompFragmentPositions(100, 200, 4)
      expect(positions.length).toBe(4)
    })

    it('should calculate positions around the player', () => {
      const positions = calculateStompFragmentPositions(100, 200, 4)
      
      // With mocked random = 0.5, distance = 50 + 0.5 * 30 = 65
      // First fragment at angle 0: x = 100 + cos(0) * 65 = 165
      expect(positions[0].x).toBeCloseTo(165, 0)
      expect(positions[0].y).toBe(220) // playerY + 20
      expect(positions[0].angle).toBe(0)
    })

    it('should distribute angles evenly', () => {
      const positions = calculateStompFragmentPositions(0, 0, 4)
      
      expect(positions[0].angle).toBeCloseTo(0)
      expect(positions[1].angle).toBeCloseTo(Math.PI / 2)
      expect(positions[2].angle).toBeCloseTo(Math.PI)
      expect(positions[3].angle).toBeCloseTo(Math.PI * 1.5)
    })
  })

  describe('calculateFragmentVelocity', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should calculate velocity based on angle', () => {
      const velocity = calculateFragmentVelocity(0)
      
      // With random = 0.5: velocityX = cos(0) * (200 + 50) = 250
      expect(velocity.velocityX).toBeCloseTo(250, 0)
      // velocityY = -300 - 100 = -400
      expect(velocity.velocityY).toBe(-400)
    })

    it('should handle PI angle', () => {
      const velocity = calculateFragmentVelocity(Math.PI)
      
      expect(velocity.velocityX).toBeCloseTo(-250, 0)
    })
  })

  describe('calculateBounceDirection', () => {
    it('should return 1 when enemy is to the right of player', () => {
      expect(calculateBounceDirection(200, 100)).toBe(1)
    })

    it('should return -1 when enemy is to the left of player', () => {
      expect(calculateBounceDirection(100, 200)).toBe(-1)
    })

    it('should return -1 when positions are equal', () => {
      expect(calculateBounceDirection(100, 100)).toBe(-1)
    })
  })

  describe('calculateCoinReward', () => {
    it('should return base reward with no multiplier', () => {
      expect(calculateCoinReward(10)).toBe(10)
    })

    it('should apply multiplier correctly', () => {
      expect(calculateCoinReward(10, 2)).toBe(20)
    })

    it('should floor fractional results', () => {
      expect(calculateCoinReward(10, 1.5)).toBe(15)
      expect(calculateCoinReward(7, 1.5)).toBe(10)
    })

    it('should handle zero multiplier', () => {
      expect(calculateCoinReward(10, 0)).toBe(0)
    })
  })

  describe('calculateEnemySeparationForce', () => {
    it('should return push force when enemies are too close horizontally', () => {
      const force = calculateEnemySeparationForce(100, 200, 150, 200)
      expect(force).not.toBeNull()
      expect(force!.pushX).toBeLessThan(0) // Push left since enemy1 is to the left
    })

    it('should return null when enemies are far apart', () => {
      const force = calculateEnemySeparationForce(0, 200, 200, 200)
      expect(force).toBeNull()
    })

    it('should handle vertical stacking', () => {
      const force = calculateEnemySeparationForce(100, 100, 120, 150, 70)
      expect(force).not.toBeNull()
    })

    it('should respect custom minimum distance', () => {
      // With minDistance=50, 60px apart should not push (60 > 50)
      const force = calculateEnemySeparationForce(100, 200, 160, 200, 50)
      expect(force).toBeNull()
    })
  })

  describe('clamp', () => {
    it('should clamp value below min to min', () => {
      expect(clamp(-10, 0, 100)).toBe(0)
    })

    it('should clamp value above max to max', () => {
      expect(clamp(150, 0, 100)).toBe(100)
    })

    it('should return value when within range', () => {
      expect(clamp(50, 0, 100)).toBe(50)
    })

    it('should handle equal min and max', () => {
      expect(clamp(50, 25, 25)).toBe(25)
    })

    it('should handle negative ranges', () => {
      expect(clamp(-50, -100, -10)).toBe(-50)
      expect(clamp(0, -100, -10)).toBe(-10)
    })
  })

  describe('lerp', () => {
    it('should return start when t is 0', () => {
      expect(lerp(0, 100, 0)).toBe(0)
    })

    it('should return end when t is 1', () => {
      expect(lerp(0, 100, 1)).toBe(100)
    })

    it('should interpolate correctly at 0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50)
    })

    it('should clamp t below 0', () => {
      expect(lerp(0, 100, -0.5)).toBe(0)
    })

    it('should clamp t above 1', () => {
      expect(lerp(0, 100, 1.5)).toBe(100)
    })

    it('should handle negative values', () => {
      expect(lerp(-100, 100, 0.5)).toBe(0)
    })
  })

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      expect(distance(0, 0, 3, 4)).toBe(5)
    })

    it('should return 0 for same point', () => {
      expect(distance(10, 20, 10, 20)).toBe(0)
    })

    it('should handle negative coordinates', () => {
      expect(distance(-3, -4, 0, 0)).toBe(5)
    })

    it('should handle diagonal distance', () => {
      expect(distance(0, 0, 1, 1)).toBeCloseTo(Math.SQRT2)
    })
  })

  describe('isPointInRect', () => {
    it('should return true when point is inside rect', () => {
      expect(isPointInRect(50, 50, 0, 0, 100, 100)).toBe(true)
    })

    it('should return true when point is on edge', () => {
      expect(isPointInRect(0, 50, 0, 0, 100, 100)).toBe(true)
      expect(isPointInRect(100, 50, 0, 0, 100, 100)).toBe(true)
    })

    it('should return false when point is outside', () => {
      expect(isPointInRect(150, 50, 0, 0, 100, 100)).toBe(false)
      expect(isPointInRect(-10, 50, 0, 0, 100, 100)).toBe(false)
    })

    it('should return true at corners', () => {
      expect(isPointInRect(0, 0, 0, 0, 100, 100)).toBe(true)
      expect(isPointInRect(100, 100, 0, 0, 100, 100)).toBe(true)
    })
  })

  describe('doRectsOverlap', () => {
    it('should return true when rects overlap', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 }
      const rect2 = { x: 50, y: 50, width: 100, height: 100 }
      expect(doRectsOverlap(rect1, rect2)).toBe(true)
    })

    it('should return false when rects do not overlap', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 }
      const rect2 = { x: 200, y: 200, width: 100, height: 100 }
      expect(doRectsOverlap(rect1, rect2)).toBe(false)
    })

    it('should return false when rects touch edges', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 }
      const rect2 = { x: 100, y: 0, width: 100, height: 100 }
      expect(doRectsOverlap(rect1, rect2)).toBe(false)
    })

    it('should return true when one rect contains another', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 }
      const rect2 = { x: 25, y: 25, width: 50, height: 50 }
      expect(doRectsOverlap(rect1, rect2)).toBe(true)
    })
  })

  describe('randomInt', () => {
    it('should return value within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 10)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    it('should return single value when min equals max', () => {
      expect(randomInt(5, 5)).toBe(5)
    })

    it('should handle negative ranges', () => {
      for (let i = 0; i < 20; i++) {
        const result = randomInt(-10, -5)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-5)
      }
    })
  })

  describe('randomElement', () => {
    it('should return element from array', () => {
      const arr = [1, 2, 3, 4, 5]
      for (let i = 0; i < 20; i++) {
        const result = randomElement(arr)
        expect(arr).toContain(result)
      }
    })

    it('should return undefined for empty array', () => {
      expect(randomElement([])).toBeUndefined()
    })

    it('should return only element for single-element array', () => {
      expect(randomElement(['only'])).toBe('only')
    })

    it('should work with different types', () => {
      const arr = ['a', 'b', 'c']
      const result = randomElement(arr)
      expect(typeof result).toBe('string')
    })
  })

  describe('calculateRespawnX', () => {
    it('should use checkpoint when available', () => {
      expect(calculateRespawnX(500, 100)).toBe(500)
    })

    it('should use default when no checkpoint', () => {
      expect(calculateRespawnX(null, 100)).toBe(100)
    })

    it('should apply offset to checkpoint', () => {
      expect(calculateRespawnX(500, 100, 50)).toBe(550)
    })

    it('should apply offset to default', () => {
      expect(calculateRespawnX(null, 100, 50)).toBe(150)
    })

    it('should handle negative offset', () => {
      expect(calculateRespawnX(500, 100, -25)).toBe(475)
    })
  })

  describe('isLevelComplete', () => {
    it('should return true when player reaches goal with no boss', () => {
      expect(isLevelComplete(1000, 1000, false, 0)).toBe(true)
    })

    it('should return true when player past goal with no boss', () => {
      expect(isLevelComplete(1100, 1000, false, 0)).toBe(true)
    })

    it('should return false when player before goal', () => {
      expect(isLevelComplete(500, 1000, false, 0)).toBe(false)
    })

    it('should return false when boss is active with health', () => {
      expect(isLevelComplete(1100, 1000, true, 50)).toBe(false)
    })

    it('should return true after boss is defeated', () => {
      expect(isLevelComplete(1100, 1000, true, 0)).toBe(true)
    })

    it('should return false at goal with active boss', () => {
      expect(isLevelComplete(1000, 1000, true, 100)).toBe(false)
    })
  })

  describe('calculateDQNReward', () => {
    it('should calculate positive reward for progress', () => {
      const reward = calculateDQNReward({
        progressDelta: 100,
        coinCollected: false,
        enemyDefeated: false,
        damageTaken: false,
        playerDied: false,
        levelComplete: false,
        bossDefeated: false
      })
      expect(reward).toBe(1) // 100 * 0.01
    })

    it('should add coin reward', () => {
      const reward = calculateDQNReward({
        progressDelta: 0,
        coinCollected: true,
        enemyDefeated: false,
        damageTaken: false,
        playerDied: false,
        levelComplete: false,
        bossDefeated: false
      })
      expect(reward).toBe(1)
    })

    it('should add enemy defeat reward', () => {
      const reward = calculateDQNReward({
        progressDelta: 0,
        coinCollected: false,
        enemyDefeated: true,
        damageTaken: false,
        playerDied: false,
        levelComplete: false,
        bossDefeated: false
      })
      expect(reward).toBe(5)
    })

    it('should add level complete reward', () => {
      const reward = calculateDQNReward({
        progressDelta: 0,
        coinCollected: false,
        enemyDefeated: false,
        damageTaken: false,
        playerDied: false,
        levelComplete: true,
        bossDefeated: false
      })
      expect(reward).toBe(50)
    })

    it('should add boss defeat reward', () => {
      const reward = calculateDQNReward({
        progressDelta: 0,
        coinCollected: false,
        enemyDefeated: false,
        damageTaken: false,
        playerDied: false,
        levelComplete: false,
        bossDefeated: true
      })
      expect(reward).toBe(100)
    })

    it('should subtract damage penalty', () => {
      const reward = calculateDQNReward({
        progressDelta: 0,
        coinCollected: false,
        enemyDefeated: false,
        damageTaken: true,
        playerDied: false,
        levelComplete: false,
        bossDefeated: false
      })
      expect(reward).toBe(-10)
    })

    it('should subtract death penalty', () => {
      const reward = calculateDQNReward({
        progressDelta: 0,
        coinCollected: false,
        enemyDefeated: false,
        damageTaken: false,
        playerDied: true,
        levelComplete: false,
        bossDefeated: false
      })
      expect(reward).toBe(-50)
    })

    it('should combine multiple rewards', () => {
      const reward = calculateDQNReward({
        progressDelta: 50,
        coinCollected: true,
        enemyDefeated: true,
        damageTaken: true,
        playerDied: false,
        levelComplete: false,
        bossDefeated: false
      })
      // 0.5 (progress) + 1 (coin) + 5 (enemy) - 10 (damage) = -3.5
      expect(reward).toBe(-3.5)
    })

    it('should handle all rewards at once', () => {
      const reward = calculateDQNReward({
        progressDelta: 100,
        coinCollected: true,
        enemyDefeated: true,
        damageTaken: false,
        playerDied: false,
        levelComplete: true,
        bossDefeated: true
      })
      // 1 + 1 + 5 + 50 + 100 = 157
      expect(reward).toBe(157)
    })
  })

  describe('SeededRandom', () => {
    it('should produce deterministic values with same seed', () => {
      const rng1 = new SeededRandom(12345)
      const rng2 = new SeededRandom(12345)
      
      const values1 = Array.from({ length: 10 }, () => rng1.random())
      const values2 = Array.from({ length: 10 }, () => rng2.random())
      
      expect(values1).toEqual(values2)
    })

    it('should produce values between 0 and 1', () => {
      const rng = new SeededRandom(99999)
      
      for (let i = 0; i < 100; i++) {
        const value = rng.random()
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })

    it('should produce different values with different seeds', () => {
      const rng1 = new SeededRandom(12345)
      const rng2 = new SeededRandom(54321)
      
      expect(rng1.random()).not.toBe(rng2.random())
    })

    it('should produce integers in range with between()', () => {
      const rng = new SeededRandom(54321)
      
      for (let i = 0; i < 50; i++) {
        const value = rng.between(10, 20)
        expect(value).toBeGreaterThanOrEqual(10)
        expect(value).toBeLessThanOrEqual(20)
        expect(Number.isInteger(value)).toBe(true)
      }
    })

    it('should produce floats in range with floatBetween()', () => {
      const rng = new SeededRandom(11111)
      
      for (let i = 0; i < 50; i++) {
        const value = rng.floatBetween(5.0, 10.0)
        expect(value).toBeGreaterThanOrEqual(5.0)
        expect(value).toBeLessThanOrEqual(10.0)
      }
    })

    it('should pick random element from array', () => {
      const rng = new SeededRandom(22222)
      const array = ['a', 'b', 'c', 'd', 'e']
      
      for (let i = 0; i < 20; i++) {
        const picked = rng.pick(array)
        expect(array).toContain(picked)
      }
    })

    it('should return undefined for empty array in pick()', () => {
      const rng = new SeededRandom(33333)
      const result = rng.pick([])
      expect(result).toBeUndefined()
    })

    it('should shuffle array deterministically', () => {
      const rng1 = new SeededRandom(44444)
      const rng2 = new SeededRandom(44444)
      const array = [1, 2, 3, 4, 5]
      
      const shuffled1 = rng1.shuffle(array)
      const shuffled2 = rng2.shuffle(array)
      
      expect(shuffled1).toEqual(shuffled2)
      expect(shuffled1).not.toEqual(array) // Should be different from original
      expect(shuffled1.sort()).toEqual(array.sort()) // Should contain same elements
    })

    it('should preserve original array when shuffling', () => {
      const rng = new SeededRandom(55555)
      const original = [1, 2, 3, 4, 5]
      const copy = [...original]
      
      rng.shuffle(original)
      
      expect(original).toEqual(copy)
    })

    it('should get and set state correctly', () => {
      const rng = new SeededRandom(66666)
      
      // Generate some values
      rng.random()
      rng.random()
      
      const state = rng.getState()
      const value1 = rng.random()
      
      // Reset to saved state
      rng.setState(state)
      const value2 = rng.random()
      
      expect(value1).toBe(value2)
    })
  })

  describe('calculateCoinDropPositions', () => {
    it('should return correct number of positions', () => {
      const rng = new SeededRandom(12345)
      const positions = calculateCoinDropPositions(100, 200, 5, rng)
      expect(positions).toHaveLength(5)
    })

    it('should generate deterministic positions', () => {
      const rng1 = new SeededRandom(12345)
      const rng2 = new SeededRandom(12345)
      
      const positions1 = calculateCoinDropPositions(100, 200, 3, rng1)
      const positions2 = calculateCoinDropPositions(100, 200, 3, rng2)
      
      expect(positions1).toEqual(positions2)
    })

    it('should have staggered delays', () => {
      const rng = new SeededRandom(12345)
      const positions = calculateCoinDropPositions(100, 200, 3, rng)
      
      expect(positions[0].delay).toBe(0)
      expect(positions[1].delay).toBe(50)
      expect(positions[2].delay).toBe(100)
    })

    it('should position coins near origin', () => {
      const rng = new SeededRandom(12345)
      const originX = 500
      const originY = 400
      const positions = calculateCoinDropPositions(originX, originY, 10, rng)
      
      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(originX - 30)
        expect(pos.x).toBeLessThanOrEqual(originX + 30)
        expect(pos.y).toBe(originY - 10)
      }
    })
  })

  describe('calculateEnemySpawnPosition', () => {
    it('should spawn ground enemies at ground level', () => {
      const rng = new SeededRandom(12345)
      const pos = calculateEnemySpawnPosition(100, 500, 600, false, rng)
      
      expect(pos.x).toBeGreaterThanOrEqual(100)
      expect(pos.x).toBeLessThanOrEqual(500)
      expect(pos.y).toBe(580) // groundY - 20
    })

    it('should spawn flying enemies above ground', () => {
      const rng = new SeededRandom(12345)
      const pos = calculateEnemySpawnPosition(100, 500, 600, true, rng)
      
      expect(pos.x).toBeGreaterThanOrEqual(100)
      expect(pos.x).toBeLessThanOrEqual(500)
      expect(pos.y).toBeGreaterThanOrEqual(400) // groundY - 200
      expect(pos.y).toBeLessThanOrEqual(500) // groundY - 100
    })
  })

  describe('selectWeightedEnemyType', () => {
    it('should select based on weights', () => {
      const rng = new SeededRandom(12345)
      const weights = [0, 0, 100] // Only third option
      
      const selected = selectWeightedEnemyType(weights, rng)
      expect(selected).toBe(2)
    })

    it('should distribute selections according to weights', () => {
      const counts = [0, 0, 0]
      const weights = [50, 30, 20]
      
      for (let i = 0; i < 1000; i++) {
        const rng = new SeededRandom(i)
        const selected = selectWeightedEnemyType(weights, rng)
        counts[selected]++
      }
      
      // First type should be most common (50% weight)
      expect(counts[0]).toBeGreaterThan(counts[1])
      expect(counts[1]).toBeGreaterThan(counts[2])
    })
  })

  describe('calculatePowerUpEffect', () => {
    it('should activate speed boost', () => {
      const result = calculatePowerUpEffect('speed', 50, 100, 3)
      
      expect(result.hasSpeedBoost).toBe(true)
      expect(result.hasShield).toBe(false)
      expect(result.boostDuration).toBe(10000)
      expect(result.newHealth).toBe(50)
      expect(result.newLives).toBe(3)
    })

    it('should activate shield', () => {
      const result = calculatePowerUpEffect('shield', 50, 100, 3)
      
      expect(result.hasShield).toBe(true)
      expect(result.hasSpeedBoost).toBe(false)
      expect(result.boostDuration).toBe(15000)
    })

    it('should add health up to max', () => {
      const result = calculatePowerUpEffect('health', 50, 100, 3)
      
      expect(result.newHealth).toBe(80) // 50 + 30
    })

    it('should cap health at max', () => {
      const result = calculatePowerUpEffect('health', 90, 100, 3)
      
      expect(result.newHealth).toBe(100)
    })

    it('should add extra life', () => {
      const result = calculatePowerUpEffect('life', 50, 100, 3)
      
      expect(result.newLives).toBe(4)
    })
  })

  describe('calculateRespawnPosition', () => {
    it('should return checkpoint position when valid', () => {
      const checkpoints = [{ x: 1000 }, { x: 2000 }, { x: 3000 }]
      const result = calculateRespawnPosition(checkpoints, 1, 100, 550)
      
      expect(result.x).toBe(2000)
      expect(result.y).toBe(550)
    })

    it('should return default position when no checkpoint', () => {
      const checkpoints = [{ x: 1000 }]
      const result = calculateRespawnPosition(checkpoints, -1, 100, 550)
      
      expect(result.x).toBe(100)
      expect(result.y).toBe(550)
    })

    it('should return default when checkpoint index out of bounds', () => {
      const checkpoints = [{ x: 1000 }]
      const result = calculateRespawnPosition(checkpoints, 5, 100, 550)
      
      expect(result.x).toBe(100)
      expect(result.y).toBe(550)
    })
  })

  describe('shouldPlayerDie', () => {
    it('should return true when health is zero', () => {
      expect(shouldPlayerDie(0, 500, 1000)).toBe(true)
    })

    it('should return true when health is negative', () => {
      expect(shouldPlayerDie(-10, 500, 1000)).toBe(true)
    })

    it('should return true when falling off map', () => {
      expect(shouldPlayerDie(100, 1500, 1000)).toBe(true)
    })

    it('should return false when alive and on map', () => {
      expect(shouldPlayerDie(100, 500, 1000)).toBe(false)
    })
  })

  describe('isOnlineGameOver', () => {
    it('should return true when both players out of lives', () => {
      expect(isOnlineGameOver(0, 0)).toBe(true)
    })

    it('should return false when player 1 has lives', () => {
      expect(isOnlineGameOver(1, 0)).toBe(false)
    })

    it('should return false when player 2 has lives', () => {
      expect(isOnlineGameOver(0, 1)).toBe(false)
    })

    it('should return false when both players have lives', () => {
      expect(isOnlineGameOver(2, 3)).toBe(false)
    })
  })

  describe('calculateBossDefeatRewards', () => {
    it('should return standard rewards for regular boss', () => {
      const result = calculateBossDefeatRewards(5)
      
      expect(result.score).toBe(1000)
      expect(result.coins).toBe(100)
      expect(result.isFinalBoss).toBe(false)
    })

    it('should mark boss 20 as final boss', () => {
      const result = calculateBossDefeatRewards(20)
      
      expect(result.score).toBe(1000)
      expect(result.coins).toBe(100)
      expect(result.isFinalBoss).toBe(true)
    })

    it('should not mark other bosses as final', () => {
      for (let i = 0; i < 20; i++) {
        const result = calculateBossDefeatRewards(i)
        expect(result.isFinalBoss).toBe(false)
      }
    })
  })
})

