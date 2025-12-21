import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ControlManager,
  DEFAULT_CONTROL_SETTINGS,
  DEFAULT_GAMEPAD_MAPPING,
  GamepadMapping,
  ControlSettings
} from '../utils/ControlManager'

describe('ControlManager', () => {
  // Use a fresh mock for localStorage for each test to prevent cross-test pollution
  let mockStorage: { [key: string]: string } = {}
  
  beforeEach(() => {
    // First, restore any existing mocks to ensure clean slate
    vi.restoreAllMocks()
    
    mockStorage = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value
    })
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      mockStorage = {}
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('DEFAULT_GAMEPAD_MAPPING', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_GAMEPAD_MAPPING.shoot).toBe(7) // RT
      expect(DEFAULT_GAMEPAD_MAPPING.moveLeftStick).toBe(true)
      expect(DEFAULT_GAMEPAD_MAPPING.moveDpad).toBe(true)
      expect(DEFAULT_GAMEPAD_MAPPING.aimRightStick).toBe(true)
    })
  })

  describe('DEFAULT_CONTROL_SETTINGS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONTROL_SETTINGS.inputMethod).toBe('keyboard')
      expect(DEFAULT_CONTROL_SETTINGS.gamepadMapping).toEqual(DEFAULT_GAMEPAD_MAPPING)
    })
  })

  describe('getControlSettings', () => {
    it('should return default settings when localStorage is empty', () => {
      const settings = ControlManager.getControlSettings()
      
      expect(settings).toEqual(DEFAULT_CONTROL_SETTINGS)
    })

    it('should return saved settings from localStorage', () => {
      const customSettings: ControlSettings = {
        inputMethod: 'gamepad',
        gamepadMapping: {
          shoot: 5,
          moveLeftStick: true,
          moveDpad: false,
          aimRightStick: true
        }
      }
      localStorage.setItem('controlSettings', JSON.stringify(customSettings))
      
      const settings = ControlManager.getControlSettings()
      
      expect(settings).toEqual(customSettings)
    })

    it('should return default settings on parse error', () => {
      localStorage.setItem('controlSettings', 'invalid json{')
      
      const settings = ControlManager.getControlSettings()
      
      expect(settings).toEqual(DEFAULT_CONTROL_SETTINGS)
    })
  })

  describe('saveControlSettings', () => {
    it('should save settings to localStorage', () => {
      const customSettings: ControlSettings = {
        inputMethod: 'gamepad',
        gamepadMapping: {
          shoot: 6,
          moveLeftStick: false,
          moveDpad: true,
          aimRightStick: false
        }
      }
      
      ControlManager.saveControlSettings(customSettings)
      
      const saved = localStorage.getItem('controlSettings')
      expect(saved).not.toBeNull()
      expect(JSON.parse(saved!)).toEqual(customSettings)
    })

    it('should overwrite existing settings', () => {
      const settings1: ControlSettings = {
        inputMethod: 'keyboard',
        gamepadMapping: DEFAULT_GAMEPAD_MAPPING
      }
      const settings2: ControlSettings = {
        inputMethod: 'gamepad',
        gamepadMapping: DEFAULT_GAMEPAD_MAPPING
      }
      
      ControlManager.saveControlSettings(settings1)
      ControlManager.saveControlSettings(settings2)
      
      const saved = JSON.parse(localStorage.getItem('controlSettings')!)
      expect(saved.inputMethod).toBe('gamepad')
    })
  })

  describe('setInputMethod', () => {
    it('should set input method to keyboard', () => {
      // Start with gamepad
      ControlManager.saveControlSettings({
        inputMethod: 'gamepad',
        gamepadMapping: DEFAULT_GAMEPAD_MAPPING
      })
      
      ControlManager.setInputMethod('keyboard')
      
      expect(ControlManager.getInputMethod()).toBe('keyboard')
    })

    it('should set input method to gamepad', () => {
      ControlManager.setInputMethod('gamepad')
      
      expect(ControlManager.getInputMethod()).toBe('gamepad')
    })

    it('should preserve gamepad mapping when changing input method', () => {
      const customMapping: GamepadMapping = {
        shoot: 4,
        moveLeftStick: false,
        moveDpad: true,
        aimRightStick: false
      }
      ControlManager.saveControlSettings({
        inputMethod: 'keyboard',
        gamepadMapping: customMapping
      })
      
      ControlManager.setInputMethod('gamepad')
      
      expect(ControlManager.getGamepadMapping()).toEqual(customMapping)
    })
  })

  describe('getInputMethod', () => {
    it('should return saved input method', () => {
      ControlManager.saveControlSettings({
        inputMethod: 'gamepad',
        gamepadMapping: DEFAULT_GAMEPAD_MAPPING
      })
      
      expect(ControlManager.getInputMethod()).toBe('gamepad')
    })
  })

  describe('getGamepadMapping', () => {
    it('should return default mapping', () => {
      expect(ControlManager.getGamepadMapping()).toEqual(DEFAULT_GAMEPAD_MAPPING)
    })

    it('should return custom mapping', () => {
      const customMapping: GamepadMapping = {
        shoot: 5,
        moveLeftStick: false,
        moveDpad: true,
        aimRightStick: false
      }
      ControlManager.saveControlSettings({
        inputMethod: 'keyboard',
        gamepadMapping: customMapping
      })
      
      expect(ControlManager.getGamepadMapping()).toEqual(customMapping)
    })
  })

  describe('setGamepadMapping', () => {
    it('should update gamepad mapping', () => {
      const newMapping: GamepadMapping = {
        shoot: 0,
        moveLeftStick: true,
        moveDpad: false,
        aimRightStick: true
      }
      
      ControlManager.setGamepadMapping(newMapping)
      
      expect(ControlManager.getGamepadMapping()).toEqual(newMapping)
    })

    it('should preserve input method when changing mapping', () => {
      ControlManager.setInputMethod('gamepad')
      
      ControlManager.setGamepadMapping({
        shoot: 1,
        moveLeftStick: false,
        moveDpad: false,
        aimRightStick: false
      })
      
      expect(ControlManager.getInputMethod()).toBe('gamepad')
    })
  })

  describe('getButtonName', () => {
    it('should return correct name for A/X button', () => {
      expect(ControlManager.getButtonName(0)).toBe('A / X')
    })

    it('should return correct name for B/Circle button', () => {
      expect(ControlManager.getButtonName(1)).toBe('B / Circle')
    })

    it('should return correct name for X/Square button', () => {
      expect(ControlManager.getButtonName(2)).toBe('X / Square')
    })

    it('should return correct name for Y/Triangle button', () => {
      expect(ControlManager.getButtonName(3)).toBe('Y / Triangle')
    })

    it('should return correct name for LB/L1 button', () => {
      expect(ControlManager.getButtonName(4)).toBe('LB / L1')
    })

    it('should return correct name for RB/R1 button', () => {
      expect(ControlManager.getButtonName(5)).toBe('RB / R1')
    })

    it('should return correct name for LT/L2 button', () => {
      expect(ControlManager.getButtonName(6)).toBe('LT / L2')
    })

    it('should return correct name for RT/R2 button', () => {
      expect(ControlManager.getButtonName(7)).toBe('RT / R2')
    })

    it('should return correct name for Back/Share button', () => {
      expect(ControlManager.getButtonName(8)).toBe('Back / Share')
    })

    it('should return correct name for Start/Options button', () => {
      expect(ControlManager.getButtonName(9)).toBe('Start / Options')
    })

    it('should return correct name for L Stick Press', () => {
      expect(ControlManager.getButtonName(10)).toBe('L Stick Press')
    })

    it('should return correct name for R Stick Press', () => {
      expect(ControlManager.getButtonName(11)).toBe('R Stick Press')
    })

    it('should return correct names for D-pad buttons', () => {
      expect(ControlManager.getButtonName(12)).toBe('D-pad Up')
      expect(ControlManager.getButtonName(13)).toBe('D-pad Down')
      expect(ControlManager.getButtonName(14)).toBe('D-pad Left')
      expect(ControlManager.getButtonName(15)).toBe('D-pad Right')
    })

    it('should return generic name for unknown button', () => {
      expect(ControlManager.getButtonName(100)).toBe('Button 100')
    })

    it('should return generic name for negative button index', () => {
      expect(ControlManager.getButtonName(-1)).toBe('Button -1')
    })
  })

  describe('integration tests', () => {
    it('should persist settings across multiple operations', () => {
      // Set input method
      ControlManager.setInputMethod('gamepad')
      
      // Set custom mapping
      const customMapping: GamepadMapping = {
        shoot: 5,
        moveLeftStick: false,
        moveDpad: true,
        aimRightStick: false
      }
      ControlManager.setGamepadMapping(customMapping)
      
      // Get settings
      const settings = ControlManager.getControlSettings()
      
      expect(settings.inputMethod).toBe('gamepad')
      expect(settings.gamepadMapping).toEqual(customMapping)
    })

    it('should handle round-trip serialization', () => {
      const originalSettings: ControlSettings = {
        inputMethod: 'gamepad',
        gamepadMapping: {
          shoot: 4,
          moveLeftStick: true,
          moveDpad: false,
          aimRightStick: true
        }
      }
      
      ControlManager.saveControlSettings(originalSettings)
      const retrievedSettings = ControlManager.getControlSettings()
      
      expect(retrievedSettings).toEqual(originalSettings)
    })
  })
})

describe('GamepadMapping Interface', () => {
  it('should have correct shape', () => {
    const mapping: GamepadMapping = {
      shoot: 7,
      moveLeftStick: true,
      moveDpad: true,
      aimRightStick: true
    }
    
    expect(typeof mapping.shoot).toBe('number')
    expect(typeof mapping.moveLeftStick).toBe('boolean')
    expect(typeof mapping.moveDpad).toBe('boolean')
    expect(typeof mapping.aimRightStick).toBe('boolean')
  })
})

describe('ControlSettings Interface', () => {
  it('should have correct shape', () => {
    const settings: ControlSettings = {
      inputMethod: 'keyboard',
      gamepadMapping: DEFAULT_GAMEPAD_MAPPING
    }
    
    expect(settings.inputMethod).toBe('keyboard')
    expect(settings.gamepadMapping).toBeDefined()
  })

  it('should accept gamepad as input method', () => {
    const settings: ControlSettings = {
      inputMethod: 'gamepad',
      gamepadMapping: DEFAULT_GAMEPAD_MAPPING
    }
    
    expect(settings.inputMethod).toBe('gamepad')
  })
})
