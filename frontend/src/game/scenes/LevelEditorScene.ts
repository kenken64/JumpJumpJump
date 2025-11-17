import Phaser from 'phaser';
import type { CustomLevel, CustomLane } from '../types/CustomLevel';
import { LevelStorage } from '../types/CustomLevel';

export class LevelEditorScene extends Phaser.Scene {
  private lanes: CustomLane[] = [];
  private selectedLaneIndex: number = -1;
  private levelName: string = 'My Custom Level';
  private levelDescription: string = 'A custom level';
  private backgroundColor: number = 0x87ceeb;
  private previewSprites: Phaser.GameObjects.GameObject[] = [];
  private laneListContainer?: Phaser.GameObjects.Container;
  private editorContainer?: Phaser.GameObjects.Container;
  private laneListScroll: number = 0;
  private laneListMaxScroll: number = 0;
  private laneViewportRect?: Phaser.Geom.Rectangle;
  private laneListMask?: Phaser.Display.Masks.GeometryMask;
  private laneScrollTrack?: Phaser.GameObjects.Rectangle;
  private laneScrollThumb?: Phaser.GameObjects.Rectangle;

  private availableVehicles = [
    'ambulance.png', 'truck.png', 'police.png', 'taxi.png', 'bus.png',
    'sedan.png', 'sports_red.png', 'van.png', 'sports_green.png',
    'sports_yellow.png', 'suv.png', 'convertible.png', 'firetruck.png',
    'hotdog.png', 'tractor.png', 'cycle.png', 'cycle_low.png', 'scooter.png'
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
    const width = this.scale.width;
    const height = this.scale.height;
    const panelWidth = Math.min(320, width * 0.28);
    const panelHeight = height - 120;
    const totalWidth = panelWidth * 3 + 40; // 3 panels + 2 gaps of 20px
    const startX = (width - totalWidth) / 2;
    const panelX = startX;
    const panelY = 70;

    // Panel background
    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x2c3e50, 0.9).setOrigin(0);
    panel.setStrokeStyle(2, 0xffffff);

    let yPos = panelY + 20;
    const centerX = panelX + panelWidth / 2;

    // Level Name
    this.add.text(centerX, yPos, 'Level Settings', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    yPos += 40;

    // Add Lane Button
    const addLaneBtn = this.createEditorButton(centerX, yPos, '+ Add Lane', 0x27ae60);
    addLaneBtn.on('pointerdown', () => this.addLane());

    yPos += 60;

    // Remove Lane Button
    const removeLaneBtn = this.createEditorButton(centerX, yPos, '- Remove Lane', 0xe74c3c);
    removeLaneBtn.on('pointerdown', () => this.removeLane());

    yPos += 60;

    // Clear All Button
    const clearBtn = this.createEditorButton(centerX, yPos, 'Clear All', 0xe67e22);
    clearBtn.on('pointerdown', () => this.clearLanes());

    yPos += 80;

    // Save Button
    const saveBtn = this.createEditorButton(centerX, yPos, 'Save Level', 0x3498db);
    saveBtn.on('pointerdown', () => this.saveLevel());

    yPos += 60;

    // Test Button
    const testBtn = this.createEditorButton(centerX, yPos, 'Test Level', 0x9b59b6);
    testBtn.on('pointerdown', () => this.testLevel());

    yPos += 80;

    // Back Button
    const backBtn = this.createEditorButton(centerX, yPos, 'Back to Menu', 0x95a5a6);
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // Instructions
    this.add.text(centerX, panelY + panelHeight - 25, 'Click lanes to edit\nproperties', {
      fontSize: '14px',
      color: '#ecf0f1',
      align: 'center'
    }).setOrigin(0.5);
  }

