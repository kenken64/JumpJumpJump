import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AudioManager } from '../utils/AudioManager'

// Create mock AudioContext
const createMockAudioContext = () => {
  const mockOscillator = {
    connect: vi.fn().mockReturnThis(),
    type: 'sine',
    frequency: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    start: vi.fn(),
    stop: vi.fn()
  }

  const mockGainNode = {
    connect: vi.fn().mockReturnThis(),
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    }
  }

  const mockBufferSource = {
    connect: vi.fn().mockReturnThis(),
    buffer: null as AudioBuffer | null,
    start: vi.fn(),
    stop: vi.fn()
  }

  const mockAudioBuffer = {
    getChannelData: vi.fn().mockReturnValue(new Float32Array(4410))
  }

  return {
    currentTime: 0,
    destination: {},
    sampleRate: 44100,
    createOscillator: vi.fn().mockReturnValue(mockOscillator),
    createGain: vi.fn().mockReturnValue(mockGainNode),
    createBufferSource: vi.fn().mockReturnValue(mockBufferSource),
    createBuffer: vi.fn().mockReturnValue(mockAudioBuffer),
    _mockOscillator: mockOscillator,
    _mockGainNode: mockGainNode
  } as unknown as AudioContext & {
    _mockOscillator: typeof mockOscillator
    _mockGainNode: typeof mockGainNode
  }
}

