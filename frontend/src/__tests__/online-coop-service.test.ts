import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { OnlineCoopService, RoomInfo, NetworkGameState } from '../services/OnlineCoopService'

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState: number
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((error: any) => void) | null = null
  onmessage: ((event: any) => void) | null = null
  send: Mock = vi.fn()
  close: Mock = vi.fn()

  static OPEN = 1
  static CLOSED = 3

  constructor(url: string) {
    this.url = url
    this.readyState = MockWebSocket.OPEN // Default to open for easier testing, or manage manually
  }
}

// Mock global fetch
global.fetch = vi.fn()

describe('OnlineCoopService', () => {
  let service: OnlineCoopService
  let mockWs: MockWebSocket

  beforeEach(() => {
    // Reset Singleton instance
    // @ts-ignore
    OnlineCoopService.instance = undefined
    
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup WebSocket mock
    // @ts-ignore
    global.WebSocket = MockWebSocket
    
    service = OnlineCoopService.getInstance()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OnlineCoopService.getInstance()
      const instance2 = OnlineCoopService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Connection Management', () => {
    it('should connect to WebSocket', async () => {
      const connectPromise = (service as any).connect('test-room')
      
      // Get the created WebSocket instance
      mockWs = (service as any).ws
      expect(mockWs).toBeDefined()
      expect(mockWs.url).toContain('/ws/room/test-room')
      
      // Simulate connection open
      mockWs.onopen?.()
      
      await connectPromise
      expect(service.isConnected).toBe(true)
    })

    it('should handle connection error', async () => {
      const connectPromise = (service as any).connect('test-room')
      mockWs = (service as any).ws
      
      const error = new Error('Connection failed')
      mockWs.onerror?.(error)
      
      await expect(connectPromise).rejects.toThrow()
    })

    it('should handle disconnection', async () => {
      const connectPromise = (service as any).connect('test-room')
      mockWs = (service as any).ws
      mockWs.onopen?.()
      await connectPromise
      
      const onDisconnectSpy = vi.fn()
      service.setCallbacks({ onDisconnect: onDisconnectSpy })
      
      mockWs.onclose?.()
      
      expect(service.isConnected).toBe(false)
      expect(onDisconnectSpy).toHaveBeenCalled()
    })

    it('should attempt reconnect on unexpected disconnect', () => {
      vi.useFakeTimers()
      
      // Setup initial state
      // @ts-ignore
      service._roomId = 'test-room'
      // @ts-ignore
      service.connect('test-room')
      mockWs = (service as any).ws
      mockWs.onopen?.()
      
      // Spy on connect
      const connectSpy = vi.spyOn(service as any, 'connect')
      
      // Trigger disconnect
      mockWs.onclose?.()
      
      // Fast forward time
      vi.advanceTimersByTime(1000)
      
      expect(connectSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Room Management', () => {
    it('should create room successfully', async () => {
      const onRoomCreatedSpy = vi.fn()
      service.setCallbacks({ onRoomCreated: onRoomCreatedSpy })
      
      const createPromise = service.createRoom('My Room', 'Player1')
      
      // Wait for WebSocket to be assigned
      mockWs = (service as any).ws
      expect(mockWs).toBeDefined()
      
      // Trigger connection open
      mockWs.onopen?.()
      
      // Now we can check if message was sent (might need a small delay for promise chain)
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // Verify create_room message sent
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('create_room'))
      
      // Simulate server response
      const response = {
        type: 'room_created',
        room_id: 'room-123',
        player_id: 'p1',
        player_number: 1,
        room_info: { room_id: 'room-123', room_name: 'My Room' }
      }
      mockWs.onmessage?.({ data: JSON.stringify(response) })
      
      await createPromise
      
      expect(service.roomId).toBe('room-123')
      expect(service.isHost).toBe(true)
      expect(onRoomCreatedSpy).toHaveBeenCalled()
    })

    it('should handle create room timeout', async () => {
      vi.useFakeTimers()
      const createPromise = service.createRoom('My Room', 'Player1')
      
      mockWs = (service as any).ws
      mockWs.onopen?.()
      
      // Allow microtasks to run
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      
      // Fast forward past timeout
      vi.advanceTimersByTime(11000)
      
      await expect(createPromise).rejects.toThrow('Room creation timed out')
    })

    it('should handle create room error', async () => {
      const createPromise = service.createRoom('My Room', 'Player1')
      
      mockWs = (service as any).ws
      mockWs.onopen?.()
      
      // Simulate error response
      const response = {
        type: 'error',
        message: 'Room name taken'
      }
      
      // Wait a tick for listeners to be attached
      await new Promise(resolve => setTimeout(resolve, 0))
      
      mockWs.onmessage?.({ data: JSON.stringify(response) })
      
      await expect(createPromise).rejects.toThrow('Room name taken')
    })

    it('should join room successfully', async () => {
      const joinPromise = service.joinRoom('room-123', 'Player2')
      
      mockWs = (service as any).ws
      mockWs.onopen?.()
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('join_room'))
      
      await joinPromise
    })

    it('should leave room', async () => {
      const connectPromise = (service as any).connect('room-123')
      mockWs = (service as any).ws
      mockWs.onopen?.()
      await connectPromise
      
      service.leaveRoom()
      
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: 'leave_room' }))
      expect(mockWs.close).toHaveBeenCalled()
      expect(service.isConnected).toBe(false)
    })
  })

  describe('Game State & Actions', () => {
    beforeEach(async () => {
      const connectPromise = (service as any).connect('room-123')
      mockWs = (service as any).ws
      mockWs.onopen?.()
      await connectPromise
    })

    it('should send player ready status', () => {
      service.setReady(true)
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'player_ready',
        is_ready: true
      }))
    })

    it('should send player state update', () => {
      const state = { x: 100, y: 200 }
      service.sendPlayerState(state)
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('player_state'))
    })

    it('should send game action', () => {
      service.sendGameAction('jump', { force: 10 })
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('game_action'))
    })

    it('should start game if host', () => {
      // @ts-ignore
      service._isHost = true
      service.startGame()
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: 'start_game' }))
    })

    it('should not start game if not host', () => {
      // @ts-ignore
      service._isHost = false
      service.startGame()
      expect(mockWs.send).not.toHaveBeenCalledWith(JSON.stringify({ type: 'start_game' }))
    })
  })

  describe('Message Handling', () => {
    beforeEach(async () => {
      const connectPromise = (service as any).connect('room-123')
      mockWs = (service as any).ws
      mockWs.onopen?.()
      await connectPromise
    })

    it('should handle player_joined', () => {
      const callback = vi.fn()
      service.setCallbacks({ onPlayerJoined: callback })
      
      const msg = {
        type: 'player_joined',
        player_id: 'p2',
        player_name: 'Player 2',
        player_number: 2,
        room_info: {}
      }
      mockWs.onmessage?.({ data: JSON.stringify(msg) })
      
      expect(callback).toHaveBeenCalledWith('p2', 'Player 2', 2, {})
    })

    it('should handle game_starting', () => {
      const callback = vi.fn()
      service.setCallbacks({ onGameStarting: callback })
      
      const msg = {
        type: 'game_starting',
        game_state: { level: 1 }
      }
      mockWs.onmessage?.({ data: JSON.stringify(msg) })
      
      expect(callback).toHaveBeenCalledWith({ level: 1 })
    })

    it('should handle error message', () => {
      const callback = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      service.setCallbacks({ onError: callback })
      
      const msg = {
        type: 'error',
        message: 'Something went wrong'
      }
      mockWs.onmessage?.({ data: JSON.stringify(msg) })
      
      expect(callback).toHaveBeenCalledWith('Something went wrong')
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Time Synchronization', () => {
    beforeEach(async () => {
      const connectPromise = (service as any).connect('room-123')
      mockWs = (service as any).ws
      mockWs.onopen?.()
      await connectPromise
    })

    it('should request time sync', () => {
      service.requestTimeSync()
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('time_sync'))
    })

    it('should handle time sync response', () => {
      const now = 1000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      
      // Simulate sending at 900ms, receiving at 1000ms (RTT = 100ms)
      // Server time at receipt was 2000ms
      // One way delay = 50ms
      // Estimated server time = 2000 + 50 = 2050ms
      // Offset = 2050 - 1000 = 1050ms
      
      const msg = {
        type: 'time_sync_response',
        client_time: 900,
        server_time: 2000,
        sequence_id: 1
      }
      
      mockWs.onmessage?.({ data: JSON.stringify(msg) })
      
      expect(service.serverTimeOffset).toBe(1050)
    })
  })

  describe('Static Methods', () => {
    it('should fetch available rooms', async () => {
      const mockRooms = [{ room_id: '1', room_name: 'Test Room' }]
      ;(global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => mockRooms
      })
      
      const rooms = await OnlineCoopService.getAvailableRooms()
      expect(rooms).toEqual(mockRooms)
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/rooms'))
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as Mock).mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const rooms = await OnlineCoopService.getAvailableRooms()
      expect(rooms).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Entity Synchronization', () => {
    beforeEach(async () => {
      const connectPromise = (service as any).connect('room-123')
      mockWs = (service as any).ws
      mockWs.onopen?.()
      await connectPromise
    })

    it('should send item collection', () => {
      service.collectItem('coin', 'c1')
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('collect_item'))
    })

    it('should send enemy state', () => {
      service.sendEnemyState('e1', { x: 100 })
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('enemy_state'))
    })

    it('should send enemy spawn if host', () => {
      // @ts-ignore
      service._isHost = true
      service.spawnEnemy({ enemy_id: 'e1' } as any)
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('enemy_spawn'))
    })

    it('should not send enemy spawn if not host', () => {
      // @ts-ignore
      service._isHost = false
      service.spawnEnemy({ enemy_id: 'e1' } as any)
      expect(mockWs.send).not.toHaveBeenCalledWith(expect.stringContaining('enemy_spawn'))
    })

    it('should send enemy kill', () => {
      service.killEnemy('e1')
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('enemy_killed'))
    })

    it('should send coin spawn if host', () => {
      // @ts-ignore
      service._isHost = true
      service.spawnCoin({ coin_id: 'c1' } as any)
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('coin_spawn'))
    })

    it('should send powerup spawn if host', () => {
      // @ts-ignore
      service._isHost = true
      service.spawnPowerUp({ powerup_id: 'p1' } as any)
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('powerup_spawn'))
    })

    it('should sync entities if host', () => {
      // @ts-ignore
      service._isHost = true
      service.syncEntities([], [])
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('sync_entities'))
    })
  })

  describe('Reconnection', () => {
    it('should handle reconnection', async () => {
      const reconnectPromise = service.reconnect('room-123', 'p1', 'token123')
      
      mockWs = (service as any).ws
      mockWs.onopen?.()
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('reconnect'))
      expect(service.reconnectToken).toBe('token123')
      
      await reconnectPromise
    })

    it('should store reconnect info', () => {
      // Setup state
      // @ts-ignore
      service._roomId = 'room-123'
      // @ts-ignore
      service._playerId = 'p1'
      // @ts-ignore
      service._playerName = 'Player1'
      
      const info = service.storeReconnectInfo()
      expect(info).toEqual({
        roomId: 'room-123',
        playerId: 'p1',
        playerName: 'Player1'
      })
    })

    it('should return null for reconnect info if state missing', () => {
      const info = service.storeReconnectInfo()
      expect(info).toBeNull()
    })
  })

  describe('Chat Functionality', () => {
    beforeEach(async () => {
      const connectPromise = (service as any).connect('room-123')
      mockWs = (service as any).ws
      mockWs.onopen?.()
      await connectPromise
    })

    it('should send chat message', () => {
      service.sendChat('Hello World')
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('chat'))
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('Hello World'))
    })

    it('should handle chat message reception', () => {
      const callback = vi.fn()
      service.setCallbacks({ onChat: callback })
      
      const msg = {
        type: 'chat',
        player_id: 'p1',
        player_name: 'Player 1',
        message: 'Hello from Player 1',
        timestamp: '12:00'
      }
      mockWs.onmessage?.({ data: JSON.stringify(msg) })
      
      expect(callback).toHaveBeenCalledWith('p1', 'Player 1', 'Hello from Player 1', '12:00')
    })
  })
})
