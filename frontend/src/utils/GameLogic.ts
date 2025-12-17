/**
 * GameLogic - Pure utility functions extracted from GameScene for testability
 * 
 * This module contains game logic that doesn't depend on Phaser's runtime,
 * making it easy to unit test without complex mocking.
 */

/**
 * Compressed state format for network/storage optimization
 */
export interface CompressedState {
  px: number  // playerX (rounded)
  py: number  // playerY (rounded)
  vx: number  // velocityX (1 decimal)
  vy: number  // velocityY (1 decimal)
  og: 0 | 1   // onGround (boolean as 0/1)
  np: number  // nearestPlatformX
  npy: number // nearestPlatformY
  ne: number  // nearestEnemyX
  ney: number // nearestEnemyY
  ns: number  // nearestSpikeX
  ba: 0 | 1   // bossActive (boolean as 0/1)
  bd: number  // bossDistance
  bh: number  // bossHealth
}

/**
 * Full state format for game logic
 */
export interface FullState {
  playerX: number
  playerY: number
  velocityX: number
  velocityY: number
  onGround: boolean
  nearestPlatformX: number
  nearestPlatformY: number
  nearestEnemyX: number
  nearestEnemyY: number
  nearestSpikeX: number
  bossActive: boolean
  bossDistance: number
  bossHealth: number
}

/**
 * Compress a full game state into a compact format
 * @param state - Full state object
 * @returns Compressed state with abbreviated keys and rounded values
 */
export function compressState(state: FullState): CompressedState {
  return {
    px: Math.round(state.playerX),
    py: Math.round(state.playerY),
    vx: Math.round(state.velocityX * 10) / 10,
    vy: Math.round(state.velocityY * 10) / 10,
    og: state.onGround ? 1 : 0,
    np: Math.round(state.nearestPlatformX),
    npy: Math.round(state.nearestPlatformY),
    ne: Math.round(state.nearestEnemyX),
    ney: Math.round(state.nearestEnemyY),
    ns: Math.round(state.nearestSpikeX),
    ba: state.bossActive ? 1 : 0,
    bd: Math.round(state.bossDistance),
    bh: Math.round(state.bossHealth)
  }
}

/**
 * Decompress a compact state back to full format
 * @param s - Compressed state object
 * @returns Full state with expanded keys and types
 */
export function decompressState(s: CompressedState): FullState {
  return {
    playerX: s.px,
    playerY: s.py,
    velocityX: s.vx,
    velocityY: s.vy,
    onGround: s.og === 1,
    nearestPlatformX: s.np,
    nearestPlatformY: s.npy,
    nearestEnemyX: s.ne,
    nearestEnemyY: s.ney,
    nearestSpikeX: s.ns,
    bossActive: s.ba === 1,
    bossDistance: s.bd,
    bossHealth: s.bh
  }
}

/**
 * Enemy size categories
 */
export type EnemySize = 'small' | 'medium' | 'large'

/**
 * Calculate score reward for defeating an enemy
 * @param enemySize - Size category of the enemy
 * @returns Score points to award
 */
export function calculateEnemyScoreReward(enemySize: EnemySize): number {
  switch (enemySize) {
    case 'large':
      return 200
    case 'medium':
      return 100
    case 'small':
    default:
      return 50
  }
}

/**
 * Calculate damage dealt to an enemy
 * @param baseDamage - Base damage from bullet/weapon
 * @param isRocket - Whether the projectile is a rocket (one-shots non-boss enemies)
 * @param currentHealth - Enemy's current health
 * @returns New health value after damage
 */
export function calculateEnemyDamage(
  baseDamage: number,
  isRocket: boolean,
  currentHealth: number
): number {
  if (isRocket) {
    // Bazooka one-shots any non-boss enemy
    return 0
  }
  return Math.max(0, currentHealth - baseDamage)
}

/**
 * Calculate damage dealt to player
 * @param currentHealth - Player's current health
 * @param damageAmount - Amount of damage to deal
 * @param hasShield - Whether player has an active shield
 * @returns Object with new health and whether shield was consumed
 */
export function calculatePlayerDamage(
  currentHealth: number,
  damageAmount: number,
  hasShield: boolean
): { newHealth: number; shieldConsumed: boolean; isDead: boolean } {
  if (hasShield) {
    return {
      newHealth: currentHealth,
      shieldConsumed: true,
      isDead: false
    }
  }
  
  const newHealth = Math.max(0, currentHealth - damageAmount)
  return {
    newHealth,
    shieldConsumed: false,
    isDead: newHealth <= 0
  }
}

