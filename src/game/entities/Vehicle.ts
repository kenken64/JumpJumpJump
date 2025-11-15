import Phaser from 'phaser';

export class Vehicle {
  public sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private direction: number; // 1 for right, -1 for left

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vehicleType: string,
    speed: number,
    direction: number
  ) {
    this.scene = scene;
    this.direction = direction;

    // Create vehicle sprite
    this.sprite = scene.add.sprite(x, y, 'sprites', vehicleType);
    this.sprite.setScale(2);

    // Flip sprite if moving left
    if (direction < 0) {
      this.sprite.setFlipX(true);
    }

    // Enable physics
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(speed * direction);
  }

  public update(): void {
    const gameWidth = this.scene.scale.width;

    // Wrap around screen
    if (this.direction > 0 && this.sprite.x > gameWidth + 50) {
      this.sprite.x = -50;
    } else if (this.direction < 0 && this.sprite.x < -50) {
      this.sprite.x = gameWidth + 50;
    }
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
