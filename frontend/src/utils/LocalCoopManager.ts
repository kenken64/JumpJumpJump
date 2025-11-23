/**
 * LocalCoopManager - Manages local cooperative multiplayer with dual gamepad support
 */

export interface PlayerState {
  playerNumber: 1 | 2
  gamepadIndex: number
  isReady: boolean
  isAlive: boolean
  health: number
  lives: number
  score: number
  skin: string
  weapon: string
}

export interface CoopSettings {
  isCoopMode: boolean
  player1: PlayerState
  player2: PlayerState
  sharedLives: boolean // If true, players share the same life pool
  friendlyFire: boolean // If true, players can damage each other
  respawnOnPartnerAlive: boolean // If true, dead player respawns when partner is alive
}

export class LocalCoopManager {
  private static instance: LocalCoopManager
  private settings: CoopSettings

  private constructor() {
    this.settings = this.getDefaultSettings()
  }

  static getInstance(): LocalCoopManager {
    if (!LocalCoopManager.instance) {
      LocalCoopManager.instance = new LocalCoopManager()
    }
    return LocalCoopManager.instance
  }

  private getDefaultSettings(): CoopSettings {
    return {
      isCoopMode: false,
      player1: {
        playerNumber: 1,
        gamepadIndex: 0,
        isReady: false,
        isAlive: true,
        health: 100,
        lives: 3,
        score: 0,
        skin: 'alienBeige',
        weapon: 'raygun'
      },
      player2: {
        playerNumber: 2,
        gamepadIndex: 1,
        isReady: false,
        isAlive: true,
        health: 100,
        lives: 3,
        score: 0,
        skin: 'alienBlue', // Different default skin for player 2
        weapon: 'raygun'
      },
      sharedLives: false,
      friendlyFire: false,
      respawnOnPartnerAlive: true
    }
  }

  enableCoopMode(): void {
    this.settings.isCoopMode = true
  }

  disableCoopMode(): void {
    this.settings.isCoopMode = false
    this.resetPlayers()
  }

  isCoopEnabled(): boolean {
    return this.settings.isCoopMode
  }

  getSettings(): CoopSettings {
    return this.settings
  }

  getPlayer1State(): PlayerState {
    return this.settings.player1
  }

  getPlayer2State(): PlayerState {
    return this.settings.player2
  }

  updatePlayerState(playerNumber: 1 | 2, updates: Partial<PlayerState>): void {
    if (playerNumber === 1) {
      this.settings.player1 = { ...this.settings.player1, ...updates }
    } else {
      this.settings.player2 = { ...this.settings.player2, ...updates }
    }
  }

  setPlayerReady(playerNumber: 1 | 2, ready: boolean): void {
    this.updatePlayerState(playerNumber, { isReady: ready })
  }

  areBothPlayersReady(): boolean {
    return this.settings.player1.isReady && this.settings.player2.isReady
  }

  resetPlayers(): void {
    const defaults = this.getDefaultSettings()
    this.settings.player1 = defaults.player1
    this.settings.player2 = defaults.player2
  }

  /**
   * Check if any player is still alive
   */
  isAnyPlayerAlive(): boolean {
    return this.settings.player1.isAlive || this.settings.player2.isAlive
  }

  /**
   * Check if both players are dead (game over condition)
   */
  areBothPlayersDead(): boolean {
    return !this.settings.player1.isAlive && !this.settings.player2.isAlive
  }

  /**
   * Get combined score from both players
   */
  getCombinedScore(): number {
    return this.settings.player1.score + this.settings.player2.score
  }

  /**
   * Get total lives remaining (for shared lives mode or combined)
   */
  getTotalLives(): number {
    if (this.settings.sharedLives) {
      // In shared lives, use player1's lives as the pool
      return this.settings.player1.lives
    }
    return this.settings.player1.lives + this.settings.player2.lives
  }

  /**
   * Detect gamepads and assign to players
   */
  static detectGamepads(scene: Phaser.Scene): { 
    player1Gamepad: Phaser.Input.Gamepad.Gamepad | null, 
    player2Gamepad: Phaser.Input.Gamepad.Gamepad | null 
  } {
    const gamepads = scene.input.gamepad?.gamepads || []
    
    return {
      player1Gamepad: gamepads.length > 0 ? gamepads[0] : null,
      player2Gamepad: gamepads.length > 1 ? gamepads[1] : null
    }
  }

  /**
   * Get player input from their assigned gamepad
   */
  static getPlayerInput(
    gamepad: Phaser.Input.Gamepad.Gamepad | null
  ): {
    moveX: number
    moveY: number
    jump: boolean
    shoot: boolean
    aimX: number
    aimY: number
  } {
    if (!gamepad) {
      return { moveX: 0, moveY: 0, jump: false, shoot: false, aimX: 0, aimY: 0 }
    }

    // Left stick for movement
    const leftStick = gamepad.leftStick
    const moveX = leftStick.x
    const moveY = leftStick.y

    // Right stick for aiming
    const rightStick = gamepad.rightStick
    const aimX = rightStick.x
    const aimY = rightStick.y

    // Buttons
    const jump = gamepad.A || false // A button for jump
    const shoot = gamepad.R2 > 0.5 || (gamepad.buttons[5] && gamepad.buttons[5].pressed) || false // RT or RB for shoot

    return { moveX, moveY, jump, shoot, aimX, aimY }
  }

  /**
   * Check if a gamepad button was just pressed (edge detection)
   */
  static wasButtonJustPressed(
    gamepad: Phaser.Input.Gamepad.Gamepad | null,
    buttonIndex: number
  ): boolean {
    if (!gamepad) return false
    const button = gamepad.buttons[buttonIndex]
    return button ? button.pressed && button.value === 1 : false
  }

  /**
   * Save coop settings to localStorage
   */
  saveSettings(): void {
    localStorage.setItem('coopSettings', JSON.stringify(this.settings))
  }

  /**
   * Load coop settings from localStorage
   */
  loadSettings(): void {
    const saved = localStorage.getItem('coopSettings')
    if (saved) {
      try {
        this.settings = JSON.parse(saved)
      } catch (e) {
        console.warn('Failed to load coop settings, using defaults')
        this.settings = this.getDefaultSettings()
      }
    }
  }
}
