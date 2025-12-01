/**
 * @fileoverview OnlineCoopService - WebSocket service for online multiplayer
 * 
 * Manages WebSocket connection to the game server for online co-op:
 * - Room creation and joining
 * - Player state synchronization
 * - Game action broadcasting
 * - Connection management and reconnection
 * 
 * @module services/OnlineCoopService
 */

/** Base URL for WebSocket connections */
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Player state for network synchronization
 */
export interface NetworkPlayerState {
  player_id: string
  player_name: string
  player_number: number
  x: number
  y: number
  velocity_x: number
  velocity_y: number
  health: number
  lives: number
  score: number
  skin: string
  weapon: string
  is_alive: boolean
  is_ready: boolean
  facing_right: boolean
  is_jumping: boolean
  is_shooting: boolean
}

/**
 * Room information from server
 */
export interface RoomInfo {
  room_id: string
  room_name: string
  host_id: string
  player_count: number
  max_players: number
  game_started: boolean
  players: {
    player_id: string
    player_name: string
    player_number: number
    is_ready: boolean
    skin: string
  }[]
}

/**
 * Game state from server
 */
export interface NetworkGameState {
  seed: number
  level: number
  game_mode: string
  // Sync data from server
  server_timestamp?: number  // Server's current time in ms
  game_start_timestamp?: number  // When game should start (scheduled)
  sequence_id?: number  // For message ordering
  players: Record<string, NetworkPlayerState>
  enemies: NetworkEnemyState[]
  coins: NetworkCoinState[]
  projectiles: any[]
  collected_coins?: string[]
  collected_powerups?: string[]
  chat_history?: any[]
}

/**
 * Enemy state for network synchronization
 */
export interface NetworkEnemyState {
  enemy_id: string
  enemy_type: string
  x: number
  y: number
  velocity_x: number
  velocity_y: number
  health: number
  max_health: number
  is_alive: boolean
  facing_right: boolean
  state: string  // idle, moving, attacking, dead
  scale?: number
  type?: string  // animation type (alias for enemy_type)
  coin_reward?: number
}

/**
 * Coin state for network synchronization
 */
export interface NetworkCoinState {
  coin_id: string
  x: number
  y: number
  is_collected: boolean
  collected_by: string | null
  value?: number
  velocity_x?: number
  velocity_y?: number
}

/**
 * WebSocket message types
 */
export type MessageType = 
  | 'room_created'
  | 'room_joined'
  | 'player_joined'
  | 'player_left'
  | 'player_disconnected'
  | 'player_reconnected'
  | 'player_ready_changed'
  | 'player_state_update'
  | 'game_action'
  | 'game_starting'
  | 'chat'
  | 'error'
  | 'room_left'
  | 'pong'
  | 'item_collected'
  | 'item_already_collected'
  | 'reconnected'
  | 'time_sync_response'
  | 'enemy_state_update'
  | 'enemy_spawned'
  | 'enemy_killed'
  | 'enemy_already_dead'
  | 'coin_spawned'
  | 'entities_sync'

/**
 * Event callbacks for WebSocket events
 */
export interface OnlineCoopCallbacks {
  onRoomCreated?: (roomId: string, playerId: string, roomInfo: RoomInfo) => void
  onRoomJoined?: (roomId: string, playerId: string, playerNumber: number, roomInfo: RoomInfo) => void
  onPlayerJoined?: (playerId: string, playerName: string, playerNumber: number, roomInfo: RoomInfo) => void
  onPlayerLeft?: (playerId: string, playerName: string, roomInfo: RoomInfo) => void
  onPlayerDisconnected?: (playerId: string, playerName: string, canReconnect: boolean, roomInfo: RoomInfo) => void
  onPlayerReconnected?: (playerId: string, playerName: string, roomInfo: RoomInfo) => void
  onPlayerReadyChanged?: (playerId: string, isReady: boolean, roomInfo: RoomInfo) => void
  onPlayerStateUpdate?: (playerId: string, state: Partial<NetworkPlayerState>) => void
  onGameAction?: (playerId: string, action: string, data: any) => void
  onGameStarting?: (gameState: NetworkGameState) => void
  onChat?: (playerId: string, playerName: string, message: string, timestamp?: string) => void
  onItemCollected?: (playerId: string, itemType: string, itemId: string, playerCoins?: number | null, playerScore?: number | null) => void
  onItemAlreadyCollected?: (itemId: string) => void
  onReconnected?: (gameState: NetworkGameState) => void
  onError?: (message: string) => void
  onDisconnect?: () => void
  onConnect?: () => void
  // Enemy sync callbacks
  onEnemyStateUpdate?: (enemyId: string, state: Partial<NetworkEnemyState>) => void
  onEnemySpawned?: (enemy: NetworkEnemyState) => void
  onEnemyKilled?: (enemyId: string, killedBy: string) => void
  onEnemyAlreadyDead?: (enemyId: string) => void
  // Coin sync callbacks
  onCoinSpawned?: (coin: NetworkCoinState) => void
  // Full entity sync callback
  onEntitiesSync?: (enemies: NetworkEnemyState[], coins: NetworkCoinState[], sequenceId: number) => void
}

