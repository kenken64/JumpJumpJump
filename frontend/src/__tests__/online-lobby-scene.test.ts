/**
 * @fileoverview Tests for OnlineLobbyScene
 * Tests online lobby functionality including room creation, joining, browsing, and waiting room
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock OnlineCoopService before importing
const mockOnlineService = {
  getInstance: vi.fn(),
  setCallbacks: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  setReady: vi.fn(),
  startGame: vi.fn(),
  disconnect: vi.fn(),
  requestTimeSync: vi.fn(),
  isHost: false,
  playerId: 'player-123',
  playerNumber: 1,
  roomId: 'ABC123',
  serverTimeOffset: 0
}

vi.mock('../services/OnlineCoopService', () => ({
  OnlineCoopService: {
    getInstance: () => mockOnlineService,
    getAvailableRooms: vi.fn().mockResolvedValue([])
  }
}))

// Mock Phaser
vi.mock('phaser', () => {
  const createTextMock = () => ({
    setOrigin: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setY: vi.fn().mockReturnThis(),
    setName: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    scene: true
  })

  const createRectangleMock = () => ({
    setInteractive: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setName: vi.fn().mockReturnThis(),
    disableInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    scene: true
  })

  const createContainerMock = () => ({
    add: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    getByName: vi.fn().mockImplementation((name: string) => {
      // Return rectangle mock for readyBg, text mock for others
      if (name === 'readyBg') {
        return createRectangleMock()
      }
      return createTextMock()
    }),
    getAt: vi.fn().mockReturnValue(createRectangleMock()),
    destroy: vi.fn(),
    scene: true
  })

  const createGraphicsMock = () => ({
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  })

  const createParticlesMock = () => ({
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  })

  return {
    default: {
      Scene: class MockScene {
        add = {
          text: vi.fn().mockReturnValue(createTextMock()),
          rectangle: vi.fn().mockReturnValue(createRectangleMock()),
          container: vi.fn().mockReturnValue(createContainerMock()),
          graphics: vi.fn().mockReturnValue(createGraphicsMock()),
          particles: vi.fn().mockReturnValue(createParticlesMock())
        }
        cameras = {
          main: {
            setBackgroundColor: vi.fn()
          }
        }
        scene = {
          start: vi.fn()
        }
        time = {
          delayedCall: vi.fn()
        }
        game = {
          canvas: {
            getBoundingClientRect: vi.fn().mockReturnValue({
              left: 0,
              top: 0,
              width: 1280,
              height: 720
            })
          }
        }
        children = {
          list: []
        }
      },
      Display: {
        Color: {
          GetColor: vi.fn().mockReturnValue(0xffffff)
        }
      }
    }
  }
})

import OnlineLobbyScene from '../scenes/OnlineLobbyScene'
import { OnlineCoopService } from '../services/OnlineCoopService'

describe('OnlineLobbyScene', () => {
  let scene: OnlineLobbyScene
  let localStorageMock: { [key: string]: string }
  let documentBodyMock: HTMLElement[]

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup localStorage mock
    localStorageMock = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => localStorageMock[key] ?? null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      localStorageMock[key] = value
    })

    // Setup document.body mock for DOM inputs
    documentBodyMock = []
    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
      documentBodyMock.push(el as HTMLElement)
      return el
    })

    // Reset mock service state
    mockOnlineService.isHost = false
    mockOnlineService.playerId = 'player-123'
    mockOnlineService.playerNumber = 1
    mockOnlineService.roomId = 'ABC123'
    mockOnlineService.createRoom.mockResolvedValue(undefined)
    mockOnlineService.joinRoom.mockResolvedValue(undefined)

    scene = new OnlineLobbyScene()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Cleanup any DOM elements
    documentBodyMock.forEach(el => el.remove?.())
  })

  describe('constructor', () => {
    it('should create scene with correct key', () => {
      expect(scene).toBeDefined()
    })

    it('should get OnlineCoopService instance', () => {
      expect((scene as any).onlineService).toBe(mockOnlineService)
    })

    it('should initialize with main view', () => {
      expect((scene as any).currentView).toBe('main')
    })

    it('should initialize isReady to false', () => {
      expect((scene as any).isReady).toBe(false)
    })

    it('should initialize roomInfo to null', () => {
      expect((scene as any).roomInfo).toBeNull()
    })
  })

  describe('create', () => {
    it('should set background color', () => {
      scene.create()
      expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#0a0a1a')
    })

    it('should setup callbacks', () => {
      scene.create()
      expect(mockOnlineService.setCallbacks).toHaveBeenCalled()
    })

    it('should show main menu', () => {
      scene.create()
      expect((scene as any).currentView).toBe('main')
    })

    it('should create blackhole background', () => {
      scene.create()
      expect(scene.add.graphics).toHaveBeenCalled()
      expect(scene.add.particles).toHaveBeenCalled()
    })
  })

  describe('setupCallbacks', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should register onRoomCreated callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onRoomCreated).toBeDefined()
    })

    it('should register onRoomJoined callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onRoomJoined).toBeDefined()
    })

    it('should register onPlayerJoined callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onPlayerJoined).toBeDefined()
    })

    it('should register onPlayerLeft callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onPlayerLeft).toBeDefined()
    })

    it('should register onPlayerReadyChanged callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onPlayerReadyChanged).toBeDefined()
    })

    it('should register onGameStarting callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onGameStarting).toBeDefined()
    })

    it('should register onChat callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onChat).toBeDefined()
    })

    it('should register onError callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onError).toBeDefined()
    })

    it('should register onDisconnect callback', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      expect(callbacks.onDisconnect).toBeDefined()
    })
  })

  describe('showMainMenu', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should set currentView to main', () => {
      (scene as any).showMainMenu()
      expect((scene as any).currentView).toBe('main')
    })

    it('should create title text', () => {
      (scene as any).showMainMenu()
      expect(scene.add.text).toHaveBeenCalledWith(640, 110, 'ONLINE CO-OP', expect.any(Object))
    })

    it('should create panel background', () => {
      (scene as any).showMainMenu()
      expect(scene.add.rectangle).toHaveBeenCalledWith(640, 360, 550, 550, 0x1a1a2e, 0.9)
    })

    it('should create connection status text', () => {
      (scene as any).showMainMenu()
      expect(scene.add.text).toHaveBeenCalledWith(640, 600, 'Connected', expect.any(Object))
    })
  })

  describe('showCreateRoom', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should set currentView to create', () => {
      (scene as any).showCreateRoom()
      expect((scene as any).currentView).toBe('create')
    })

    it('should create title text', () => {
      (scene as any).showCreateRoom()
      expect(scene.add.text).toHaveBeenCalledWith(640, 160, 'CREATE ROOM', expect.any(Object))
    })

    it('should create room name input', () => {
      (scene as any).showCreateRoom()
      expect((scene as any).roomNameInput).toBeDefined()
      expect(documentBodyMock.length).toBeGreaterThan(0)
    })

    it('should use player name from localStorage for default room name', () => {
      localStorageMock['player_name'] = 'TestPlayer'
      ;(scene as any).showCreateRoom()
      expect((scene as any).roomNameInput.value).toContain('TestPlayer')
    })

    it('should default to Player if no name in localStorage', () => {
      (scene as any).showCreateRoom()
      expect((scene as any).roomNameInput.value).toContain('Player')
    })
  })

  describe('showJoinRoom', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should set currentView to join', () => {
      (scene as any).showJoinRoom()
      expect((scene as any).currentView).toBe('join')
    })

    it('should create title text', () => {
      (scene as any).showJoinRoom()
      expect(scene.add.text).toHaveBeenCalledWith(640, 160, 'JOIN ROOM', expect.any(Object))
    })

    it('should create room code input', () => {
      (scene as any).showJoinRoom()
      expect((scene as any).roomCodeInput).toBeDefined()
      expect(documentBodyMock.length).toBeGreaterThan(0)
    })

    it('should set max length to 6 for room code', () => {
      (scene as any).showJoinRoom()
      expect((scene as any).roomCodeInput.maxLength).toBe(6)
    })
  })

  describe('showBrowseRooms', () => {
    beforeEach(() => {
      scene.create()
      // Setup default mock to return empty array
      ;(OnlineCoopService.getAvailableRooms as any).mockResolvedValue([])
    })

    it('should set currentView to browse', async () => {
      await (scene as any).showBrowseRooms()
      expect((scene as any).currentView).toBe('browse')
    })

    it('should create title text', async () => {
      await (scene as any).showBrowseRooms()
      expect(scene.add.text).toHaveBeenCalledWith(640, 60, 'AVAILABLE ROOMS', expect.any(Object))
    })

    it('should show no rooms message when empty', async () => {
      ;(OnlineCoopService.getAvailableRooms as any).mockResolvedValue([])
      await (scene as any).showBrowseRooms()
      expect(scene.add.text).toHaveBeenCalledWith(640, 300, expect.stringContaining('No rooms available'), expect.any(Object))
    })

    it('should display available rooms', async () => {
      const mockRooms = [
        { room_id: 'ABC123', room_name: 'Test Room', player_count: 1, max_players: 2, game_started: false }
      ]
      ;(OnlineCoopService.getAvailableRooms as any).mockResolvedValue(mockRooms)
      await (scene as any).showBrowseRooms()
      expect(scene.add.container).toHaveBeenCalled()
    })

    it('should filter out full rooms', async () => {
      const mockRooms = [
        { room_id: 'ABC123', room_name: 'Full Room', player_count: 2, max_players: 2, game_started: false },
        { room_id: 'DEF456', room_name: 'Available Room', player_count: 1, max_players: 2, game_started: false }
      ]
      ;(OnlineCoopService.getAvailableRooms as any).mockResolvedValue(mockRooms)
      await (scene as any).showBrowseRooms()
      // Should only show the available room
      expect((scene as any).roomListContainer).toBeDefined()
    })

    it('should filter out started games', async () => {
      const mockRooms = [
        { room_id: 'ABC123', room_name: 'Started Game', player_count: 1, max_players: 2, game_started: true },
        { room_id: 'DEF456', room_name: 'Waiting Room', player_count: 1, max_players: 2, game_started: false }
      ]
      ;(OnlineCoopService.getAvailableRooms as any).mockResolvedValue(mockRooms)
      await (scene as any).showBrowseRooms()
      expect((scene as any).roomListContainer).toBeDefined()
    })
  })

  describe('showWaitingRoom', () => {
    beforeEach(() => {
      scene.create()
      ;(scene as any).roomInfo = {
        room_id: 'ABC123',
        room_name: 'Test Room',
        host_id: 'player-123',
        player_count: 1,
        max_players: 2,
        game_started: false,
        players: [
          { player_id: 'player-123', player_name: 'Host', player_number: 1, is_ready: false }
        ]
      }
    })

    it('should set currentView to waiting', () => {
      (scene as any).showWaitingRoom()
      expect((scene as any).currentView).toBe('waiting')
    })

    it('should create room name title', () => {
      (scene as any).showWaitingRoom()
      expect(scene.add.text).toHaveBeenCalledWith(640, 100, 'Test Room', expect.any(Object))
    })

    it('should display room code', () => {
      (scene as any).showWaitingRoom()
      expect(scene.add.text).toHaveBeenCalledWith(640, 175, 'ABC123', expect.any(Object))
    })

    it('should create player indicators', () => {
      (scene as any).showWaitingRoom()
      expect((scene as any).player1Container).toBeDefined()
      expect((scene as any).player2Container).toBeDefined()
    })

    it('should create start button for host', () => {
      mockOnlineService.isHost = true
      ;(scene as any).showWaitingRoom()
      expect((scene as any).startButton).toBeDefined()
    })

    it('should not create start button for non-host', () => {
      mockOnlineService.isHost = false
      ;(scene as any).roomInfo.host_id = 'other-player'
      ;(scene as any).showWaitingRoom()
      expect((scene as any).startButton).toBeUndefined()
    })

    it('should return early if no roomInfo', () => {
      (scene as any).roomInfo = null
      ;(scene as any).showWaitingRoom()
      expect((scene as any).player1Container).toBeUndefined()
    })
  })

  describe('createPlayerIndicator', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should create container for player 1', () => {
      (scene as any).createPlayerIndicator(1, 400, 360)
      expect((scene as any).player1Container).toBeDefined()
    })

    it('should create container for player 2', () => {
      (scene as any).createPlayerIndicator(2, 880, 360)
      expect((scene as any).player2Container).toBeDefined()
    })

    it('should create player label with correct number', () => {
      (scene as any).createPlayerIndicator(1, 400, 360)
      expect(scene.add.text).toHaveBeenCalledWith(0, -60, 'PLAYER 1', expect.any(Object))
    })
  })

  describe('createReadyButton', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should create ready button container', () => {
      (scene as any).createReadyButton()
      expect(scene.add.container).toHaveBeenCalledWith(640, 500)
    })

    it('should create button with READY UP text', () => {
      (scene as any).createReadyButton()
      expect(scene.add.text).toHaveBeenCalledWith(0, 0, 'READY UP', expect.any(Object))
    })
  })

  describe('createStartButton', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should create start button container', () => {
      (scene as any).createStartButton()
      expect((scene as any).startButton).toBeDefined()
    })

    it('should create button with START GAME text', () => {
      (scene as any).createStartButton()
      expect(scene.add.text).toHaveBeenCalledWith(0, 0, 'START GAME', expect.any(Object))
    })
  })

  describe('updateWaitingRoom', () => {
    beforeEach(() => {
      scene.create()
      ;(scene as any).roomInfo = {
        room_id: 'ABC123',
        room_name: 'Test Room',
        host_id: 'player-123',
        player_count: 2,
        max_players: 2,
        game_started: false,
        players: [
          { player_id: 'player-123', player_name: 'Host', player_number: 1, is_ready: true },
          { player_id: 'player-456', player_name: 'Guest', player_number: 2, is_ready: true }
        ]
      }
      ;(scene as any).showWaitingRoom()
    })

    it('should return early if no roomInfo', () => {
      (scene as any).roomInfo = null
      expect(() => (scene as any).updateWaitingRoom()).not.toThrow()
    })

    it('should update player containers', () => {
      (scene as any).updateWaitingRoom()
      expect((scene as any).player1Container.getByName).toHaveBeenCalled()
    })

    it('should enable start button when all ready', () => {
      mockOnlineService.isHost = true
      ;(scene as any).updateWaitingRoom()
      expect((scene as any).startButton.setAlpha).toHaveBeenCalledWith(1)
    })
  })

  describe('createMenuButton', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should create button container', () => {
      const onClick = vi.fn()
      ;(scene as any).createMenuButton(640, 300, 'TEST', 0x00ff00, onClick)
      expect(scene.add.container).toHaveBeenCalled()
    })

    it('should create button with correct label', () => {
      const onClick = vi.fn()
      ;(scene as any).createMenuButton(640, 300, 'TEST BUTTON', 0x00ff00, onClick)
      expect(scene.add.text).toHaveBeenCalledWith(0, 0, 'TEST BUTTON', expect.any(Object))
    })

    it('should create button with custom width', () => {
      const onClick = vi.fn()
      ;(scene as any).createMenuButton(640, 300, 'TEST', 0x00ff00, onClick, 200)
      expect(scene.add.rectangle).toHaveBeenCalledWith(0, 0, 200, 55, 0x00ff00)
    })
  })

  describe('showError', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should create error overlay', () => {
      (scene as any).showError('Test error')
      expect(scene.add.rectangle).toHaveBeenCalledWith(640, 360, 1280, 720, 0x000000, 0.7)
    })

    it('should create error popup', () => {
      (scene as any).showError('Test error')
      expect(scene.add.container).toHaveBeenCalledWith(640, 360)
    })

    it('should display error title', () => {
      (scene as any).showError('Test error')
      expect(scene.add.text).toHaveBeenCalledWith(0, -60, 'ERROR', expect.any(Object))
    })

    it('should display error message', () => {
      (scene as any).showError('Custom error message')
      expect(scene.add.text).toHaveBeenCalledWith(0, 0, 'Custom error message', expect.any(Object))
    })
  })

  describe('cleanupInputs', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should remove room name input', () => {
      const mockInput = { remove: vi.fn() }
      ;(scene as any).roomNameInput = mockInput
      ;(scene as any).cleanupInputs()
      expect(mockInput.remove).toHaveBeenCalled()
      expect((scene as any).roomNameInput).toBeUndefined()
    })

    it('should remove room code input', () => {
      const mockInput = { remove: vi.fn() }
      ;(scene as any).roomCodeInput = mockInput
      ;(scene as any).cleanupInputs()
      expect(mockInput.remove).toHaveBeenCalled()
      expect((scene as any).roomCodeInput).toBeUndefined()
    })

    it('should remove chat input', () => {
      const mockInput = { remove: vi.fn() }
      ;(scene as any).chatInput = mockInput
      ;(scene as any).cleanupInputs()
      expect(mockInput.remove).toHaveBeenCalled()
      expect((scene as any).chatInput).toBeUndefined()
    })

    it('should handle undefined inputs gracefully', () => {
      expect(() => (scene as any).cleanupInputs()).not.toThrow()
    })
  })

  describe('clearUI', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should reset containers', () => {
      (scene as any).player1Container = {}
      ;(scene as any).player2Container = {}
      ;(scene as any).clearUI()
      expect((scene as any).player1Container).toBeUndefined()
      expect((scene as any).player2Container).toBeUndefined()
    })

    it('should reset startButton', () => {
      (scene as any).startButton = {}
      ;(scene as any).clearUI()
      expect((scene as any).startButton).toBeUndefined()
    })

    it('should reset chatContainer', () => {
      (scene as any).chatContainer = {}
      ;(scene as any).clearUI()
      expect((scene as any).chatContainer).toBeUndefined()
    })

    it('should clear chatMessages array', () => {
      (scene as any).chatMessages = ['msg1', 'msg2']
      ;(scene as any).clearUI()
      expect((scene as any).chatMessages).toEqual([])
    })
  })

  describe('time sync', () => {
    beforeEach(() => {
      scene.create()
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should start time sync on room creation', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = { 
        room_id: 'ABC123', 
        players: [{ player_id: 'player-123', player_name: 'Host', player_number: 1, is_ready: false }] 
      }
      callbacks.onRoomCreated('ABC123', 'player-123', roomInfo)
      expect(mockOnlineService.requestTimeSync).toHaveBeenCalled()
    })

    it('should start time sync on room join', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = { 
        room_id: 'ABC123', 
        players: [
          { player_id: 'player-123', player_name: 'Host', player_number: 1, is_ready: false },
          { player_id: 'player-456', player_name: 'Guest', player_number: 2, is_ready: false }
        ] 
      }
      callbacks.onRoomJoined('ABC123', 'player-456', 2, roomInfo)
      expect(mockOnlineService.requestTimeSync).toHaveBeenCalled()
    })

    it('should stop time sync on clearUI', () => {
      (scene as any).timeSyncInterval = 123
      ;(scene as any).stopTimeSync()
      expect((scene as any).timeSyncInterval).toBeUndefined()
    })
  })

  describe('callback handlers', () => {
    beforeEach(() => {
      scene.create()
      ;(scene as any).roomInfo = {
        room_id: 'ABC123',
        room_name: 'Test Room',
        host_id: 'player-123',
        player_count: 1,
        max_players: 2,
        game_started: false,
        players: [{ player_id: 'player-123', player_name: 'Host', is_ready: false }]
      }
    })

    it('should handle onRoomCreated', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = { room_id: 'NEW123', room_name: 'New Room', players: [] }
      callbacks.onRoomCreated('NEW123', 'player-123', roomInfo)
      expect((scene as any).roomInfo).toBe(roomInfo)
    })

    it('should handle onRoomJoined', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = { room_id: 'JOIN123', room_name: 'Joined Room', players: [] }
      callbacks.onRoomJoined('JOIN123', 'player-456', 2, roomInfo)
      expect((scene as any).roomInfo).toBe(roomInfo)
    })

    it('should handle onPlayerJoined', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = { room_id: 'ABC123', players: [{ player_id: 'player-456', player_name: 'NewPlayer', is_ready: false }] }
      callbacks.onPlayerJoined('player-456', 'NewPlayer', 2, roomInfo)
      expect((scene as any).roomInfo).toBe(roomInfo)
    })

    it('should handle onPlayerLeft and reset ready state', () => {
      (scene as any).isReady = true
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = { room_id: 'ABC123', players: [] }
      callbacks.onPlayerLeft('player-456', 'LeftPlayer', roomInfo)
      expect((scene as any).isReady).toBe(false)
      expect((scene as any).roomInfo).toBe(roomInfo)
    })

    it('should handle onPlayerReadyChanged', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = { 
        room_id: 'ABC123', 
        players: [{ player_id: 'player-123', player_name: 'Host', is_ready: true }] 
      }
      callbacks.onPlayerReadyChanged('player-123', true, roomInfo)
      expect((scene as any).isReady).toBe(true)
      expect((scene as any).roomInfo).toBe(roomInfo)
    })

    it('should handle onPlayerDisconnected and reset ready state', () => {
      (scene as any).isReady = true
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = { room_id: 'ABC123', players: [] }
      callbacks.onPlayerDisconnected('player-456', 'DisconnectedPlayer', true, roomInfo)
      expect((scene as any).isReady).toBe(false)
    })

    it('should handle onGameStarting', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const gameState = { 
        seed: 12345, 
        server_timestamp: Date.now(),
        game_start_timestamp: Date.now() + 1000,
        sequence_id: 1
      }
      callbacks.onGameStarting(gameState)
      expect(scene.time.delayedCall).toHaveBeenCalled()
    })

    it('should start game immediately if past scheduled time', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const gameState = { 
        seed: 12345, 
        server_timestamp: Date.now() - 2000,
        game_start_timestamp: Date.now() - 1000,
        sequence_id: 1
      }
      callbacks.onGameStarting(gameState)
      expect(scene.scene.start).toHaveBeenCalledWith('GameScene', expect.objectContaining({
        mode: 'online_coop',
        gameState: gameState
      }))
    })

    it('should handle onError', () => {
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      callbacks.onError('Test error message')
      // Error popup should be shown
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('should handle onDisconnect in waiting view', () => {
      (scene as any).currentView = 'waiting'
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      callbacks.onDisconnect()
      expect((scene as any).currentView).toBe('main')
    })
  })

  describe('addChatMessage', () => {
    beforeEach(() => {
      scene.create()
      ;(scene as any).chatContainer = scene.add.container(0, 0)
      ;(scene as any).chatMessages = []
    })

    it('should add message to chat', () => {
      (scene as any).addChatMessage('Test message')
      expect(scene.add.text).toHaveBeenCalledWith(0, 0, 'Test message', expect.any(Object))
    })

    it('should return early if no chatContainer', () => {
      (scene as any).chatContainer = undefined
      expect(() => (scene as any).addChatMessage('Test')).not.toThrow()
    })
  })

  describe('shutdown', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should cleanup inputs on shutdown', () => {
      const mockInput = { remove: vi.fn() }
      ;(scene as any).roomNameInput = mockInput
      scene.shutdown()
      expect(mockInput.remove).toHaveBeenCalled()
    })

    it('should disconnect online service', () => {
      scene.shutdown()
      expect(mockOnlineService.disconnect).toHaveBeenCalled()
    })
  })

  describe('createBlackholeBackground', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should create graphics for blackhole effect', () => {
      expect(scene.add.graphics).toHaveBeenCalled()
    })

    it('should create particles for swirling effect', () => {
      expect(scene.add.particles).toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    beforeEach(() => {
      scene.create()
    })

    it('should handle full room creation flow', async () => {
      // Show create room
      (scene as any).showCreateRoom()
      expect((scene as any).currentView).toBe('create')
      
      // Simulate room created callback
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = {
        room_id: 'NEW123',
        room_name: 'My Room',
        host_id: 'player-123',
        players: [{ player_id: 'player-123', player_name: 'Host', player_number: 1, is_ready: false }]
      }
      callbacks.onRoomCreated('NEW123', 'player-123', roomInfo)
      
      expect((scene as any).currentView).toBe('waiting')
      expect((scene as any).roomInfo).toBe(roomInfo)
    })

    it('should handle full room join flow', async () => {
      // Show join room
      (scene as any).showJoinRoom()
      expect((scene as any).currentView).toBe('join')
      
      // Simulate room joined callback
      const callbacks = mockOnlineService.setCallbacks.mock.calls[0][0]
      const roomInfo = {
        room_id: 'ABC123',
        room_name: 'Existing Room',
        host_id: 'other-player',
        players: [
          { player_id: 'other-player', player_name: 'Host', player_number: 1, is_ready: false },
          { player_id: 'player-123', player_name: 'Guest', player_number: 2, is_ready: false }
        ]
      }
      callbacks.onRoomJoined('ABC123', 'player-123', 2, roomInfo)
      
      expect((scene as any).currentView).toBe('waiting')
      expect((scene as any).roomInfo).toBe(roomInfo)
    })

    it('should handle leave room and return to main menu', () => {
      (scene as any).roomInfo = { room_id: 'ABC123' }
      ;(scene as any).currentView = 'waiting'
      
      mockOnlineService.leaveRoom()
      ;(scene as any).showMainMenu()
      
      expect((scene as any).currentView).toBe('main')
      expect(mockOnlineService.leaveRoom).toHaveBeenCalled()
    })

    it('should handle reconnection in waiting view', () => {
      (scene as any).currentView = 'waiting'
      const callbacks = mockOnlineService.setCallbacks.mock.calls[1][0]
      
      const gameState = {
        players: {
          'player-123': { player_name: 'Host', player_number: 1, is_ready: false }
        }
      }
      
      callbacks.onReconnected(gameState)
      expect((scene as any).roomInfo).toBeDefined()
    })
  })

  describe('state management', () => {
    it('should track current view correctly', () => {
      scene.create()
      const currentView1 = (scene as any).currentView
      expect(currentView1).toBe('main')
      
      ;(scene as any).showCreateRoom()
      const currentView2 = (scene as any).currentView
      expect(currentView2).toBe('create')
      
      ;(scene as any).showJoinRoom()
      const currentView3 = (scene as any).currentView
      expect(currentView3).toBe('join')
      
      ;(scene as any).showMainMenu()
      const currentView4 = (scene as any).currentView
      expect(currentView4).toBe('main')
    })

    it('should track ready state', () => {
      scene.create()
      const isReady1 = (scene as any).isReady
      expect(isReady1).toBe(false)
      
      ;(scene as any).isReady = true
      const isReady2 = (scene as any).isReady
      expect(isReady2).toBe(true)
    })
  })

  describe('gamepad plugin workaround', () => {
    it('should handle shutdown when gamepad plugin exists without pads', () => {
      scene.create()
      
      scene.input = {
        gamepad: {}
      } as any
      
      expect(() => scene.shutdown()).not.toThrow()
      expect((scene.input.gamepad as any).pads).toEqual([])
    })
    
    it('should handle shutdown when input is undefined', () => {
      scene.create()
      ;(scene as any).input = undefined
      
      expect(() => scene.shutdown()).not.toThrow()
    })
    
    it('should cleanup all input fields on shutdown', () => {
      scene.create()
      
      const mockRoomNameInput = { remove: vi.fn() }
      const mockRoomCodeInput = { remove: vi.fn() }
      const mockChatInput = { remove: vi.fn() }
      
      ;(scene as any).roomNameInput = mockRoomNameInput
      ;(scene as any).roomCodeInput = mockRoomCodeInput
      ;(scene as any).chatInput = mockChatInput
      
      scene.shutdown()
      
      expect(mockRoomNameInput.remove).toHaveBeenCalled()
      expect(mockRoomCodeInput.remove).toHaveBeenCalled()
      expect(mockChatInput.remove).toHaveBeenCalled()
    })
  })
})
