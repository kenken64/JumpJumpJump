/**
 * GameTypes.ts
 * Centralized TypeScript interfaces and types for the game
 */

import Phaser from 'phaser'

// ==================== PLAYER TYPES ====================

export interface PlayerState {
  health: number
  maxHealth: number
  lives: number
  score: number
  coins: number
  isDead: boolean
  canDoubleJump: boolean
  hasDoubleJumped: boolean
  isStomping: boolean
  hasSpeedBoost: boolean
  hasShield: boolean
}

export interface PlayerConfig {
  spawnX: number
  spawnY: number
  speed: number
  jumpVelocity: number
  equippedSkin: string
  equippedWeapon: string
}

export interface PlayerInput {
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
  shoot: boolean
  aimX?: number
  aimY?: number
}

// ==================== ENEMY TYPES ====================

export type EnemySize = 'small' | 'medium' | 'large'
export type EnemyType = 'fly' | 'bee' | 'slimeGreen' | 'slimeBlue' | 'wormGreen' | 'wormPink'

export interface EnemyConfig {
  type: EnemyType
  size: EnemySize
  x: number
  y: number
  health: number
  maxHealth: number
  speed: number
  coinReward: number
  detectionRange: number
  scale: number
}

export interface EnemyState {
  health: number
  wanderDirection: number
  wanderTimer: number
  idleTimer: number
  isChasing: boolean
}

// ==================== BOSS TYPES ====================

export interface BossConfig {
  index: number
  name: string
  maxHealth: number
  attackCooldown: number
  x: number
  y: number
}

export interface BossState {
  health: number
  maxHealth: number
  phase: number
  lastAttack: number
  isActive: boolean
}

export interface BossData {
  boss_index: number
  boss_name: string
  notorious_title: string
  frame_x: number
  frame_y: number
}

// ==================== WEAPON TYPES ====================

export type WeaponType = 'raygun' | 'laserGun' | 'sword' | 'bazooka'

export interface WeaponConfig {
  type: WeaponType
  damage: number
  cooldown: number
  projectileSpeed: number
  projectileKey: string
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  raygun: {
    type: 'raygun',
    damage: 10,
    cooldown: 1000,
    projectileSpeed: 800,
    projectileKey: 'laserBlue'
  },
  laserGun: {
    type: 'laserGun',
    damage: 5,
    cooldown: 300,
    projectileSpeed: 1000,
    projectileKey: 'laserGreen'
  },
  sword: {
    type: 'sword',
    damage: 15,
    cooldown: 500,
    projectileSpeed: 700,
    projectileKey: 'sword'
  },
  bazooka: {
    type: 'bazooka',
    damage: 50,
    cooldown: 2000,
    projectileSpeed: 500,
    projectileKey: 'rocket'
  }
}

// ==================== POWER-UP TYPES ====================

export type PowerUpType = 'powerSpeed' | 'powerShield' | 'powerLife' | 'powerHealth'

export interface PowerUpConfig {
  type: PowerUpType
  duration?: number  // ms, undefined = permanent
  textureKey: string
  effect: string
  value?: number
}

export const POWERUP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  powerSpeed: {
    type: 'powerSpeed',
    duration: 10000,
    textureKey: 'powerSpeed',
    effect: '1.5x speed'
  },
  powerShield: {
    type: 'powerShield',
    duration: 15000,
    textureKey: 'powerShield',
    effect: 'Invincibility'
  },
  powerLife: {
    type: 'powerLife',
    duration: undefined,
    textureKey: 'powerLife',
    effect: '+1 life'
  },
  powerHealth: {
    type: 'powerHealth',
    duration: undefined,
    textureKey: 'powerHealth',
    effect: '+30 health',
    value: 30
  }
}

// ==================== WORLD GENERATION TYPES ====================

export type BiomeType = 'metal' | 'stone' | 'dirt'

export interface ChunkConfig {
  width: number
  minPlatforms: number
  maxPlatforms: number
  enemySpawnChance: number
  coinSpawnChance: number
  spikeSpawnChance: number
  powerUpSpawnChance: number
}

export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  width: 800,
  minPlatforms: 3,
  maxPlatforms: 5,
  enemySpawnChance: 0.2,
  coinSpawnChance: 0.4,
  spikeSpawnChance: 0.15,
  powerUpSpawnChance: 0.05
}

export interface PlatformData {
  x: number
  y: number
  width: number
  type: 'solid' | 'thin'
  biome: BiomeType
}