/**
 * Singleton service for managing online multiplayer connections
 */
export class OnlineCoopService {
  private static instance: OnlineCoopService
  
  private ws: WebSocket | null = null
  private callbacks: OnlineCoopCallbacks = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pingInterval: number | null = null
  
  private _playerId: string | null = null
  private _playerNumber: number = 0
  private _roomId: string | null = null
  private _isHost: boolean = false
  private _isConnected: boolean = false
  private _roomInfo: RoomInfo | null = null
  private _reconnectToken: string | null = null
  private _playerName: string | null = null
  
  // Time synchronization - server is authoritative
  private _serverTimeOffset: number = 0  // Difference between server and client time
  private _lastSequenceId: number = 0  // Track message ordering
  private _timeSyncSamples: number[] = []  // RTT samples for averaging
  
  private constructor() {}
  
  static getInstance(): OnlineCoopService {
    if (!OnlineCoopService.instance) {
      OnlineCoopService.instance = new OnlineCoopService()
    }
    return OnlineCoopService.instance
  }
  
  // Getters for state
  get playerId(): string | null { return this._playerId }
  get playerNumber(): number { return this._playerNumber }
  get roomId(): string | null { return this._roomId }
  get isHost(): boolean { return this._isHost }
  get isConnected(): boolean { return this._isConnected }
  get roomInfo(): RoomInfo | null { return this._roomInfo }
  get reconnectToken(): string | null { return this._reconnectToken }
  get serverTimeOffset(): number { return this._serverTimeOffset }
  
