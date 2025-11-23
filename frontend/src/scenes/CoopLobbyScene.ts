import Phaser from 'phaser'
import { LocalCoopManager } from '../utils/LocalCoopManager'

export default class CoopLobbyScene extends Phaser.Scene {
  private coopManager: LocalCoopManager
  private player1Indicator?: Phaser.GameObjects.Container
  private player2Indicator?: Phaser.GameObjects.Container
  private player1Gamepad: Phaser.Input.Gamepad.Gamepad | null = null
  private player2Gamepad: Phaser.Input.Gamepad.Gamepad | null = null
  private startButton?: Phaser.GameObjects.Container
  private instructionsText?: Phaser.GameObjects.Text


  constructor() {
    super('CoopLobbyScene')
    this.coopManager = LocalCoopManager.getInstance()
  }

  create() {
    // Enable coop mode
    this.coopManager.enableCoopMode()
    this.coopManager.resetPlayers()

    // Set background
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.createBlackholeBackground()

    // Title
    const title = this.add.text(640, 80, 'LOCAL CO-OP LOBBY', {
      fontSize: '56px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    })
    title.setOrigin(0.5)

    // Instructions
    this.instructionsText = this.add.text(640, 160, 'Connect two gamepads and press A to join!', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'italic'
    })
    this.instructionsText.setOrigin(0.5)

    // Player 1 indicator
    this.createPlayerIndicator(1, 320, 350)

    // Player 2 indicator
    this.createPlayerIndicator(2, 960, 350)

    // Start button (hidden until both players ready)
    this.createStartButton()

    // Back button
    this.createBackButton()

    // Gamepad plugin is already initialized via game config
    // Just log if it's available

    // Initial gamepad check
    this.updateGamepadAssignments()

    // Listen for gamepad connections
    this.input.gamepad?.on('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
      console.log(`Gamepad ${pad.index} connected`)
      this.updateGamepadAssignments()
    })

    this.input.gamepad?.on('disconnected', (pad: Phaser.Input.Gamepad.Gamepad) => {
      console.log(`Gamepad ${pad.index} disconnected`)
      this.updateGamepadAssignments()
    })
  }

