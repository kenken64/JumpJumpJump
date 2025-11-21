// API Service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_KEY = import.meta.env.VITE_API_KEY || 'your-secret-api-key-here'

export interface ScoreData {
  player_name: string
  score: number
  coins: number
  enemies_defeated: number
  distance: number
  level: number
  game_mode: string
}

export interface ScoreResponse extends ScoreData {
  id: number
  created_at: string
  rank?: number
}

export class GameAPI {
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

  static async submitScore(scoreData: ScoreData): Promise<ScoreResponse> {
    return this.fetchAPI('/api/scores', {
      method: 'POST',
      body: JSON.stringify(scoreData),
    })
  }

  static async getLeaderboard(limit: number = 10, gameMode?: string): Promise<ScoreResponse[]> {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (gameMode) params.append('game_mode', gameMode)
    
    return this.fetchAPI(`/api/scores/leaderboard?${params}`)
  }

  static async getPlayerHighScore(playerName: string): Promise<ScoreResponse | null> {
    try {
      return await this.fetchAPI(`/api/scores/player/${encodeURIComponent(playerName)}`)
    } catch (error) {
      return null // Player not found
    }
  }

  static async getScoreRank(score: number, gameMode?: string): Promise<{ score: number; rank: number }> {
    const params = new URLSearchParams({ score: score.toString() })
    if (gameMode) params.append('game_mode', gameMode)
    
    return this.fetchAPI(`/api/scores/rank/${score}?${params}`)
  }

  static async checkConnection(): Promise<boolean> {
    try {
      await this.fetchAPI('/')
      return true
    } catch {
      return false
    }
  }
}
