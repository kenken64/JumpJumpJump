/**
 * @fileoverview AudioManager - Sound effects generation and playback
 * 
 * Generates game sound effects programmatically using Web Audio API:
 * - Jump sounds (single and double jump)
 * - Shooting sounds for various weapons
 * - Melee/stomp sounds
 * - Coin collection sounds
 * - Enemy hit and death sounds
 * - Power-up activation sounds
 * - Boss-related sounds
 * - Portal/checkpoint sounds
 * 
 * All sounds are synthesized rather than loaded from files.
 * 
 * @module utils/AudioManager
 */

/**
 * Manages all game sound effect generation and playback
 * Uses Web Audio API oscillators and noise for procedural audio
 */
export class AudioManager {
  /** Web Audio API context for sound synthesis */
  private audioContext: AudioContext
  /** Whether sound effects are enabled */
  private soundEnabled: boolean = true
  /** Master volume for sound effects (0-1) */
  private soundVolume: number = 0.5

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    this.loadSettings()
  }

  private loadSettings() {
    this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false'
    this.soundVolume = parseFloat(localStorage.getItem('soundVolume') || '0.5')
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  getSoundVolume(): number {
    return this.soundVolume
  }

  playJumpSound(doubleJump: boolean = false) {
    if (!this.isSoundEnabled() || !this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'square'
    oscillator.frequency.value = doubleJump ? 600 : 400
    
    const volume = 0.1 * this.getSoundVolume()
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.1)
  }
  
  playShootSound() {
    if (!this.isSoundEnabled() || !this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.05)
    
    const volume = 0.15 * this.getSoundVolume()
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.05)
  }
  
  playMeleeSound() {
    if (!this.isSoundEnabled() || !this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    const noiseNode = this.audioContext.createBufferSource()
    
    const bufferSize = this.audioContext.sampleRate * 0.1
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    noiseNode.buffer = buffer
    
    oscillator.connect(gainNode)
    noiseNode.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'square'
    oscillator.frequency.value = 150
    
    const volume = 0.2 * this.getSoundVolume()
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
    
    oscillator.start(this.audioContext.currentTime)
    noiseNode.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.1)
    noiseNode.stop(this.audioContext.currentTime + 0.1)
  }
  
  playCoinSound() {
    if (!this.isSoundEnabled() || !this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.05)
    
    const volume = 0.15 * this.getSoundVolume()
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.15)
  }
  
  playDamageSound() {
    if (!this.isSoundEnabled() || !this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2)
    
    const volume = 0.2 * this.getSoundVolume()
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.2)
  }
  
  playDeathSound() {
    if (!this.isSoundEnabled() || !this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5)
    
    const volume = 0.3 * this.getSoundVolume()
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.5)
  }
  
  playBossSound() {
    if (!this.isSoundEnabled() || !this.audioContext?.createOscillator) return
    
    const oscillator1 = this.audioContext.createOscillator()
    const oscillator2 = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator1.type = 'sine'
    oscillator2.type = 'sawtooth'
    oscillator1.frequency.value = 80
    oscillator2.frequency.value = 120
    
    const volume = 0.3 * this.getSoundVolume()
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0)
    
    oscillator1.start(this.audioContext.currentTime)
    oscillator2.start(this.audioContext.currentTime)
    oscillator1.stop(this.audioContext.currentTime + 1.0)
    oscillator2.stop(this.audioContext.currentTime + 1.0)
  }
  
  playBossAttackSound() {
    if (!this.isSoundEnabled() || !this.audioContext?.createOscillator) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime)
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.1)
    
    const volume = 0.2 * this.getSoundVolume()
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.15)
  }
}
