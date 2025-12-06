/**
 * @fileoverview GameAPI Service - Backend communication layer for JumpJumpJump
 * 
 * Handles all API communication with the FastAPI backend:
 * - Score submission and leaderboard retrieval
 * - Player high scores and rankings
 * - Boss data fetching
 * - Connection status checking
 * 
 * Uses environment variables for API URL and key configuration.
 * 
 * @module services/api
 */

/** Base URL for API requests, defaults to localhost:8000 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
/** API key for authentication */
const API_KEY = import.meta.env.VITE_API_KEY || 'your-secret-api-key-here'

/**
 * Data structure for submitting a new score
 */
export interface ScoreData {
  player_name: string
  score: number
  coins: number
  enemies_defeated: number
  distance: number
  level: number
  game_mode: string
}

/**
 * Response structure for score data from API
 * Extends ScoreData with server-generated fields
 */
export interface ScoreResponse extends ScoreData {
  id: number
  created_at: string
  rank?: number
}

/**
 * Boss data structure from backend
 */
export interface Boss {
  id: number
  boss_index: number
  boss_name: string
  notorious_title: string
  frame_x: number
  frame_y: number
}

export interface SaveGameData {
  player_name: string
  level: number
  score: number
  lives: number
  health: number
  coins: number
  weapon: string
}

/**
 * Static class for all game API operations
 * Provides methods for scores, leaderboards, player data, and boss information
 */
export class GameAPI {
  /**
   * Internal fetch wrapper with authentication and error handling
   * @param endpoint - API endpoint path
   * @param options - Optional fetch configuration
   * @returns Parsed JSON response
   * @throws Error if request fails
   * @private
   */
  private static async fetchAPI(endpoint: string, options?: RequestInit) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          ...options?.headers,
        },
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  /**
   * Submit a new score to the leaderboard
   * @param scoreData - Score data to submit
   * @returns The created score record with ID and timestamp
   */
  static async submitScore(scoreData: ScoreData): Promise<ScoreResponse> {
    return this.fetchAPI('/api/scores', {
      method: 'POST',
      body: JSON.stringify(scoreData),
    })
  }

  static async saveGame(saveData: SaveGameData): Promise<{ message: string }> {
    return this.fetchAPI('/api/save_game', {
      method: 'POST',
      body: JSON.stringify(saveData),
    })
  }

  static async loadGame(playerName: string): Promise<SaveGameData> {
    return this.fetchAPI(`/api/load_game/${encodeURIComponent(playerName)}`)
  }

  /**
   * Retrieve leaderboard scores
   * @param limit - Maximum number of scores to return (default: 10)
   * @param gameMode - Optional filter by game mode
   * @returns Array of score records sorted by score descending
   */
  static async getLeaderboard(limit: number = 10, gameMode?: string): Promise<ScoreResponse[]> {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (gameMode) params.append('game_mode', gameMode)
    
    return this.fetchAPI(`/api/scores/leaderboard?${params}`)
  }

  /**
   * Get a player's personal best score
   * @param playerName - Player name to look up
   * @returns Player's highest score or null if not found
   */
  static async getPlayerHighScore(playerName: string): Promise<ScoreResponse | null> {
    try {
      return await this.fetchAPI(`/api/scores/player/${encodeURIComponent(playerName)}`)
    } catch (error) {
      return null // Player not found
    }
  }

  /**
   * Get the rank position for a given score
   * @param score - Score value to check
   * @param gameMode - Optional game mode filter
   * @returns Object with score and its rank position
   */
  static async getScoreRank(score: number, gameMode?: string): Promise<{ score: number; rank: number }> {
    const params = new URLSearchParams({ score: score.toString() })
    if (gameMode) params.append('game_mode', gameMode)
    
    return this.fetchAPI(`/api/scores/rank/${score}?${params}`)
  }

  /**
   * Check if the backend API is reachable
   * @returns true if API responds, false otherwise
   */
  static async checkConnection(): Promise<boolean> {
    try {
      await this.fetchAPI('/')
      return true
    } catch {
      return false
    }
  }

  /**
   * Fetch all boss data from the backend
   * @returns Array of all boss records
   */
  static async getAllBosses(): Promise<Boss[]> {
    return this.fetchAPI('/api/bosses')
  }
}
