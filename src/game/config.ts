import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { MainGameScene } from './scenes/MainGameScene';
import { LevelEditorScene } from './scenes/LevelEditorScene';
import { CustomLevelSelectScene } from './scenes/CustomLevelSelectScene';
import { CustomGameScene } from './scenes/CustomGameScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#2c3e50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [
    PreloadScene,
    MenuScene,
    MainGameScene,
    LevelEditorScene,
    CustomLevelSelectScene,
    CustomGameScene
  ],
  input: {
    gamepad: true
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
