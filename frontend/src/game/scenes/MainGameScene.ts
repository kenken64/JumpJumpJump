import Phaser from 'phaser';
import { InputManager } from '../managers/InputManager';
import { LevelManager } from '../managers/LevelManager';
import { Player } from '../entities/Player';
import { Vehicle } from '../entities/Vehicle';
import { API_CONFIG } from '../apiConfig';

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
  private static levelManager: LevelManager = new LevelManager(); // Shared across all scene instances
  private static persistentScore: number = 0; // Persists across scene restarts
  private static persistentLives: number = 3; // Persists across scene restarts
  private inputManager!: InputManager;
  private player!: Player;
  private lanes: Lane[] = [];
  private score: number = 0;
  private lives: number = 3;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gamepadText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private difficultyText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private isLevelTransition: boolean = false;
  private goalsReachedThisLevel: number = 0;
  private goalsNeededForNextLevel: number = 3;
  private goalTree!: Phaser.GameObjects.Graphics;
  private goalY: number = 0;
  private goalX: number = 0;
  private treeGraphics: Phaser.GameObjects.GameObject[] = [];
  private redTreesGraphics: Phaser.GameObjects.GameObject[] = [];
  private countdownActive: boolean = false;
  private countdownText?: Phaser.GameObjects.Text;
  private cheatModeActive: boolean = false;
  private cheatModeText?: Phaser.GameObjects.Text;
  private isPlayerInvulnerable: boolean = false;

  constructor() {
    super({ key: 'MainGameScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Reset game state
    this.countdownActive = false;
    this.isLevelTransition = false;
    this.isGameOver = false;
    this.goalsReachedThisLevel = 0;
    this.cheatModeActive = false;
    this.isPlayerInvulnerable = false;

    // Restore score and lives from static persistent values
    this.score = MainGameScene.persistentScore;
    this.lives = MainGameScene.persistentLives;

    // Get level config from the static level manager
    const levelConfig = MainGameScene.levelManager.getLevelConfig();

    // Create background with level-specific color - set depth very low so it doesn't cover roads
    this.add.rectangle(0, 0, width, height, levelConfig.backgroundColor).setOrigin(0).setDepth(-300);

    // Create input manager
    this.inputManager = new InputManager(this);

    // Create lanes based on level
    this.createLanes();

    // Create player at bottom center (just before the first lane)
    const startX = width / 2;
    const laneHeight = 64;
    const grassTopHeight = Math.max(laneHeight * 2, laneHeight * 3 - (levelConfig.laneCount - 4) * 16);
    const roadAreaHeight = levelConfig.laneCount * laneHeight;
    const roadEndY = grassTopHeight + roadAreaHeight;
    const startY = roadEndY + 32; // Just below the road
    this.player = new Player(this, startX, startY);

    // Create UI
    this.createUI();

    // Setup collision detection
    this.setupCollisions();

    // Spawn initial vehicles to populate the road
    this.spawnInitialVehicles();

    // Show level intro
    this.showLevelIntro();
  }

  private createLanes(): void {
    const height = this.scale.height;
    const width = this.scale.width;
    const laneHeight = 64; // Increased from 32 to make roads wider

    // Clear existing lanes and vehicles
    for (const lane of this.lanes) {
      for (const vehicle of lane.vehicles) {
        vehicle.destroy();
      }
    }
    this.lanes = [];

    // Get level configuration
    const levelConfig = MainGameScene.levelManager.getLevelConfig();
    const vehicleTypes = MainGameScene.levelManager.getVehicleTypesForLevel();

    // Calculate road area - adjust top grass based on lane count to keep player visible
    // For 8 lanes, use smaller top area; for fewer lanes, use more space
    const grassTopHeight = Math.max(laneHeight * 2, laneHeight * 3 - (levelConfig.laneCount - 4) * 16);
    const roadAreaHeight = levelConfig.laneCount * laneHeight;
    const roadStartY = grassTopHeight;
    const roadEndY = roadStartY + roadAreaHeight;

    // First, fill entire background with grass
    this.add.rectangle(0, 0, width, height, 0x228b22).setOrigin(0).setDepth(-100);

    // Then draw the black road on top of grass in the middle section
    const roadBackground = this.add.rectangle(0, roadStartY, width, roadAreaHeight, 0x333333).setOrigin(0).setDepth(-50);

    // Create lanes based on level difficulty
    for (let i = 0; i < levelConfig.laneCount; i++) {
      const laneY = roadStartY + (i + 0.5) * laneHeight;
      const direction = i % 2 === 0 ? 1 : -1; // Alternate directions
      const speed = levelConfig.minSpeed + Math.random() * (levelConfig.maxSpeed - levelConfig.minSpeed);
      const vehicleType = vehicleTypes[i % vehicleTypes.length];

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
        vehicleType,
        speed,
        direction,
        spawnTimer: 0,
        spawnInterval: levelConfig.minSpawnInterval + Math.random() * (levelConfig.maxSpawnInterval - levelConfig.minSpawnInterval)
      });
    }

    // Draw trees at the top
    this.goalY = grassTopHeight / 2;

    // Create 5 tree positions evenly spaced across the top
    const treePositions: number[] = [];
    const spacing = (width - 200) / 4; // Space for 5 trees with margins
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

  private clearTree(): void {
    // Destroy all existing tree graphics (green tree)
    for (const graphic of this.treeGraphics) {
      graphic.destroy();
    }
    this.treeGraphics = [];

    // Destroy all red trees
    for (const graphic of this.redTreesGraphics) {
      graphic.destroy();
    }
    this.redTreesGraphics = [];

    if (this.goalTree) {
      this.goalTree.destroy();
    }
  }

  private drawTree(x: number, y: number, foliageColor: number): void {
    // Draw tree trunk with black outline - depth -5 to be below UI
    const trunkOutline = this.add.rectangle(x, y + 30, 24, 64, 0x000000).setDepth(-5);
    const trunk = this.add.rectangle(x, y + 30, 20, 60, 0x8B4513).setDepth(-5);

    // Draw tree foliage with black outlines (3 layers of circles to make it look like a tree)
    // Layer 1 - largest circle
    const foliage1Outline = this.add.circle(x, y, 42, 0x000000).setDepth(-5);
    const foliage1 = this.add.circle(x, y, 40, foliageColor).setDepth(-5);

    // Layer 2 - left circle
    const foliage2Outline = this.add.circle(x - 15, y + 15, 37, 0x000000).setDepth(-5);
    const foliage2 = this.add.circle(x - 15, y + 15, 35, foliageColor).setDepth(-5);

    // Layer 3 - right circle
    const foliage3Outline = this.add.circle(x + 15, y + 15, 37, 0x000000).setDepth(-5);
    const foliage3 = this.add.circle(x + 15, y + 15, 35, foliageColor).setDepth(-5);

    // Layer 4 - bottom circle (slightly darker shade)
    const foliage4Outline = this.add.circle(x, y + 25, 32, 0x000000).setDepth(-5);
    const bottomColor = foliageColor === 0x228B22 ? 0x2E8B57 : 0xcc0000; // Darker green or darker red
    const foliage4 = this.add.circle(x, y + 25, 30, bottomColor).setDepth(-5);

    // Store tree graphics - only store green tree in main array, red trees in separate array
    const treeGraphicsArray = [
      trunkOutline, trunk,
      foliage1Outline, foliage1,
      foliage2Outline, foliage2,
      foliage3Outline, foliage3,
      foliage4Outline, foliage4
    ];

    if (foliageColor === 0x228B22) {
      // Green tree - this is the goal
      this.treeGraphics = treeGraphicsArray;
    } else {
      // Red tree - distractor
      this.redTreesGraphics.push(...treeGraphicsArray);
    }

    // Store reference to tree for collision detection
    this.goalTree = this.add.graphics();
    this.goalTree.fillStyle(0x228B22, 0);
    this.goalTree.fillCircle(x, y, 50); // Invisible hitbox for tree
    this.goalTree.setDepth(-5);
  }

  private createUI(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const levelConfig = MainGameScene.levelManager.getLevelConfig();

    // Position UI at the very top
    const uiDepth = 10000; // Very high depth to always show on top

    // Top row: Score (left), Level (center), Lives (right)
    this.scoreText = this.add.text(16, 8, 'Score: 0', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(uiDepth);

    this.livesText = this.add.text(width - 16, 8, 'Lives: 3', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0).setDepth(uiDepth);

    this.levelText = this.add.text(width / 2, 8, `Level ${levelConfig.level}`, {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0).setDepth(uiDepth);

    // Second row: Gamepad (left), Difficulty (center)
    this.difficultyText = this.add.text(width / 2, 32, MainGameScene.levelManager.getDifficultyName(), {
      fontSize: '14px',
      color: MainGameScene.levelManager.getDifficultyColor(),
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0).setDepth(uiDepth);

    this.gamepadText = this.add.text(16, 32, '', {
      fontSize: '12px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setDepth(uiDepth);

    // Cheat mode indicator (hidden by default)
    this.cheatModeText = this.add.text(width / 2, height - 40, '🛡️ CHEAT MODE: INVINCIBLE 🛡️', {
      fontSize: '24px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiDepth).setVisible(false);

    // Instructions at bottom right
    this.add.text(width - 16, 32, 'ESC: Menu', {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(uiDepth);
  }

  private updateLevelUI(): void {
    const levelConfig = MainGameScene.levelManager.getLevelConfig();
    this.levelText.setText(`Level ${levelConfig.level}`);
    this.difficultyText.setText(MainGameScene.levelManager.getDifficultyName());
    this.difficultyText.setColor(MainGameScene.levelManager.getDifficultyColor());
  }

  private setupCollisions(): void {
    // Will check collisions in update loop
  }

  private spawnInitialVehicles(): void {
    // Spawn 2-3 vehicles per lane at random positions across the screen
    // This makes the road look populated from the start
    const width = this.scale.width;

    for (const lane of this.lanes) {
      const vehicleCount = 2 + Math.floor(Math.random() * 2); // 2-3 vehicles per lane

      for (let i = 0; i < vehicleCount; i++) {
        // Random position across the screen width
        const randomX = Math.random() * width;

        const vehicle = new Vehicle(
          this,
          randomX,
          lane.y,
          lane.vehicleType,
          lane.speed,
          lane.direction
        );

        lane.vehicles.push(vehicle);
      }
    }
  }

  private spawnVehicle(lane: Lane): void {
    const width = this.scale.width;
    const startX = lane.direction > 0 ? -50 : width + 50;

    // Progressive max vehicles per lane based on level
    const levelConfig = MainGameScene.levelManager.getLevelConfig();
    // Level 1-9: Start at 2, max 5
    // Level 10+: Increase further, up to 8 vehicles per lane
    const maxVehiclesPerLane = levelConfig.level >= 10 
      ? Math.min(5 + Math.floor((levelConfig.level - 9) / 2), 8) 
      : Math.min(2 + Math.floor(levelConfig.level / 2), 5);

    if (lane.vehicles.length >= maxVehiclesPerLane) {
      return;
    }

    // Progressive spacing - tighter as levels increase
    const minSpacing = Math.max(250, 400 - (levelConfig.level * 15)); // Increased base spacing

    // Check if spawn position is too close to ANY existing vehicle
    for (const existingVehicle of lane.vehicles) {
      const distance = Math.abs(existingVehicle.sprite.x - startX);
      if (distance < minSpacing) {
        // Too close to spawn, skip this spawn
        return;
      }
    }

    // Additional check: ensure no vehicles will overlap due to speed differences
    // Check if any existing vehicle in the same direction is close enough to potentially overlap
    for (const existingVehicle of lane.vehicles) {
      // For vehicles moving in the same direction
      if (lane.direction > 0) {
        // Moving right: check if there's a vehicle ahead (to the right of spawn point)
        if (existingVehicle.sprite.x > startX && existingVehicle.sprite.x < startX + minSpacing) {
          return;
        }
      } else {
        // Moving left: check if there's a vehicle ahead (to the left of spawn point)
        if (existingVehicle.sprite.x < startX && existingVehicle.sprite.x > startX - minSpacing) {
          return;
        }
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
    if (this.isGameOver || this.countdownActive) return;

    const playerPos = this.player.getPosition();
    // Player hitbox - reduced for more accurate collision (16x16)
    const playerBounds = new Phaser.Geom.Rectangle(
      playerPos.x - 8,
      playerPos.y - 8,
      16,
      16
    );

    // Skip vehicle collision check if cheat mode is active or player is invulnerable
    if (!this.cheatModeActive && !this.isPlayerInvulnerable) {
      for (const lane of this.lanes) {
        for (const vehicle of lane.vehicles) {
          // Safety check: ensure vehicle and sprite exist
          if (!vehicle || !vehicle.sprite || !vehicle.sprite.active) {
            continue;
          }

          const vehicleBounds = vehicle.sprite.getBounds();

          if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, vehicleBounds)) {
            this.handlePlayerHit();
            return;
          }
        }
      }
    }

    // Check if player reached the tree (goal)
    const distanceToTree = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, this.goalX, this.goalY);

    if (distanceToTree < 50) { // Within 50 pixels of the tree
      this.handleGoalReached();
    }
  }

  private handlePlayerHit(): void {
    // Prevent multiple hits during invulnerability period
    if (this.isPlayerInvulnerable) return;
    
    this.isPlayerInvulnerable = true; // Set invulnerability immediately
    
    this.lives--;
    MainGameScene.persistentLives = this.lives; // Save to persistent
    this.livesText.setText(`Lives: ${this.lives}`);
    this.player.die();

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.time.delayedCall(1000, () => {
        const laneHeight = 64;
        const levelConfig = MainGameScene.levelManager.getLevelConfig();
        const grassTopHeight = Math.max(laneHeight * 2, laneHeight * 3 - (levelConfig.laneCount - 4) * 16);
        const roadAreaHeight = levelConfig.laneCount * laneHeight;
        const roadEndY = grassTopHeight + roadAreaHeight;
        this.player.reset(this.scale.width / 2, roadEndY + 32);
        
        // Restore cheat mode appearance if active
        if (this.cheatModeActive) {
          this.player.sprite.setAlpha(0.5);
          this.player.sprite.setTint(0x00ff00);
        }
        
        // Give brief invulnerability after respawn (1 second)
        this.time.delayedCall(1000, () => {
          this.isPlayerInvulnerable = false;
        });
      });
    }
  }

  private handleGoalReached(): void {
    const levelConfig = MainGameScene.levelManager.getLevelConfig();
    const points = 100 * levelConfig.scoreMultiplier;
    this.score += points;
    MainGameScene.persistentScore = this.score; // Save to persistent
    this.scoreText.setText(`Score: ${this.score}`);
    this.goalsReachedThisLevel++;

    // Check if ready for next level
    if (this.goalsReachedThisLevel >= this.goalsNeededForNextLevel) {
      this.advanceToNextLevel();
    } else {
      const laneHeight = 64;
      const grassTopHeight = Math.max(laneHeight * 2, laneHeight * 3 - (levelConfig.laneCount - 4) * 16);
      const roadAreaHeight = levelConfig.laneCount * laneHeight;
      const roadEndY = grassTopHeight + roadAreaHeight;
      this.player.reset(this.scale.width / 2, roadEndY + 32);
      
      // Restore cheat mode appearance if active
      if (this.cheatModeActive) {
        this.player.sprite.setAlpha(0.5);
        this.player.sprite.setTint(0x00ff00);
      }
    }
  }

  private advanceToNextLevel(): void {
    this.isLevelTransition = true;
    this.goalsReachedThisLevel = 0; // Reset goals counter for next level

    // Check if current level is the max level (16)
    const currentLevel = MainGameScene.levelManager.getCurrentLevel();
    if (currentLevel >= MainGameScene.levelManager.getMaxLevel()) {
      // Player completed all levels!
      this.showGameComplete();
      return;
    }

    // Show level complete screen
    this.showLevelComplete();

    // Advance to next level and transition after delay
    this.time.delayedCall(3000, () => {
      MainGameScene.levelManager.nextLevel();
      this.rebuildLevel();
    });
  }

  private rebuildLevel(): void {
    // Restart the entire scene to properly clear and rebuild everything with new level config
    this.scene.restart();
  }

  private showLevelIntro(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const levelConfig = MainGameScene.levelManager.getLevelConfig();

    // Only do countdown on level 1
    const isLevel1 = levelConfig.level === 1;

    // Prevent player movement immediately on level 1 (before countdown starts)
    if (isLevel1) {
      this.countdownActive = true;
    }

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setDepth(1000);

    const titleText = this.add.text(width / 2, height / 2 - 80, levelConfig.name, {
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(1001);

    const difficultyText = this.add.text(width / 2, height / 2 - 30, MainGameScene.levelManager.getDifficultyName(), {
      fontSize: '28px',
      color: MainGameScene.levelManager.getDifficultyColor(),
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(1001);

    const infoText = this.add.text(width / 2, height / 2 + 20, `Reach the goal ${this.goalsNeededForNextLevel} times to advance!`, {
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(1001);

    const readyText = this.add.text(width / 2, height / 2 + 60, 'Get Ready...', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(1001);

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

          // Only start countdown on level 1
          if (isLevel1) {
            // Wait 5 seconds for vehicles to reach middle of screen, then start countdown
            this.time.delayedCall(5000, () => {
              this.startCountdown();
            });
          }
        }
      });
    });
  }

  private startCountdown(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // countdownActive should already be true (set in showLevelIntro)
    let count = 10;

    this.countdownText = this.add.text(width / 2, height / 2, count.toString(), {
      fontSize: '72px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(1002);

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText?.setText(count.toString());
          // Change color as countdown gets lower
          if (count <= 3) {
            this.countdownText?.setColor('#ff0000'); // Red for last 3 seconds
          } else if (count <= 5) {
            this.countdownText?.setColor('#ff9900'); // Orange for 4-5 seconds
          }
        } else {
          this.countdownText?.setText('GO!');
          this.countdownText?.setColor('#00ff00');

          // Remove countdown after "GO!"
          this.time.delayedCall(500, () => {
            this.countdownText?.destroy();
            this.countdownActive = false;
          });
        }
      }
    });
  }

  private showLevelComplete(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const currentLevel = MainGameScene.levelManager.getLevelConfig().level;

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setDepth(1000);

    const completeText = this.add.text(width / 2, height / 2 - 60, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(1001);

    const clearedText = this.add.text(width / 2, height / 2, `Level ${currentLevel} Cleared!`, {
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(1001);

    const nextText = this.add.text(width / 2, height / 2 + 50, `Next: Level ${currentLevel + 1}`, {
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(1001);

    // Fade out after 2.5 seconds (before the 3 second delay in advanceToNextLevel)
    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: [overlay, completeText, clearedText, nextText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          overlay.destroy();
          completeText.destroy();
          clearedText.destroy();
          nextText.destroy();
        }
      });
    });
  }

  private async showGameComplete(): Promise<void> {
    const width = this.scale.width;
    const height = this.scale.height;

    // Darken screen
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setDepth(3000);

    // Congratulations panel
    const panelWidth = 600;
    const panelHeight = 600;
    const panelX = width / 2;
    const panelY = height / 2;

    // Panel background with gold theme
    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x2c3e50).setDepth(3001);
    panel.setStrokeStyle(6, 0xf1c40f);

    // Decorative top bar with gold
    this.add.rectangle(panelX, panelY - panelHeight / 2 + 30, panelWidth, 60, 0xf1c40f).setDepth(3002);

    // Trophy/Star emoji
    this.add.text(panelX, panelY - panelHeight / 2 + 30, '🏆', {
      fontSize: '48px'
    }).setOrigin(0.5).setDepth(3003);

    // Congratulations text
    this.add.text(panelX, panelY - 200, 'CONGRATULATIONS!', {
      fontSize: '56px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(3003);

    // Game complete message
    this.add.text(panelX, panelY - 120, 'You completed all 16 levels!', {
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(3003);

    // Final score
    this.add.text(panelX, panelY - 70, `Final Score: ${this.score}`, {
      fontSize: '36px',
      color: '#2ecc71',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(3003);

    // Achievement message
    this.add.text(panelX, panelY - 20, 'You are a true champion!', {
      fontSize: '24px',
      color: '#ecf0f1',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(3003);

    // Stars decoration
    this.add.text(panelX - 150, panelY + 30, '⭐', { fontSize: '32px' }).setOrigin(0.5).setDepth(3003);
    this.add.text(panelX, panelY + 30, '⭐', { fontSize: '40px' }).setOrigin(0.5).setDepth(3003);
    this.add.text(panelX + 150, panelY + 30, '⭐', { fontSize: '32px' }).setOrigin(0.5).setDepth(3003);

    // Username prompt
    this.add.text(panelX, panelY + 80, 'Enter Your Name:', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3003);

    // Show username input and submit score
    await this.showUsernameInputForCompletion(panelX, panelY);

    // Add tween animation for the congratulations text
    const congratsText = this.add.text(panelX, panelY - 200, 'CONGRATULATIONS!', {
      fontSize: '56px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(3003);

    this.tweens.add({
      targets: congratsText,
      scale: { from: 1, to: 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private async gameOver(): Promise<void> {
    this.isGameOver = true;

    const width = this.scale.width;
    const height = this.scale.height;
    const levelConfig = MainGameScene.levelManager.getLevelConfig();

    // Darken screen
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setDepth(2000);

    // Game over panel background
    const panelWidth = 500;
    const panelHeight = 400;
    const panelX = width / 2;
    const panelY = height / 2;

    // Panel background with gradient effect
    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x2c3e50).setDepth(2001);
    panel.setStrokeStyle(4, 0x3498db);

    // Decorative top bar
    this.add.rectangle(panelX, panelY - panelHeight / 2 + 20, panelWidth, 40, 0x3498db).setDepth(2002);

    // Game over text
    this.add.text(panelX, panelY - 160, 'GAME OVER', {
      fontSize: '48px',
      color: '#e74c3c',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(2003);

    // Stats
    this.add.text(panelX, panelY - 90, `Level Reached: ${levelConfig.level}`, {
      fontSize: '22px',
      color: '#ecf0f1',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(2003);

    this.add.text(panelX, panelY - 50, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(2003);

    // Username prompt
    this.add.text(panelX, panelY + 10, 'Enter Your Name:', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(2003);

    // Show custom input dialog
    await this.showUsernameInput(panelX, panelY);

    // Instructions at bottom
    this.add.text(panelX, panelY + 160, 'Press SPACE or A to restart | ESC for Menu', {
      fontSize: '16px',
      color: '#95a5a6',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(2003);
  }

  private async showUsernameInput(panelX: number, panelY: number): Promise<void> {
    return new Promise((resolve) => {
      // Create input box background
      const inputBg = this.add.rectangle(panelX, panelY + 60, 300, 50, 0x34495e).setDepth(2003);
      inputBg.setStrokeStyle(2, 0x3498db);

      // Input text placeholder
      const inputText = this.add.text(panelX, panelY + 60, 'Click to enter name...', {
        fontSize: '18px',
        color: '#7f8c8d',
        fontStyle: 'italic'
      }).setOrigin(0.5).setDepth(2004);

      // Submit button
      const buttonBg = this.add.rectangle(panelX, panelY + 120, 200, 45, 0x27ae60).setDepth(2003);
      buttonBg.setStrokeStyle(2, 0xffffff);

      const buttonText = this.add.text(panelX, panelY + 120, 'Submit Score', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(2004);

      let username = '';
      let inputDialog: Phaser.GameObjects.Container | null = null;

      // Create in-game input dialog
      const showInputDialog = () => {
        if (inputDialog) return; // Already showing

        const dialogWidth = this.scale.width;
        const dialogHeight = this.scale.height;

        // Create dialog container
        inputDialog = this.add.container(dialogWidth / 2, dialogHeight / 2).setDepth(3000);

        // Dialog background
        const dialogBg = this.add.rectangle(0, 0, 400, 200, 0x2c3e50, 0.95);
        dialogBg.setStrokeStyle(3, 0xf39c12);

        // Title
        const dialogTitle = this.add.text(0, -60, 'Enter your username to save your score:', {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 350 }
        }).setOrigin(0.5);

        // Input box background
        const dialogInputBg = this.add.rectangle(0, -10, 300, 40, 0x34495e);
        dialogInputBg.setStrokeStyle(2, 0xecf0f1);

        // Input text display
        const dialogInputText = this.add.text(0, -10, '', {
          fontSize: '20px',
          color: '#ffffff'
        }).setOrigin(0.5);

        // OK button
        const okBg = this.add.rectangle(-60, 50, 100, 40, 0x27ae60);
        okBg.setStrokeStyle(2, 0xffffff);
        const okText = this.add.text(-60, 50, 'OK', {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        // Cancel button
        const cancelBg = this.add.rectangle(60, 50, 100, 40, 0xe74c3c);
        cancelBg.setStrokeStyle(2, 0xffffff);
        const cancelText = this.add.text(60, 50, 'Cancel', {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        inputDialog.add([dialogBg, dialogTitle, dialogInputBg, dialogInputText, okBg, okText, cancelBg, cancelText]);

        let currentInput = '';

        // OK button logic
        okBg.setInteractive({ useHandCursor: true });
        okBg.on('pointerdown', async () => {
          if (currentInput.trim()) {
            username = currentInput.trim();
            inputText.setText(username);
            inputText.setColor('#ffffff');
            inputText.setFontStyle('normal');

            // Submit score
            await this.submitScore(username, this.score, MainGameScene.levelManager.getLevelConfig().level);

            // Show success message
            inputText.setText('Score Saved! ✓');
            inputText.setColor('#2ecc71');
            buttonBg.setFillStyle(0x95a5a6);
            buttonText.setText('Submitted');

            // Disable button
            buttonBg.removeInteractive();

            // Close dialog
            inputDialog?.destroy();
            inputDialog = null;
            resolve();
          }
        });

        okBg.on('pointerover', () => okBg.setFillStyle(0x2ecc71));
        okBg.on('pointerout', () => okBg.setFillStyle(0x27ae60));

        // Cancel button logic
        cancelBg.setInteractive({ useHandCursor: true });
        cancelBg.on('pointerdown', () => {
          inputDialog?.destroy();
          inputDialog = null;
          inputText.setText('Click to enter name...');
          inputText.setColor('#7f8c8d');
          resolve();
        });

        cancelBg.on('pointerover', () => cancelBg.setFillStyle(0xc0392b));
        cancelBg.on('pointerout', () => cancelBg.setFillStyle(0xe74c3c));

        // Keyboard input
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
          if (!inputDialog) return;

          if (event.key === 'Escape') {
            inputDialog?.destroy();
            inputDialog = null;
            inputText.setText('Click to enter name...');
            inputText.setColor('#7f8c8d');
            resolve();
          } else if (event.key === 'Enter') {
            okBg.emit('pointerdown');
          } else if (event.key === 'Backspace') {
            currentInput = currentInput.slice(0, -1);
            dialogInputText.setText(currentInput || '|');
          } else if (event.key.length === 1 && currentInput.length < 20) {
            currentInput += event.key;
            dialogInputText.setText(currentInput);
          }
        });

        dialogInputText.setText('|');
      };

      const promptAndSubmit = () => {
        showInputDialog();
      };

      // Make input interactive
      inputBg.setInteractive({ useHandCursor: true });
      inputBg.on('pointerdown', promptAndSubmit);

      // Make button interactive
      buttonBg.setInteractive({ useHandCursor: true });
      buttonBg.on('pointerdown', promptAndSubmit);

      // Button hover effect
      buttonBg.on('pointerover', () => {
        if (buttonText.text === 'Submit Score') {
          buttonBg.setFillStyle(0x2ecc71);
        }
      });

      buttonBg.on('pointerout', () => {
        if (buttonText.text === 'Submit Score') {
          buttonBg.setFillStyle(0x27ae60);
        }
      });
    });
  }

  private async showUsernameInputForCompletion(panelX: number, panelY: number): Promise<void> {
    return new Promise((resolve) => {
      // Create input box background
      const inputBg = this.add.rectangle(panelX, panelY + 130, 300, 50, 0x34495e).setDepth(3003);
      inputBg.setStrokeStyle(2, 0xf1c40f);

      // Input text placeholder
      const inputText = this.add.text(panelX, panelY + 130, 'Click to enter name...', {
        fontSize: '18px',
        color: '#7f8c8d',
        fontStyle: 'italic'
      }).setOrigin(0.5).setDepth(3004);

      // Submit button
      const buttonBg = this.add.rectangle(panelX, panelY + 190, 200, 45, 0xf1c40f).setDepth(3003);
      buttonBg.setStrokeStyle(2, 0xffffff);

      const buttonText = this.add.text(panelX, panelY + 190, 'Submit Score', {
        fontSize: '20px',
        color: '#2c3e50',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(3004);

      // Return to menu message
      const menuText = this.add.text(panelX, panelY + 250, 'Press SPACE to return to menu', {
        fontSize: '18px',
        color: '#95a5a6',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(3003);

      let username = '';
      let scoreSubmitted = false;
      let inputDialog: Phaser.GameObjects.Container | null = null;

      // Create in-game input dialog
      const showInputDialog = () => {
        if (scoreSubmitted || inputDialog) return;

        const dialogWidth = this.scale.width;
        const dialogHeight = this.scale.height;

        // Create dialog container
        inputDialog = this.add.container(dialogWidth / 2, dialogHeight / 2).setDepth(3100);

        // Dialog background
        const dialogBg = this.add.rectangle(0, 0, 400, 200, 0x2c3e50, 0.95);
        dialogBg.setStrokeStyle(3, 0xf39c12);

        // Title
        const dialogTitle = this.add.text(0, -60, 'Enter your username to save your score:', {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 350 }
        }).setOrigin(0.5);

        // Input box background
        const dialogInputBg = this.add.rectangle(0, -10, 300, 40, 0x34495e);
        dialogInputBg.setStrokeStyle(2, 0xecf0f1);

        // Input text display
        const dialogInputText = this.add.text(0, -10, '', {
          fontSize: '20px',
          color: '#ffffff'
        }).setOrigin(0.5);

        // OK button
        const okBg = this.add.rectangle(-60, 50, 100, 40, 0x27ae60);
        okBg.setStrokeStyle(2, 0xffffff);
        const okText = this.add.text(-60, 50, 'OK', {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        // Cancel button
        const cancelBg = this.add.rectangle(60, 50, 100, 40, 0xe74c3c);
        cancelBg.setStrokeStyle(2, 0xffffff);
        const cancelText = this.add.text(60, 50, 'Cancel', {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        inputDialog.add([dialogBg, dialogTitle, dialogInputBg, dialogInputText, okBg, okText, cancelBg, cancelText]);

        let currentInput = '';

        // OK button logic
        okBg.setInteractive({ useHandCursor: true });
        okBg.on('pointerdown', async () => {
          if (currentInput.trim()) {
            username = currentInput.trim();
            inputText.setText(username);
            inputText.setColor('#ffffff');
            inputText.setFontStyle('normal');

            // Submit score - level 16 since game is complete
            await this.submitScore(username, this.score, 16);

            // Show success message
            inputText.setText('Score Saved! ✓');
            inputText.setColor('#2ecc71');
            buttonBg.setFillStyle(0x95a5a6);
            buttonText.setText('Submitted');
            buttonText.setColor('#ffffff');

            scoreSubmitted = true;

            // Disable button
            buttonBg.removeInteractive();
            inputBg.removeInteractive();

            // Close dialog
            inputDialog?.destroy();
            inputDialog = null;
          }
        });

        okBg.on('pointerover', () => okBg.setFillStyle(0x2ecc71));
        okBg.on('pointerout', () => okBg.setFillStyle(0x27ae60));

        // Cancel button logic
        cancelBg.setInteractive({ useHandCursor: true });
        cancelBg.on('pointerdown', () => {
          inputDialog?.destroy();
          inputDialog = null;
          inputText.setText('Click to enter name...');
          inputText.setColor('#7f8c8d');
        });

        cancelBg.on('pointerover', () => cancelBg.setFillStyle(0xc0392b));
        cancelBg.on('pointerout', () => cancelBg.setFillStyle(0xe74c3c));

        // Keyboard input
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
          if (!inputDialog) return;

          if (event.key === 'Escape') {
            cancelBg.emit('pointerdown');
          } else if (event.key === 'Enter') {
            okBg.emit('pointerdown');
          } else if (event.key === 'Backspace') {
            currentInput = currentInput.slice(0, -1);
            dialogInputText.setText(currentInput || '|');
          } else if (event.key.length === 1 && currentInput.length < 20) {
            currentInput += event.key;
            dialogInputText.setText(currentInput);
          }
        });

        dialogInputText.setText('|');
      };

      const promptAndSubmit = () => {
        showInputDialog();
      };

      // Make input interactive
      inputBg.setInteractive({ useHandCursor: true });
      inputBg.on('pointerdown', promptAndSubmit);

      // Make button interactive
      buttonBg.setInteractive({ useHandCursor: true });
      buttonBg.on('pointerdown', promptAndSubmit);

      // Button hover effect
      buttonBg.on('pointerover', () => {
        if (!scoreSubmitted) {
          buttonBg.setFillStyle(0xf39c12);
        }
      });

      buttonBg.on('pointerout', () => {
        if (!scoreSubmitted) {
          buttonBg.setFillStyle(0xf1c40f);
        }
      });

      // Listen for SPACE key to return to menu
      const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      if (spaceKey) {
        spaceKey.on('down', () => {
          // Reset everything
          MainGameScene.levelManager.reset();
          MainGameScene.persistentScore = 0;
          MainGameScene.persistentLives = 3;
          this.scene.start('MenuScene');
          resolve();
        });
      }

      // Also listen for gamepad A button
      this.input.gamepad?.on('down', (_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
        if (button.index === 0) { // A button
          // Reset everything
          MainGameScene.levelManager.reset();
          MainGameScene.persistentScore = 0;
          MainGameScene.persistentLives = 3;
          this.scene.start('MenuScene');
          resolve();
        }
      });
    });
  }

  private async submitScore(username: string, score: number, levelReached: number): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCORES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          score: score,
          level_reached: levelReached
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Score saved successfully:', data);
      } else {
        console.error('Failed to save score:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }

  update(_time: number, delta: number): void {
    // Check for ESC key to return to menu
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (Phaser.Input.Keyboard.JustDown(escKey!)) {
      // Reset level manager and persistent values
      MainGameScene.levelManager.reset();
      MainGameScene.persistentScore = 0;
      MainGameScene.persistentLives = 3;
      this.scene.start('MenuScene');
      return;
    }

    // Check for Ctrl+C to toggle cheat mode
    const ctrlKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    const cKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    if (ctrlKey?.isDown && Phaser.Input.Keyboard.JustDown(cKey!)) {
      this.cheatModeActive = !this.cheatModeActive;
      this.cheatModeText?.setVisible(this.cheatModeActive);
      
      // Add visual feedback to player when cheat mode is active
      if (this.cheatModeActive) {
        this.player.sprite.setAlpha(0.5); // Make player semi-transparent
        this.player.sprite.setTint(0x00ff00); // Green tint
      } else {
        this.player.sprite.setAlpha(1.0); // Restore full opacity
        this.player.sprite.clearTint(); // Remove tint
      }
    }

    // Check for Ctrl+Z to jump to level 16 (final level)
    const zKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    if (ctrlKey?.isDown && Phaser.Input.Keyboard.JustDown(zKey!)) {
      // Jump to level 16 with appropriate score and lives
      MainGameScene.levelManager.setLevel(16);
      MainGameScene.persistentScore = this.score; // Keep current score
      MainGameScene.persistentLives = 3; // Reset lives for the challenge
      
      // Show a notification
      const width = this.scale.width;
      const height = this.scale.height;
      const notification = this.add.text(width / 2, height / 2, 'Jumping to Level 16!', {
        fontSize: '48px',
        color: '#f1c40f',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(5000);

      // Fade out notification and restart scene
      this.tweens.add({
        targets: notification,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          notification.destroy();
          this.scene.restart();
        }
      });
      
      return; // Stop processing this frame
    }

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
      // Reset everything BEFORE restarting the scene
      MainGameScene.levelManager.reset();
      MainGameScene.persistentScore = 0;
      MainGameScene.persistentLives = 3;
      // Restart the scene (this will call create() which will read the reset values)
      this.scene.restart();
      return;
    }

    if (this.isGameOver || this.isLevelTransition) return;

    // Update player (but only if countdown is not active)
    if (!this.countdownActive) {
      this.player.update(inputState);
    }

    // Update lanes and vehicles (always, even during countdown for visual effect)
    const levelConfig = MainGameScene.levelManager.getLevelConfig();
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

        // Safety check: ensure vehicle and sprite exist
        if (!vehicle || !vehicle.sprite || !vehicle.sprite.active) {
          lane.vehicles.splice(i, 1);
          continue;
        }

        vehicle.update();

        // Remove off-screen vehicles
        const width = this.scale.width;
        if (vehicle.sprite.x < -100 || vehicle.sprite.x > width + 100) {
          vehicle.destroy();
          lane.vehicles.splice(i, 1);
        }
      }
    }

    // Check collisions (but not during countdown)
    if (!this.countdownActive) {
      this.checkCollisions();
    }
  }
}
