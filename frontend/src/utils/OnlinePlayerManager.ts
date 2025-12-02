/**
 * @fileoverview OnlinePlayerManager - Manages players in online co-op mode
 * 
 * Handles all aspects of online 2-player gameplay:
 * - Local player sprite creation and control
 * - Remote player sprite rendering and interpolation
 * - Network state synchronization
 * - Health bars and lives display for both players
 * - Collision handling
 * - Enemy and coin synchronization
 * 
 * @module utils/OnlinePlayerManager
 */

import Phaser from 'phaser'
import { OnlineCoopService, NetworkPlayerState, NetworkGameState, NetworkEnemyState, NetworkCoinState } from '../services/OnlineCoopService'

/**
 * Complete state for a player in online mode
 */
export interface OnlinePlayer {
  playerId: string
  playerNumber: number
  sprite: Phaser.Physics.Arcade.Sprite
  gun: Phaser.GameObjects.Image
  healthBar: Phaser.GameObjects.Rectangle
  healthBarBg: Phaser.GameObjects.Rectangle
  livesText: Phaser.GameObjects.Text
  nameText: Phaser.GameObjects.Text
  isLocal: boolean
  state: NetworkPlayerState
  // Interpolation for remote players
  targetX?: number
  targetY?: number
  lastUpdateTime?: number
}

/**
 * Tracked enemy state for synchronization
 */
interface TrackedEnemy {
  enemyId: string
  sprite: Phaser.Physics.Arcade.Sprite
  state: NetworkEnemyState
  targetX?: number
  targetY?: number
  lastUpdateTime?: number
}

/**
 * Manages online multiplayer players
 */
export class OnlinePlayerManager {
  private scene: Phaser.Scene
  private onlineService: OnlineCoopService
  private localPlayer: OnlinePlayer | null = null
  private remotePlayer: OnlinePlayer | null = null
  private platforms: Phaser.Physics.Arcade.StaticGroup
  private lastStateSendTime: number = 0
  private stateSendInterval: number = 16 // Send state every 16ms (60 times per second)
  private interpolationSpeed: number = 0.35 // Faster interpolation for smoother movement
  private positionSnapThreshold: number = 200 // Snap if difference is too large
  
  // Enemy sync tracking
  private trackedEnemies: Map<string, TrackedEnemy> = new Map()
  private lastEnemySyncTime: number = 0
  private enemySyncInterval: number = 50 // Sync enemies every 50ms (20 times per second)
  
  // Tethered scrolling - camera won't scroll forward unless both players are close
  private tetherMaxScrollX: number = 0 // Maximum scroll X based on trailing player
  private readonly TETHER_DISTANCE_THRESHOLD = 400 // Players must be within this distance to scroll forward
  
  // Entity sync callbacks for GameScene
  private onEnemySpawnedCallback?: (enemy: NetworkEnemyState) => void
  private onEnemyKilledCallback?: (enemyId: string, killedBy: string) => void
  private onEnemyStateUpdateCallback?: (enemyId: string, state: Partial<NetworkEnemyState>) => void
  private onCoinSpawnedCallback?: (coin: NetworkCoinState) => void
  private onEntitiesSyncCallback?: (enemies: NetworkEnemyState[], coins: NetworkCoinState[]) => void
  
  constructor(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene
    this.platforms = platforms
    this.onlineService = OnlineCoopService.getInstance()
    
    // Setup network callbacks
    this.setupNetworkCallbacks()
  }
  
  /**
   * Set callbacks for entity sync events (called by GameScene)
   */
  setEntityCallbacks(callbacks: {
    onEnemySpawned?: (enemy: NetworkEnemyState) => void
    onEnemyKilled?: (enemyId: string, killedBy: string) => void
    onEnemyStateUpdate?: (enemyId: string, state: Partial<NetworkEnemyState>) => void
    onCoinSpawned?: (coin: NetworkCoinState) => void
    onEntitiesSync?: (enemies: NetworkEnemyState[], coins: NetworkCoinState[]) => void
  }): void {
    this.onEnemySpawnedCallback = callbacks.onEnemySpawned
    this.onEnemyKilledCallback = callbacks.onEnemyKilled
    this.onEnemyStateUpdateCallback = callbacks.onEnemyStateUpdate
    this.onCoinSpawnedCallback = callbacks.onCoinSpawned
    this.onEntitiesSyncCallback = callbacks.onEntitiesSync
  }
  
