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

    // Adjust difficulty based on level - Progressive increase in vehicles and speed
    if (this.currentLevel <= 3) {
      // Levels 1-3: Easy - Few vehicles, slower speed, VERY noticeable progression
      return {
        ...baseConfig,
        level: this.currentLevel,
        laneCount: Math.min(3 + this.currentLevel, 5), // 4-5 lanes
        minSpeed: 60 + (this.currentLevel * 25), // 85 -> 110 -> 135
        maxSpeed: 100 + (this.currentLevel * 30), // 130 -> 160 -> 190
        minSpawnInterval: 5000 - (this.currentLevel * 400), // 5000 -> 4600 -> 4200
        maxSpawnInterval: 8000 - (this.currentLevel * 600), // 8000 -> 7400 -> 6800
        scoreMultiplier: this.currentLevel,
        name: `Level ${this.currentLevel}: Easy Street`,
        backgroundColor: 0x87ceeb
      };
    } else if (this.currentLevel <= 6) {
      // Levels 4-6: Medium - More vehicles, much faster, very noticeable jump
      return {
        ...baseConfig,
        level: this.currentLevel,
        laneCount: Math.min(4 + (this.currentLevel - 3), 7), // 5-7 lanes
        minSpeed: 120 + (this.currentLevel * 30), // 150 -> 180 -> 210
        maxSpeed: 180 + (this.currentLevel * 40), // 220 -> 260 -> 300
        minSpawnInterval: 4000 - (this.currentLevel * 200), // Gets tighter
        maxSpawnInterval: 6500 - (this.currentLevel * 300),
        scoreMultiplier: this.currentLevel,
        name: `Level ${this.currentLevel}: Busy Highway`,
        backgroundColor: 0x7ba8d4
      };
    } else if (this.currentLevel <= 9) {
      // Levels 7-9: Hard - Many vehicles, extremely fast
      return {
        ...baseConfig,
        level: this.currentLevel,
        laneCount: 8, // Always 8 lanes for hard levels
        minSpeed: 180 + (this.currentLevel * 35), // 215 -> 250 -> 285
        maxSpeed: 250 + (this.currentLevel * 45), // 295 -> 340 -> 385
        minSpawnInterval: 3000 - (this.currentLevel * 100),
        maxSpawnInterval: 5000 - (this.currentLevel * 150),
        scoreMultiplier: this.currentLevel,
        name: `Level ${this.currentLevel}: Rush Hour`,
        backgroundColor: 0x6b95c4
      };
    } else {
      // Level 10+: Expert - Blazing fast, extreme challenge, 8 lanes
      return {
        ...baseConfig,
        level: this.currentLevel,
        laneCount: 8,
        minSpeed: 250 + (this.currentLevel * 40), // Starts at 290+
        maxSpeed: 350 + (this.currentLevel * 50), // Starts at 400+
        minSpawnInterval: Math.max(2000, 2800 - (this.currentLevel * 80)),
        maxSpawnInterval: Math.max(3500, 4500 - (this.currentLevel * 120)),
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