  private createLaneList(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const panelWidth = Math.min(320, width * 0.28);
    const panelHeight = height - 120;
    const totalWidth = panelWidth * 3 + 40;
    const startX = (width - totalWidth) / 2;
    const listX = startX + panelWidth + 20;
    const listY = 70;

    // List background
    const listBg = this.add.rectangle(listX, listY, panelWidth, panelHeight, 0x34495e, 0.9).setOrigin(0);
    listBg.setStrokeStyle(2, 0xffffff);

    this.add.text(listX + panelWidth / 2, listY + 20, 'Lane Properties', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const headerHeight = 40;
    const editorReservedHeight = 280;
    const viewportHeight = Math.max(140, panelHeight - editorReservedHeight);
    const viewportY = listY + headerHeight;
    this.laneViewportRect = new Phaser.Geom.Rectangle(listX + 4, viewportY, panelWidth - 8, viewportHeight);

    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRectShape(this.laneViewportRect);
    maskGraphics.setVisible(false);
    this.laneListMask = maskGraphics.createGeometryMask();

    // Scroll indicator
    const trackX = listX + panelWidth - 12;
    this.laneScrollTrack = this.add.rectangle(trackX, viewportY + viewportHeight / 2, 4, viewportHeight, 0x22313f, 0.6);
    this.laneScrollTrack.setOrigin(0.5);
    this.laneScrollThumb = this.add.rectangle(trackX, viewportY, 10, 30, 0xffffff, 0.8);
    this.laneScrollThumb.setOrigin(0.5);
    this.laneScrollThumb.setVisible(false);

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (this.isPointerInsideLaneList(pointer)) {
        this.adjustLaneListScroll(deltaY);
      }
    });
  }

  private createPreviewArea(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const panelWidth = Math.min(320, width * 0.28);
    const panelHeight = height - 120;
    const totalWidth = panelWidth * 3 + 40;
    const startX = (width - totalWidth) / 2;
    const previewX = startX + (panelWidth + 20) * 2;
    const previewY = 70;
    const previewWidth = panelWidth;
    const previewHeight = panelHeight;

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
    // Clear previous list container
    if (this.laneListContainer) {
      this.laneListContainer.destroy();
    }

    const width = this.scale.width;
    const panelWidth = Math.min(320, width * 0.28);
    const totalWidth = panelWidth * 3 + 40;
    const startX = (width - totalWidth) / 2;
    const listX = startX + panelWidth + 20;
    const listY = 70;

    this.laneListContainer = this.add.container(0, 0);
    if (this.laneListMask) {
      this.laneListContainer.setMask(this.laneListMask);
    }

    // Redraw list
    const viewportTop = (this.laneViewportRect?.y ?? listY + 60) + 10;
    let yOffset = 0;

    this.lanes.forEach((lane, index) => {
      const itemY = viewportTop + yOffset;

      // Lane item background
      const itemBg = this.add.rectangle(listX + 10, itemY, panelWidth - 20, 50,
        index === this.selectedLaneIndex ? 0x3498db : 0x2c3e50
      );
      itemBg.setOrigin(0);
      itemBg.setInteractive({ useHandCursor: true });
      itemBg.on('pointerdown', () => this.selectLane(index));

      // Lane info
      const directionArrow = lane.direction > 0 ? '→' : '←';
      const laneLabel = this.add.text(listX + 20, itemY + 10, `Lane ${index + 1} ${directionArrow}`, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      const laneDetails = this.add.text(listX + 20, itemY + 28, `Speed: ${lane.speed} | Spawn: ${lane.spawnInterval}ms`, {
        fontSize: '11px',
        color: '#ecf0f1'
      });

      this.laneListContainer!.add([itemBg, laneLabel, laneDetails]);

      yOffset += 60;
    });

    const viewportHeight = this.laneViewportRect?.height ?? (this.scale.height - 200);
    const contentHeight = yOffset;
    this.laneListMaxScroll = Math.max(0, contentHeight - viewportHeight);
    this.laneListScroll = Phaser.Math.Clamp(this.laneListScroll, 0, this.laneListMaxScroll);
    this.positionLaneList();
    this.updateScrollThumb();
  }

  private selectLane(index: number): void {
    this.selectedLaneIndex = index;
    this.updateLaneList();
    this.showLaneEditor(index);
  }

  private showLaneEditor(index: number): void {
    // Clear previous editor
    if (this.editorContainer) {
      this.editorContainer.destroy();
    }

    const lane = this.lanes[index];
    const width = this.scale.width;
    const panelWidth = Math.min(320, width * 0.28);
    const totalWidth = panelWidth * 3 + 40;
    const startX = (width - totalWidth) / 2;
    const editorX = startX + panelWidth + 20;
    const viewportBottom = this.laneViewportRect ? this.laneViewportRect.y + this.laneViewportRect.height : 280;
    const editorY = viewportBottom + 15;

    this.editorContainer = this.add.container(0, 0);

    // Title
    const title = this.add.text(editorX + panelWidth / 2, editorY, `Editing Lane ${index + 1}`, {
      fontSize: '16px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.editorContainer.add(title);

    // Shared layout helpers
    const labelStyle = { fontSize: '12px', color: '#bdc3c7' };
    const valueStyle = { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' };
    const labelX = editorX + 20;
    const valueX = editorX + panelWidth / 2;
    const buttonRightX = editorX + panelWidth - 30;
    const buttonLeftX = buttonRightX - 45;
    const rowStartY = editorY + 35;
    const rowGap = 48;

    const addRow = (label: string, value: string, y: number): void => {
      const labelText = this.add.text(labelX, y, label, labelStyle).setOrigin(0, 0.5);
      const valueText = this.add.text(valueX, y, value, valueStyle).setOrigin(0.5);
      this.editorContainer!.add([labelText, valueText]);
    };

    // Vehicle selection row
    let rowY = rowStartY;
    addRow('Vehicle', lane.vehicleType.replace('.png', ''), rowY);

    const vehiclePrev = this.createSmallButton(buttonLeftX, rowY, '<', 0x2980b9);
    vehiclePrev.on('pointerdown', () => {
      const currentIndex = this.availableVehicles.indexOf(lane.vehicleType);
      const newIndex = (currentIndex - 1 + this.availableVehicles.length) % this.availableVehicles.length;
      lane.vehicleType = this.availableVehicles[newIndex];
      this.showLaneEditor(index);
      this.updateLaneList();
      this.updatePreview();
    });
    this.editorContainer.add(vehiclePrev);

    const vehicleNext = this.createSmallButton(buttonRightX, rowY, '>', 0x2980b9);
    vehicleNext.on('pointerdown', () => {
      const currentIndex = this.availableVehicles.indexOf(lane.vehicleType);
      const newIndex = (currentIndex + 1) % this.availableVehicles.length;
      lane.vehicleType = this.availableVehicles[newIndex];
      this.showLaneEditor(index);
      this.updateLaneList();
      this.updatePreview();
    });
    this.editorContainer.add(vehicleNext);

    // Speed row
    rowY += rowGap;
    addRow('Speed', `${lane.speed} px/s`, rowY);

    const adjustSpeedDown = this.createSmallButton(buttonLeftX, rowY, '-', 0xe74c3c);
    adjustSpeedDown.on('pointerdown', () => {
      lane.speed = Math.max(25, lane.speed - 25);
      this.showLaneEditor(index);
      this.updateLaneList();
      this.updatePreview();
    });
    this.editorContainer.add(adjustSpeedDown);

    const adjustSpeedUp = this.createSmallButton(buttonRightX, rowY, '+', 0x27ae60);
    adjustSpeedUp.on('pointerdown', () => {
      lane.speed = Math.min(500, lane.speed + 25);
      this.showLaneEditor(index);
      this.updateLaneList();
      this.updatePreview();
    });
    this.editorContainer.add(adjustSpeedUp);

    // Direction row
    rowY += rowGap;
    addRow('Direction', lane.direction > 0 ? 'Right →' : 'Left ←', rowY);

    const toggleDirection = this.createSmallButton((buttonLeftX + buttonRightX) / 2, rowY, '↔', 0x3498db);
    toggleDirection.on('pointerdown', () => {
      lane.direction *= -1;
      this.showLaneEditor(index);
      this.updateLaneList();
      this.updatePreview();
    });
    this.editorContainer.add(toggleDirection);

    // Spawn row
    rowY += rowGap;
    addRow('Spawn', `${lane.spawnInterval} ms`, rowY);

    const adjustSpawnDown = this.createSmallButton(buttonLeftX, rowY, '-', 0xe74c3c);
    adjustSpawnDown.on('pointerdown', () => {
      lane.spawnInterval = Math.max(1000, lane.spawnInterval - 500);
      this.showLaneEditor(index);
      this.updateLaneList();
      this.updatePreview();
    });
    this.editorContainer.add(adjustSpawnDown);

    const adjustSpawnUp = this.createSmallButton(buttonRightX, rowY, '+', 0x27ae60);
    adjustSpawnUp.on('pointerdown', () => {
      lane.spawnInterval = Math.min(10000, lane.spawnInterval + 500);
      this.showLaneEditor(index);
      this.updateLaneList();
      this.updatePreview();
    });
    this.editorContainer.add(adjustSpawnUp);
  }

  private updatePreview(): void {
    this.previewSprites.forEach(sprite => sprite.destroy());
    this.previewSprites = [];

    const width = this.scale.width;
    const panelWidth = Math.min(320, width * 0.28);
    const totalWidth = panelWidth * 3 + 40;
    const startX = (width - totalWidth) / 2;
    const previewX = startX + (panelWidth + 20) * 2 + panelWidth / 2;
    const previewY = 120;

    const previewTop = previewY + 90;
    const laneSpacing = 55;
    const laneWidth = panelWidth - 60;
    const laneHeight = 30;

    this.lanes.forEach((lane, index) => {
      const laneY = previewTop + index * laneSpacing;

      // Draw black road lane with padding for clarity
      const roadLane = this.add.rectangle(previewX, laneY, laneWidth, laneHeight, 0x000000);
      roadLane.setStrokeStyle(2, 0xe74c3c);
      this.previewSprites.push(roadLane);

      // Add vehicle sprite
      const sprite = this.add.sprite(previewX, laneY, 'sprites', lane.vehicleType);
      sprite.setScale(1.5);
      if (lane.direction < 0) sprite.setFlipX(true);
      this.previewSprites.push(sprite);
    });
  }

  private async saveLevel(): Promise<void> {
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

    this.showMessage('Saving...', 0x3498db);
    const success = await LevelStorage.saveLevel(level);
    
    if (success) {
      this.showMessage('Level saved!', 0x27ae60);
    } else {
      this.showMessage('Failed to save level', 0xe74c3c);
    }
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

  private isPointerInsideLaneList(pointer: Phaser.Input.Pointer): boolean {
    if (!this.laneViewportRect) {
      return false;
    }
    return this.laneViewportRect.contains(pointer.x, pointer.y);
  }

  private adjustLaneListScroll(deltaY: number): void {
    if (this.laneListMaxScroll <= 0) {
      return;
    }

    const direction = Math.sign(deltaY);
    if (direction === 0) {
      return;
    }

    const step = 35;
    this.laneListScroll = Phaser.Math.Clamp(
      this.laneListScroll + direction * step,
      0,
      this.laneListMaxScroll
    );
    this.positionLaneList();
    this.updateScrollThumb();
  }

  private positionLaneList(): void {
    if (!this.laneListContainer) {
      return;
    }
    this.laneListContainer.y = -this.laneListScroll;
  }

  private updateScrollThumb(): void {
    if (!this.laneScrollThumb || !this.laneScrollTrack) {
      return;
    }

    if (this.laneListMaxScroll <= 0) {
      this.laneScrollThumb.setVisible(false);
      return;
    }

    this.laneScrollThumb.setVisible(true);
    const available = (this.laneScrollTrack.height / 2) - (this.laneScrollThumb.height / 2);
    const ratio = this.laneListScroll / this.laneListMaxScroll;
    this.laneScrollThumb.y = this.laneScrollTrack.y - available + ratio * available * 2;
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

  update(): void {
    // Check for ESC key press
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (escKey && Phaser.Input.Keyboard.JustDown(escKey)) {
      this.scene.start('MenuScene');
    }
  }
}
