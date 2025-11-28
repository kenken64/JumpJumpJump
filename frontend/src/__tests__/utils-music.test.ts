import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MusicManager } from '../utils/MusicManager'

// Mock Phaser scene
const createMockScene = () => {
  const mockSound = {
    stop: vi.fn(),
    destroy: vi.fn(),
    play: vi.fn()
  }

  return {
    sound: {
      add: vi.fn().mockReturnValue(mockSound),
      stopAll: vi.fn()
    },
    cache: {
      audio: {
        exists: vi.fn().mockReturnValue(true)
      }
    },
    _mockSound: mockSound
  }
}

describe('MusicManager', () => {
  let mockScene: ReturnType<typeof createMockScene>
  let musicManager: MusicManager

  beforeEach(() => {
    localStorage.clear()
    mockScene = createMockScene()
    musicManager = new MusicManager(mockScene as any)
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create instance with scene reference', () => {
      expect(musicManager).toBeDefined()
    })

    it('should initialize with no music playing', () => {
      expect(musicManager.getGameMusic()).toBeNull()
    })
  })

  describe('playGameMusic', () => {
    it('should stop all existing sounds before playing', () => {
      musicManager.playGameMusic()
      
      expect(mockScene.sound.stopAll).toHaveBeenCalled()
    })

    it('should check if music exists in cache', () => {
      musicManager.playGameMusic()
      
      expect(mockScene.cache.audio.exists).toHaveBeenCalledWith('gameMusic')
    })

    it('should not play if music is not in cache', () => {
      mockScene.cache.audio.exists.mockReturnValue(false)
      
      musicManager.playGameMusic()
      
      expect(mockScene.sound.add).not.toHaveBeenCalled()
    })

    it('should play music when enabled and available', () => {
      localStorage.setItem('musicEnabled', 'true')
      
      musicManager.playGameMusic()
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('gameMusic', {
        loop: true,
        volume: 0.5
      })
    })

    it('should not play when music is disabled', () => {
      localStorage.setItem('musicEnabled', 'false')
      
      musicManager.playGameMusic()
      
      expect(mockScene.sound.add).not.toHaveBeenCalled()
    })

    it('should use default volume when not set', () => {
      musicManager.playGameMusic()
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('gameMusic', {
        loop: true,
        volume: 0.5
      })
    })

    it('should use custom volume from localStorage', () => {
      localStorage.setItem('musicVolume', '0.8')
      
      musicManager.playGameMusic()
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('gameMusic', {
        loop: true,
        volume: 0.8
      })
    })

    it('should stop existing music before playing new', () => {
      // Play first time
      musicManager.playGameMusic()
      const firstSound = mockScene._mockSound
      
      // Play second time
      musicManager.playGameMusic()
      
      expect(firstSound.stop).toHaveBeenCalled()
      expect(firstSound.destroy).toHaveBeenCalled()
    })

    it('should set loop to true', () => {
      musicManager.playGameMusic()
      
      expect(mockScene.sound.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ loop: true })
      )
    })

    it('should call play on the sound object', () => {
      musicManager.playGameMusic()
      
      expect(mockScene._mockSound.play).toHaveBeenCalled()
    })

    it('should handle errors gracefully', () => {
      mockScene.sound.add.mockImplementation(() => {
        throw new Error('Sound error')
      })
      
      // Should not throw
      expect(() => musicManager.playGameMusic()).not.toThrow()
    })
  })

  describe('stopMusic', () => {
    it('should stop and destroy game music', () => {
      musicManager.playGameMusic()
      musicManager.stopMusic()
      
      expect(mockScene._mockSound.stop).toHaveBeenCalled()
      expect(mockScene._mockSound.destroy).toHaveBeenCalled()
    })

    it('should stop all scene sounds', () => {
      musicManager.stopMusic()
      
      expect(mockScene.sound.stopAll).toHaveBeenCalled()
    })

    it('should set gameMusic to null', () => {
      musicManager.playGameMusic()
      musicManager.stopMusic()
      
      expect(musicManager.getGameMusic()).toBeNull()
    })

    it('should handle stop when no music is playing', () => {
      // Should not throw when no music is playing
      expect(() => musicManager.stopMusic()).not.toThrow()
    })
  })

  describe('getGameMusic', () => {
    it('should return null initially', () => {
      expect(musicManager.getGameMusic()).toBeNull()
    })

    it('should return sound object after playing', () => {
      musicManager.playGameMusic()
      
      expect(musicManager.getGameMusic()).toBe(mockScene._mockSound)
    })

    it('should return null after stopping', () => {
      musicManager.playGameMusic()
      musicManager.stopMusic()
      
      expect(musicManager.getGameMusic()).toBeNull()
    })
  })

  describe('settings integration', () => {
    it('should respect musicEnabled setting', () => {
      localStorage.setItem('musicEnabled', 'false')
      const manager = new MusicManager(mockScene as any)
      
      manager.playGameMusic()
      
      expect(mockScene.sound.add).not.toHaveBeenCalled()
    })

    it('should respect musicVolume setting', () => {
      localStorage.setItem('musicVolume', '0.3')
      const manager = new MusicManager(mockScene as any)
      
      manager.playGameMusic()
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('gameMusic', {
        loop: true,
        volume: 0.3
      })
    })

    it('should handle zero volume', () => {
      localStorage.setItem('musicVolume', '0')
      const manager = new MusicManager(mockScene as any)
      
      manager.playGameMusic()
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('gameMusic', {
        loop: true,
        volume: 0
      })
    })

    it('should handle max volume', () => {
      localStorage.setItem('musicVolume', '1')
      const manager = new MusicManager(mockScene as any)
      
      manager.playGameMusic()
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('gameMusic', {
        loop: true,
        volume: 1
      })
    })
  })

  describe('edge cases', () => {
    it('should handle multiple play calls', () => {
      musicManager.playGameMusic()
      musicManager.playGameMusic()
      musicManager.playGameMusic()
      
      // Should have called stopAll 3 times
      expect(mockScene.sound.stopAll).toHaveBeenCalledTimes(3)
    })

    it('should handle multiple stop calls', () => {
      musicManager.playGameMusic()
      musicManager.stopMusic()
      musicManager.stopMusic()
      
      // Should not throw and should handle gracefully
      expect(musicManager.getGameMusic()).toBeNull()
    })

    it('should handle stop then play', () => {
      musicManager.playGameMusic()
      musicManager.stopMusic()
      musicManager.playGameMusic()
      
      expect(musicManager.getGameMusic()).toBe(mockScene._mockSound)
    })
  })
})
