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
    // Vehicles no longer wrap - they'll be removed by MainGameScene when off-screen
    // This allows for proper vehicle management and spawning
  }

  public setSpeed(speed: number, direction: number): void {
    this.direction = direction;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(speed * direction);

    // Update sprite flip if direction changed
    this.sprite.setFlipX(direction < 0);
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
