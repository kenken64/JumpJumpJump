import Phaser from 'phaser'

export class MusicManager {
  private scene: Phaser.Scene
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
    
    // Play game music if enabled
    if (musicEnabled) {
      this.gameMusic = this.scene.sound.add('gameMusic', { 
        loop: true, 
        volume: musicVolume 
      })
      this.gameMusic.play()
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
