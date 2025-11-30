/**
 * @fileoverview OnlineLobbyScene - Online multiplayer lobby for room management
 * 
 * Features:
 * - Create new game rooms
 * - Join existing rooms by code
 * - Browse available rooms
 * - Player ready status
 * - Chat functionality
 * - Game launch when both players ready
 * 
 * @module scenes/OnlineLobbyScene
 */

import Phaser from 'phaser'
import { OnlineCoopService, RoomInfo, NetworkGameState } from '../services/OnlineCoopService'

/**
 * Lobby scene for setting up online 2-player co-op games
 * @extends Phaser.Scene
 */
export default class OnlineLobbyScene extends Phaser.Scene {
  private onlineService: OnlineCoopService
  private currentView: 'main' | 'create' | 'join' | 'browse' | 'waiting' = 'main'
  
  // UI Elements
  private titleText?: Phaser.GameObjects.Text
  private statusText?: Phaser.GameObjects.Text
  private roomCodeText?: Phaser.GameObjects.Text
  private player1Container?: Phaser.GameObjects.Container
  private player2Container?: Phaser.GameObjects.Container
  private startButton?: Phaser.GameObjects.Container
  private chatContainer?: Phaser.GameObjects.Container
  private chatMessages: Phaser.GameObjects.Text[] = []
  private roomListContainer?: Phaser.GameObjects.Container
  
  // Input elements (DOM)
  private roomNameInput?: HTMLInputElement
  private roomCodeInput?: HTMLInputElement
  private chatInput?: HTMLInputElement
  
  // State
  private isReady: boolean = false
  private roomInfo: RoomInfo | null = null

  constructor() {
    super('OnlineLobbyScene')
    this.onlineService = OnlineCoopService.getInstance()
  }

  create() {
    // Set background
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.createBlackholeBackground()
    
    // Setup callbacks
    this.setupCallbacks()
    
    // Show main menu
    this.showMainMenu()
  }

  private setupCallbacks(): void {
    this.onlineService.setCallbacks({
      onRoomCreated: (roomId, _playerId, roomInfo) => {
        console.log('Room created:', roomId)
        this.roomInfo = roomInfo
        this.showWaitingRoom()
        // Start time sync for tight synchronization
        this.startTimeSync()
      },
      
      onRoomJoined: (roomId, _playerId, playerNumber, roomInfo) => {
        console.log('Joined room:', roomId, 'as player', playerNumber)
        this.roomInfo = roomInfo
        this.showWaitingRoom()
        // Start time sync for tight synchronization
        this.startTimeSync()
      },
      
      onPlayerJoined: (_playerId, playerName, _playerNumber, roomInfo) => {
        console.log('Player joined:', playerName)
        this.roomInfo = roomInfo
        this.updateWaitingRoom()
        this.addChatMessage(`${playerName} joined the room`)
      },
      
      onPlayerLeft: (_playerId, playerName, roomInfo) => {
        console.log('Player left:', playerName)
        this.roomInfo = roomInfo
        this.updateWaitingRoom()
        this.addChatMessage(`${playerName} left the room`)
      },
      
      onPlayerReadyChanged: (playerId, isReady, roomInfo) => {
        this.roomInfo = roomInfo
        this.updateWaitingRoom()
        const player = roomInfo.players.find(p => p.player_id === playerId)
        if (player) {
          this.addChatMessage(`${player.player_name} is ${isReady ? 'ready' : 'not ready'}`)
        }
      },
      
      onGameStarting: (gameState: NetworkGameState) => {
        console.log('🎮 Game starting with state:', gameState)
        console.log('🌱 World seed from server:', gameState.seed)
        console.log('⏱️ Server timestamp:', gameState.server_timestamp)
        console.log('🚀 Game start scheduled at:', gameState.game_start_timestamp)
        console.log('📊 Sequence ID:', gameState.sequence_id)
        
        // Calculate delay until scheduled start time
        const serverTimeOffset = this.onlineService.serverTimeOffset
        const localNow = Date.now()
        const estimatedServerNow = localNow + serverTimeOffset
        const startTime = gameState.game_start_timestamp || estimatedServerNow
        const delayMs = Math.max(0, startTime - estimatedServerNow)
        
        console.log(`⏳ Starting game in ${delayMs}ms (synchronized)`)
        
        this.cleanupInputs()
        
        // Schedule game start at the exact synchronized time
        if (delayMs > 0) {
          this.time.delayedCall(delayMs, () => {
            console.log('🎯 Game starting NOW (synchronized)')
            this.scene.start('GameScene', {
              mode: 'online_coop',
              gameState: gameState,
              playerNumber: this.onlineService.playerNumber,
              playerId: this.onlineService.playerId
            })
          })
        } else {
          // Start immediately if already past scheduled time
          this.scene.start('GameScene', {
            mode: 'online_coop',
            gameState: gameState,
            playerNumber: this.onlineService.playerNumber,
            playerId: this.onlineService.playerId
          })
        }
      },
      
      onChat: (_playerId, playerName, message) => {
        this.addChatMessage(`${playerName}: ${message}`)
      },
      
      onError: (message) => {
        this.showError(message)
      },
      
      onDisconnect: () => {
        if (this.currentView === 'waiting') {
          this.showError('Disconnected from server')
          this.showMainMenu()
        }
      }
    })
  }