  /**
   * Setup callbacks for receiving network updates
   */
  private setupNetworkCallbacks(): void {
    this.onlineService.setCallbacks({
      onPlayerStateUpdate: (playerId: string, state: Partial<NetworkPlayerState>) => {
        this.handleRemotePlayerUpdate(playerId, state)
      },
      
      onGameAction: (playerId: string, action: string, data: any) => {
        this.handleRemoteGameAction(playerId, action, data)
      },
      
      onPlayerLeft: (playerId: string) => {
        if (this.remotePlayer && this.remotePlayer.playerId === playerId) {
          this.destroyPlayer(this.remotePlayer)
          this.remotePlayer = null
          // Show message that partner disconnected
          this.showDisconnectMessage()
        }
      },
      
      onPlayerDisconnected: (playerId: string, playerName: string, canReconnect: boolean) => {
        if (this.remotePlayer && this.remotePlayer.playerId === playerId) {
          if (canReconnect) {
            this.showWaitingForReconnectMessage(playerName)
          } else {
            this.destroyPlayer(this.remotePlayer)
            this.remotePlayer = null
            this.showDisconnectMessage()
          }
        }
      },
      
      onPlayerReconnected: (_playerId: string, playerName: string) => {
        this.showReconnectedMessage(playerName)
        // Remote player sprite is recreated from game state
      },
      
      onChat: (_playerId: string, playerName: string, message: string) => {
        this.showChatMessage(playerName, message)
      },
      
      onItemCollected: (playerId: string, itemType: string, itemId: string, playerCoins?: number | null, playerScore?: number | null) => {
        // Item was collected by remote player - destroy it locally if it exists
        this.handleRemoteItemCollected(playerId, itemType, itemId, playerCoins ?? undefined, playerScore ?? undefined)
      },
      
      // Enemy sync callbacks
      onEnemyStateUpdate: (enemyId: string, state: Partial<NetworkEnemyState>) => {
        this.onEnemyStateUpdateCallback?.(enemyId, state)
      },
      
      onEnemySpawned: (enemy: NetworkEnemyState) => {
        console.log('👾 Remote enemy spawned:', enemy.enemy_id, enemy.enemy_type)
        this.onEnemySpawnedCallback?.(enemy)
        // If we are host and the spawn corresponds to our local enemy, ensure it is tracked
        if (this.isHost() && enemy.enemy_id && !this.trackedEnemies.has(enemy.enemy_id)) {
          // host-side will track enemies as they are created locally; if we missed one, add placeholder
          // actual sprite association should be done by GameScene via trackLocalEnemy when available
          this.trackedEnemies.set(enemy.enemy_id, {
            enemyId: enemy.enemy_id,
            sprite: null as any,
            state: enemy
          })
        }
      },
      
      onEnemyKilled: (enemyId: string, killedBy: string) => {
        console.log('💀 Remote enemy killed:', enemyId, 'by', killedBy)
        // Remove tracked enemy if present
        if (this.trackedEnemies.has(enemyId)) {
          this.trackedEnemies.delete(enemyId)
        }
        this.onEnemyKilledCallback?.(enemyId, killedBy)
      },
      
      onEnemyAlreadyDead: (enemyId: string) => {
        console.log('⚠️ Enemy already dead:', enemyId)
        // Enemy was killed by other player before our request arrived
      },
      
      // Coin sync callbacks
      onCoinSpawned: (coin: NetworkCoinState) => {
        console.log('🪙 Remote coin spawned:', coin.coin_id)
        this.onCoinSpawnedCallback?.(coin)
      },
      
      // Full entity sync
      onEntitiesSync: (enemies: NetworkEnemyState[], coins: NetworkCoinState[], sequenceId: number) => {
        console.log('🔄 Entities sync received, seq:', sequenceId, 'enemies:', enemies.length, 'coins:', coins.length)
        this.onEntitiesSyncCallback?.(enemies, coins)
      }
    })
  }

  /**
   * Register a locally spawned enemy for host-authoritative updates
   */
  trackLocalEnemy(sprite: Phaser.Physics.Arcade.Sprite, enemyId?: string): void {
    if (!sprite) return
    const id = enemyId || sprite.getData('enemyId')
    if (!id) return
    const state: NetworkEnemyState = {
      enemy_id: id,
      enemy_type: sprite.getData('enemyType') || 'fly',
      x: sprite.x,
      y: sprite.y,
      velocity_x: (sprite.body as Phaser.Physics.Arcade.Body)?.velocity.x || 0,
      velocity_y: (sprite.body as Phaser.Physics.Arcade.Body)?.velocity.y || 0,
      health: sprite.getData('health') || 1,
      max_health: sprite.getData('maxHealth') || sprite.getData('health') || 1,
      is_alive: true,
      facing_right: sprite.scaleX >= 0,
      state: 'idle'
    }
    this.trackedEnemies.set(id, { enemyId: id, sprite, state })
  }

  /**
   * Unregister enemy from tracking
   */
  untrackEnemy(enemyId: string): void {
    if (this.trackedEnemies.has(enemyId)) this.trackedEnemies.delete(enemyId)
  }
  
  /**
   * Initialize players from game state
   */
  initializePlayers(
    gameState: NetworkGameState,
    _bulletGroup: Phaser.Physics.Arcade.Group
  ): void {
    const localPlayerId = this.onlineService.playerId
    
    console.log('🎮 Initializing players from game state:', {
      localPlayerId,
      playerCount: Object.keys(gameState.players).length,
      players: Object.entries(gameState.players).map(([id, p]) => ({
        id,
        name: p.player_name,
        number: p.player_number,
        skin: p.skin,
        x: p.x,
        y: p.y
      }))
    })
    
    for (const [playerId, playerState] of Object.entries(gameState.players)) {
      const isLocal = playerId === localPlayerId
      
      console.log(`Creating ${isLocal ? 'LOCAL' : 'REMOTE'} player:`, playerId, playerState.player_name, playerState.skin)
      
      const player = this.createPlayer(
        playerId,
        playerState.player_number,
        playerState.x,
        playerState.y,
        playerState.skin,
        isLocal
      )
      
      if (isLocal) {
        this.localPlayer = player
        // Reset tether anchor when initializing local player
        this.tetherMaxScrollX = player.sprite.x
      } else {
        this.remotePlayer = player
        // Initialize target position for interpolation
        this.remotePlayer.targetX = playerState.x
        this.remotePlayer.targetY = playerState.y
        console.log('✅ Remote player initialized:', {
          playerId,
          skin: player.state.skin,
          spriteTexture: player.sprite.texture?.key,
          spriteVisible: player.sprite.visible,
          spriteActive: player.sprite.active,
          spritePosition: { x: player.sprite.x, y: player.sprite.y }
        })
      }
    }
  }
  