  /**
   * Get estimated server time based on local clock + offset
   */
  getServerTime(): number {
    return Date.now() + this._serverTimeOffset
  }
  
  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: OnlineCoopCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }
  
  /**
   * Connect to the WebSocket server
   */
  private connect(roomId: string = 'new'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }
      
      const wsUrl = `${WS_BASE_URL}/ws/room/${roomId}`
      console.log(`[OnlineCoop] Connecting to ${wsUrl}`)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('[OnlineCoop] WebSocket connected')
        this._isConnected = true
        this.reconnectAttempts = 0
        this.startPingInterval()
        this.callbacks.onConnect?.()
        resolve()
      }
      
      this.ws.onclose = () => {
        console.log('[OnlineCoop] WebSocket disconnected')
        this._isConnected = false
        this.stopPingInterval()
        this.callbacks.onDisconnect?.()
        
        // Attempt reconnection if we were in a room
        if (this._roomId && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect()
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('[OnlineCoop] WebSocket error:', error)
        reject(error)
      }
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }
    })
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    const type = data.type as MessageType
    
    switch (type) {
      case 'room_created':
        this._roomId = data.room_id
        this._playerId = data.player_id
        this._playerNumber = data.player_number
        this._isHost = true
        this._roomInfo = data.room_info
        this.callbacks.onRoomCreated?.(data.room_id, data.player_id, data.room_info)
        break
        
      case 'room_joined':
        this._roomId = data.room_id
        this._playerId = data.player_id
        this._playerNumber = data.player_number
        this._isHost = false
        this._roomInfo = data.room_info
        this.callbacks.onRoomJoined?.(data.room_id, data.player_id, data.player_number, data.room_info)
        break
        
      case 'player_joined':
        this._roomInfo = data.room_info
        this.callbacks.onPlayerJoined?.(data.player_id, data.player_name, data.player_number, data.room_info)
        break
        
      case 'player_left':
        this._roomInfo = data.room_info
        this.callbacks.onPlayerLeft?.(data.player_id, data.player_name, data.room_info)
        break
        
      case 'player_ready_changed':
        this._roomInfo = data.room_info
        this.callbacks.onPlayerReadyChanged?.(data.player_id, data.is_ready, data.room_info)
        break
        
      case 'player_state_update':
        this.callbacks.onPlayerStateUpdate?.(data.player_id, data.state)
        break
        
      case 'game_action':
        this.callbacks.onGameAction?.(data.player_id, data.action, data.data)
        break
        
      case 'game_starting':
        this.callbacks.onGameStarting?.(data.game_state)
        break
        
      case 'chat':
        this.callbacks.onChat?.(data.player_id, data.player_name, data.message, data.timestamp)
        break
        
      case 'player_disconnected':
        this._roomInfo = data.room_info
        this.callbacks.onPlayerDisconnected?.(data.player_id, data.player_name, data.can_reconnect, data.room_info)
        break
        
      case 'player_reconnected':
        this._roomInfo = data.room_info
        this.callbacks.onPlayerReconnected?.(data.player_id, data.player_name, data.room_info)
        break
        
      case 'item_collected':
        this.callbacks.onItemCollected?.(data.player_id, data.item_type, data.item_id, data.player_coins ?? null, data.player_score ?? null)
        break
        
      case 'item_already_collected':
        this.callbacks.onItemAlreadyCollected?.(data.item_id)
        break
        
      case 'reconnected':
        this._roomId = data.room_id
        this._playerId = data.player_id
        this._playerNumber = data.player_number
        this._reconnectToken = null // Clear used token
        this.callbacks.onReconnected?.(data.game_state)
        break
      
      case 'time_sync_response':
        // NTP-style time sync calculation
        this.handleTimeSyncResponse(data.client_time, data.server_time, data.sequence_id)
        break
      
      // Enemy sync messages
      case 'enemy_state_update':
        this.callbacks.onEnemyStateUpdate?.(data.enemy_id, data.state)
        break
        
      case 'enemy_spawned':
        this.callbacks.onEnemySpawned?.(data.enemy)
        break
        
      case 'enemy_killed':
        this.callbacks.onEnemyKilled?.(data.enemy_id, data.killed_by)
        break
        
      case 'enemy_already_dead':
        this.callbacks.onEnemyAlreadyDead?.(data.enemy_id)
        break
      
      // Coin sync messages
      case 'coin_spawned':
        this.callbacks.onCoinSpawned?.(data.coin)
        break
      
      // Full entity sync
      case 'entities_sync':
        this.callbacks.onEntitiesSync?.(data.enemies, data.coins, data.sequence_id)
        break
        
      case 'error':
        console.error('[OnlineCoop] Server error:', data.message)
        this.callbacks.onError?.(data.message)
        break
        
      case 'room_left':
        this.resetState()
        break
        
      case 'pong':
        // Keep-alive response received
        break
    }
  }
  
  /**
   * Handle time sync response from server (NTP-style)
   */
  private handleTimeSyncResponse(clientTime: number, serverTime: number, sequenceId: number): void {
    const now = Date.now()
    const rtt = now - clientTime  // Round trip time
    const oneWayDelay = rtt / 2
    
    // Estimate server time at the moment we received this message
    const estimatedServerTime = serverTime + oneWayDelay
    
    // Calculate offset (positive means server is ahead)
    const offset = estimatedServerTime - now
    
    // Keep samples and average them for stability
    this._timeSyncSamples.push(offset)
    if (this._timeSyncSamples.length > 5) {
      this._timeSyncSamples.shift()
    }
    
    // Use median offset for robustness against outliers
    const sortedSamples = [...this._timeSyncSamples].sort((a, b) => a - b)
    this._serverTimeOffset = sortedSamples[Math.floor(sortedSamples.length / 2)]
    
    // Track sequence for ordering
    this._lastSequenceId = Math.max(this._lastSequenceId, sequenceId)
    
    console.log(`⏱️ Time sync: RTT=${rtt}ms, offset=${this._serverTimeOffset.toFixed(1)}ms, seq=${sequenceId}`)
  }
  
  /**
   * Request time synchronization from server
   */
  requestTimeSync(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'time_sync',
        client_time: Date.now()
      }))
    }
  }
  
  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval()
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000) // Ping every 30 seconds
  }
  
  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
  
  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++
    console.log(`[OnlineCoop] Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (this._roomId) {
        this.connect(this._roomId).catch(() => {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect()
          }
        })
      }
    }, this.reconnectDelay * this.reconnectAttempts)
  }
  
  /**
   * Send a message through WebSocket
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
  
  /**
   * Reset service state
   */
  private resetState(): void {
    this._playerId = null
    this._playerNumber = 0
    this._roomId = null
    this._isHost = false
    this._roomInfo = null
  }
  
  /**
   * Create a new game room
   */
  async createRoom(roomName: string, playerName: string): Promise<void> {
    this._playerName = playerName
    
    return new Promise(async (resolve, reject) => {
      try {
        await this.connect('new')
        
        // Set up one-time handlers for room creation response
        const originalOnRoomCreated = this.callbacks.onRoomCreated
        const originalOnError = this.callbacks.onError
        
        const timeout = setTimeout(() => {
          this.callbacks.onRoomCreated = originalOnRoomCreated
          this.callbacks.onError = originalOnError
          reject(new Error('Room creation timed out'))
        }, 10000)
        
        this.callbacks.onRoomCreated = (roomId, playerId, roomInfo) => {
          clearTimeout(timeout)
          this.callbacks.onRoomCreated = originalOnRoomCreated
          this.callbacks.onError = originalOnError
          originalOnRoomCreated?.(roomId, playerId, roomInfo)
          resolve()
        }
        
        this.callbacks.onError = (message) => {
          clearTimeout(timeout)
          this.callbacks.onRoomCreated = originalOnRoomCreated
          this.callbacks.onError = originalOnError
          originalOnError?.(message)
          reject(new Error(message))
        }
        
        this.send({
          type: 'create_room',
          room_name: roomName,
          player_name: playerName
        })
      } catch (error) {
        reject(error)
      }
    })
  }
  
  /**
   * Join an existing room
   */
  async joinRoom(roomId: string, playerName: string): Promise<void> {
    this._playerName = playerName
    await this.connect(roomId)
    
    this.send({
      type: 'join_room',
      room_id: roomId,
      player_name: playerName
    })
  }
  
  /**
   * Leave the current room
   */
  leaveRoom(): void {
    this.send({ type: 'leave_room' })
    this.disconnect()
  }
  
  /**
   * Toggle player ready status
   */
  setReady(isReady: boolean): void {
    this.send({
      type: 'player_ready',
      is_ready: isReady
    })
  }
  
  /**
   * Send player state update
   */
  sendPlayerState(state: Partial<NetworkPlayerState>): void {
    this.send({
      type: 'player_state',
      state
    })
  }
  
  /**
   * Send a game action
   */
  sendGameAction(action: string, data: any = {}): void {
    this.send({
      type: 'game_action',
      action,
      data
    })
  }
  
  /**
   * Request to start the game (host only)
   */
  startGame(): void {
    if (this._isHost) {
      this.send({ type: 'start_game' })
    }
  }
  
  /**
   * Send a chat message (works in both lobby and game)
   */
  sendChat(message: string): void {
    this.send({
      type: 'chat',
      message
    })
  }
  
  /**
   * Report item collection to server
   */
  collectItem(itemType: 'coin' | 'powerup', itemId: string): void {
    this.send({
      type: 'collect_item',
      item_type: itemType,
      item_id: itemId
    })
  }
  
  /**
   * Send enemy state update (host sends periodically)
   */
  sendEnemyState(enemyId: string, state: Partial<NetworkEnemyState>): void {
    this.send({
      type: 'enemy_state',
      enemy_id: enemyId,
      state
    })
  }
  
  /**
   * Report enemy spawn (host only)
   */
  spawnEnemy(enemy: NetworkEnemyState): void {
    if (this._isHost) {
      this.send({
        type: 'enemy_spawn',
        enemy
      })
    }
  }
  
  /**
   * Report enemy killed
   */
  killEnemy(enemyId: string): void {
    this.send({
      type: 'enemy_killed',
      enemy_id: enemyId
    })
  }
  
  /**
   * Report coin spawn (host only)
   */
  spawnCoin(coin: NetworkCoinState): void {
    if (this._isHost) {
      this.send({
        type: 'coin_spawn',
        coin
      })
    }
  }
  
  /**
   * Send full entity sync (host only, periodic)
   */
  syncEntities(enemies: NetworkEnemyState[], coins: NetworkCoinState[]): void {
    if (this._isHost) {
      this.send({
        type: 'sync_entities',
        enemies,
        coins
      })
    }
  }
  
  /**
   * Attempt to reconnect to a game session
   */
  async reconnect(roomId: string, playerId: string, token: string): Promise<void> {
    this._reconnectToken = token
    await this.connect(roomId)
    
    this.send({
      type: 'reconnect',
      room_id: roomId,
      player_id: playerId,
      token
    })
  }
  
  /**
   * Store reconnection info for later use
   */
  storeReconnectInfo(): { roomId: string, playerId: string, playerName: string } | null {
    if (this._roomId && this._playerId && this._playerName) {
      return {
        roomId: this._roomId,
        playerId: this._playerId,
        playerName: this._playerName
      }
    }
    return null
  }
  
  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.stopPingInterval()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.resetState()
    this._isConnected = false
  }
  
  /**
   * Get list of available rooms from REST API
   */
  static async getAvailableRooms(): Promise<RoomInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`)
      if (!response.ok) {
        throw new Error('Failed to fetch rooms')
      }
      return await response.json()
    } catch (error) {
      console.error('[OnlineCoop] Failed to fetch rooms:', error)
      return []
    }
  }
}

export default OnlineCoopService
