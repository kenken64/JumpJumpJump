/**
 * @fileoverview MusicManager - Background music playback controller
 * 
 * Manages game background music:
 * - Loads music settings from localStorage
 * - Plays/stops music based on settings
 * - Handles music volume control
 * - Graceful fallback if audio not available
 * 
 * @module utils/MusicManager
 */

import Phaser from 'phaser'

/**
 * Controls background music playback for the game
 */
export class MusicManager {
  /** Reference to the Phaser scene */
  private scene: Phaser.Scene
  /** Current music track instance */
  private gameMusic: Phaser.Sound.BaseSound | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  playGameMusic() {
    // Stop any existing music
    if (this.gameMusic) {
      this.gameMusic.stop()
      this.gameMusic.destroy()
    }
    this.scene.sound.stopAll()
    
    // Load music settings from localStorage
    const musicEnabled = localStorage.getItem('musicEnabled') !== 'false'
    const musicVolume = parseFloat(localStorage.getItem('musicVolume') || '0.5')
    
    // Check if gameMusic exists in cache before playing
    if (!this.scene.cache.audio.exists('gameMusic')) {
      console.warn('⚠️ Game music not found in cache. Music disabled.')
      return
    }
    
    // Play game music if enabled
    if (musicEnabled) {
      try {
        this.gameMusic = this.scene.sound.add('gameMusic', { 
          loop: true, 
          volume: musicVolume 
        })
        this.gameMusic.play()
      } catch (error) {
        console.error('❌ Failed to play game music:', error)
      }
    }
  }

  stopMusic() {
    if (this.gameMusic) {
      this.gameMusic.stop()
      this.gameMusic.destroy()
      this.gameMusic = null
    }
    this.scene.sound.stopAll()
  }

  getGameMusic(): Phaser.Sound.BaseSound | null {
    return this.gameMusic
  }
}
