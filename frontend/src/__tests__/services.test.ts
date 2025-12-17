import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameAPI, ScoreData, ScoreResponse, Boss } from '../services/api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('GameAPI', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('fetchAPI (private method tested through public methods)', () => {
    it('should include correct headers in all requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      await GameAPI.getLeaderboard()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': expect.any(String)
          })
        })
      )
    })

    it('should throw error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      })

      await expect(GameAPI.getLeaderboard()).rejects.toThrow('API error: Internal Server Error')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(GameAPI.getLeaderboard()).rejects.toThrow('Network error')
    })

    it('should throw Not Found error on 404 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(GameAPI.getAllBosses()).rejects.toThrow('Not Found')
    })

    it('should not log 404 errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      try {
        await GameAPI.getAllBosses()
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should log non-404 errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await GameAPI.getAllBosses()
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('API request failed:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('submitScore', () => {
    const mockScoreData: ScoreData = {
      player_name: 'TestPlayer',
      score: 1000,
      coins: 50,
      enemies_defeated: 10,
      distance: 5000,
      level: 3,
      game_mode: 'classic'
    }

    const mockResponse: ScoreResponse = {
      ...mockScoreData,
      id: 1,
      created_at: '2024-01-01T00:00:00Z',
      rank: 5
    }

    it('should submit score with POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await GameAPI.submitScore(mockScoreData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scores'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockScoreData)
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should return score response with rank', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await GameAPI.submitScore(mockScoreData)

      expect(result.id).toBe(1)
      expect(result.rank).toBe(5)
      expect(result.player_name).toBe('TestPlayer')
    })
  })

  describe('saveGame', () => {
    const mockSaveData = {
      player_name: 'TestPlayer',
      level: 3,
      score: 1500,
      lives: 2,
      health: 80,
      coins: 50,
      weapon: 'laser'
    }

    it('should save game with POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Game saved successfully' })
      })

      const result = await GameAPI.saveGame(mockSaveData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/save_game'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockSaveData)
        })
      )
      expect(result).toEqual({ message: 'Game saved successfully' })
    })

    it('should handle save game error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      })

      await expect(GameAPI.saveGame(mockSaveData)).rejects.toThrow('API error: Bad Request')
    })
  })

  describe('loadGame', () => {
    const mockLoadedData = {
      player_name: 'TestPlayer',
      level: 3,
      score: 1500,
      lives: 2,
      health: 80,
      coins: 50,
      weapon: 'laser'
    }

    it('should load game by player name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoadedData
      })

      const result = await GameAPI.loadGame('TestPlayer')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/load_game/TestPlayer'),
        expect.any(Object)
      )
      expect(result).toEqual(mockLoadedData)
    })

    it('should encode player name with spaces in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoadedData
      })

      await GameAPI.loadGame('Test Player')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/load_game/Test%20Player'),
        expect.any(Object)
      )
    })

    it('should encode special characters in player name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoadedData
      })

      await GameAPI.loadGame('Player@#$%')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/load_game/Player%40%23%24%25'),
        expect.any(Object)
      )
    })
  })

  describe('deleteSave', () => {
    it('should delete save with DELETE method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Save deleted successfully' })
      })

      const result = await GameAPI.deleteSave('TestPlayer')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/save_game/TestPlayer'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
      expect(result).toEqual({ message: 'Save deleted successfully' })
    })

    it('should encode player name with spaces in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Save deleted' })
      })

      await GameAPI.deleteSave('Test Player')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/save_game/Test%20Player'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    it('should handle delete error for non-existent save', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(GameAPI.deleteSave('NonExistentPlayer')).rejects.toThrow('Not Found')
    })
  })

  describe('getLeaderboard', () => {
    const mockLeaderboard: ScoreResponse[] = [
      {
        id: 1,
        player_name: 'Player1',
        score: 5000,
        coins: 100,
        enemies_defeated: 50,
        distance: 10000,
        level: 5,
        game_mode: 'classic',
        created_at: '2024-01-01T00:00:00Z',
        rank: 1
      },
      {
        id: 2,
        player_name: 'Player2',
        score: 4500,
        coins: 90,
        enemies_defeated: 45,
        distance: 9000,
        level: 4,
        game_mode: 'classic',
        created_at: '2024-01-01T00:00:00Z',
        rank: 2
      }
    ]

    it('should fetch leaderboard with default limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboard
      })

      const result = await GameAPI.getLeaderboard()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scores/leaderboard?limit=10'),
        expect.any(Object)
      )
      expect(result).toEqual(mockLeaderboard)
    })

    it('should fetch leaderboard with custom limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboard.slice(0, 1)
      })

      await GameAPI.getLeaderboard(5)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=5'),
        expect.any(Object)
      )
    })

    it('should filter leaderboard by game mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboard
      })

      await GameAPI.getLeaderboard(10, 'arcade')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('game_mode=arcade'),
        expect.any(Object)
      )
    })
  })

  describe('getPlayerHighScore', () => {
    const mockHighScore: ScoreResponse = {
      id: 1,
      player_name: 'TestPlayer',
      score: 3000,
      coins: 75,
      enemies_defeated: 25,
      distance: 7500,
      level: 3,
      game_mode: 'classic',
      created_at: '2024-01-01T00:00:00Z'
    }

    it('should fetch player high score', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHighScore
      })

      const result = await GameAPI.getPlayerHighScore('TestPlayer')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scores/player/TestPlayer'),
        expect.any(Object)
      )
      expect(result).toEqual(mockHighScore)
    })

    it('should encode player name in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHighScore
      })

      await GameAPI.getPlayerHighScore('Test Player')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scores/player/Test%20Player'),
        expect.any(Object)
      )
    })

    it('should return null for non-existent player', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      })

      const result = await GameAPI.getPlayerHighScore('NonExistentPlayer')

      expect(result).toBeNull()
    })
  })

  describe('getScoreRank', () => {
    it('should fetch rank for a score', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 2500, rank: 10 })
      })

      const result = await GameAPI.getScoreRank(2500)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scores/rank/2500'),
        expect.any(Object)
      )
      expect(result).toEqual({ score: 2500, rank: 10 })
    })

    it('should include game mode in rank query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 2500, rank: 5 })
      })

      await GameAPI.getScoreRank(2500, 'survival')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('game_mode=survival'),
        expect.any(Object)
      )
    })
  })

  describe('checkConnection', () => {
    it('should return true when API is reachable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      })

      const result = await GameAPI.checkConnection()

      expect(result).toBe(true)
    })

    it('should return false when API is unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await GameAPI.checkConnection()

      expect(result).toBe(false)
    })

    it('should call root endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      await GameAPI.checkConnection()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/'),
        expect.any(Object)
      )
    })
  })

  describe('getAllBosses', () => {
    const mockBosses: Boss[] = [
      {
        id: 1,
        boss_index: 0,
        boss_name: 'Space Slime',
        notorious_title: 'The Gelatinous Terror',
        frame_x: 0,
        frame_y: 0
      },
      {
        id: 2,
        boss_index: 1,
        boss_name: 'Mecha Knight',
        notorious_title: 'The Iron Destroyer',
        frame_x: 1,
        frame_y: 0
      }
    ]

    it('should fetch all bosses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBosses
      })

      const result = await GameAPI.getAllBosses()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bosses'),
        expect.any(Object)
      )
      expect(result).toEqual(mockBosses)
      expect(result).toHaveLength(2)
    })

    it('should return boss with all required properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBosses
      })

      const result = await GameAPI.getAllBosses()

      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('boss_index')
      expect(result[0]).toHaveProperty('boss_name')
      expect(result[0]).toHaveProperty('notorious_title')
      expect(result[0]).toHaveProperty('frame_x')
      expect(result[0]).toHaveProperty('frame_y')
    })
  })
})

