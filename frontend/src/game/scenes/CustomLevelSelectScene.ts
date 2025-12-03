import Phaser from 'phaser';
import type { CustomLevel } from '../types/CustomLevel';
import { LevelStorage } from '../types/CustomLevel';
import { API_CONFIG } from '../apiConfig';

export class CustomLevelSelectScene extends Phaser.Scene {
  private levels: CustomLevel[] = [];
  private currentPage: number = 0;
  private levelsPerPage: number = 8;
  private levelCards: Phaser.GameObjects.Container[] = [];

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

    // Loading message
    const loadingText = this.add.text(width / 2, 300, 'Loading levels...', {
      fontSize: '24px',
      color: '#bdc3c7'
    }).setOrigin(0.5);

    // Load levels asynchronously
    this.loadLevelsAsync(loadingText);

    // Back button
    const backBtn = this.createButton(width / 2, height - 60, 'Back to Menu', 0x95a5a6, 250, 50);
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private async loadLevelsAsync(loadingText: Phaser.GameObjects.Text): Promise<void> {
    this.levels = await LevelStorage.loadLevels();
    loadingText.destroy();
    this.displayLevels();
  }

  private displayLevels(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const startY = 120;
    const spacing = 70;

    // Clear existing level cards
    this.levelCards.forEach(card => card.destroy());
    this.levelCards = [];

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

    // Calculate pagination
    const totalPages = Math.ceil(this.levels.length / this.levelsPerPage);
    const startIndex = this.currentPage * this.levelsPerPage;
    const endIndex = Math.min(startIndex + this.levelsPerPage, this.levels.length);
    const levelsToDisplay = this.levels.slice(startIndex, endIndex);

    // Display current page levels
    levelsToDisplay.forEach((level, index) => {
      const yPos = startY + (index * spacing);

      // Create container for the entire level card
      const cardContainer = this.add.container(width / 2, yPos);

      // Level card background
      const cardBg = this.add.rectangle(0, 0, 600, 65, 0x2c3e50);
      cardBg.setStrokeStyle(2, 0x3498db);
      cardContainer.add(cardBg);

      // Level info
      const levelNameText = this.add.text(-280, -18, level.name, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      cardContainer.add(levelNameText);

      const levelInfo = this.add.text(-280, 5, `Author: ${level.author} | Lanes: ${level.lanes.length}`, {
        fontSize: '14px',
        color: '#ecf0f1'
      });
      cardContainer.add(levelInfo);

      // Edit button
      const editBtn = this.createButton(50, 0, 'Edit', 0xf39c12, 80, 40);
      editBtn.on('pointerdown', () => this.editLevelName(level, levelNameText));
      cardContainer.add(editBtn);

      // Play button
      const playBtn = this.createButton(140, 0, 'Play', 0x27ae60, 80, 40);
      playBtn.on('pointerdown', () => this.playLevel(level));
      cardContainer.add(playBtn);

      // Delete button
      const deleteBtn = this.createButton(230, 0, 'Delete', 0xe74c3c, 90, 40);
      deleteBtn.on('pointerdown', () => this.deleteLevel(level.id));
      cardContainer.add(deleteBtn);

      this.levelCards.push(cardContainer);
    });

    // Page indicator
    this.add.text(width / 2, height - 120, `Page ${this.currentPage + 1} of ${totalPages}`, {
      fontSize: '20px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Navigation buttons
    if (totalPages > 1) {
      // Previous button
      if (this.currentPage > 0) {
        const prevBtn = this.createButton(width / 2 - 150, height - 120, '< Previous', 0x3498db, 130, 45);
        prevBtn.on('pointerdown', () => {
          this.currentPage--;
          this.scene.restart();
        });
      }

      // Next button
      if (this.currentPage < totalPages - 1) {
        const nextBtn = this.createButton(width / 2 + 150, height - 120, 'Next >', 0x3498db, 130, 45);
        nextBtn.on('pointerdown', () => {
          this.currentPage++;
          this.scene.restart();
        });
      }
    }
  }

  private playLevel(level: CustomLevel): void {
    this.scene.start('CustomGameScene', { level });
  }

  private async deleteLevel(id: string): Promise<void> {
    const success = await LevelStorage.deleteLevel(id);
    if (success) {
      this.scene.restart();
    } else {
      console.error('Failed to delete level');
    }
  }

  private editLevelName(level: CustomLevel, _nameText: Phaser.GameObjects.Text): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setDepth(1000);
    overlay.setInteractive();

    // Create dialog box
    const dialogWidth = 500;
    const dialogHeight = 300;
    const dialogBg = this.add.rectangle(width / 2, height / 2, dialogWidth, dialogHeight, 0x2c3e50).setDepth(1001);
    dialogBg.setStrokeStyle(3, 0x3498db);

    // Title
    const titleText = this.add.text(width / 2, height / 2 - 80, 'Edit Level Name', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001);

    // Current name display
    const labelText = this.add.text(width / 2, height / 2 - 35, 'Current name:', {
      fontSize: '16px',
      color: '#bdc3c7'
    }).setOrigin(0.5).setDepth(1001);

    const currentNameText = this.add.text(width / 2, height / 2 - 10, level.name, {
      fontSize: '20px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001);

    // Input instruction
    const instructionText = this.add.text(width / 2, height / 2 + 20, 'Click below to enter new name:', {
      fontSize: '14px',
      color: '#95a5a6'
    }).setOrigin(0.5).setDepth(1001);

    // Create HTML input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = level.name;
    input.maxLength = 50;
    input.style.position = 'absolute';
    input.style.left = `${width / 2 - 150}px`;
    input.style.top = `${height / 2 + 40}px`;
    input.style.width = '300px';
    input.style.height = '40px';
    input.style.fontSize = '18px';
    input.style.padding = '8px';
    input.style.border = '2px solid #3498db';
    input.style.borderRadius = '5px';
    input.style.backgroundColor = '#2c3e50';
    input.style.color = '#ecf0f1';
    input.style.outline = 'none';
    input.style.boxSizing = 'border-box';
    input.style.zIndex = '1002';
    input.setAttribute('autocomplete', 'off');
    document.body.appendChild(input);
    input.focus();
    input.select();

    const closeDialog = (shouldRestart: boolean = false) => {
      overlay.destroy();
      dialogBg.destroy();
      titleText.destroy();
      labelText.destroy();
      currentNameText.destroy();
      instructionText.destroy();
      saveBtn.destroy();
      cancelBtn.destroy();
      input.remove();
      
      if (shouldRestart) {
        this.scene.restart();
      }
    };

    // Save button
    const saveBtn = this.createButton(width / 2 - 70, height / 2 + 120, 'Save', 0x27ae60, 120, 45);
    saveBtn.setDepth(1001);
    saveBtn.on('pointerdown', async () => {
      const newName = input.value.trim();
      if (newName && newName !== level.name) {
        const success = await this.updateLevelName(level.id, newName);
        if (success) {
          closeDialog(true); // Restart scene to refresh list
          return;
        }
      }
      closeDialog(false);
    });

    // Cancel button
    const cancelBtn = this.createButton(width / 2 + 70, height / 2 + 120, 'Cancel', 0x95a5a6, 120, 45);
    cancelBtn.setDepth(1001);
    cancelBtn.on('pointerdown', () => {
      closeDialog(false);
    });

    // Handle Enter key
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const newName = input.value.trim();
        if (newName && newName !== level.name) {
          const success = await this.updateLevelName(level.id, newName);
          if (success) {
            closeDialog(true); // Restart scene to refresh list
            return;
          }
        }
        closeDialog(false);
      } else if (e.key === 'Escape') {
        closeDialog(false);
      }
    });
  }

  private async updateLevelName(levelId: string, newName: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LEVELS}/${levelId}/name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      if (response.ok) {
        return true;
      } else {
        console.error('Failed to update level name:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error updating level name:', error);
      return false;
    }
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

  update(): void {
    // Check for ESC key press
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (escKey && Phaser.Input.Keyboard.JustDown(escKey)) {
      this.scene.start('MenuScene');
    }
  }
}
