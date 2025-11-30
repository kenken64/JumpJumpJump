/**
 * @fileoverview App - Main React component and Phaser game initialization
 * 
 * Initializes the Phaser game engine with:
 * - Canvas rendering (auto-selects WebGL or Canvas)
 * - Arcade physics with gravity
 * - Gamepad input support
 * - All game scenes registered
 * - Responsive scaling to fit viewport
 * 
 * Shows a "Click to Start" screen to ensure audio context is unlocked.
 * 
 * @module App
 */

import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import './App.css'
import MenuScene from './scenes/MenuScene'
import GameScene from './scenes/GameScene'
import ShopScene from './scenes/ShopScene'
import LeaderboardScene from './scenes/LeaderboardScene'
import InventoryScene from './scenes/InventoryScene'
import BossGalleryScene from './scenes/BossGalleryScene'
import CreditScene from './scenes/CreditScene'
import CoopLobbyScene from './scenes/CoopLobbyScene'
import OnlineLobbyScene from './scenes/OnlineLobbyScene'
import DQNTrainingScene from './scenes/DQNTrainingScene'

/**
 * Main React component that initializes and hosts the Phaser game
 * @returns JSX element containing the game container
 */
function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const [audioReady, setAudioReady] = useState(false)

  const handleStartAudio = () => {
    setAudioReady(true)
  }

  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current && audioReady) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: 'game-container',
        backgroundColor: '#0a0a1a',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 400, x: 0 },
            debug: false
          }
        },
        input: {
          gamepad: true
        },
        loader: {
          crossOrigin: 'anonymous',
          maxParallelDownloads: 10
        },
        scene: [MenuScene, GameScene, ShopScene, LeaderboardScene, InventoryScene, BossGalleryScene, CreditScene, CoopLobbyScene, OnlineLobbyScene, DQNTrainingScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1280,
          height: 720
        }
      }

      phaserGameRef.current = new Phaser.Game(config)
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true)
        phaserGameRef.current = null
      }
    }
  }, [audioReady])

  return (
    <div className="App">
      {!audioReady && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
          onClick={handleStartAudio}
        >
          <h1 style={{ color: '#00ff00', fontSize: '48px', marginBottom: '20px' }}>
            JUMP JUMP JUMP
          </h1>
          <p style={{ color: '#ffffff', fontSize: '24px', marginBottom: '40px' }}>
            Click anywhere to start with audio
          </p>
          <div style={{
            padding: '20px 40px',
            backgroundColor: '#00aa00',
            color: '#ffffff',
            fontSize: '24px',
            borderRadius: '10px',
            fontWeight: 'bold'
          }}>
            ▶ START GAME
          </div>
        </div>
      )}
      <div ref={gameRef} id="game-container"></div>
    </div>
  )
}

export default App
