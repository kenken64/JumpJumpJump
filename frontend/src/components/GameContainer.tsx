import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';

export const GameContainer = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Create game instance
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="game-wrapper" style={{ position: 'relative' }}>
      <div id="game-container" />
    </div>
  );
};
