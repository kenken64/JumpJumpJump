import Phaser from 'phaser';
import { InputManager } from '../managers/InputManager';
import { Player } from '../entities/Player';
import { Vehicle } from '../entities/Vehicle';
import type { CustomLevel } from '../types/CustomLevel';

interface Lane {
  y: number;
  vehicles: Vehicle[];
  vehicleType: string;
  speed: number;
  direction: number;
  spawnTimer: number;
  spawnInterval: number;
}

export class CustomGameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private player!: Player;
  private lanes: Lane[] = [];
  private customLevel!: CustomLevel;
  private score: number = 0;
  private lives: number = 3;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gamepadText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;

  constructor() {
    super({ key: 'CustomGameScene' });
  }

  init(data: { level: CustomLevel }): void {
    this.customLevel = data.level;
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create background with custom color
    this.add.rectangle(0, 0, width, height, this.customLevel.backgroundColor).setOrigin(0);

    // Create input manager
    this.inputManager = new InputManager(this);

    // Create lanes from custom level
    this.createCustomLanes();

    // Create player at bottom center
    const startX = width / 2;
    const startY = height - 32;
    this.player = new Player(this, startX, startY);

    // Create UI
    this.createUI();
  }

  private createCustomLanes(): void {
    const height = this.scale.height;
    const width = this.scale.width;
    const laneHeight = 32;

    // Create lanes based on custom level configuration
    this.customLevel.lanes.forEach((customLane, i) => {
      const laneY = height - (i + 2) * laneHeight;

      // Draw lane background (road)
      this.add.rectangle(0, laneY - laneHeight / 2, width, laneHeight, 0x444444).setOrigin(0);

      // Add lane markings
      if (i > 0) {
        for (let x = 0; x < width; x += 40) {
          this.add.rectangle(x, laneY - laneHeight, 20, 2, 0xffff00).setOrigin(0);
        }
      }

      this.lanes.push({
        y: laneY,
        vehicles: [],
        vehicleType: customLane.vehicleType,
        speed: customLane.speed,
        direction: customLane.direction,
        spawnTimer: 0,
        spawnInterval: customLane.spawnInterval
      });
    });

    // Create safe zone at top
    const safeZoneY = height - (this.customLevel.lanes.length + 2) * laneHeight;
    this.add.rectangle(0, 0, width, safeZoneY + laneHeight, 0x90ee90).setOrigin(0);
    this.add.text(width / 2, 32, 'GOAL!', {
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Create safe zone at bottom
    this.add.rectangle(0, height - laneHeight, width, laneHeight, 0x90ee90).setOrigin(0);
  }

  private createUI(): void {
    const width = this.scale.width;

    this.add.text(width / 2, 16, this.customLevel.name, {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    this.livesText = this.add.text(width - 16, 16, 'Lives: 3', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0);

    this.gamepadText = this.add.text(16, 48, '', {
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    });

    // Exit button
    const exitBtn = this.add.text(width - 16, 48, '[ESC] Exit', {
      fontSize: '14px',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0);
    exitBtn.setInteractive({ useHandCursor: true });
    exitBtn.on('pointerdown', () => this.scene.start('CustomLevelSelectScene'));
  }

  private spawnVehicle(lane: Lane): void {
    const width = this.scale.width;
    const startX = lane.direction > 0 ? -50 : width + 50;

    // Check if there's already a vehicle too close to the spawn point
    const minSpacing = 150; // Minimum pixels between vehicles
    for (const existingVehicle of lane.vehicles) {
      const distance = Math.abs(existingVehicle.sprite.x - startX);
      if (distance < minSpacing) {
        // Too close to spawn, skip this spawn
        return;
      }
    }

    const vehicle = new Vehicle(
      this,
      startX,
      lane.y,
      lane.vehicleType,
      lane.speed,
      lane.direction
    );

    lane.vehicles.push(vehicle);
  }

  private checkCollisions(): void {
    if (this.isGameOver) return;

    const playerPos = this.player.getPosition();
    const playerBounds = new Phaser.Geom.Rectangle(
      playerPos.x - 8,
      playerPos.y - 8,
      16,
      16
    );

    for (const lane of this.lanes) {
      for (const vehicle of lane.vehicles) {
        const vehicleBounds = vehicle.sprite.getBounds();

        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, vehicleBounds)) {
          this.handlePlayerHit();
          return;
        }
      }
    }

    // Check if player reached goal
    if (playerPos.y < 100) {
      this.handleGoalReached();
    }
  }

  private handlePlayerHit(): void {
    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);
    this.player.die();

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.time.delayedCall(1000, () => {
        this.player.reset(this.scale.width / 2, this.scale.height - 32);
      });
    }
  }

  private handleGoalReached(): void {
    this.score += 100;
    this.scoreText.setText(`Score: ${this.score}`);
    this.player.reset(this.scale.width / 2, this.scale.height - 32);
  }

  private gameOver(): void {
    this.isGameOver = true;

    const width = this.scale.width;
    const height = this.scale.height;

    // Darken screen
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    // Game over text
    this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, `Level: ${this.customLevel.name}`, {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 70, 'Press SPACE or A to retry', {
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 100, 'Press ESC to exit', {
      fontSize: '16px',
      color: '#95a5a6',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    // Get input state
    const inputState = this.inputManager.getInputState();

    // Update gamepad status
    if (this.inputManager.isGamepadConnected()) {
      this.gamepadText.setText(`Gamepad: ${this.inputManager.getGamepadName()}`);
    } else {
      this.gamepadText.setText('Gamepad: Not connected');
    }

    // Handle exit
    if (inputState.pause) {
      this.scene.start('CustomLevelSelectScene');
      return;
    }

    // Handle restart
    if (this.isGameOver && inputState.jump) {
      this.scene.restart({ level: this.customLevel });
      this.isGameOver = false;
      this.score = 0;
      this.lives = 3;
      return;
    }

    if (this.isGameOver) return;

    // Update player
    this.player.update(inputState);

    // Update lanes and vehicles
    for (const lane of this.lanes) {
      lane.spawnTimer += delta;

      // Spawn new vehicles
      if (lane.spawnTimer >= lane.spawnInterval) {
        this.spawnVehicle(lane);
        lane.spawnTimer = 0;
      }

      // Update and cleanup vehicles
      for (let i = lane.vehicles.length - 1; i >= 0; i--) {
        const vehicle = lane.vehicles[i];
        vehicle.update();

        // Remove off-screen vehicles
        const width = this.scale.width;
        if (vehicle.sprite.x < -100 || vehicle.sprite.x > width + 100) {
          vehicle.destroy();
          lane.vehicles.splice(i, 1);
        }
      }
    }

    // Check collisions
    this.checkCollisions();
  }
}
