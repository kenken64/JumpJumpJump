import Phaser from 'phaser';
import type { CustomLevel } from '../types/CustomLevel';
import { LevelStorage } from '../types/CustomLevel';

export class CustomLevelSelectScene extends Phaser.Scene {
  private levels: CustomLevel[] = [];

  constructor() {
    super({ key: 'CustomLevelSelectScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0x34495e).setOrigin(0);

    // Title
    this.add.text(width / 2, 40, 'CUSTOM LEVELS', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Load levels
    this.levels = LevelStorage.loadLevels();

    // Display levels
    this.displayLevels();

    // Back button
    const backBtn = this.createButton(width / 2, height - 60, 'Back to Menu', 0x95a5a6, 250, 50);
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private displayLevels(): void {
    const width = this.scale.width;
    const startY = 120;
    const spacing = 90;

    if (this.levels.length === 0) {
      this.add.text(width / 2, 300, 'No custom levels yet!', {
        fontSize: '24px',
        color: '#bdc3c7'
      }).setOrigin(0.5);

      this.add.text(width / 2, 340, 'Create one in the Level Editor', {
        fontSize: '18px',
        color: '#95a5a6'
      }).setOrigin(0.5);

      return;
    }

    this.levels.forEach((level, index) => {
      const yPos = startY + (index * spacing);

      // Level card background
      const cardBg = this.add.rectangle(width / 2, yPos, 600, 70, 0x2c3e50);
      cardBg.setStrokeStyle(2, 0x3498db);

      // Level info
      this.add.text(width / 2 - 280, yPos - 20, level.name, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      this.add.text(width / 2 - 280, yPos + 5, `Author: ${level.author} | Lanes: ${level.lanes.length}`, {
        fontSize: '14px',
        color: '#ecf0f1'
      });

      // Play button
      const playBtn = this.createButton(width / 2 + 180, yPos, 'Play', 0x27ae60, 100, 40);
      playBtn.on('pointerdown', () => this.playLevel(level));

      // Delete button
      const deleteBtn = this.createButton(width / 2 + 290, yPos, 'Delete', 0xe74c3c, 80, 40);
      deleteBtn.on('pointerdown', () => this.deleteLevel(level.id));
    });
  }

  private playLevel(level: CustomLevel): void {
    this.scene.start('CustomGameScene', { level });
  }

  private deleteLevel(id: string): void {
    LevelStorage.deleteLevel(id);
    this.scene.restart();
  }

  private createButton(x: number, y: number, text: string, color: number, width: number = 200, height: number = 45): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, color);
    bg.setStrokeStyle(2, 0xffffff);

    const label = this.add.text(0, 0, text, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => container.setScale(1.05));
    container.on('pointerout', () => container.setScale(1));

    return container;
  }
}
