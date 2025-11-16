import Phaser from 'phaser';
import type { CustomLevel, CustomLane } from '../types/CustomLevel';
import { LevelStorage } from '../types/CustomLevel';

export class LevelEditorScene extends Phaser.Scene {
  private lanes: CustomLane[] = [];
  private selectedLaneIndex: number = -1;
  private levelName: string = 'My Custom Level';
  private levelDescription: string = 'A custom level';
  private backgroundColor: number = 0x87ceeb;
  private previewSprites: Phaser.GameObjects.Sprite[] = [];

  private availableVehicles = [
    'ambulance.png', 'truck.png', 'police.png', 'taxi.png', 'bus.png',
    'sedan.png', 'sports_red.png', 'van.png', 'sports_green.png',
    'sports_yellow.png', 'suv.png', 'convertible.png', 'firetruck.png',
    'hotdog.png', 'tractor.png'
  ];

  constructor() {
    super({ key: 'LevelEditorScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    this.add.rectangle(0, 0, width, height, this.backgroundColor).setOrigin(0);

    // Title
    this.add.text(width / 2, 20, 'LEVEL EDITOR', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Create UI panels
    this.createControlPanel();
    this.createLaneList();
    this.createPreviewArea();

    // Add initial lane
    this.addLane();
  }

  private createControlPanel(): void {
    const panelX = 20;
    const panelY = 60;

    // Panel background
    const panel = this.add.rectangle(panelX, panelY, 250, 520, 0x2c3e50, 0.9).setOrigin(0);
    panel.setStrokeStyle(2, 0xffffff);

    let yPos = panelY + 20;

    // Level Name
    this.add.text(panelX + 125, yPos, 'Level Settings', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    yPos += 40;

    // Add Lane Button
    const addLaneBtn = this.createEditorButton(panelX + 125, yPos, '+ Add Lane', 0x27ae60);
    addLaneBtn.on('pointerdown', () => this.addLane());

    yPos += 60;

    // Remove Lane Button
    const removeLaneBtn = this.createEditorButton(panelX + 125, yPos, '- Remove Lane', 0xe74c3c);
    removeLaneBtn.on('pointerdown', () => this.removeLane());

    yPos += 60;

    // Clear All Button
    const clearBtn = this.createEditorButton(panelX + 125, yPos, 'Clear All', 0xe67e22);
    clearBtn.on('pointerdown', () => this.clearLanes());

    yPos += 80;

    // Save Button
    const saveBtn = this.createEditorButton(panelX + 125, yPos, 'Save Level', 0x3498db);
    saveBtn.on('pointerdown', () => this.saveLevel());

    yPos += 60;

    // Test Button
    const testBtn = this.createEditorButton(panelX + 125, yPos, 'Test Level', 0x9b59b6);
    testBtn.on('pointerdown', () => this.testLevel());

    yPos += 80;

    // Back Button
    const backBtn = this.createEditorButton(panelX + 125, yPos, 'Back to Menu', 0x95a5a6);
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // Instructions
    this.add.text(panelX + 10, 540, 'Click lanes to edit\nproperties', {
      fontSize: '14px',
      color: '#ecf0f1',
      align: 'center'
    });
  }

  private createLaneList(): void {
    const listX = 290;
    const listY = 60;

    // List background
    const listBg = this.add.rectangle(listX, listY, 230, 520, 0x34495e, 0.9).setOrigin(0);
    listBg.setStrokeStyle(2, 0xffffff);

    this.add.text(listX + 115, listY + 20, 'Lane Properties', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // This area will be updated dynamically
  }

  private createPreviewArea(): void {
    const previewX = 540;
    const previewY = 60;
    const previewWidth = 240;
    const previewHeight = 520;

    // Preview background
    const previewBg = this.add.rectangle(previewX, previewY, previewWidth, previewHeight, 0x1abc9c, 0.3).setOrigin(0);
    previewBg.setStrokeStyle(2, 0xffffff);

    this.add.text(previewX + previewWidth / 2, previewY + 20, 'Preview', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(previewX + previewWidth / 2, previewY + 50, 'Lanes will appear here', {
      fontSize: '14px',
      color: '#ecf0f1'
    }).setOrigin(0.5);
  }

  private addLane(): void {
    if (this.lanes.length >= 8) {
      this.showMessage('Maximum 8 lanes allowed!', 0xe74c3c);
      return;
    }

    const newLane: CustomLane = {
      vehicleType: this.availableVehicles[0],
      speed: 100,
      direction: this.lanes.length % 2 === 0 ? 1 : -1,
      spawnInterval: 3000
    };

    this.lanes.push(newLane);
    this.updateLaneList();
    this.updatePreview();
    this.showMessage(`Lane ${this.lanes.length} added!`, 0x27ae60);
  }

  private removeLane(): void {
    if (this.lanes.length === 0) {
      this.showMessage('No lanes to remove!', 0xe74c3c);
      return;
    }

    this.lanes.pop();
    this.selectedLaneIndex = -1;
    this.updateLaneList();
    this.updatePreview();
    this.showMessage('Lane removed!', 0xe67e22);
  }

  private clearLanes(): void {
    this.lanes = [];
    this.selectedLaneIndex = -1;
    this.updateLaneList();
    this.updatePreview();
    this.showMessage('All lanes cleared!', 0xe67e22);
  }

  private updateLaneList(): void {
    // Clear previous list items (except header)
    const listX = 290;
    const listY = 60;

    // Redraw list
    let yOffset = 60;

    this.lanes.forEach((lane, index) => {
      const itemY = listY + yOffset;

      // Lane item background
      const itemBg = this.add.rectangle(listX + 10, itemY, 210, 50,
        index === this.selectedLaneIndex ? 0x3498db : 0x2c3e50
      );
      itemBg.setOrigin(0);
      itemBg.setInteractive({ useHandCursor: true });
      itemBg.on('pointerdown', () => this.selectLane(index));

      // Lane info
      const directionArrow = lane.direction > 0 ? '→' : '←';
      this.add.text(listX + 20, itemY + 10, `Lane ${index + 1} ${directionArrow}`, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      this.add.text(listX + 20, itemY + 28, `Speed: ${lane.speed} | Spawn: ${lane.spawnInterval}ms`, {
        fontSize: '11px',
        color: '#ecf0f1'
      });

      yOffset += 60;
    });
  }

  private selectLane(index: number): void {
    this.selectedLaneIndex = index;
    this.updateLaneList();
    this.showLaneEditor(index);
  }

  private showLaneEditor(index: number): void {
    const lane = this.lanes[index];
    const editorX = 290;
    const editorY = 300;

    // Clear previous editor UI (simplified approach)
    this.add.text(editorX + 115, editorY, `Editing Lane ${index + 1}`, {
      fontSize: '16px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Show current values
    this.add.text(editorX + 20, editorY + 30, `Vehicle: ${lane.vehicleType.replace('.png', '')}`, {
      fontSize: '12px',
      color: '#ffffff'
    });

    this.add.text(editorX + 20, editorY + 50, `Speed: ${lane.speed} px/s`, {
      fontSize: '12px',
      color: '#ffffff'
    });

    this.add.text(editorX + 20, editorY + 70, `Direction: ${lane.direction > 0 ? 'Right →' : 'Left ←'}`, {
      fontSize: '12px',
      color: '#ffffff'
    });

    this.add.text(editorX + 20, editorY + 90, `Spawn: ${lane.spawnInterval}ms`, {
      fontSize: '12px',
      color: '#ffffff'
    });

    // Edit buttons
    const adjustSpeedUp = this.createSmallButton(editorX + 180, editorY + 50, '+', 0x27ae60);
    adjustSpeedUp.on('pointerdown', () => {
      lane.speed = Math.min(500, lane.speed + 25);
      this.updatePreview();
    });

    const adjustSpeedDown = this.createSmallButton(editorX + 140, editorY + 50, '-', 0xe74c3c);
    adjustSpeedDown.on('pointerdown', () => {
      lane.speed = Math.max(25, lane.speed - 25);
      this.updatePreview();
    });

    const toggleDirection = this.createSmallButton(editorX + 180, editorY + 70, '↔', 0x3498db);
    toggleDirection.on('pointerdown', () => {
      lane.direction *= -1;
      this.updateLaneList();
      this.updatePreview();
    });
  }

  private updatePreview(): void {
    // Clear previous preview
    this.previewSprites.forEach(sprite => sprite.destroy());
    this.previewSprites = [];

    const previewX = 660;
    const previewY = 120;

    this.lanes.forEach((lane, index) => {
      const sprite = this.add.sprite(previewX, previewY + (index * 40), 'sprites', lane.vehicleType);
      sprite.setScale(1.5);
      if (lane.direction < 0) sprite.setFlipX(true);
      this.previewSprites.push(sprite);
    });
  }

  private saveLevel(): void {
    if (this.lanes.length === 0) {
      this.showMessage('Add at least one lane!', 0xe74c3c);
      return;
    }

    const level: CustomLevel = {
      id: Date.now().toString(),
      name: this.levelName,
      author: 'Player',
      description: this.levelDescription,
      backgroundColor: this.backgroundColor,
      lanes: [...this.lanes],
      createdAt: Date.now()
    };

    LevelStorage.saveLevel(level);
    this.showMessage('Level saved!', 0x27ae60);
  }

  private testLevel(): void {
    if (this.lanes.length === 0) {
      this.showMessage('Add lanes first!', 0xe74c3c);
      return;
    }

    // Save as temp level and start custom game
    const tempLevel: CustomLevel = {
      id: 'temp_test',
      name: 'Test Level',
      author: 'Testing',
      description: 'Test',
      backgroundColor: this.backgroundColor,
      lanes: [...this.lanes],
      createdAt: Date.now()
    };

    this.scene.start('CustomGameScene', { level: tempLevel });
  }

  private showMessage(text: string, color: number): void {
    const colorObj = Phaser.Display.Color.IntegerToRGB(color);
    const rgbaString = `rgba(${colorObj.r},${colorObj.g},${colorObj.b},${colorObj.a})`;
    const msg = this.add.text(400, 30, text, {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: rgbaString,
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: msg,
        alpha: 0,
        duration: 500,
        onComplete: () => msg.destroy()
      });
    });
  }

  private createEditorButton(x: number, y: number, text: string, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 200, 45, color);
    bg.setStrokeStyle(2, 0xffffff);

    const label = this.add.text(0, 0, text, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(200, 45);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => container.setScale(1.05));
    container.on('pointerout', () => container.setScale(1));

    return container;
  }

  private createSmallButton(x: number, y: number, text: string, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 30, 30, color);
    bg.setStrokeStyle(2, 0xffffff);

    const label = this.add.text(0, 0, text, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(30, 30);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => container.setScale(1.1));
    container.on('pointerout', () => container.setScale(1));

    return container;
  }
}