  private createBlackholeBackground(): void {
    // Dark gradient background
    const graphics = this.add.graphics()
    
    // Create multiple rings for blackhole effect
    for (let i = 10; i > 0; i--) {
      const alpha = 0.1 + (i * 0.03)
      const radius = i * 80
      graphics.fillStyle(0x1a0a2e, alpha)
      graphics.fillCircle(640, 360, radius)
    }
    
    // Add some stars
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1280
      const y = Math.random() * 720
      const size = Math.random() * 2 + 1
      const alpha = Math.random() * 0.5 + 0.2
      
      graphics.fillStyle(0xffffff, alpha)
      graphics.fillCircle(x, y, size)
    }
    
    // Swirling particles
    const particles = this.add.particles(640, 360, 'coin', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.1, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 3000,
      frequency: 200,
      blendMode: 'ADD'
    })
    particles.setDepth(-1)
  }

  private clearUI(): void {
    // Remove all children except background
    this.children.list
      .filter(child => (child as Phaser.GameObjects.Container).depth >= 0)
      .forEach(child => child.destroy())
    
    // Reset containers
    this.player1Container = undefined
    this.player2Container = undefined
    this.startButton = undefined
    this.chatContainer = undefined
    this.roomListContainer = undefined
    this.chatMessages = []
    
    // Stop time sync if running
    this.stopTimeSync()
  }
  
  // Time sync interval for clock synchronization
  private timeSyncInterval?: number
  
  /**
   * Start periodic time synchronization with server
   * This is NTP-style sync to ensure both clients have aligned clocks
   */
  private startTimeSync(): void {
    // Do initial sync immediately
    this.onlineService.requestTimeSync()
    
    // Then sync every 5 seconds to maintain accuracy
    this.timeSyncInterval = window.setInterval(() => {
      this.onlineService.requestTimeSync()
    }, 5000)
    
    console.log('⏱️ Time synchronization started')
  }
  
  /**
   * Stop time synchronization
   */
  private stopTimeSync(): void {
    if (this.timeSyncInterval) {
      clearInterval(this.timeSyncInterval)
      this.timeSyncInterval = undefined
    }
  }

  private showMainMenu(): void {
    this.currentView = 'main'
    this.clearUI()
    this.cleanupInputs()
    
    // Background panel
    const panel = this.add.rectangle(640, 360, 550, 550, 0x1a1a2e, 0.9)
    panel.setStrokeStyle(3, 0x00ffff)
    
    // Title without emoji (cleaner look)
    this.titleText = this.add.text(640, 110, 'ONLINE CO-OP', {
      fontSize: '48px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    })
    this.titleText.setOrigin(0.5)
    
    // Subtitle
    const subtitle = this.add.text(640, 165, 'Play with friends anywhere!', {
      fontSize: '20px',
      color: '#888888',
      fontStyle: 'italic'
    })
    subtitle.setOrigin(0.5)
    
    // Divider line
    this.add.rectangle(640, 200, 400, 2, 0x00ffff, 0.5)
    
    // Create Room Button
    this.createMenuButton(640, 270, 'CREATE ROOM', 0x00aa00, () => {
      this.showCreateRoom()
    })
    
    // Join by Code Button
    this.createMenuButton(640, 350, 'JOIN BY CODE', 0x0088aa, () => {
      this.showJoinRoom()
    })
    
    // Browse Rooms Button
    this.createMenuButton(640, 430, 'BROWSE ROOMS', 0xaa6600, () => {
      this.showBrowseRooms()
    })
    
    // Back Button
    this.createMenuButton(640, 530, 'BACK TO MENU', 0x444444, () => {
      this.cleanupInputs()
      this.scene.start('MenuScene')
    })
    
    // Connection status - moved up and made more visible
    this.statusText = this.add.text(640, 600, 'Connected', {
      fontSize: '18px',
      color: '#00ff00'
    })
    this.statusText.setOrigin(0.5)
  }

  private showCreateRoom(): void {
    this.currentView = 'create'
    this.clearUI()
    
    // Background panel
    const panel = this.add.rectangle(640, 360, 500, 450, 0x1a1a2e, 0.95)
    panel.setStrokeStyle(3, 0x00ff00)
    
    // Title
    this.add.text(640, 160, 'CREATE ROOM', {
      fontSize: '42px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)
    
    // Room name label
    this.add.text(640, 240, 'Room Name', {
      fontSize: '20px',
      color: '#aaaaaa'
    }).setOrigin(0.5)
    
    // Create DOM input for room name - position relative to canvas
    const canvas = this.game.canvas
    const canvasRect = canvas.getBoundingClientRect()
    const scaleX = canvasRect.width / 1280
    const scaleY = canvasRect.height / 720
    
    this.roomNameInput = document.createElement('input')
    this.roomNameInput.type = 'text'
    this.roomNameInput.placeholder = 'Enter room name...'
    this.roomNameInput.maxLength = 20
    this.roomNameInput.value = `${localStorage.getItem('player_name') || 'Player'}'s Room`
    this.roomNameInput.style.cssText = `
      position: absolute;
      left: ${canvasRect.left + (640 * scaleX)}px;
      top: ${canvasRect.top + (280 * scaleY)}px;
      transform: translateX(-50%);
      width: ${320 * scaleX}px;
      padding: ${12 * scaleY}px ${20 * scaleX}px;
      font-size: ${18 * scaleY}px;
      border: 2px solid #00ff00;
      border-radius: 8px;
      background: rgba(0, 20, 0, 0.9);
      color: #ffffff;
      text-align: center;
      outline: none;
      box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
    `
    document.body.appendChild(this.roomNameInput)
    this.roomNameInput.focus()
    
    // Create button
    this.createMenuButton(640, 400, 'CREATE ROOM', 0x00aa00, async () => {
      const roomName = this.roomNameInput?.value || 'Game Room'
      const playerName = localStorage.getItem('player_name') || 'Player'
      
      this.statusText?.setText('Creating room...')
      try {
        await this.onlineService.createRoom(roomName, playerName)
      } catch (error) {
        console.error('[OnlineLobby] Failed to create room:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to create room'
        this.showError(errorMessage)
      }
    })
    
    // Back button
    this.createMenuButton(640, 480, '← BACK', 0x444444, () => {
      this.showMainMenu()
    })
    
    // Status
    this.statusText = this.add.text(640, 550, '', {
      fontSize: '16px',
      color: '#ffff00'
    }).setOrigin(0.5)
  }

  private showJoinRoom(): void {
    this.currentView = 'join'
    this.clearUI()
    
    // Background panel
    const panel = this.add.rectangle(640, 360, 500, 450, 0x1a1a2e, 0.95)
    panel.setStrokeStyle(3, 0x00ffff)
    
    // Title
    this.add.text(640, 160, 'JOIN ROOM', {
      fontSize: '42px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)
    
    // Room code label
    this.add.text(640, 240, 'Enter Room Code', {
      fontSize: '20px',
      color: '#aaaaaa'
    }).setOrigin(0.5)
    
    // Create DOM input for room code - position relative to canvas
    const canvas = this.game.canvas
    const canvasRect = canvas.getBoundingClientRect()
    const scaleX = canvasRect.width / 1280
    const scaleY = canvasRect.height / 720
    
    this.roomCodeInput = document.createElement('input')
    this.roomCodeInput.type = 'text'
    this.roomCodeInput.placeholder = '••••••'
    this.roomCodeInput.maxLength = 6
    this.roomCodeInput.style.cssText = `
      position: absolute;
      left: ${canvasRect.left + (640 * scaleX)}px;
      top: ${canvasRect.top + (280 * scaleY)}px;
      transform: translateX(-50%);
      width: ${220 * scaleX}px;
      padding: ${15 * scaleY}px ${20 * scaleX}px;
      font-size: ${28 * scaleY}px;
      font-family: 'Courier New', monospace;
      letter-spacing: 10px;
      border: 2px solid #00ffff;
      border-radius: 8px;
      background: rgba(0, 20, 30, 0.9);
      color: #ffffff;
      text-align: center;
      text-transform: uppercase;
      outline: none;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
    `
    document.body.appendChild(this.roomCodeInput)
    this.roomCodeInput.focus()
    
    // Auto-uppercase input
    this.roomCodeInput.addEventListener('input', () => {
      if (this.roomCodeInput) {
        this.roomCodeInput.value = this.roomCodeInput.value.toUpperCase()
      }
    })
    
    // Join button
    this.createMenuButton(640, 400, 'JOIN ROOM', 0x0088aa, async () => {
      const roomCode = this.roomCodeInput?.value?.toUpperCase() || ''
      
      if (roomCode.length !== 6) {
        this.statusText?.setText('Please enter a 6-character room code')
        return
      }
      
      const playerName = localStorage.getItem('player_name') || 'Player'
      
      this.statusText?.setText('Joining room...')
      try {
        await this.onlineService.joinRoom(roomCode, playerName)
      } catch (error) {
        this.showError('Failed to join room')
      }
    })
    
    // Back button
    this.createMenuButton(640, 480, 'BACK', 0x444444, () => {
      this.showMainMenu()
    })
    
    // Status
    this.statusText = this.add.text(640, 550, '', {
      fontSize: '16px',
      color: '#ffff00'
    }).setOrigin(0.5)
  }

  private async showBrowseRooms(): Promise<void> {
    this.currentView = 'browse'
    this.clearUI()
    
    // Title
    this.add.text(640, 60, 'AVAILABLE ROOMS', {
      fontSize: '48px',
      color: '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5)
    
    // Loading text
    const loadingText = this.add.text(640, 300, 'Loading rooms...', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5)
    
    // Fetch rooms
    const allRooms = await OnlineCoopService.getAvailableRooms()
    loadingText.destroy()
    
    // Filter out full rooms (client-side safety check - server should already filter)
    const rooms = allRooms.filter(room => room.player_count < room.max_players && !room.game_started)
    
    if (rooms.length === 0) {
      this.add.text(640, 300, 'No rooms available\n\nCreate one or wait for others!', {
        fontSize: '24px',
        color: '#888888',
        align: 'center'
      }).setOrigin(0.5)
    } else {
      // Room list container
      this.roomListContainer = this.add.container(640, 300)
      
      rooms.slice(0, 5).forEach((room, index) => {
        const y = index * 80
        const isJoinable = room.player_count < room.max_players && !room.game_started
        
        // Room card background - green tint for joinable rooms
        const bg = this.add.rectangle(0, y, 600, 70, isJoinable ? 0x2a3a2a : 0x3a2a2a, 0.8)
        bg.setStrokeStyle(2, isJoinable ? 0x00ff00 : 0xff4444)
        
        if (isJoinable) {
          bg.setInteractive({ useHandCursor: true })
        }
        
        // Room name
        const nameText = this.add.text(-280, y - 15, room.room_name, {
          fontSize: '22px',
          color: isJoinable ? '#ffffff' : '#888888',
          fontStyle: 'bold'
        })
        
        // Player count - show status
        const statusText = isJoinable ? `Players: ${room.player_count}/${room.max_players}` : 'FULL'
        const countText = this.add.text(-280, y + 10, statusText, {
          fontSize: '16px',
          color: isJoinable ? '#00ff00' : '#ff4444'
        })
        
        // Room code
        const codeText = this.add.text(200, y, room.room_id, {
          fontSize: '24px',
          color: isJoinable ? '#00ffff' : '#666666',
          fontFamily: 'monospace'
        })
        codeText.setOrigin(0.5)
        
        // Hover effects - only for joinable rooms
        if (isJoinable) {
          bg.on('pointerover', () => bg.setFillStyle(0x3a4a3a, 0.9))
          bg.on('pointerout', () => bg.setFillStyle(0x2a3a2a, 0.8))
          bg.on('pointerdown', async () => {
            const playerName = localStorage.getItem('player_name') || 'Player'
            try {
              await this.onlineService.joinRoom(room.room_id, playerName)
            } catch (error) {
              this.showError('Failed to join room')
            }
          })
        }
        
        this.roomListContainer?.add([bg, nameText, countText, codeText])
      })
    }
    
    // Refresh button
    this.createMenuButton(500, 580, 'REFRESH', 0x0088aa, () => {
      this.showBrowseRooms()
    }, 150)
    
    // Back button
    this.createMenuButton(780, 580, 'BACK', 0x666666, () => {
      this.showMainMenu()
    }, 150)
  }

  private showWaitingRoom(): void {
    this.currentView = 'waiting'
    this.clearUI()
    this.cleanupInputs()
    
    if (!this.roomInfo) return
    
    // Main panel background
    const mainPanel = this.add.rectangle(640, 360, 900, 600, 0x1a1a2e, 0.95)
    mainPanel.setStrokeStyle(3, 0x00ff00)
    
    // Room title
    this.add.text(640, 100, this.roomInfo.room_name, {
      fontSize: '32px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    // Room code display
    this.add.text(640, 140, 'Room Code:', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5)
    
    // Room code in a box
    const codeBox = this.add.rectangle(640, 175, 180, 45, 0x003333)
    codeBox.setStrokeStyle(2, 0x00ffff)
    
    this.roomCodeText = this.add.text(640, 175, this.roomInfo.room_id, {
      fontSize: '28px',
      color: '#00ffff',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    })
    this.roomCodeText.setOrigin(0.5)
    
    // Share hint
    this.add.text(640, 210, 'Share this code with your friend!', {
      fontSize: '12px',
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5)
    
    // Divider
    this.add.rectangle(640, 240, 800, 2, 0x444444)
    
    // Player containers - centered and side by side
    this.createPlayerIndicator(1, 400, 360)
    this.createPlayerIndicator(2, 880, 360)
    
    // Buttons at bottom center
    this.createReadyButton()
    
    if (this.onlineService.isHost) {
      this.createStartButton()
    }
    
    // Leave button - bottom left inside panel
    this.createMenuButton(280, 600, 'LEAVE ROOM', 0xaa0000, () => {
      this.onlineService.leaveRoom()
      this.showMainMenu()
    }, 160)
    
    // Update display
    this.updateWaitingRoom()
  }

  private createPlayerIndicator(playerNum: 1 | 2, x: number, y: number): void {
    const container = this.add.container(x, y)
    
    // Background
    const bg = this.add.rectangle(0, 0, 220, 180, 0x222233, 0.9)
    bg.setStrokeStyle(3, playerNum === 1 ? 0x00ff00 : 0x00ffff)
    container.add(bg)
    
    // Player label
    const label = this.add.text(0, -60, `PLAYER ${playerNum}`, {
      fontSize: '20px',
      color: playerNum === 1 ? '#00ff00' : '#00ffff',
      fontStyle: 'bold'
    })
    label.setOrigin(0.5)
    container.add(label)
    
    // Name placeholder
    const nameText = this.add.text(0, -20, 'Waiting...', {
      fontSize: '18px',
      color: '#666666'
    })
    nameText.setOrigin(0.5)
    nameText.setName('nameText')
    container.add(nameText)
    
    // Status text (host indicator)
    const statusText = this.add.text(0, 10, '', {
      fontSize: '14px',
      color: '#ffaa00'
    })
    statusText.setOrigin(0.5)
    statusText.setName('statusText')
    container.add(statusText)
    
    // Ready indicator
    const readyBg = this.add.rectangle(0, 50, 100, 30, 0x333333)
    readyBg.setName('readyBg')
    container.add(readyBg)
    
    const readyText = this.add.text(0, 50, 'NOT READY', {
      fontSize: '12px',
      color: '#ff4444',
      fontStyle: 'bold'
    })
    readyText.setOrigin(0.5)
    readyText.setName('readyText')
    container.add(readyText)
    
    if (playerNum === 1) {
      this.player1Container = container
    } else {
      this.player2Container = container
    }
  }

  private createReadyButton(): void {
    const container = this.add.container(640, 500)
    
    const bg = this.add.rectangle(0, 0, 180, 45, 0x666600)
    bg.setStrokeStyle(2, 0xffff00)
    bg.setInteractive({ useHandCursor: true })
    container.add(bg)
    
    const text = this.add.text(0, 0, 'READY UP', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    text.setOrigin(0.5)
    text.setName('readyText')
    container.add(text)
    
    bg.on('pointerover', () => bg.setFillStyle(0x888800))
    bg.on('pointerout', () => {
      bg.setFillStyle(this.isReady ? 0x008800 : 0x666600)
    })
    bg.on('pointerdown', () => {
      this.isReady = !this.isReady
      this.onlineService.setReady(this.isReady)
      
      const readyText = container.getByName('readyText') as Phaser.GameObjects.Text
      if (this.isReady) {
        bg.setFillStyle(0x008800)
        bg.setStrokeStyle(2, 0x00ff00)
        readyText.setText('READY!')
      } else {
        bg.setFillStyle(0x666600)
        bg.setStrokeStyle(2, 0xffff00)
        readyText.setText('READY UP')
      }
    })
  }

  private createStartButton(): void {
    const container = this.add.container(640, 560)
    
    const bg = this.add.rectangle(0, 0, 200, 50, 0x005500, 0.8)
    bg.setStrokeStyle(2, 0x00ff00)
    container.add(bg)
    
    const text = this.add.text(0, 0, 'START GAME', {
      fontSize: '22px',
      color: '#00ff00',
      fontStyle: 'bold'
    })
    text.setOrigin(0.5)
    container.add(text)
    
    // Initially disabled
    container.setAlpha(0.4)
    
    this.startButton = container
  }

  private addChatMessage(message: string): void {
    if (!this.chatContainer) return
    
    // Create new message
    const msgText = this.add.text(0, this.chatMessages.length * 22, message, {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 280 }
    })
    
    this.chatContainer.add(msgText)
    this.chatMessages.push(msgText)
    
    // Keep only last 10 messages
    while (this.chatMessages.length > 10) {
      const oldMsg = this.chatMessages.shift()
      oldMsg?.destroy()
    }
    
    // Reposition messages
    this.chatMessages.forEach((msg, idx) => {
      msg.setY(idx * 22)
    })
  }

  private updateWaitingRoom(): void {
    if (!this.roomInfo) return
    
    const players = this.roomInfo.players
    
    // Update player 1
    const p1 = players.find(p => p.player_number === 1)
    if (this.player1Container) {
      const nameText = this.player1Container.getByName('nameText') as Phaser.GameObjects.Text
      const statusText = this.player1Container.getByName('statusText') as Phaser.GameObjects.Text
      const readyBg = this.player1Container.getByName('readyBg') as Phaser.GameObjects.Rectangle
      const readyText = this.player1Container.getByName('readyText') as Phaser.GameObjects.Text
      
      if (p1) {
        nameText.setText(p1.player_name)
        nameText.setColor('#ffffff')
        statusText.setText(p1.player_id === this.roomInfo.host_id ? '👑 HOST' : '')
        
        if (p1.is_ready) {
          readyBg.setFillStyle(0x00aa00)
          readyText.setText('READY!')
          readyText.setColor('#00ff00')
        } else {
          readyBg.setFillStyle(0x333333)
          readyText.setText('NOT READY')
          readyText.setColor('#ff0000')
        }
      }
    }
    
    // Update player 2
    const p2 = players.find(p => p.player_number === 2)
    if (this.player2Container) {
      const nameText = this.player2Container.getByName('nameText') as Phaser.GameObjects.Text
      const statusText = this.player2Container.getByName('statusText') as Phaser.GameObjects.Text
      const readyBg = this.player2Container.getByName('readyBg') as Phaser.GameObjects.Rectangle
      const readyText = this.player2Container.getByName('readyText') as Phaser.GameObjects.Text
      
      if (p2) {
        nameText.setText(p2.player_name)
        nameText.setColor('#ffffff')
        statusText.setText(p2.player_id === this.roomInfo.host_id ? '👑 HOST' : '')
        
        if (p2.is_ready) {
          readyBg.setFillStyle(0x00aa00)
          readyText.setText('READY!')
          readyText.setColor('#00ff00')
        } else {
          readyBg.setFillStyle(0x333333)
          readyText.setText('NOT READY')
          readyText.setColor('#ff0000')
        }
      } else {
        nameText.setText('Waiting...')
        nameText.setColor('#888888')
        statusText.setText('')
        readyBg.setFillStyle(0x333333)
        readyText.setText('NOT READY')
        readyText.setColor('#666666')
      }
    }
    
    // Update start button
    if (this.startButton && this.onlineService.isHost) {
      const allReady = players.every(p => p.is_ready)
      const enoughPlayers = players.length >= 2
      
      if (allReady && enoughPlayers) {
        this.startButton.setAlpha(1)
        const bg = this.startButton.getAt(0) as Phaser.GameObjects.Rectangle
        bg.setInteractive({ useHandCursor: true })
        bg.off('pointerdown')
        bg.on('pointerdown', () => {
          this.onlineService.startGame()
        })
        bg.on('pointerover', () => bg.setFillStyle(0x00aa00))
        bg.on('pointerout', () => bg.setFillStyle(0x006600))
      } else {
        this.startButton.setAlpha(0.5)
        const bg = this.startButton.getAt(0) as Phaser.GameObjects.Rectangle
        bg.disableInteractive()
      }
    }
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
    width: number = 320
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    const bg = this.add.rectangle(0, 0, width, 55, color)
    bg.setStrokeStyle(2, 0xffffff)
    bg.setInteractive({ useHandCursor: true })
    container.add(bg)
    
    const text = this.add.text(0, 0, label, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    text.setOrigin(0.5)
    container.add(text)
    
    bg.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.GetColor(
        Math.min(255, ((color >> 16) & 0xff) + 40),
        Math.min(255, ((color >> 8) & 0xff) + 40),
        Math.min(255, (color & 0xff) + 40)
      ))
      bg.setScale(1.02)
    })
    bg.on('pointerout', () => {
      bg.setFillStyle(color)
      bg.setScale(1)
    })
    bg.on('pointerdown', onClick)
    
    return container
  }

  private showError(message: string): void {
    // Create error popup
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7)
    overlay.setInteractive()
    overlay.setDepth(100)
    
    const popup = this.add.container(640, 360)
    popup.setDepth(101)
    
    const bg = this.add.rectangle(0, 0, 400, 200, 0x330000)
    bg.setStrokeStyle(3, 0xff0000)
    popup.add(bg)
    
    const title = this.add.text(0, -60, 'ERROR', {
      fontSize: '32px',
      color: '#ff0000',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    popup.add(title)
    
    const msgText = this.add.text(0, 0, message, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 350 }
    })
    msgText.setOrigin(0.5)
    popup.add(msgText)
    
    const okBtn = this.add.rectangle(0, 60, 100, 40, 0xcc0000)
    okBtn.setInteractive({ useHandCursor: true })
    okBtn.on('pointerdown', () => {
      overlay.destroy()
      popup.destroy()
    })
    popup.add(okBtn)
    
    const okText = this.add.text(0, 60, 'OK', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    okText.setOrigin(0.5)
    popup.add(okText)
  }

  private cleanupInputs(): void {
    if (this.roomNameInput) {
      this.roomNameInput.remove()
      this.roomNameInput = undefined
    }
    if (this.roomCodeInput) {
      this.roomCodeInput.remove()
      this.roomCodeInput = undefined
    }
    if (this.chatInput) {
      this.chatInput.remove()
      this.chatInput = undefined
    }
  }

  shutdown(): void {
    this.cleanupInputs()
    this.onlineService.disconnect()
  }
}