  private createBlackholeBackground(): void {
    // Create animated space background with stars
    const graphics = this.add.graphics()
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, 1280)
      const y = Phaser.Math.Between(0, 720)
      const alpha = Phaser.Math.FloatBetween(0.3, 1)
      graphics.fillStyle(0xffffff, alpha)
      graphics.fillCircle(x, y, 1)
    }
  }

  private createPlayerIndicator(playerNum: 1 | 2, x: number, y: number): void {
    const container = this.add.container(x, y)

    // Background box
    const bg = this.add.rectangle(0, 0, 400, 300, 0x333333, 0.8)
    bg.setStrokeStyle(4, playerNum === 1 ? 0x00ff00 : 0x00ffff)
    container.add(bg)

    // Player label
    const label = this.add.text(0, -120, `PLAYER ${playerNum}`, {
      fontSize: '32px',
      color: playerNum === 1 ? '#00ff00' : '#00ffff',
      fontStyle: 'bold'
    })
    label.setOrigin(0.5)
    container.add(label)

    // Status text
    const statusText = this.add.text(0, -60, 'WAITING...', {
      fontSize: '24px',
      color: '#888888'
    })
    statusText.setOrigin(0.5)
    statusText.setName('statusText')
    container.add(statusText)

    // Gamepad icon placeholder
    const gamepadText = this.add.text(0, 0, '🎮', {
      fontSize: '64px'
    })
    gamepadText.setOrigin(0.5)
    gamepadText.setAlpha(0.3)
    gamepadText.setName('gamepadIcon')
    container.add(gamepadText)

    // Ready indicator
    const readyText = this.add.text(0, 80, '', {
      fontSize: '28px',
      color: '#00ff00',
      fontStyle: 'bold'
    })
    readyText.setOrigin(0.5)
    readyText.setName('readyText')
    container.add(readyText)

    if (playerNum === 1) {
      this.player1Indicator = container
    } else {
      this.player2Indicator = container
    }
  }

  private createStartButton(): void {
    const container = this.add.container(640, 600)
    container.setAlpha(0) // Hidden initially
    container.setName('startButton')

    const bg = this.add.rectangle(0, 0, 300, 80, 0x00ff00, 0.9)
    bg.setStrokeStyle(4, 0xffffff)
    container.add(bg)

    const text = this.add.text(0, 0, 'START GAME', {
      fontSize: '32px',
      color: '#000000',
      fontStyle: 'bold'
    })
    text.setOrigin(0.5)
    container.add(text)

    container.setInteractive(
      new Phaser.Geom.Rectangle(-150, -40, 300, 80),
      Phaser.Geom.Rectangle.Contains
    )
    container.on('pointerover', () => {
      bg.setScale(1.05)
    })
    container.on('pointerout', () => {
      bg.setScale(1)
    })
    container.on('pointerdown', () => {
      this.startGame()
    })

    this.startButton = container
  }

  private createBackButton(): void {
    const container = this.add.container(120, 650)

    const bg = this.add.rectangle(0, 0, 200, 60, 0xff0000, 0.8)
    bg.setStrokeStyle(3, 0xffffff)
    container.add(bg)

    const text = this.add.text(0, 0, 'BACK', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    text.setOrigin(0.5)
    container.add(text)

    container.setInteractive(
      new Phaser.Geom.Rectangle(-100, -30, 200, 60),
      Phaser.Geom.Rectangle.Contains
    )
    container.on('pointerover', () => {
      bg.setScale(1.05)
    })
    container.on('pointerout', () => {
      bg.setScale(1)
    })
    container.on('pointerdown', () => {
      this.coopManager.disableCoopMode()
      this.scene.start('MenuScene')
    })


  }

  private updateGamepadAssignments(): void {
    const gamepads = this.input.gamepad?.gamepads || []

    // Filter out null gamepads and get only active ones
    const activeGamepads = gamepads.filter(gp => gp !== null && gp !== undefined)

    // Assign first two active gamepads to players
    this.player1Gamepad = activeGamepads.length > 0 ? activeGamepads[0] : null
    this.player2Gamepad = activeGamepads.length > 1 ? activeGamepads[1] : null

    // Update player 1 indicator
    if (this.player1Indicator) {
      const statusText = this.player1Indicator.getByName('statusText') as Phaser.GameObjects.Text
      const gamepadIcon = this.player1Indicator.getByName('gamepadIcon') as Phaser.GameObjects.Text

      if (this.player1Gamepad) {
        statusText.setText('CONNECTED')
        statusText.setColor('#00ff00')
        gamepadIcon.setAlpha(1)
        // Use actual gamepad index
        this.coopManager.updatePlayerState(1, { gamepadIndex: this.player1Gamepad.index })
      } else {
        statusText.setText('WAITING...')
        statusText.setColor('#888888')
        gamepadIcon.setAlpha(0.3)
        this.coopManager.setPlayerReady(1, false)
      }
    }

    // Update player 2 indicator
    if (this.player2Indicator) {
      const statusText = this.player2Indicator.getByName('statusText') as Phaser.GameObjects.Text
      const gamepadIcon = this.player2Indicator.getByName('gamepadIcon') as Phaser.GameObjects.Text

      if (this.player2Gamepad) {
        statusText.setText('CONNECTED')
        statusText.setColor('#00ffff')
        gamepadIcon.setAlpha(1)
        // Use actual gamepad index
        this.coopManager.updatePlayerState(2, { gamepadIndex: this.player2Gamepad.index })
      } else {
        statusText.setText('WAITING...')
        statusText.setColor('#888888')
        gamepadIcon.setAlpha(0.3)
        this.coopManager.setPlayerReady(2, false)
      }
    }

    this.updateStartButtonVisibility()
  }

  private updateStartButtonVisibility(): void {
    if (!this.startButton) return

    if (this.coopManager.areBothPlayersReady()) {
      this.startButton.setAlpha(1)
    } else {
      this.startButton.setAlpha(0)
    }
  }

  private startGame(): void {
    if (this.coopManager.areBothPlayersReady()) {
      // Start the game scene with coop mode enabled
      this.scene.start('GameScene', {
        mode: 'coop',
        level: 1
      })
    }
  }

  update(): void {
    // Poll for gamepad changes every frame (browser requires button press to activate)
    const gamepads = this.input.gamepad?.gamepads || []
    const activeGamepads = gamepads.filter(gp => gp !== null && gp !== undefined)

    // Check if gamepad count changed
    const currentP1 = activeGamepads.length > 0 ? activeGamepads[0] : null
    const currentP2 = activeGamepads.length > 1 ? activeGamepads[1] : null

    if (currentP1 !== this.player1Gamepad || currentP2 !== this.player2Gamepad) {
      console.log('🎮 Gamepad state changed, updating assignments...')
      this.updateGamepadAssignments()
    }

    // Check for gamepad input to mark players as ready
    if (this.player1Gamepad && !this.coopManager.getPlayer1State().isReady) {
      if (this.player1Gamepad.A) {
        this.coopManager.setPlayerReady(1, true)
        this.updatePlayerReadyStatus(1)
      }
    }

    if (this.player2Gamepad && !this.coopManager.getPlayer2State().isReady) {
      if (this.player2Gamepad.A) {
        this.coopManager.setPlayerReady(2, true)
        this.updatePlayerReadyStatus(2)
      }
    }

    // Check if both players pressed B to un-ready
    if (this.player1Gamepad && this.coopManager.getPlayer1State().isReady) {
      if (this.player1Gamepad.B) {
        this.coopManager.setPlayerReady(1, false)
        this.updatePlayerReadyStatus(1)
      }
    }

    if (this.player2Gamepad && this.coopManager.getPlayer2State().isReady) {
      if (this.player2Gamepad.B) {
        this.coopManager.setPlayerReady(2, false)
        this.updatePlayerReadyStatus(2)
      }
    }

    this.updateStartButtonVisibility()

    // Allow starting with Start button on any gamepad when both ready
    if (this.coopManager.areBothPlayersReady()) {
      if ((this.player1Gamepad && this.player1Gamepad.buttons[9]?.pressed) ||
        (this.player2Gamepad && this.player2Gamepad.buttons[9]?.pressed)) {
        this.startGame()
      }
    }
  }

  private updatePlayerReadyStatus(playerNum: 1 | 2): void {
    const indicator = playerNum === 1 ? this.player1Indicator : this.player2Indicator
    if (!indicator) return

    const readyText = indicator.getByName('readyText') as Phaser.GameObjects.Text
    const state = playerNum === 1 ? this.coopManager.getPlayer1State() : this.coopManager.getPlayer2State()

    if (state.isReady) {
      readyText.setText('READY!')
      readyText.setColor('#00ff00')
    } else {
      readyText.setText('Press A to Ready')
      readyText.setColor('#ffff00')
    }
  }
}
