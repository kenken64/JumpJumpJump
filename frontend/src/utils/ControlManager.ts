/**
 * @fileoverview ControlManager - Manages input control settings and gamepad mappings
 * 
 * Handles:
 * - Input method selection (keyboard vs gamepad)
 * - Gamepad button mappings
 * - Settings persistence via localStorage
 * - Button name lookups for UI display
 * 
 * @module utils/ControlManager
 */

/**
 * Gamepad button mapping configuration
 */
export interface GamepadMapping {
  shoot: number
  moveLeftStick: boolean
  moveDpad: boolean
  aimRightStick: boolean
}

/**
 * Complete control settings including input method and mappings
 */
export interface ControlSettings {
  inputMethod: 'keyboard' | 'gamepad'
  gamepadMapping: GamepadMapping
}

/** Default gamepad button mappings - RT for shoot, sticks for movement/aim */
export const DEFAULT_GAMEPAD_MAPPING: GamepadMapping = {
  shoot: 7, // RT (Right Trigger)
  moveLeftStick: true,
  moveDpad: true,
  aimRightStick: true
}

/** Default control settings - keyboard input with standard gamepad mapping */
export const DEFAULT_CONTROL_SETTINGS: ControlSettings = {
  inputMethod: 'keyboard',
  gamepadMapping: DEFAULT_GAMEPAD_MAPPING
}

/**
 * Static utility class for managing game control settings
 * Persists settings to localStorage for cross-session retention
 */
export class ControlManager {
  /**
   * Get current control settings from localStorage
   * @returns Current settings or defaults if none saved
   */
  static getControlSettings(): ControlSettings {
    const saved = localStorage.getItem('controlSettings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return DEFAULT_CONTROL_SETTINGS
      }
    }
    return DEFAULT_CONTROL_SETTINGS
  }

  static saveControlSettings(settings: ControlSettings): void {
    localStorage.setItem('controlSettings', JSON.stringify(settings))
  }

  static setInputMethod(method: 'keyboard' | 'gamepad'): void {
    const settings = this.getControlSettings()
    settings.inputMethod = method
    this.saveControlSettings(settings)
  }

  static getInputMethod(): 'keyboard' | 'gamepad' {
    return this.getControlSettings().inputMethod
  }

  static getGamepadMapping(): GamepadMapping {
    return this.getControlSettings().gamepadMapping
  }

  static setGamepadMapping(mapping: GamepadMapping): void {
    const settings = this.getControlSettings()
    settings.gamepadMapping = mapping
    this.saveControlSettings(settings)
  }

  static getButtonName(buttonIndex: number): string {
    const buttonNames: { [key: number]: string } = {
      0: 'A / X',
      1: 'B / Circle',
      2: 'X / Square',
      3: 'Y / Triangle',
      4: 'LB / L1',
      5: 'RB / R1',
      6: 'LT / L2',
      7: 'RT / R2',
      8: 'Back / Share',
      9: 'Start / Options',
      10: 'L Stick Press',
      11: 'R Stick Press',
      12: 'D-pad Up',
      13: 'D-pad Down',
      14: 'D-pad Left',
      15: 'D-pad Right'
    }
    return buttonNames[buttonIndex] || `Button ${buttonIndex}`
  }
}
