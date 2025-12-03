import Phaser from 'phaser';
import { InputManager } from '../managers/InputManager';
import { Player } from '../entities/Player';
import { Vehicle } from '../entities/Vehicle';
import type { CustomLevel } from '../types/CustomLevel';
import { SettingsScene } from './SettingsScene';

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
  private isPaused: boolean = false;
  private pausedText?: Phaser.GameObjects.Text;
  private goalY: number = 0;
  private goalX: number = 0;
  private redTreesGraphics: Phaser.GameObjects.GameObject[] = [];
  private roadProps: Phaser.GameObjects.Sprite[] = [];
  private availableProps = ['barrier.png', 'light.png', 'light_double.png', 'sign_blue.png', 'sign_red.png', 'sign_street.png'];
  private static bgMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'CustomGameScene' });
  }

  init(data: { level: CustomLevel }): void {
    this.customLevel = data.level;
  }

  create(): void {
    const width = this.scale.width;

    // Initialize and manage background music
    if (!CustomGameScene.bgMusic) {
      CustomGameScene.bgMusic = this.sound.add('bgMusic', { loop: true, volume: SettingsScene.getMusicVolume() });
    }
    
    if (SettingsScene.isMusicEnabled() && !CustomGameScene.bgMusic.isPlaying) {
      CustomGameScene.bgMusic.play();
    } else if (!SettingsScene.isMusicEnabled() && CustomGameScene.bgMusic.isPlaying) {
      CustomGameScene.bgMusic.pause();
    }

    // Create input manager
    this.inputManager = new InputManager(this);

    // Create lanes from custom level (this will handle all backgrounds including grass)
    this.createCustomLanes();

    // Create player at bottom center (just before the first lane)
    const laneCount = this.customLevel.lanes.length;
    const laneHeight = 64;
    const grassTopHeight = Math.max(laneHeight * 2, laneHeight * 3 - (laneCount - 4) * 16);
    const roadAreaHeight = laneCount * laneHeight;
    const roadEndY = grassTopHeight + roadAreaHeight;
    const startX = width / 2;
    const startY = roadEndY + 32;
    this.player = new Player(this, startX, startY);

    // Create UI
    this.createUI();
  }

  private createCustomLanes(): void {
    const height = this.scale.height;
    const width = this.scale.width;
    const laneHeight = 64; // Match MainGameScene

    // Clear existing
    for (const lane of this.lanes) {
      for (const vehicle of lane.vehicles) {
        vehicle.destroy();
      }
    }
    this.lanes = [];

    for (const prop of this.roadProps) {
      prop.destroy();
    }
    this.roadProps = [];

    // Calculate road area like MainGameScene
    const laneCount = this.customLevel.lanes.length;
    const grassTopHeight = Math.max(laneHeight * 2, laneHeight * 3 - (laneCount - 4) * 16);
    const roadAreaHeight = laneCount * laneHeight;
    const roadStartY = grassTopHeight;

    // First, fill entire background with grass
    this.add.rectangle(0, 0, width, height, 0x228b22).setOrigin(0).setDepth(-100);

    // Then draw the black road on top of grass in the middle section
    this.add.rectangle(0, roadStartY, width, roadAreaHeight, 0x333333).setOrigin(0).setDepth(-50);

    // Create lanes based on custom level configuration
    this.customLevel.lanes.forEach((customLane, i) => {
      const laneY = roadStartY + (i + 0.5) * laneHeight;

      // Draw individual lane with gray color
      this.add.rectangle(0, roadStartY + i * laneHeight, width, laneHeight, 0x555555).setOrigin(0).setDepth(-40);

      // Add lane markings
      if (i > 0) {
        for (let x = 0; x < width; x += 40) {
          this.add.rectangle(x, roadStartY + i * laneHeight - 2, 20, 2, 0xffff00).setOrigin(0).setDepth(-30);
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

    // Spawn random road props/obstacles
    this.spawnRoadProps(roadStartY, laneHeight);

    // Draw trees at the top like MainGameScene
    this.goalY = grassTopHeight / 2;

    // Create 5 tree positions evenly spaced across the top
    const treePositions: number[] = [];
    const spacing = (width - 200) / 4;
    for (let i = 0; i < 5; i++) {
      treePositions.push(100 + i * spacing);
    }

    // Shuffle positions to randomize tree placement
    const shuffled = treePositions.sort(() => Math.random() - 0.5);

    // First position gets the green tree (correct goal)
    this.goalX = shuffled[0];
    this.drawTree(this.goalX, this.goalY, 0x228B22); // Green tree

    // Other 4 positions get red trees (distractors)
    for (let i = 1; i < 5; i++) {
      this.drawTree(shuffled[i], this.goalY, 0xff0000); // Red trees
    }
  }

  private spawnRoadProps(roadStartY: number, laneHeight: number): void {
    const width = this.scale.width;
    const laneCount = this.customLevel.lanes.length;
    const roadAreaHeight = laneCount * laneHeight;
    const roadEndY = roadStartY + roadAreaHeight;

    const propCount = Math.floor(Math.random() * 8) + 8; // 8-15 props

    for (let i = 0; i < propCount; i++) {
      const propType = this.availableProps[Math.floor(Math.random() * this.availableProps.length)];
      const x = Math.random() * (width - 100) + 50;
      const y = roadStartY + Math.random() * roadAreaHeight;

      if (y < roadStartY + 30 || y > roadEndY - 30) continue;

      const prop = this.add.sprite(x, y, 'sprites', propType);
      prop.setDepth(5);
      prop.setScale(1.5);

      this.physics.add.existing(prop, true);
      const body = prop.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setSize(prop.width * 0.8, prop.height * 0.6);
      }

      this.roadProps.push(prop);
    }
  }

  private drawTree(x: number, y: number, foliageColor: number): void {
    // Draw tree trunk with black outline
    const trunkOutline = this.add.rectangle(x, y + 30, 24, 64, 0x000000).setDepth(-5);
    const trunk = this.add.rectangle(x, y + 30, 20, 60, 0x8B4513).setDepth(-5);

    // Draw tree foliage with black outlines
    const foliage1Outline = this.add.circle(x, y, 42, 0x000000).setDepth(-5);
    const foliage1 = this.add.circle(x, y, 40, foliageColor).setDepth(-5);

    const foliage2Outline = this.add.circle(x - 15, y + 15, 37, 0x000000).setDepth(-5);
    const foliage2 = this.add.circle(x - 15, y + 15, 35, foliageColor).setDepth(-5);

    const foliage3Outline = this.add.circle(x + 15, y + 15, 37, 0x000000).setDepth(-5);
    const foliage3 = this.add.circle(x + 15, y + 15, 35, foliageColor).setDepth(-5);

    const foliage4Outline = this.add.circle(x, y + 25, 32, 0x000000).setDepth(-5);
    const bottomColor = foliageColor === 0x228B22 ? 0x2E8B57 : 0xcc0000;
    const foliage4 = this.add.circle(x, y + 25, 30, bottomColor).setDepth(-5);

    const treeGraphicsArray = [
      trunkOutline, trunk,
      foliage1Outline, foliage1,
      foliage2Outline, foliage2,
      foliage3Outline, foliage3,
      foliage4Outline, foliage4
    ];

    // Only track red trees for special visual effects
    if (foliageColor !== 0x228B22) {
      this.redTreesGraphics.push(...treeGraphicsArray);
    }
  }

  private createUI(): void {
    const width = this.scale.width;
    const height = this.scale.height;

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

    // Pause indicator (hidden by default)
    this.pausedText = this.add.text(width / 2, height / 2, '⏸️ PAUSED ⏸️\n\nPress Ctrl+A to Resume', {
      fontSize: '48px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(1000).setVisible(false);

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
    
    // Play car engine sound effect when vehicle spawns
    if (SettingsScene.isSfxEnabled()) {
      this.sound.play('carEngine', { volume: SettingsScene.getSfxVolume() });
    }
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
          this.createCollisionParticles(playerPos.x, playerPos.y, 0xff0000); // Red particles for vehicle collision
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

  private createCollisionParticles(x: number, y: number, color: number): void {
    // Create a burst of particles at the collision point
    const particleCount = 15;
    const particles: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(x, y);

      // Random velocity for explosion effect
      const angle = (Math.PI * 2 * i) / particleCount + Phaser.Math.FloatBetween(-0.3, 0.3);
      const speed = Phaser.Math.FloatBetween(50, 150);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      particles.push(particle);

      // Animate particles
      this.tweens.add({
        targets: particle,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  private handlePlayerHit(): void {
    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);
    this.player.die();

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.time.delayedCall(1500, () => {
        const laneCount = this.customLevel.lanes.length;
        const laneHeight = 64;
        const grassTopHeight = Math.max(laneHeight * 2, laneHeight * 3 - (laneCount - 4) * 16);
        const roadAreaHeight = laneCount * laneHeight;
        const roadEndY = grassTopHeight + roadAreaHeight;
        this.player.reset(this.scale.width / 2, roadEndY + 32);
      });
    }
  }

  private handleGoalReached(): void {
    this.score += 100;
    this.scoreText.setText(`Score: ${this.score}`);
    
    // Reset player to starting position at bottom
    const laneCount = this.customLevel.lanes.length;
    const laneHeight = 64;
    const grassTopHeight = Math.max(laneHeight * 2, laneHeight * 3 - (laneCount - 4) * 16);
    const roadAreaHeight = laneCount * laneHeight;
    const roadEndY = grassTopHeight + roadAreaHeight;
    this.player.reset(this.scale.width / 2, roadEndY + 32);
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

    // Check for Ctrl+A to toggle pause
    const ctrlKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    const aKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    if (ctrlKey?.isDown && Phaser.Input.Keyboard.JustDown(aKey!)) {
      this.isPaused = !this.isPaused;
      this.pausedText?.setVisible(this.isPaused);

      // Pause/resume physics and animations
      if (this.isPaused) {
        this.physics.pause();
        this.anims.pauseAll();
      } else {
        this.physics.resume();
        this.anims.resumeAll();
      }
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

    if (this.isGameOver || this.isPaused) return;

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
