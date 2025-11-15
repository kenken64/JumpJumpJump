import Phaser from 'phaser';
import type { InputState } from '../managers/InputManager';

export class Player {
  public sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private isMoving: boolean = false;
  private targetPosition?: { x: number; y: number };
  private gridSize: number = 32;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create player sprite
    this.sprite = scene.add.sprite(x, y, 'sprites', 'man.png');
    this.sprite.setScale(2); // Scale up the small pixel art

    // Enable physics
    scene.physics.add.existing(this.sprite);

    this.createAnimations();
  }

  private createAnimations(): void {
    // Walk animation
    if (!this.scene.anims.exists('walk')) {
      this.scene.anims.create({
        key: 'walk',
        frames: [
          { key: 'sprites', frame: 'man_walk1.png' },
          { key: 'sprites', frame: 'man_walk2.png' }
        ],
        frameRate: 8,
        repeat: -1
      });
    }

    // Idle animation
    if (!this.scene.anims.exists('idle')) {
      this.scene.anims.create({
        key: 'idle',
        frames: [{ key: 'sprites', frame: 'man.png' }],
        frameRate: 1
      });
    }

    // Fall/death animation
    if (!this.scene.anims.exists('fall')) {
      this.scene.anims.create({
        key: 'fall',
        frames: [{ key: 'sprites', frame: 'man_fall.png' }],
        frameRate: 1
      });
    }
  }

  public update(inputState: InputState): void {
    // Always update movement if moving
    if (this.isMoving) {
      this.updateMovement();
    }

    // Only accept new input if not currently moving
    if (!this.isMoving) {
      // Grid-based movement (like Frogger)
      if (inputState.up) {
        this.moveInDirection(0, -this.gridSize);
      } else if (inputState.down) {
        this.moveInDirection(0, this.gridSize);
      } else if (inputState.left) {
        this.moveInDirection(-this.gridSize, 0);
      } else if (inputState.right) {
        this.moveInDirection(this.gridSize, 0);
      }
    }

    // Update animation based on movement
    if (this.isMoving) {
      this.sprite.play('walk', true);
    } else {
      this.sprite.play('idle', true);
    }
  }

  private moveInDirection(dx: number, dy: number): void {
    if (this.isMoving) return;

    this.targetPosition = {
      x: this.sprite.x + dx,
      y: this.sprite.y + dy
    };

    // Clamp to game bounds
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;

    this.targetPosition.x = Phaser.Math.Clamp(this.targetPosition.x, 16, gameWidth - 16);
    this.targetPosition.y = Phaser.Math.Clamp(this.targetPosition.y, 16, gameHeight - 16);

    this.isMoving = true;
  }

  private updateMovement(): void {
    if (!this.targetPosition) {
      this.isMoving = false;
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      this.targetPosition.x,
      this.targetPosition.y
    );

    const speed = 8; // Pixels per frame - increased for smoother movement

    if (distance < speed) {
      // Close enough - snap to target position
      this.sprite.setPosition(this.targetPosition.x, this.targetPosition.y);
      this.isMoving = false;
      this.targetPosition = undefined;
    } else {
      // Move towards target
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x,
        this.sprite.y,
        this.targetPosition.x,
        this.targetPosition.y
      );

      this.sprite.x += Math.cos(angle) * speed;
      this.sprite.y += Math.sin(angle) * speed;
    }
  }

  public die(): void {
    this.sprite.play('fall');
    this.isMoving = false;
    this.targetPosition = undefined;
  }

  public reset(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.sprite.play('idle');
    this.isMoving = false;
    this.targetPosition = undefined;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
