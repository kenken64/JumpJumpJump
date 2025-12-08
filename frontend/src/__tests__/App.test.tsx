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

  it('should have game container element', () => {
    render(<App />)
    const container = document.getElementById('game-container')
    expect(container).toBeTruthy()
  })

  it('should configure arcade physics with correct gravity', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    const config = (Phaser.Game as any).mock.calls[0][0]
    expect(config.physics).toEqual({
      default: 'arcade',
      arcade: {
        gravity: { y: 400, x: 0 },
        debug: false
      }
    })
  })

  it('should configure gamepad input', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    const config = (Phaser.Game as any).mock.calls[0][0]
    expect(config.input).toEqual({
      gamepad: true
    })
  })

  it('should configure scale settings', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    const config = (Phaser.Game as any).mock.calls[0][0]
    expect(config.scale).toEqual({
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720
    })
  })

  it('should configure loader settings', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    const config = (Phaser.Game as any).mock.calls[0][0]
    expect(config.loader).toEqual({
      crossOrigin: 'anonymous',
      maxParallelDownloads: 10
    })
  })

  it('should include all game scenes in config', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    const config = (Phaser.Game as any).mock.calls[0][0]
    expect(config.scene).toHaveLength(11) // All 11 scenes
  })

  it('should set background color', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    const config = (Phaser.Game as any).mock.calls[0][0]
    expect(config.backgroundColor).toBe('#0a0a1a')
  })

  it('should expose game instance on window', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    expect((window as any).game).toBeDefined()
  })

  it('clicking on overlay should also start game', () => {
    render(<App />)
    
    // Click on the title instead of button
    const title = screen.getByText('JUMP JUMP JUMP')
    const overlay = title.closest('div')!
    fireEvent.click(overlay)
    
    expect(screen.queryByText('▶ START GAME')).toBeNull()
    expect(Phaser.Game).toHaveBeenCalledTimes(1)
  })

  it('should not re-initialize game on multiple clicks', () => {
    render(<App />)
    
    const startButton = screen.getByText('▶ START GAME')
    fireEvent.click(startButton)
    
    // Game container is still there, try to interact
    expect(Phaser.Game).toHaveBeenCalledTimes(1)
  })
})
