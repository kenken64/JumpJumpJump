import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import './App.css'
import MenuScene from './scenes/MenuScene'
import GameScene from './scenes/GameScene'
import ShopScene from './scenes/ShopScene'
import LeaderboardScene from './scenes/LeaderboardScene'

function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
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
        scene: [MenuScene, GameScene, ShopScene, LeaderboardScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
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
  }, [])

  return (
    <div className="App">
      <div ref={gameRef} id="game-container"></div>
    </div>
  )
}

export default App