describe('ScoreData Interface', () => {
  it('should have correct shape', () => {
    const scoreData: ScoreData = {
      player_name: 'Test',
      score: 100,
      coins: 10,
      enemies_defeated: 5,
      distance: 1000,
      level: 1,
      game_mode: 'classic'
    }

    expect(scoreData.player_name).toBeDefined()
    expect(scoreData.score).toBeGreaterThanOrEqual(0)
    expect(scoreData.coins).toBeGreaterThanOrEqual(0)
    expect(scoreData.enemies_defeated).toBeGreaterThanOrEqual(0)
    expect(scoreData.distance).toBeGreaterThanOrEqual(0)
    expect(scoreData.level).toBeGreaterThanOrEqual(1)
    expect(scoreData.game_mode).toBeDefined()
  })
})

describe('Boss Interface', () => {
  it('should have correct shape', () => {
    const boss: Boss = {
      id: 1,
      boss_index: 0,
      boss_name: 'Test Boss',
      notorious_title: 'The Tester',
      frame_x: 0,
      frame_y: 0
    }

    expect(boss.id).toBeDefined()
    expect(boss.boss_index).toBeGreaterThanOrEqual(0)
    expect(boss.boss_name).toBeDefined()
    expect(boss.notorious_title).toBeDefined()
    expect(typeof boss.frame_x).toBe('number')
    expect(typeof boss.frame_y).toBe('number')
  })
})