/**
 * Check if player should trigger a stomp on an enemy
 * @param playerY - Player's Y position
 * @param playerVelocityY - Player's vertical velocity (positive = falling)
 * @param enemyY - Enemy's Y position
 * @param stompThreshold - Minimum velocity to trigger stomp (default: 50)
 * @returns true if stomp conditions are met
 */
export function shouldTriggerStomp(
  playerY: number,
  playerVelocityY: number,
  enemyY: number,
  stompThreshold: number = 50
): boolean {
  // Player must be above enemy and falling down
  const isAboveEnemy = playerY < enemyY
  const isFalling = playerVelocityY > stompThreshold
  
  return isAboveEnemy && isFalling
}

/**
 * Check if player is within invincibility window
 * @param lastHitTime - Timestamp of last hit
 * @param currentTime - Current timestamp
 * @param invincibilityDuration - Duration of invincibility in ms (default: 1000)
 * @returns true if player is still invincible
 */
export function isInvincible(
  lastHitTime: number,
  currentTime: number,
  invincibilityDuration: number = 1000
): boolean {
  return currentTime - lastHitTime < invincibilityDuration
}

/**
 * Calculate fragment spawn positions for stomp effect
 * @param playerX - Player's X position
 * @param playerY - Player's Y position
 * @param fragmentCount - Number of fragments to spawn
 * @returns Array of {x, y, angle} positions for fragments
 */
export function calculateStompFragmentPositions(
  playerX: number,
  playerY: number,
  fragmentCount: number = 8
): Array<{ x: number; y: number; angle: number }> {
  const positions: Array<{ x: number; y: number; angle: number }> = []
  
  for (let i = 0; i < fragmentCount; i++) {
    const angle = (Math.PI * 2 / fragmentCount) * i
    const distance = 50 + Math.random() * 30
    positions.push({
      x: playerX + Math.cos(angle) * distance,
      y: playerY + 20,
      angle
    })
  }
  
  return positions
}

/**
 * Calculate velocity for stomp fragment
 * @param angle - Angle in radians
 * @returns {velocityX, velocityY} for the fragment
 */
export function calculateFragmentVelocity(
  angle: number
): { velocityX: number; velocityY: number } {
  return {
    velocityX: Math.cos(angle) * (200 + Math.random() * 100),
    velocityY: -300 - Math.random() * 200
  }
}

/**
 * Calculate bounce direction for enemy knockback
 * @param enemyX - Enemy's X position
 * @param playerX - Player's X position
 * @returns 1 for right, -1 for left
 */
export function calculateBounceDirection(enemyX: number, playerX: number): 1 | -1 {
  return enemyX > playerX ? 1 : -1
}

/**
 * Calculate coin reward based on enemy type and modifiers
 * @param baseCoinReward - Base coin reward from enemy data
 * @param multiplier - Coin multiplier (e.g., from power-ups)
 * @returns Total coins to drop
 */
export function calculateCoinReward(baseCoinReward: number, multiplier: number = 1): number {
  return Math.floor(baseCoinReward * multiplier)
}

/**
 * Calculate enemy separation force
 * Used to prevent enemies from overlapping each other
 * @param enemy1X - First enemy X position
 * @param enemy1Y - First enemy Y position
 * @param enemy2X - Second enemy X position
 * @param enemy2Y - Second enemy Y position
 * @param minDistance - Minimum distance to maintain
 * @returns {pushX, pushY} force to apply, or null if no push needed
 */
export function calculateEnemySeparationForce(
  enemy1X: number,
  enemy1Y: number,
  enemy2X: number,
  enemy2Y: number,
  minDistance: number = 70
): { pushX: number; pushY: number } | null {
  const horizontalDistance = Math.abs(enemy1X - enemy2X)
  const verticalDistance = Math.abs(enemy1Y - enemy2Y)
  const distance = Math.sqrt(
    (enemy1X - enemy2X) ** 2 + (enemy1Y - enemy2Y) ** 2
  )
  
  if (horizontalDistance < minDistance && distance > 0) {
    const angle = Math.atan2(enemy1Y - enemy2Y, enemy1X - enemy2X)
    const force = 150
    return {
      pushX: Math.cos(angle) * force,
      pushY: 0 // Only horizontal push for now
    }
  }
  
  // Check for vertical stacking
  if (verticalDistance < 60 && horizontalDistance < 50) {
    const direction = enemy1X > enemy2X ? 1 : -1
    return {
      pushX: direction * 100,
      pushY: 0
    }
  }
  
  return null
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Linear interpolation between two values
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1)
}

