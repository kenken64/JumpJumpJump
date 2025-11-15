import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0x2c3e50).setOrigin(0);

    // Title
    this.add.text(width / 2, 100, 'JUMP JUMP JUMP!', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 170, 'Select Game Mode', {
      fontSize: '24px',
      color: '#ecf0f1',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Campaign Mode Button
    const campaignButton = this.createButton(width / 2, 250, 'Campaign Mode', 0x27ae60);
    campaignButton.on('pointerdown', () => {
      this.scene.start('MainGameScene');
    });

    // Custom Levels Button
    const customButton = this.createButton(width / 2, 330, 'Custom Levels', 0x3498db);
    customButton.on('pointerdown', () => {
      this.scene.start('CustomLevelSelectScene');
    });

    // Level Editor Button
    const editorButton = this.createButton(width / 2, 410, 'Level Editor', 0xe74c3c);
    editorButton.on('pointerdown', () => {
      this.scene.start('LevelEditorScene');
    });

    // Instructions
    this.add.text(width / 2, height - 80, 'Controls: Arrow Keys / WASD / Gamepad', {
      fontSize: '18px',
      color: '#bdc3c7',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 50, 'Avoid traffic and reach the goal!', {
      fontSize: '16px',
      color: '#95a5a6',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, text: string, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 60, color);
    bg.setStrokeStyle(3, 0xffffff);

    const label = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(300, 60);
    container.setInteractive({ useHandCursor: true });

    // Hover effects
    container.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.GetColor(
        Math.min(255, Phaser.Display.Color.IntegerToColor(color).red + 30),
        Math.min(255, Phaser.Display.Color.IntegerToColor(color).green + 30),
        Math.min(255, Phaser.Display.Color.IntegerToColor(color).blue + 30)
      ));
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(color);
      container.setScale(1);
    });

    return container;
  }
}
