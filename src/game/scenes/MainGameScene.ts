import Phaser from 'phaser';
import { InputManager } from '../managers/InputManager';
import { LevelManager } from '../managers/LevelManager';
import { Player } from '../entities/Player';
import { Vehicle } from '../entities/Vehicle';

interface Lane {
  y: number;
  vehicles: Vehicle[];
  vehicleType: string;
  speed: number;
  direction: number;
  spawnTimer: number;
  spawnInterval: number;
}

export class MainGameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private levelManager!: LevelManager;
  private player!: Player;
  private lanes: Lane[] = [];
  private score: number = 0;
  private lives: number = 3;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gamepadText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private isLevelTransition: boolean = false;
  private goalsReachedThisLevel: number = 0;
  private goalsNeededForNextLevel: number = 3;

  constructor() {
    super({ key: 'MainGameScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create level manager
    this.levelManager = new LevelManager();

    // Get level config
    const levelConfig = this.levelManager.getLevelConfig();

    // Create background with level-specific color
    this.add.rectangle(0, 0, width, height, levelConfig.backgroundColor).setOrigin(0);

    // Create input manager
    this.inputManager = new InputManager(this);

    // Create lanes based on level
    this.createLanes();

    // Create player at bottom center
    const startX = width / 2;
    const startY = height - 32;
    this.player = new Player(this, startX, startY);

    // Create UI
    this.createUI();

    // Setup collision detection
    this.setupCollisions();

    // Show level intro
    this.showLevelIntro();
  }

  private createLanes(): void {
    const height = this.scale.height;
    const width = this.scale.width;
    const laneHeight = 32;

    // Get level configuration
    const levelConfig = this.levelManager.getLevelConfig();
    const vehicleTypes = this.levelManager.getVehicleTypesForLevel();

    // Create lanes based on level difficulty
    for (let i = 0; i < levelConfig.laneCount; i++) {
      const laneY = height - (i + 2) * laneHeight;
      const direction = i % 2 === 0 ? 1 : -1; // Alternate directions
      const speed = levelConfig.minSpeed + Math.random() * (levelConfig.maxSpeed - levelConfig.minSpeed);
      const vehicleType = vehicleTypes[i % vehicleTypes.length];

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
        vehicleType,
        speed,
        direction,
        spawnTimer: 0,
        spawnInterval: levelConfig.minSpawnInterval + Math.random() * (levelConfig.maxSpawnInterval - levelConfig.minSpawnInterval)
      });
    }

    // Create safe zone at top
    const safeZoneY = height - (levelConfig.laneCount + 2) * laneHeight;
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
    const levelConfig = this.levelManager.getLevelConfig();

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

    this.add.text(width / 2, 16, `Level ${levelConfig.level}`, {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0);

    this.add.text(width / 2, 42, this.levelManager.getDifficultyName(), {
      fontSize: '16px',
      color: this.levelManager.getDifficultyColor(),
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);

    this.gamepadText = this.add.text(16, 48, '', {
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    });
  }

  private setupCollisions(): void {
    // Will check collisions in update loop
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
    const levelConfig = this.levelManager.getLevelConfig();
    const points = 100 * levelConfig.scoreMultiplier;
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
    this.goalsReachedThisLevel++;

    // Check if ready for next level
    if (this.goalsReachedThisLevel >= this.goalsNeededForNextLevel) {
      this.advanceToNextLevel();
    } else {
      this.player.reset(this.scale.width / 2, this.scale.height - 32);
    }
  }

  private advanceToNextLevel(): void {
    this.isLevelTransition = true;
    this.levelManager.nextLevel();

    // Show level complete screen
    this.showLevelComplete();

    // Transition to next level after delay
    this.time.delayedCall(3000, () => {
      this.scene.restart();
    });
  }

  private showLevelIntro(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const levelConfig = this.levelManager.getLevelConfig();

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

    const titleText = this.add.text(width / 2, height / 2 - 80, levelConfig.name, {
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const difficultyText = this.add.text(width / 2, height / 2 - 30, this.levelManager.getDifficultyName(), {
      fontSize: '28px',
      color: this.levelManager.getDifficultyColor(),
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const infoText = this.add.text(width / 2, height / 2 + 20, `Reach the goal ${this.goalsNeededForNextLevel} times to advance!`, {
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const readyText = this.add.text(width / 2, height / 2 + 60, 'Get Ready...', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Fade out after 2 seconds
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: [overlay, titleText, difficultyText, infoText, readyText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          overlay.destroy();
          titleText.destroy();
          difficultyText.destroy();
          infoText.destroy();
          readyText.destroy();
        }
      });
    });
  }

  private showLevelComplete(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const levelConfig = this.levelManager.getLevelConfig();

    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

    this.add.text(width / 2, height / 2 - 60, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, `Level ${levelConfig.level} Cleared!`, {
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 50, `Next: Level ${levelConfig.level + 1}`, {
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  private gameOver(): void {
    this.isGameOver = true;

    const width = this.scale.width;
    const height = this.scale.height;
    const levelConfig = this.levelManager.getLevelConfig();

    // Darken screen
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    // Game over text
    this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, `Reached Level: ${levelConfig.level}`, {
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

    this.add.text(width / 2, height / 2 + 70, 'Press SPACE or A to restart', {
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
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

    // Handle restart
    if (this.isGameOver && inputState.jump) {
      this.levelManager.reset();
      this.scene.restart();
      this.isGameOver = false;
      this.score = 0;
      this.lives = 3;
      this.goalsReachedThisLevel = 0;
      return;
    }

    if (this.isGameOver || this.isLevelTransition) return;

    // Update player
    this.player.update(inputState);

    // Update lanes and vehicles
    const levelConfig = this.levelManager.getLevelConfig();
    for (const lane of this.lanes) {
      lane.spawnTimer += delta;

      // Spawn new vehicles
      if (lane.spawnTimer >= lane.spawnInterval) {
        this.spawnVehicle(lane);
        lane.spawnTimer = 0;
        lane.spawnInterval = levelConfig.minSpawnInterval + Math.random() * (levelConfig.maxSpawnInterval - levelConfig.minSpawnInterval);
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