/**
 * Calculate distance between two points
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Euclidean distance
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * Check if a point is within a rectangular area
 * @param pointX - Point X position
 * @param pointY - Point Y position
 * @param rectX - Rectangle X (top-left)
 * @param rectY - Rectangle Y (top-left)
 * @param rectWidth - Rectangle width
 * @param rectHeight - Rectangle height
 * @returns true if point is inside rectangle
 */
export function isPointInRect(
  pointX: number,
  pointY: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  return (
    pointX >= rectX &&
    pointX <= rectX + rectWidth &&
    pointY >= rectY &&
    pointY <= rectY + rectHeight
  )
}

/**
 * Check if two rectangles overlap
 * @param rect1 - First rectangle {x, y, width, height}
 * @param rect2 - Second rectangle {x, y, width, height}
 * @returns true if rectangles overlap
 */
export function doRectsOverlap(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Pick a random element from an array
 * @param array - Array to pick from
 * @returns Random element, or undefined if array is empty
 */
export function randomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Calculate player spawn position for respawn
 * @param checkpointX - Checkpoint X position (if any)
 * @param defaultX - Default spawn X
 * @param offsetX - X offset from checkpoint/default
 * @returns Spawn X position
 */
export function calculateRespawnX(
  checkpointX: number | null,
  defaultX: number,
  offsetX: number = 0
): number {
  return (checkpointX ?? defaultX) + offsetX
}

/**
 * Determine if level is complete based on player position
 * @param playerX - Player's current X position
 * @param goalX - Goal X position
 * @param bossActive - Whether a boss is currently active
 * @param bossHealth - Boss's current health (if boss is active)
 * @returns true if level is complete
 */
export function isLevelComplete(
  playerX: number,
  goalX: number,
  bossActive: boolean,
  bossHealth: number
): boolean {
  // If boss is active, must defeat it first
  if (bossActive && bossHealth > 0) {
    return false
  }
  
  return playerX >= goalX
}

/**
 * Calculate DQN reward for game state
 * @param params - Reward calculation parameters
 * @returns Calculated reward value
 */
export function calculateDQNReward(params: {
  progressDelta: number
  coinCollected: boolean
  enemyDefeated: boolean
  damageTaken: boolean
  playerDied: boolean
  levelComplete: boolean
  bossDefeated: boolean
}): number {
  let reward = 0
  
  // Progress reward (normalized)
  reward += params.progressDelta * 0.01
  
  // Positive rewards
  if (params.coinCollected) reward += 1
  if (params.enemyDefeated) reward += 5
  if (params.levelComplete) reward += 50
  if (params.bossDefeated) reward += 100
  
  // Negative rewards
  if (params.damageTaken) reward -= 10
  if (params.playerDied) reward -= 50
  
  return reward
}

/**
 * SeededRandom class for deterministic random number generation
 * Uses the mulberry32 algorithm
 */
export class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed
  }

  /**
   * Get the current state (useful for syncing)
   */
  getState(): number {
    return this.state
  }

  /**
   * Set the state (useful for syncing)
   */
  setState(state: number): void {
    this.state = state
  }

  /**
   * Generate a random number between 0 and 1
   * Uses mulberry32 algorithm for determinism
   */
  random(): number {
    this.state += 0x6D2B79F5
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  between(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  /**
   * Generate a random float between min and max
   */
  floatBetween(min: number, max: number): number {
    return this.random() * (max - min) + min
  }

  /**
   * Pick a random element from an array
   */
  pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined
    return array[this.between(0, array.length - 1)]
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   * Returns a new array, does not modify original
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.between(0, i)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}

/**
 * Calculate coin drop positions for deterministic spawning
 * Used in online mode to ensure both players see same coins
 * @param originX - Origin X position (where enemy died)
 * @param originY - Origin Y position (where enemy died)
 * @param count - Number of coins to drop
 * @param rng - Seeded random number generator
 * @returns Array of {x, y, delay} for each coin
 */
export function calculateCoinDropPositions(
  originX: number,
  originY: number,
  count: number,
  rng: SeededRandom
): Array<{ x: number; y: number; delay: number }> {
  const positions: Array<{ x: number; y: number; delay: number }> = []
  
  for (let i = 0; i < count; i++) {
    const xOffset = rng.between(-30, 30)
    const delay = i * 50 // Staggered drop
    
    positions.push({
      x: originX + xOffset,
      y: originY - 10, // Slightly above origin
      delay
    })
  }
  
  return positions
}

/**
 * Calculate spawn position for an enemy
 * @param areaStartX - Start X of spawn area
 * @param areaEndX - End X of spawn area
 * @param groundY - Ground Y level
 * @param isFlying - Whether enemy is a flying type
 * @param rng - Seeded random generator
 * @returns {x, y} spawn position
 */
export function calculateEnemySpawnPosition(
  areaStartX: number,
  areaEndX: number,
  groundY: number,
  isFlying: boolean,
  rng: SeededRandom
): { x: number; y: number } {
  const x = rng.between(areaStartX, areaEndX)
  const y = isFlying ? groundY - rng.between(100, 200) : groundY - 20
  
  return { x, y }
}

/**
 * Determine enemy type index based on weighted probability
 * @param weights - Array of weights for each enemy type
 * @param rng - Seeded random generator
 * @returns Index of selected enemy type
 */
export function selectWeightedEnemyType(
  weights: number[],
  rng: SeededRandom
): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = rng.floatBetween(0, totalWeight)
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return i
    }
  }
  
  return weights.length - 1
}