describe('AudioManager', () => {
  let audioManager: AudioManager
  let mockAudioContext: ReturnType<typeof createMockAudioContext>

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    mockAudioContext = createMockAudioContext()
    audioManager = new AudioManager(mockAudioContext as unknown as AudioContext)
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('constructor and settings', () => {
    it('should load default settings when localStorage is empty', () => {
      expect(audioManager.isSoundEnabled()).toBe(true)
      expect(audioManager.getSoundVolume()).toBe(0.5)
    })

    it('should load sound enabled setting from localStorage', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      expect(manager.isSoundEnabled()).toBe(false)
    })

    it('should load sound volume from localStorage', () => {
      localStorage.setItem('soundVolume', '0.8')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      expect(manager.getSoundVolume()).toBe(0.8)
    })

    it('should handle invalid volume in localStorage', () => {
      localStorage.setItem('soundVolume', 'invalid')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      expect(manager.getSoundVolume()).toBeNaN()
    })
  })

  describe('isSoundEnabled', () => {
    it('should return true by default', () => {
      expect(audioManager.isSoundEnabled()).toBe(true)
    })

    it('should return false when disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      expect(manager.isSoundEnabled()).toBe(false)
    })
  })

  describe('getSoundVolume', () => {
    it('should return default volume 0.5', () => {
      expect(audioManager.getSoundVolume()).toBe(0.5)
    })

    it('should return custom volume from localStorage', () => {
      localStorage.setItem('soundVolume', '0.3')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      expect(manager.getSoundVolume()).toBe(0.3)
    })
  })

  describe('playJumpSound', () => {
    it('should create oscillator and gain node', () => {
      audioManager.playJumpSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should use square wave type', () => {
      audioManager.playJumpSound()
      
      const oscillator = mockAudioContext._mockOscillator
      expect(oscillator.type).toBe('square')
    })

    it('should use higher frequency for double jump', () => {
      audioManager.playJumpSound(false)
      expect(mockAudioContext._mockOscillator.frequency.value).toBe(400)
      
      // Reset and test double jump
      mockAudioContext = createMockAudioContext()
      audioManager = new AudioManager(mockAudioContext as unknown as AudioContext)
      audioManager.playJumpSound(true)
      expect(mockAudioContext._mockOscillator.frequency.value).toBe(600)
    })

    it('should not play when sound is disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playJumpSound()
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })

    it('should connect oscillator to gain node', () => {
      audioManager.playJumpSound()
      
      expect(mockAudioContext._mockOscillator.connect).toHaveBeenCalledWith(
        mockAudioContext._mockGainNode
      )
    })

    it('should start and stop oscillator', () => {
      audioManager.playJumpSound()
      
      expect(mockAudioContext._mockOscillator.start).toHaveBeenCalled()
      expect(mockAudioContext._mockOscillator.stop).toHaveBeenCalled()
    })
  })

  describe('playShootSound', () => {
    it('should create audio components', () => {
      audioManager.playShootSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should use sawtooth wave type', () => {
      audioManager.playShootSound()
      
      expect(mockAudioContext._mockOscillator.type).toBe('sawtooth')
    })

    it('should set frequency sweep', () => {
      audioManager.playShootSound()
      
      expect(mockAudioContext._mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        800, mockAudioContext.currentTime
      )
      expect(mockAudioContext._mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        200, expect.any(Number)
      )
    })

    it('should not play when sound is disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playShootSound()
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('playMeleeSound', () => {
    it('should create oscillator, gain, and buffer source for noise', () => {
      audioManager.playMeleeSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockAudioContext.createBuffer).toHaveBeenCalled()
    })

    it('should create noise buffer', () => {
      audioManager.playMeleeSound()
      
      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        mockAudioContext.sampleRate
      )
    })

    it('should use square wave for oscillator', () => {
      audioManager.playMeleeSound()
      
      expect(mockAudioContext._mockOscillator.type).toBe('square')
    })

    it('should not play when sound is disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playMeleeSound()
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('playCoinSound', () => {
    it('should create audio components', () => {
      audioManager.playCoinSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should use sine wave type', () => {
      audioManager.playCoinSound()
      
      expect(mockAudioContext._mockOscillator.type).toBe('sine')
    })

    it('should not play when sound is disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playCoinSound()
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('playDamageSound', () => {
    it('should create audio components', () => {
      audioManager.playDamageSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should use sawtooth wave type', () => {
      audioManager.playDamageSound()
      
      expect(mockAudioContext._mockOscillator.type).toBe('sawtooth')
    })

    it('should set descending frequency for damage sound', () => {
      audioManager.playDamageSound()
      
      expect(mockAudioContext._mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        200, mockAudioContext.currentTime
      )
      expect(mockAudioContext._mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        50, expect.any(Number)
      )
    })

    it('should not play when sound is disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playDamageSound()
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('playDeathSound', () => {
    it('should create audio components', () => {
      audioManager.playDeathSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should use sawtooth wave type', () => {
      audioManager.playDeathSound()
      
      expect(mockAudioContext._mockOscillator.type).toBe('sawtooth')
    })

    it('should set long descending frequency', () => {
      audioManager.playDeathSound()
      
      expect(mockAudioContext._mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        400, mockAudioContext.currentTime
      )
      expect(mockAudioContext._mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        50, expect.any(Number)
      )
    })

    it('should not play when sound is disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playDeathSound()
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('playBossSound', () => {
    it('should create two oscillators for rich sound', () => {
      audioManager.playBossSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2)
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should not play when sound is disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playBossSound()
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('playBossAttackSound', () => {
    it('should create audio components', () => {
      audioManager.playBossAttackSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should use triangle wave type', () => {
      audioManager.playBossAttackSound()
      
      expect(mockAudioContext._mockOscillator.type).toBe('triangle')
    })

    it('should not play when sound is disabled', () => {
      localStorage.setItem('soundEnabled', 'false')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playBossAttackSound()
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('volume scaling', () => {
    it('should scale volume based on soundVolume setting', () => {
      localStorage.setItem('soundVolume', '1.0')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playJumpSound()
      
      // Volume should be 0.1 * 1.0 = 0.1 for jump sound
      expect(mockAudioContext._mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(
        0.1, // 0.1 * 1.0
        mockAudioContext.currentTime
      )
    })

    it('should respect lower volume settings', () => {
      localStorage.setItem('soundVolume', '0.5')
      const manager = new AudioManager(mockAudioContext as unknown as AudioContext)
      manager.playJumpSound()
      
      expect(mockAudioContext._mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(
        0.05, // 0.1 * 0.5
        mockAudioContext.currentTime
      )
    })
  })

  describe('edge cases', () => {
    it('should handle missing audioContext gracefully', () => {
      const nullContext = {
        currentTime: 0,
        destination: {},
        createOscillator: undefined
      } as unknown as AudioContext
      
      const manager = new AudioManager(nullContext)
      
      // Should not throw
      expect(() => manager.playJumpSound()).not.toThrow()
      expect(() => manager.playShootSound()).not.toThrow()
      expect(() => manager.playDamageSound()).not.toThrow()
    })

    it('should handle null audioContext', () => {
      const manager = new AudioManager(null as unknown as AudioContext)
      
      // Should not throw
      expect(() => manager.playJumpSound()).not.toThrow()
    })
  })
})
