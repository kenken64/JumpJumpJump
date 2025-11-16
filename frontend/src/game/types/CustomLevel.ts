export interface CustomLane {
  vehicleType: string;
  speed: number;
  direction: number; // 1 for right, -1 for left
  spawnInterval: number;
}

export interface CustomLevel {
  id: string;
  name: string;
  author: string;
  description: string;
  backgroundColor: number;
  lanes: CustomLane[];
  createdAt: number;
}

export class LevelStorage {
  private static STORAGE_KEY = 'jumpjumpjump_custom_levels';

  static saveLevels(levels: CustomLevel[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(levels));
    } catch (error) {
      console.error('Failed to save levels:', error);
    }
  }

  static loadLevels(): CustomLevel[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load levels:', error);
      return [];
    }
  }

  static saveLevel(level: CustomLevel): void {
    const levels = this.loadLevels();
    const existingIndex = levels.findIndex(l => l.id === level.id);

    if (existingIndex >= 0) {
      levels[existingIndex] = level;
    } else {
      levels.push(level);
    }

    this.saveLevels(levels);
  }

  static deleteLevel(id: string): void {
    const levels = this.loadLevels().filter(l => l.id !== id);
    this.saveLevels(levels);
  }

  static getLevel(id: string): CustomLevel | undefined {
    return this.loadLevels().find(l => l.id === id);
  }
}