/**
 * Calculate power-up collection result
 * @param type - Type of power-up collected
 * @param currentHealth - Player's current health
 * @param maxHealth - Maximum health
 * @param currentLives - Current life count
 * @returns Updated values after collecting power-up
 */
export function calculatePowerUpEffect(
  type: 'speed' | 'shield' | 'health' | 'life',
  currentHealth: number,
  maxHealth: number = 100,
  currentLives: number = 3
): {
  newHealth: number
  newLives: number
  hasSpeedBoost: boolean
  hasShield: boolean
  boostDuration: number
} {
  const result = {
    newHealth: currentHealth,
    newLives: currentLives,
    hasSpeedBoost: false,
    hasShield: false,
    boostDuration: 0
  }

  switch (type) {
    case 'speed':
      result.hasSpeedBoost = true
      result.boostDuration = 10000 // 10 seconds
      break
    case 'shield':
      result.hasShield = true
      result.boostDuration = 15000 // 15 seconds
      break
    case 'health':
      result.newHealth = Math.min(maxHealth, currentHealth + 30)
      break
    case 'life':
      result.newLives = currentLives + 1
      break
  }

  return result
}

/**
 * Calculate respawn position considering checkpoints
 * @param checkpoints - Array of checkpoint positions
 * @param currentCheckpointIndex - Index of current checkpoint (-1 if none)
 * @param defaultSpawnX - Default spawn X if no checkpoint
 * @param defaultSpawnY - Default spawn Y
 * @returns Respawn position
 */
export function calculateRespawnPosition(
  checkpoints: Array<{ x: number }>,
  currentCheckpointIndex: number,
  defaultSpawnX: number,
  defaultSpawnY: number
): { x: number; y: number } {
  if (currentCheckpointIndex >= 0 && currentCheckpointIndex < checkpoints.length) {
    return {
      x: checkpoints[currentCheckpointIndex].x,
      y: defaultSpawnY
    }
  }

  return {
    x: defaultSpawnX,
    y: defaultSpawnY
  }
}

/**
 * Check if death conditions are met
 * @param health - Current health
 * @param y - Current Y position
 * @param deathY - Y position that causes instant death (falling off map)
 * @returns true if player should die
 */
export function shouldPlayerDie(
  health: number,
  y: number,
  deathY: number = 1000
): boolean {
  return health <= 0 || y > deathY
}

/**
 * Calculate game over conditions for online mode
 * @param player1Lives - Player 1 remaining lives
 * @param player2Lives - Player 2 remaining lives
 * @returns true if game over
 */
export function isOnlineGameOver(
  player1Lives: number,
  player2Lives: number
): boolean {
  return player1Lives <= 0 && player2Lives <= 0
}

/**
 * Calculate boss defeat rewards
 * @param bossIndex - Index/type of boss
 * @returns Reward values
 */
export function calculateBossDefeatRewards(bossIndex: number): {
  score: number
  coins: number
  isFinalBoss: boolean
} {
  // Boss at index 20 (level 21) is the final boss
  const isFinalBoss = bossIndex === 20

  return {
    score: 1000,
    coins: 100,
    isFinalBoss
  }
}
