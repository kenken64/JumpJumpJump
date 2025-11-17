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
  private static API_URL = 'http://localhost:8000/api/levels';

  static async saveLevels(levels: CustomLevel[]): Promise<void> {
    // Deprecated - use saveLevel instead
    console.warn('saveLevels is deprecated, use saveLevel for individual saves');
  }

  static async loadLevels(): Promise<CustomLevel[]> {
    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch levels');
      }
      const data = await response.json();
      return data.map((level: any) => ({
        id: level.id,
        name: level.name,
        author: level.author,
        description: level.description,
        backgroundColor: level.backgroundColor,
        lanes: level.lanes,
        createdAt: new Date(level.created_at).getTime()
      }));
    } catch (error) {
      console.error('Failed to load levels:', error);
      return [];
    }
  }

  static async saveLevel(level: CustomLevel): Promise<boolean> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(level),
      });

      if (!response.ok) {
        throw new Error('Failed to save level');
      }

      return true;
    } catch (error) {
      console.error('Failed to save level:', error);
      return false;
    }
  }

  static async deleteLevel(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete level');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete level:', error);
      return false;
    }
  }

  static async getLevel(id: string): Promise<CustomLevel | undefined> {
    try {
      const response = await fetch(`${this.API_URL}/${id}`);
      if (!response.ok) {
        return undefined;
      }
      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        author: data.author,
        description: data.description,
        backgroundColor: data.backgroundColor,
        lanes: data.lanes,
        createdAt: new Date(data.created_at).getTime()
      };
    } catch (error) {
      console.error('Failed to get level:', error);
      return undefined;
    }
  }
}
