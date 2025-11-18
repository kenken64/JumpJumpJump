import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';
import { MenuOverlay } from './MenuOverlay';
import { CustomLevelSelectOverlay } from './CustomLevelSelectOverlay';
import { LevelEditorOverlay } from './LevelEditorOverlay';
import { SettingsOverlay } from './SettingsOverlay';

export const GameContainer = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null);

  useEffect(() => {
    // Create game instance
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
      setGameInstance(gameRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        setGameInstance(null);
      }
    };
  }, []);

  return (
    <div className="game-wrapper" style={{ position: 'relative' }}>
      <div id="game-container" />
      <MenuOverlay game={gameInstance} />
      <CustomLevelSelectOverlay game={gameInstance} />
      <LevelEditorOverlay game={gameInstance} />
      <SettingsOverlay game={gameInstance} />
    </div>
  );
};