export interface SpikePosition {
  x: number
  y: number
  width: number
}

// ==================== GAME MODE TYPES ====================

export type GameMode = 'levels' | 'endless'

export interface GameConfig {
  mode: GameMode
  level: number
  levelLength: number
  isCoopMode: boolean
  isDQNTraining: boolean
}

export interface LevelTransitionData {
  gameMode: GameMode
  level: number
  lives: number
  score: number
  isRecording?: boolean
  mode?: 'coop'
  dqnTraining?: boolean
}

// ==================== UI TYPES ====================

export interface UIElements {
  healthBarBg: Phaser.GameObjects.Rectangle
  healthBarFill: Phaser.GameObjects.Rectangle
  livesText: Phaser.GameObjects.Text
  scoreText: Phaser.GameObjects.Text
  highScoreText: Phaser.GameObjects.Text
  coinText: Phaser.GameObjects.Text
  coinIcon: Phaser.GameObjects.Image
  levelText: Phaser.GameObjects.Text
  reloadBarBg: Phaser.GameObjects.Rectangle
  reloadBarFill: Phaser.GameObjects.Rectangle
}

export interface DebugUIElements {
  debugText: Phaser.GameObjects.Text | null
  fpsText: Phaser.GameObjects.Text | null
  coordText: Phaser.GameObjects.Text | null
}

// ==================== AI TYPES ====================

export interface AIDecision {
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
  shoot: boolean
  aimX?: number
  aimY?: number
}

export interface DQNStateData {
  playerX: number
  playerY: number
  velocityX: number
  velocityY: number
  onGround: boolean
  nearestPlatformDistance: number
  nearestPlatformHeight: number
  nearestEnemyDistance: number
  nearestSpikeDistance: number
  hasGroundAhead: boolean
  gapAhead: boolean
  bossActive: boolean
  bossDistance: number
  bossHealth: number
}

export interface DQNActionData {
  actionIndex: number
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
  shoot: boolean
}

// ==================== EVENT TYPES ====================

export const GAME_EVENTS = {
  // Player events
  PLAYER_DAMAGED: 'player-damaged',
  PLAYER_DIED: 'player-died',
  PLAYER_RESPAWNED: 'player-respawned',
  PLAYER_HEALED: 'player-healed',
  REQUEST_PLAYER_POSITION: 'request-player-position',
  
  // Enemy events
  ENEMY_KILLED: 'enemy-killed',
  ENEMY_SPAWNED: 'enemy-spawned',
  
  // Boss events
  BOSS_SPAWNED: 'boss-spawned',
  BOSS_DEFEATED: 'boss-defeated',
  BOSS_DAMAGED: 'boss-damaged',
  EXPLOSION_CREATED: 'explosion-created',
  
  // Collectibles
  COIN_COLLECTED: 'coin-collected',
  POWERUP_COLLECTED: 'powerup-collected',
  
  // Power-up states
  SPEED_BOOST_START: 'speed-boost-start',
  SPEED_BOOST_END: 'speed-boost-end',
  SHIELD_START: 'shield-start',
  SHIELD_END: 'shield-end',
  HEALTH_RESTORED: 'health-restored',
  EXTRA_LIFE_GAINED: 'extra-life-gained',
  
  // Game state
  LEVEL_COMPLETE: 'level-complete',
  GAME_OVER: 'game-over',
  CHECKPOINT_REACHED: 'checkpoint-reached',
  SCORE_UPDATED: 'score-updated',
  
  // UI events
  SHOW_TIP: 'show-tip',
  UPDATE_UI: 'update-ui'
} as const

export type GameEventType = typeof GAME_EVENTS[keyof typeof GAME_EVENTS]

// ==================== SCORE TYPES ====================

export interface ScoreSubmission {
  player_name: string
  score: number
  coins: number
  enemies_defeated: number
  distance: number
  level: number
  game_mode: GameMode
}

export interface LeaderboardEntry {
  id: number
  player_name: string
  score: number
  coins: number
  enemies_defeated: number
  distance: number
  level: number
  game_mode: GameMode
  created_at: string
}

// ==================== COLLISION MASKS ====================

export const COLLISION_CATEGORIES = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  BULLET: 0x0004,
  PLATFORM: 0x0008,
  COIN: 0x0010,
  SPIKE: 0x0020,
  POWERUP: 0x0040,
  BOSS: 0x0080
}
