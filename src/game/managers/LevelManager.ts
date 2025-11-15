export interface LevelConfig {
  level: number;
  laneCount: number;
  minSpeed: number;
  maxSpeed: number;
  minSpawnInterval: number;
  maxSpawnInterval: number;
  scoreMultiplier: number;
  name: string;
  backgroundColor: number;
}

export class LevelManager {
  private currentLevel: number = 1;

  constructor() {}

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public nextLevel(): void {
    this.currentLevel++;
  }

  public reset(): void {
    this.currentLevel = 1;
  }

  public getLevelConfig(): LevelConfig {
    // Progressive difficulty system
    const baseConfig: LevelConfig = {
      level: this.currentLevel,
      laneCount: 6,
      minSpeed: 50,
      maxSpeed: 100,
      minSpawnInterval: 2000,
      maxSpawnInterval: 4000,
      scoreMultiplier: 1,
      name: 'Easy Street',
      backgroundColor: 0x87ceeb
    };

    // Adjust difficulty based on level
    if (this.currentLevel <= 3) {
      // Levels 1-3: Easy
      return {
        ...baseConfig,
        level: this.currentLevel,
        laneCount: 4 + this.currentLevel,
        minSpeed: 40 + (this.currentLevel * 10),
        maxSpeed: 80 + (this.currentLevel * 10),
        minSpawnInterval: 2500 - (this.currentLevel * 100),
        maxSpawnInterval: 4500 - (this.currentLevel * 100),
        scoreMultiplier: this.currentLevel,
        name: `Level ${this.currentLevel}: Easy Street`,
        backgroundColor: 0x87ceeb
      };
    } else if (this.currentLevel <= 6) {
      // Levels 4-6: Medium
      return {
        ...baseConfig,
        level: this.currentLevel,
        laneCount: 6 + (this.currentLevel - 3),
        minSpeed: 60 + (this.currentLevel * 15),
        maxSpeed: 100 + (this.currentLevel * 15),
        minSpawnInterval: 2000 - (this.currentLevel * 50),
        maxSpawnInterval: 3500 - (this.currentLevel * 50),
        scoreMultiplier: this.currentLevel,
        name: `Level ${this.currentLevel}: Busy Highway`,
        backgroundColor: 0x7ba8d4
      };
    } else if (this.currentLevel <= 9) {
      // Levels 7-9: Hard
      return {
        ...baseConfig,
        level: this.currentLevel,
        laneCount: 8,
        minSpeed: 80 + (this.currentLevel * 20),
        maxSpeed: 140 + (this.currentLevel * 20),
        minSpawnInterval: 1500 - (this.currentLevel * 30),
        maxSpawnInterval: 2800 - (this.currentLevel * 30),
        scoreMultiplier: this.currentLevel,
        name: `Level ${this.currentLevel}: Rush Hour`,
        backgroundColor: 0x6b95c4
      };
    } else {
      // Level 10+: Expert
      return {
        ...baseConfig,
        level: this.currentLevel,
        laneCount: 8,
        minSpeed: 100 + (this.currentLevel * 25),
        maxSpeed: 180 + (this.currentLevel * 25),
        minSpawnInterval: Math.max(800, 1200 - (this.currentLevel * 20)),
        maxSpawnInterval: Math.max(1500, 2000 - (this.currentLevel * 20)),
        scoreMultiplier: this.currentLevel * 2,
        name: `Level ${this.currentLevel}: INSANE MODE`,
        backgroundColor: 0x5a7fb0
      };
    }
  }

  public getVehicleTypesForLevel(): string[] {
    const allVehicles = [
      'ambulance.png',
      'truck.png',
      'police.png',
      'taxi.png',
      'bus.png',
      'sedan.png',
      'sports_red.png',
      'van.png',
      'sports_green.png',
      'sports_yellow.png',
      'suv.png',
      'convertible.png',
      'firetruck.png',
      'hotdog.png',
      'tractor.png'
    ];

    // Unlock more vehicle types as levels progress
    const vehicleCount = Math.min(allVehicles.length, 5 + this.currentLevel);
    return allVehicles.slice(0, vehicleCount);
  }

  public getDifficultyName(): string {
    if (this.currentLevel <= 3) return 'EASY';
    if (this.currentLevel <= 6) return 'MEDIUM';
    if (this.currentLevel <= 9) return 'HARD';
    return 'EXPERT';
  }

  public getDifficultyColor(): string {
    if (this.currentLevel <= 3) return '#00ff00';
    if (this.currentLevel <= 6) return '#ffff00';
    if (this.currentLevel <= 9) return '#ff9900';
    return '#ff0000';
  }
}
