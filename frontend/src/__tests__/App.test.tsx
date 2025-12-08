import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'
import Phaser from 'phaser'

// Mock Phaser
vi.mock('phaser', () => {
  return {
    default: {
      Game: vi.fn(() => ({
        destroy: vi.fn()
      })),
      AUTO: 'AUTO',
      Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH'
      },
      Types: {
        Core: {
          GameConfig: {}
        }
      }
    }
  }
})

// Mock scenes to avoid instantiation issues
vi.mock('../scenes/MenuScene', () => ({ default: class {} }))
vi.mock('../scenes/GameScene', () => ({ default: class {} }))
vi.mock('../scenes/ShopScene', () => ({ default: class {} }))
vi.mock('../scenes/LeaderboardScene', () => ({ default: class {} }))
vi.mock('../scenes/InventoryScene', () => ({ default: class {} }))
vi.mock('../scenes/BossGalleryScene', () => ({ default: class {} }))
vi.mock('../scenes/CreditScene', () => ({ default: class {} }))
vi.mock('../scenes/CoopLobbyScene', () => ({ default: class {} }))
vi.mock('../scenes/OnlineLobbyScene', () => ({ default: class {} }))
vi.mock('../scenes/DQNTrainingScene', () => ({ default: class {} }))
vi.mock('../scenes/EndingScene', () => ({ default: class {} }))

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the start screen initially', () => {
    render(<App />)
    expect(screen.getByText('JUMP JUMP JUMP')).toBeTruthy()
    expect(screen.getByText('▶ START GAME')).toBeTruthy()
    expect(screen.getByText('Click anywhere to start with audio')).toBeTruthy()
  })

  it('initializes Phaser game on start click', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)

    // Overlay should be gone
    expect(screen.queryByText('▶ START GAME')).toBeNull()
    
    // Phaser game should be initialized
    expect(Phaser.Game).toHaveBeenCalledTimes(1)
    
    // Check config passed to Phaser
    const config = (Phaser.Game as any).mock.calls[0][0]
    expect(config.width).toBe(1280)
    expect(config.height).toBe(720)
    expect(config.parent).toBe('game-container')
  })
  
  it('destroys game instance on unmount', () => {
    const { unmount } = render(<App />)
    
    // Start the game first
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    // Get the mock instance
    const mockGameInstance = (Phaser.Game as any).mock.results[0].value
    
    unmount()
    
    expect(mockGameInstance.destroy).toHaveBeenCalledWith(true)
  })
})