  /**
   * Create a player sprite with UI
   */
  private createPlayer(
    playerId: string,
    playerNumber: number,
    x: number,
    y: number,
    skin: string,
    isLocal: boolean
  ): OnlinePlayer {
    // Validate skin texture exists, fallback to alienGreen if not
    const textureKey = `${skin}_stand`
    if (!this.scene.textures.exists(textureKey)) {
      console.warn(`Texture ${textureKey} not found, falling back to alienGreen_stand`)
      skin = 'alienGreen'
    }
    
    // Create player sprite
    const sprite = this.scene.physics.add.sprite(x, y, `${skin}_stand`)
    sprite.setScale(0.8)
    sprite.setBounce(0.1)
    sprite.setCollideWorldBounds(false)
    sprite.setData('playerNumber', playerNumber)
    sprite.setData('playerId', playerId)
    sprite.setDepth(10) // Ensure player renders above background
    
    console.log(`Created player sprite for ${isLocal ? 'local' : 'remote'} player:`, {
      playerId,
      playerNumber,
      skin,
      texture: `${skin}_stand`,
      x,
      y,
      spriteActive: sprite.active,
      spriteVisible: sprite.visible,
      spriteTexture: sprite.texture?.key,
      spriteFrame: sprite.frame?.name,
      textureExists: this.scene.textures.exists(`${skin}_stand`)
    })
    
    // Setup physics
    if (sprite.body) {
      const body = sprite.body as Phaser.Physics.Arcade.Body
      body.setGravityY(400)
      body.setSize(50, 70)
      body.setOffset(10, 10)
    }
    
    // Add platform collision
    this.scene.physics.add.collider(sprite, this.platforms)
    
    // Create gun
    const gun = this.scene.add.image(x, y, 'raygun')
    gun.setScale(0.6)
    gun.setDepth(1)
    
    // Create health bar
    const barWidth = 60
    const healthBarBg = this.scene.add.rectangle(0, 0, barWidth + 4, 10, 0x333333)
    const healthBar = this.scene.add.rectangle(0, 0, barWidth, 6, playerNumber === 1 ? 0x00ff00 : 0x00ffff)
    
    // Create lives text
    const livesText = this.scene.add.text(0, 0, '❤️❤️❤️', {
      fontSize: '14px'
    })
    livesText.setOrigin(0.5)
    
    // Create name label
    const playerName = this.onlineService.roomInfo?.players.find(p => p.player_id === playerId)?.player_name || `Player ${playerNumber}`
    const nameText = this.scene.add.text(0, 0, playerName, {
      fontSize: '12px',
      color: playerNumber === 1 ? '#00ff00' : '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    nameText.setOrigin(0.5)
    
    // If remote player, make sprite slightly transparent
    if (!isLocal) {
      sprite.setAlpha(0.9)
    }
    
    // Create walk animation
    const animKey = `${skin}_walk`
    if (!this.scene.anims.exists(animKey)) {
      this.scene.anims.create({
        key: animKey,
        frames: [
          { key: `${skin}_walk1` },
          { key: `${skin}_stand` },
          { key: `${skin}_walk2` },
          { key: `${skin}_stand` }
        ],
        frameRate: 10,
        repeat: -1
      })
    }
    
    const state: NetworkPlayerState = {
      player_id: playerId,
      player_name: playerName,
      player_number: playerNumber,
      x,
      y,
      velocity_x: 0,
      velocity_y: 0,
      health: 100,
      lives: 3,
      score: 0,
      skin,
      weapon: 'raygun',
      is_alive: true,
      is_ready: true,
      facing_right: true,
      is_jumping: false,
      is_shooting: false
    }
    
    return {
      playerId,
      playerNumber,
      sprite,
      gun,
      healthBar,
      healthBarBg,
      livesText,
      nameText,
      isLocal,
      state
    }
  }
  
  /**
   * Handle remote player state update
   */
  private handleRemotePlayerUpdate(playerId: string, state: Partial<NetworkPlayerState>): void {
    // Log every state update (reduce frequency if too noisy)
    console.log('📡 Remote player state update:', {
      playerId,
      hasRemotePlayer: !!this.remotePlayer,
      remotePlayerId: this.remotePlayer?.playerId,
      stateX: state.x,
      stateY: state.y,
      stateSkin: state.skin
    })
    
    if (!this.remotePlayer || this.remotePlayer.playerId !== playerId) {
      console.warn('❌ Ignoring state update - no matching remote player')
      return
    }
    
    // Update target position for interpolation
    if (state.x !== undefined) this.remotePlayer.targetX = state.x
    if (state.y !== undefined) this.remotePlayer.targetY = state.y
    
    // Store velocity for prediction
    if (state.velocity_x !== undefined) this.remotePlayer.state.velocity_x = state.velocity_x
    if (state.velocity_y !== undefined) this.remotePlayer.state.velocity_y = state.velocity_y
    
    // Update other state
    Object.assign(this.remotePlayer.state, state)
    
    // Update sprite facing (gun is handled in updatePlayerUI)
    if (state.facing_right !== undefined) {
      this.remotePlayer.sprite.setFlipX(!state.facing_right)
    }
    
    // Update animations based on state
    this.updateRemotePlayerAnimation(state)
    
    this.remotePlayer.lastUpdateTime = Date.now()
  }
  
  /**
   * Update remote player animation based on state
   */
  private updateRemotePlayerAnimation(state: Partial<NetworkPlayerState>): void {
    if (!this.remotePlayer) return
    
    const skin = this.remotePlayer.state.skin
    const sprite = this.remotePlayer.sprite
    
    // Validate skin exists
    if (!skin) {
      console.warn('❌ Remote player has no skin set!')
      return
    }
    
    // Validate textures exist before setting
    const jumpTexture = `${skin}_jump`
    const standTexture = `${skin}_stand`
    
    if (state.is_jumping) {
      if (this.scene.textures.exists(jumpTexture)) {
        sprite.setTexture(jumpTexture)
      }
    } else if (Math.abs(state.velocity_x || 0) > 20) {
      const animKey = `${skin}_walk`
      if (this.scene.anims.exists(animKey)) {
        if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
          sprite.play(animKey)
        }
      }
    } else {
      if (this.scene.textures.exists(standTexture)) {
        sprite.setTexture(standTexture)
      }
    }
  }
  
  /**
   * Handle remote game actions
   */
  private handleRemoteGameAction(playerId: string, action: string, data: any): void {
    if (!this.remotePlayer || this.remotePlayer.playerId !== playerId) return
    
    switch (action) {
      case 'shoot':
        this.createRemoteBullet(data)
        break
      case 'damage':
        // Remote player took damage
        this.remotePlayer.state.health = data.health
        this.remotePlayer.state.lives = data.lives
        break
      case 'death':
        this.remotePlayer.state.lives = data.lives
        this.remotePlayer.state.is_alive = false
        this.handleRemotePlayerDeath()
        
        // If remote player is permanently out (no lives left)
        if (data.is_permanent || data.lives <= 0) {
          this.showRemotePlayerOutMessage()
        }
        break
      case 'respawn':
        this.handleRemotePlayerRespawn(data)
        break
      case 'assist':
        // Remote player attempted to assist someone (usually host-initiated)
        const targetId = data?.target_player_id
        const newX = data?.x
        const newY = data?.y
        if (!targetId) return

        // If the target is the local player, apply immediate correction
        if (this.localPlayer && this.localPlayer.playerId === targetId) {
          this.localPlayer.sprite.setPosition(newX ?? this.localPlayer.sprite.x, newY ?? this.localPlayer.sprite.y)
        }

        // If the target is the remote, apply position correction
        if (this.remotePlayer && this.remotePlayer.playerId === targetId) {
          this.remotePlayer.sprite.setPosition(newX ?? this.remotePlayer.sprite.x, newY ?? this.remotePlayer.sprite.y)
        }

        // Also fire a UI hint on the scene (best-effort)
        try {
          const sceneAny = this.scene as any
          if (sceneAny && typeof sceneAny.showTip === 'function') {
            sceneAny.showTip('assist_received', `${playerId} assisted ${targetId}`)
          }
        } catch (e) {
          // silent
        }
        break
    }
  }
  
  /**
   * Create bullet from remote player
   */
  private createRemoteBullet(data: { x: number, y: number, velocityX: number, velocityY: number, weapon?: string, angle?: number }): void {
    if (!this.remotePlayer) return
    
    // Choose bullet texture based on weapon
    let bulletTexture = 'laserBlue'
    if (data.weapon === 'laserGun') {
      bulletTexture = 'laserGreen'
    } else if (data.weapon === 'bazooka') {
      bulletTexture = 'rocket'
    }
    
    // Create bullet visual effect
    const bullet = this.scene.add.image(data.x, data.y, bulletTexture)
    bullet.setScale(0.5)
    if (data.angle !== undefined) {
      bullet.setRotation(data.angle)
    }
    
    // Calculate end position based on velocity (simulate ~2 seconds of travel)
    const endX = data.x + data.velocityX * 2
    const endY = data.y + data.velocityY * 2
    
    // Animate bullet movement
    this.scene.tweens.add({
      targets: bullet,
      x: endX,
      y: endY,
      duration: 1500,
      ease: 'Linear',
      onComplete: () => bullet.destroy()
    })
    
    // Play shoot sound
    const audioManager = (this.scene as any).audioManager
    if (audioManager && audioManager.playShootSound) {
      audioManager.playShootSound()
    }
  }
  
  /**
   * Handle remote player death
   */
  private handleRemotePlayerDeath(): void {
    if (!this.remotePlayer) return
    
    this.remotePlayer.sprite.setTint(0xff0000)
    this.scene.time.delayedCall(500, () => {
      if (this.remotePlayer) {
        this.remotePlayer.sprite.setVisible(false)
      }
    })
  }
  
  /**
   * Show message when remote player is out of lives
   */
  private showRemotePlayerOutMessage(): void {
    const partnerName = this.remotePlayer?.state.player_name || 'Partner'
    const text = this.scene.add.text(640, 150, `💀 ${partnerName} is out!`, {
      fontSize: '28px',
      color: '#ff6666',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    text.setOrigin(0.5)
    text.setScrollFactor(0)
    text.setDepth(100)
    
    // Fade out after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: text,
        alpha: 0,
        duration: 500,
        onComplete: () => text.destroy()
      })
    })
  }
  
  /**
   * Handle remote player respawn
   */
  private handleRemotePlayerRespawn(data: { x: number, y: number }): void {
    if (!this.remotePlayer) return
    
    this.remotePlayer.sprite.setPosition(data.x, data.y)
    this.remotePlayer.sprite.setVisible(true)
    this.remotePlayer.sprite.clearTint()
    this.remotePlayer.state.is_alive = true
  }
  
  /**
   * Update method called every frame
   */
  update(time: number, delta: number): void {
    // Debug log remote player state (every ~1 second)
    if (this.remotePlayer && time % 1000 < 20) {
      console.log('Remote player state:', {
        playerId: this.remotePlayer.playerId,
        skin: this.remotePlayer.state.skin,
        spriteX: Math.round(this.remotePlayer.sprite.x),
        spriteY: Math.round(this.remotePlayer.sprite.y),
        targetX: this.remotePlayer.targetX,
        targetY: this.remotePlayer.targetY,
        spriteActive: this.remotePlayer.sprite.active,
        spriteVisible: this.remotePlayer.sprite.visible,
        spriteAlpha: this.remotePlayer.sprite.alpha,
        spriteTexture: this.remotePlayer.sprite.texture?.key,
        spriteWidth: this.remotePlayer.sprite.width,
        spriteHeight: this.remotePlayer.sprite.height
      })
    }
    
    // Ensure remote player sprite stays visible and valid
    if (this.remotePlayer && this.remotePlayer.state.is_alive) {
      if (!this.remotePlayer.sprite.visible) {
        console.warn('Remote player sprite was hidden, making visible again')
        this.remotePlayer.sprite.setVisible(true)
      }
      if (this.remotePlayer.sprite.alpha < 0.5) {
        console.warn('Remote player sprite alpha too low, resetting')
        this.remotePlayer.sprite.setAlpha(0.9)
      }
    }
    
    // Update UI positions
    this.updatePlayerUI(this.localPlayer)
    this.updatePlayerUI(this.remotePlayer)
    
    // Interpolate remote player position
    this.interpolateRemotePlayer(delta)
    
    // Send local player state to server
    this.sendLocalPlayerState(time)
    // Send enemies states if host
    this.sendTrackedEnemiesState(time)
  }

  /**
   * Periodically send tracked enemy states to server (host only)
   */
  private sendTrackedEnemiesState(time: number): void {
    if (!this.isHost()) return
    if (time - this.lastEnemySyncTime < this.enemySyncInterval) return
    this.lastEnemySyncTime = time

    for (const [id, tracked] of this.trackedEnemies) {
      const sprite = tracked.sprite
      // If sprite is not yet attached (placeholder), skip
      if (!sprite || !sprite.body) continue

      const body = sprite.body as Phaser.Physics.Arcade.Body
      const state: Partial<NetworkEnemyState> = {
        x: Math.round(sprite.x),
        y: Math.round(sprite.y),
        velocity_x: Math.round(body.velocity.x),
        velocity_y: Math.round(body.velocity.y),
        health: sprite.getData('health'),
        is_alive: sprite.active && (sprite.getData('health') === undefined ? true : sprite.getData('health') > 0)
      }

      // Update local cached state
      tracked.state = { ...tracked.state, ...state }

      // Send to server
      try {
        this.onlineService.sendEnemyState(id, state)
      } catch (err) {
        console.warn('Failed to send enemy state for', id, err)
      }
    }
  }
  
  /**
   * Update UI elements position for a player
   */
  private updatePlayerUI(player: OnlinePlayer | null): void {
    if (!player || !player.sprite.active) return
    
    const x = player.sprite.x
    const y = player.sprite.y
    
    // Debug log for remote player UI updates (every ~2 seconds)
    if (!player.isLocal && Date.now() % 2000 < 20) {
      console.log('🎨 Remote player UI update:', {
        spritePos: { x: Math.round(x), y: Math.round(y) },
        spriteVisible: player.sprite.visible,
        spriteAlpha: player.sprite.alpha,
        spriteTexture: player.sprite.texture?.key,
        spriteScale: { x: player.sprite.scaleX, y: player.sprite.scaleY },
        spriteDepth: player.sprite.depth
      })
    }
    
    // Update gun position and rotation based on facing direction
    const gunOffsetX = player.state.facing_right ? 25 : -25
    player.gun.setPosition(x + gunOffsetX, y + 5)
    
    // Flip gun when facing left and rotate properly
    if (player.state.facing_right) {
      player.gun.setFlipX(false)
      player.gun.setRotation(0)
      player.gun.setScale(0.6, 0.6)
    } else {
      player.gun.setFlipX(true)
      player.gun.setRotation(Math.PI) // Rotate 180 degrees
      player.gun.setScale(0.6, -0.6) // Flip Y to keep gun right-side up
    }
    
    // Update health bar
    player.healthBarBg.setPosition(x, y - 50)
    player.healthBar.setPosition(x - 30 + (player.state.health / 100 * 30), y - 50)
    player.healthBar.setSize(player.state.health / 100 * 60, 6)
    
    // Update lives
    player.livesText.setPosition(x, y - 65)
    player.livesText.setText('❤️'.repeat(Math.max(0, player.state.lives)))
    
    // Update name
    player.nameText.setPosition(x, y - 80)
  }
  
  /**
   * Interpolate remote player position for smooth movement
   */
  private interpolateRemotePlayer(delta: number): void {
    if (!this.remotePlayer || this.remotePlayer.targetX === undefined) return
    
    const sprite = this.remotePlayer.sprite
    const targetX = this.remotePlayer.targetX
    const targetY = this.remotePlayer.targetY ?? sprite.y
    
    // Calculate distance to target
    const distX = Math.abs(targetX - sprite.x)
    const distY = Math.abs(targetY - sprite.y)
    
    // If too far, snap to position (teleport/respawn detection)
    if (distX > this.positionSnapThreshold || distY > this.positionSnapThreshold) {
      sprite.setPosition(targetX, targetY)
      return
    }
    
    // Use velocity for prediction if available
    const vx = this.remotePlayer.state.velocity_x || 0
    const vy = this.remotePlayer.state.velocity_y || 0
    
    // Calculate interpolation factor based on frame time
    const t = Math.min(1, this.interpolationSpeed * (delta / 16.67))
    
    // Predict position slightly ahead based on velocity
    const predictedX = targetX + (vx * 0.016) // 16ms prediction
    const predictedY = targetY + (vy * 0.016)
    
    // Smooth interpolation towards predicted position
    const newX = Phaser.Math.Linear(sprite.x, predictedX, t)
    const newY = Phaser.Math.Linear(sprite.y, predictedY, t)
    
    sprite.setPosition(newX, newY)
  }
  
  /**
   * Send local player state to server
   */
  private sendLocalPlayerState(time: number): void {
    if (!this.localPlayer || time - this.lastStateSendTime < this.stateSendInterval) return
    
    const sprite = this.localPlayer.sprite
    const body = sprite.body as Phaser.Physics.Arcade.Body
    
    this.onlineService.sendPlayerState({
      x: sprite.x,
      y: sprite.y,
      velocity_x: body.velocity.x,
      velocity_y: body.velocity.y,
      health: this.localPlayer.state.health,
      lives: this.localPlayer.state.lives,
      score: this.localPlayer.state.score,
      is_alive: this.localPlayer.state.is_alive,
      facing_right: this.localPlayer.state.facing_right,
      is_jumping: !body.onFloor(),
      is_shooting: this.localPlayer.state.is_shooting
    })
    
    this.lastStateSendTime = time
  }
  
  /**
   * Get the local player
   */
  getLocalPlayer(): OnlinePlayer | null {
    return this.localPlayer
  }
  
  /**
   * Get the remote player
   */
  getRemotePlayer(): OnlinePlayer | null {
    return this.remotePlayer
  }
  
  /**
   * Get local player sprite
   */
  getLocalSprite(): Phaser.Physics.Arcade.Sprite | null {
    return this.localPlayer?.sprite || null
  }
  
  /**
   * Get the X position of the furthest player (for chunk generation)
   * This ensures both clients generate the same chunks at the same time
   */
  getFurthestPlayerX(): number {
    const localX = this.localPlayer?.sprite?.x ?? 0
    const remoteX = this.remotePlayer?.sprite?.x ?? 0
    return Math.max(localX, remoteX)
  }
  
  /**
   * Update local player state
   */
  updateLocalState(updates: Partial<NetworkPlayerState>): void {
    if (this.localPlayer) {
      Object.assign(this.localPlayer.state, updates)
    }
  }
  
  /**
   * Send a game action to the server
   */
  sendAction(action: string, data: any = {}): void {
    this.onlineService.sendGameAction(action, data)
  }
  
  /**
   * Get camera focus point between players with tethered scrolling.
   * The camera won't scroll forward unless both players are close together.
   * This keeps both players on screen and encourages cooperative movement.
   * 
   * When one player dies (out of lives), tethered scrolling is disabled
   * to allow the surviving player to continue playing freely.
   */
  getCameraFocusPoint(): { x: number, y: number } {
    if (!this.localPlayer) return { x: 640, y: 360 }

    // If local player is dead and out of lives, follow remote player
    if (!this.localPlayer.state.is_alive && this.localPlayer.state.lives <= 0) {
      if (this.remotePlayer && this.remotePlayer.state.is_alive) {
        return { x: this.remotePlayer.sprite.x, y: this.remotePlayer.sprite.y }
      }
    }

    // Single player or remote player unavailable - just follow local player (no tether)
    if (!this.remotePlayer || !this.remotePlayer.sprite.active) {
      return { x: this.localPlayer.sprite.x, y: this.localPlayer.sprite.y }
    }

    // Check if either player is out of lives - disable tethering to let survivor play freely
    const localOutOfLives = this.localPlayer.state.lives <= 0
    const remoteOutOfLives = this.remotePlayer.state.lives <= 0
    
    if (localOutOfLives || remoteOutOfLives) {
      // One player is out - follow the surviving player without tethering
      if (localOutOfLives && this.remotePlayer.state.is_alive) {
        return { x: this.remotePlayer.sprite.x, y: this.remotePlayer.sprite.y }
      } else if (remoteOutOfLives && this.localPlayer.state.is_alive) {
        return { x: this.localPlayer.sprite.x, y: this.localPlayer.sprite.y }
      }
      // Both out of lives - center between them
      return {
        x: (this.localPlayer.sprite.x + this.remotePlayer.sprite.x) / 2,
        y: (this.localPlayer.sprite.y + this.remotePlayer.sprite.y) / 2
      }
    }

    const lx = this.localPlayer.sprite.x
    const ly = this.localPlayer.sprite.y
    const rx = this.remotePlayer.sprite.x
    const ry = this.remotePlayer.sprite.y

    // Find leading and trailing player positions
    const leadingX = Math.max(lx, rx)
    const trailingX = Math.min(lx, rx)
    const distanceX = leadingX - trailingX

    // Calculate the center point between players for Y axis (always center vertically)
    const centerY = (ly + ry) / 2

    // Tethered scrolling logic:
    // 1. If players are close together (within threshold), allow camera to advance to center
    // 2. If players are far apart, anchor camera to trailing player's position
    
    if (distanceX <= this.TETHER_DISTANCE_THRESHOLD) {
      // Players are close - allow camera to scroll forward to their center
      const centerX = (lx + rx) / 2
      // Update tether anchor to allow scrolling to this position
      this.tetherMaxScrollX = Math.max(this.tetherMaxScrollX, centerX)
      return { x: centerX, y: centerY }
    } else {
      // Players are far apart - tether camera to trailing player
      // Camera focus should not go beyond trailing player + some buffer
      // This keeps the trailing player visible and prevents camera from leaving them behind
      const tetherFocusX = trailingX + (this.TETHER_DISTANCE_THRESHOLD / 2)
      
      // Don't let camera go backwards beyond what we've already scrolled
      // (prevents jarring backward scrolling when a player dies and respawns)
      const focusX = Math.max(tetherFocusX, this.tetherMaxScrollX - 200)
      
      // Update tether anchor
      this.tetherMaxScrollX = Math.max(this.tetherMaxScrollX, focusX)
      
      return { x: focusX, y: centerY }
    }
  }
  
  /**
   * Check if both players are out of lives (game over condition)
   */
  areBothPlayersOutOfLives(): boolean {
    const localOut = !this.localPlayer || this.localPlayer.state.lives <= 0
    const remoteOut = !this.remotePlayer || this.remotePlayer.state.lives <= 0
    return localOut && remoteOut
  }
  
  /**
   * Check if the local player is out of lives
   */
  isLocalPlayerOutOfLives(): boolean {
    return !this.localPlayer || this.localPlayer.state.lives <= 0
  }
  
  /**
   * Check if the remote player is out of lives
   */
  isRemotePlayerOutOfLives(): boolean {
    return !this.remotePlayer || this.remotePlayer.state.lives <= 0
  }
  
  /**
   * Handle local player death notification to remote
   */
  notifyLocalPlayerDeath(lives: number): void {
    if (!this.localPlayer) return
    
    this.localPlayer.state.lives = lives
    this.localPlayer.state.is_alive = false
    
    // Send death notification to remote
    this.onlineService.sendGameAction('death', { 
      lives: lives,
      is_permanent: lives <= 0 
    })
  }
  
  /**
   * Handle local player respawn notification
   */
  notifyLocalPlayerRespawn(x: number, y: number, lives: number): void {
    if (!this.localPlayer) return
    
    this.localPlayer.state.is_alive = true
    this.localPlayer.state.lives = lives
    this.localPlayer.state.health = 100
    
    // Send respawn notification to remote
    this.onlineService.sendGameAction('respawn', { x, y, lives })
  }
  
  /**
   * Show spectating message when local player is out
   */
  showSpectatingMessage(): void {
    const text = this.scene.add.text(640, 100, '👀 SPECTATING PARTNER', {
      fontSize: '28px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    text.setOrigin(0.5)
    text.setScrollFactor(0)
    text.setDepth(100)
    text.setName('spectatingText')
  }
  
  /**
   * Remove spectating message
   */
  removeSpectatingMessage(): void {
    const text = this.scene.children.getByName('spectatingText')
    if (text) {
      text.destroy()
    }
  }
  
  /**
   * Destroy a player
   */
  private destroyPlayer(player: OnlinePlayer): void {
    player.sprite.destroy()
    player.gun.destroy()
    player.healthBar.destroy()
    player.healthBarBg.destroy()
    player.livesText.destroy()
    player.nameText.destroy()
  }
  
  /**
   * Show disconnect message
   */
  private showDisconnectMessage(): void {
    const text = this.scene.add.text(640, 200, 'Partner Disconnected!', {
      fontSize: '32px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    text.setOrigin(0.5)
    text.setScrollFactor(0)
    text.setDepth(100)
    
    this.scene.time.delayedCall(3000, () => text.destroy())
  }
  
  /**
   * Show waiting for reconnect message
   */
  private showWaitingForReconnectMessage(playerName: string): void {
    // Remove any existing waiting message
    const existingText = this.scene.children.getByName('waitingReconnectText')
    if (existingText) existingText.destroy()
    
    const text = this.scene.add.text(640, 200, `⏳ ${playerName} disconnected - waiting for reconnection...`, {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    text.setOrigin(0.5)
    text.setScrollFactor(0)
    text.setDepth(100)
    text.setName('waitingReconnectText')
    
    // Make remote player semi-transparent
    if (this.remotePlayer) {
      this.remotePlayer.sprite.setAlpha(0.3)
    }
  }
  
  /**
   * Show reconnected message
   */
  private showReconnectedMessage(playerName: string): void {
    // Remove waiting message
    const waitingText = this.scene.children.getByName('waitingReconnectText')
    if (waitingText) waitingText.destroy()
    
    // Restore remote player visibility
    if (this.remotePlayer) {
      this.remotePlayer.sprite.setAlpha(0.9)
    }
    
    const text = this.scene.add.text(640, 200, `✅ ${playerName} reconnected!`, {
      fontSize: '28px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    text.setOrigin(0.5)
    text.setScrollFactor(0)
    text.setDepth(100)
    
    this.scene.time.delayedCall(2000, () => text.destroy())
  }
  
  /**
   * Show in-game chat message
   */
  private showChatMessage(playerName: string, message: string): void {
    const text = this.scene.add.text(20, 100, `${playerName}: ${message}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 }
    })
    text.setScrollFactor(0)
    text.setDepth(100)
    
    // Slide in animation
    text.setX(-200)
    this.scene.tweens.add({
      targets: text,
      x: 20,
      duration: 300,
      ease: 'Back.easeOut'
    })
    
    // Fade out after 4 seconds
    this.scene.time.delayedCall(4000, () => {
      this.scene.tweens.add({
        targets: text,
        alpha: 0,
        x: -200,
        duration: 300,
        onComplete: () => text.destroy()
      })
    })
  }
  
  /**
   * Handle item collected by remote player
   */
  private handleRemoteItemCollected(_playerId: string, itemType: string, itemId: string, playerCoins?: number, playerScore?: number): void {
    const gameScene = this.scene as any
    
    console.log(`🪙 Remote item collected: ${itemType} ${itemId} by ${_playerId}`)
    
    if (itemType === 'coin' && gameScene.coins) {
      // Find and destroy the coin with matching ID
      const coins = gameScene.coins.getChildren()
      let found = false
      for (const coin of coins) {
        const storedId = coin.getData('coinId')
        if (storedId === itemId) {
          found = true
          console.log(`🪙 Found coin to remove: ${storedId}`)
          // Remove from remote coins tracking if present
          if (gameScene.remoteCoins) {
            gameScene.remoteCoins.delete(itemId)
          }
          // Play collection effect
          this.scene.tweens.add({
            targets: coin,
            alpha: 0,
            scale: 0,
            duration: 200,
            onComplete: () => coin.destroy()
          })
          break
        }
      }
      if (!found) {
        console.log(`🪙 Coin ${itemId} not found locally (might already be collected)`)
      }
      
      // Check if the REMOTE player collected this coin (not us)
      const isRemoteCollection = this.remotePlayer?.playerId === _playerId
      
      // Update player UI/state: find which player collected this coin
      const targetPlayer = this.localPlayer?.playerId === _playerId ? this.localPlayer : this.remotePlayer?.playerId === _playerId ? this.remotePlayer : null
      if (targetPlayer) {
        // Apply authoritative values if available, otherwise increment predictively
        if (typeof playerCoins === 'number') {
          (targetPlayer.state as any).coins = playerCoins
        } else {
          (targetPlayer.state as any).coins = (targetPlayer.state as any).coins ? (targetPlayer.state as any).coins + 1 : 1
        }

        if (typeof playerScore === 'number') {
          (targetPlayer.state as any).score = playerScore
        } else {
          (targetPlayer.state as any).score = (targetPlayer.state as any).score ? (targetPlayer.state as any).score + 10 : 10
        }

        // Update top-right UI coin/score text in GameScene if present (co-op style HUD)
        const playerNumber = targetPlayer.playerNumber
        const scoreName = playerNumber === 1 ? 'p1ScoreText' : 'p2ScoreText'
        const coinName = playerNumber === 1 ? 'p1CoinText' : 'p2CoinText'
        const sText = gameScene.children.getByName(scoreName) as Phaser.GameObjects.Text
        const cText = gameScene.children.getByName(coinName) as Phaser.GameObjects.Text
        if (sText) sText.setText(`Score: ${(targetPlayer.state as any).score}`)
        if (cText) cText.setText(`${(targetPlayer.state as any).coins}`)
      }
      
      // For online mode: Also update the main HUD (coinCount, coinText, score, scoreText)
      // When remote player collects a coin, we want to increment our local counter too
      // so both players see the same total team coins
      if (isRemoteCollection && gameScene.isOnlineMode) {
        gameScene.coinCount = (gameScene.coinCount || 0) + 1
        gameScene.score = (gameScene.score || 0) + 10
        if (gameScene.coinText) {
          gameScene.coinText.setText(gameScene.coinCount.toString())
        }
        if (gameScene.scoreText) {
          gameScene.scoreText.setText(`Score: ${gameScene.score}`)
        }
        console.log(`🪙 Updated local HUD for remote collection: coins=${gameScene.coinCount}, score=${gameScene.score}`)
      }
    } else if (itemType === 'powerup' && gameScene.powerUps) {
      // Find and destroy the powerup with matching ID
      const powerups = gameScene.powerUps.getChildren()
      for (const powerup of powerups) {
        if (powerup.getData('powerupId') === itemId) {
          this.scene.tweens.add({
            targets: powerup,
            alpha: 0,
            scale: 0,
            duration: 200,
            onComplete: () => powerup.destroy()
          })
          break
        }
      }
      // Also update remote player's UI/state to indicate they picked a powerup (best-effort)
      const targetPlayer2 = this.localPlayer?.playerId === _playerId ? this.localPlayer : this.remotePlayer?.playerId === _playerId ? this.remotePlayer : null
      if (targetPlayer2) {
        // simple visual notification above player
        const playerSprite = targetPlayer2.sprite
        const text = this.scene.add.text(playerSprite.x, playerSprite.y - 50, 'POWER-UP!', { fontSize: '18px', color: '#ffff00' })
        text.setOrigin(0.5)
        this.scene.tweens.add({ targets: text, y: text.y - 30, alpha: 0, duration: 1500, onComplete: () => text.destroy() })
      }
    }
  }
  
  /**
   * Send chat message
   */
  sendChatMessage(message: string): void {
    this.onlineService.sendChat(message)
  }
  
  /**
   * Report item collection to server
   */
  reportItemCollected(itemType: 'coin' | 'powerup', itemId: string): void {
    this.onlineService.collectItem(itemType, itemId)
  }
  
  /**
   * Report enemy spawn to server (host only)
   */
  reportEnemySpawn(enemy: NetworkEnemyState): void {
    this.onlineService.spawnEnemy(enemy)
  }
  
  /**
   * Report enemy killed to server
   */
  reportEnemyKilled(enemyId: string): void {
    this.onlineService.killEnemy(enemyId)
  }
  
  /**
   * Send enemy state update (host only, for AI enemies)
   */
  sendEnemyState(enemyId: string, state: Partial<NetworkEnemyState>): void {
    this.onlineService.sendEnemyState(enemyId, state)
  }
  
  /**
   * Report coin spawn to server (host only)
   */
  reportCoinSpawn(coin: NetworkCoinState): void {
    this.onlineService.spawnCoin(coin)
  }
  
  /**
   * Send full entity sync (host only, periodic)
   */
  syncEntities(enemies: NetworkEnemyState[], coins: NetworkCoinState[]): void {
    this.onlineService.syncEntities(enemies, coins)
  }
  
  /**
   * Check if this client is the host
   */
  isHost(): boolean {
    return this.onlineService.isHost
  }
  
  /**
   * Clean up
   */
  destroy(): void {
    if (this.localPlayer) this.destroyPlayer(this.localPlayer)
    if (this.remotePlayer) this.destroyPlayer(this.remotePlayer)
    this.localPlayer = null
    this.remotePlayer = null
  }
}

export default OnlinePlayerManager
