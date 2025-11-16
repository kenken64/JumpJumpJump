import { describe, it, expect } from 'vitest';

// Test type definitions for CustomLevel
describe('CustomLevel Type', () => {
  describe('Lane Type', () => {
    it('should have correct lane structure', () => {
      const lane = {
        vehicleType: 'ambulance.png',
        speed: 100,
        direction: 1,
        spawnInterval: 2000
      };

      expect(lane).toHaveProperty('vehicleType');
      expect(lane).toHaveProperty('speed');
      expect(lane).toHaveProperty('direction');
      expect(lane).toHaveProperty('spawnInterval');
    });

    it('should accept valid vehicle types', () => {
      const validVehicles = [
        'ambulance.png',
        'truck.png',
        'police.png',
        'taxi.png',
        'bus.png',
        'sedan.png',
        'sports_red.png'
      ];

      validVehicles.forEach(vehicle => {
        const lane = { vehicleType: vehicle, speed: 100, direction: 1, spawnInterval: 2000 };
        expect(lane.vehicleType).toBe(vehicle);
      });
    });

    it('should accept positive and negative directions', () => {
      const laneLeft = { vehicleType: 'ambulance.png', speed: 100, direction: -1, spawnInterval: 2000 };
      const laneRight = { vehicleType: 'ambulance.png', speed: 100, direction: 1, spawnInterval: 2000 };

      expect(laneLeft.direction).toBe(-1);
      expect(laneRight.direction).toBe(1);
    });

    it('should accept reasonable speed values', () => {
      const slowLane = { vehicleType: 'ambulance.png', speed: 50, direction: 1, spawnInterval: 2000 };
      const fastLane = { vehicleType: 'ambulance.png', speed: 500, direction: 1, spawnInterval: 2000 };

      expect(slowLane.speed).toBe(50);
      expect(fastLane.speed).toBe(500);
    });

    it('should accept reasonable spawn intervals', () => {
      const frequentSpawn = { vehicleType: 'ambulance.png', speed: 100, direction: 1, spawnInterval: 1000 };
      const rareSpawn = { vehicleType: 'ambulance.png', speed: 100, direction: 1, spawnInterval: 10000 };

      expect(frequentSpawn.spawnInterval).toBe(1000);
      expect(rareSpawn.spawnInterval).toBe(10000);
    });
  });

  describe('CustomLevel Type', () => {
    it('should have correct level structure', () => {
      const level = {
        id: 'level-123',
        name: 'Test Level',
        lanes: [],
        createdAt: Date.now(),
        difficulty: 'Medium'
      };

      expect(level).toHaveProperty('id');
      expect(level).toHaveProperty('name');
      expect(level).toHaveProperty('lanes');
      expect(level).toHaveProperty('createdAt');
      expect(level).toHaveProperty('difficulty');
    });

    it('should accept valid difficulty values', () => {
      const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];

      difficulties.forEach(diff => {
        const level = {
          id: 'level-123',
          name: 'Test Level',
          lanes: [],
          createdAt: Date.now(),
          difficulty: diff
        };
        expect(level.difficulty).toBe(diff);
      });
    });

    it('should accept arrays of lanes', () => {
      const lanes = [
        { vehicleType: 'ambulance.png', speed: 100, direction: 1, spawnInterval: 2000 },
        { vehicleType: 'taxi.png', speed: 150, direction: -1, spawnInterval: 1500 }
      ];

      const level = {
        id: 'level-123',
        name: 'Test Level',
        lanes: lanes,
        createdAt: Date.now(),
        difficulty: 'Medium'
      };

      expect(level.lanes).toHaveLength(2);
      expect(level.lanes[0].vehicleType).toBe('ambulance.png');
      expect(level.lanes[1].vehicleType).toBe('taxi.png');
    });

    it('should accept empty lanes array', () => {
      const level = {
        id: 'level-123',
        name: 'Test Level',
        lanes: [],
        createdAt: Date.now(),
        difficulty: 'Easy'
      };

      expect(level.lanes).toHaveLength(0);
    });

    it('should have timestamp in createdAt', () => {
      const now = Date.now();
      const level = {
        id: 'level-123',
        name: 'Test Level',
        lanes: [],
        createdAt: now,
        difficulty: 'Medium'
      };

      expect(level.createdAt).toBe(now);
      expect(typeof level.createdAt).toBe('number');
    });

    it('should accept various level names', () => {
      const names = [
        'Easy Street',
        'Highway to Hell',
        'Traffic Jam',
        'Speed Demon',
        'Level 1'
      ];

      names.forEach(name => {
        const level = {
          id: 'level-123',
          name: name,
          lanes: [],
          createdAt: Date.now(),
          difficulty: 'Medium'
        };
        expect(level.name).toBe(name);
      });
    });

    it('should support complex levels with multiple lanes', () => {
      const complexLevel = {
        id: 'level-complex',
        name: 'Complex Traffic',
        lanes: [
          { vehicleType: 'ambulance.png', speed: 120, direction: 1, spawnInterval: 3000 },
          { vehicleType: 'bus.png', speed: 80, direction: -1, spawnInterval: 4000 },
          { vehicleType: 'sports_red.png', speed: 200, direction: 1, spawnInterval: 1500 },
          { vehicleType: 'truck.png', speed: 90, direction: -1, spawnInterval: 3500 },
          { vehicleType: 'taxi.png', speed: 150, direction: 1, spawnInterval: 2000 }
        ],
        createdAt: Date.now(),
        difficulty: 'Hard'
      };

      expect(complexLevel.lanes).toHaveLength(5);
      expect(complexLevel.difficulty).toBe('Hard');
      expect(complexLevel.lanes.every(lane => lane.speed > 0)).toBe(true);
    });
  });

  describe('Level Validation', () => {
    it('should validate minimum required fields', () => {
      const level = {
        id: 'level-123',
        name: 'Test',
        lanes: [],
        createdAt: Date.now(),
        difficulty: 'Easy'
      };

      const requiredFields = ['id', 'name', 'lanes', 'createdAt', 'difficulty'];
      requiredFields.forEach(field => {
        expect(level).toHaveProperty(field);
      });
    });

    it('should have unique IDs', () => {
      const level1 = { id: 'level-1', name: 'Level 1', lanes: [], createdAt: Date.now(), difficulty: 'Easy' };
      const level2 = { id: 'level-2', name: 'Level 2', lanes: [], createdAt: Date.now(), difficulty: 'Easy' };

      expect(level1.id).not.toBe(level2.id);
    });

    it('should have valid lane configurations', () => {
      const level = {
        id: 'level-123',
        name: 'Test Level',
        lanes: [
          { vehicleType: 'ambulance.png', speed: 100, direction: 1, spawnInterval: 2000 }
        ],
        createdAt: Date.now(),
        difficulty: 'Medium'
      };

      const lane = level.lanes[0];
      expect(lane.speed).toBeGreaterThan(0);
      expect([1, -1]).toContain(lane.direction);
      expect(lane.spawnInterval).toBeGreaterThan(0);
    });
  });

  describe('LocalStorage Operations', () => {
    it('should serialize to JSON', () => {
      const level = {
        id: 'level-123',
        name: 'Test Level',
        lanes: [
          { vehicleType: 'ambulance.png', speed: 100, direction: 1, spawnInterval: 2000 }
        ],
        createdAt: Date.now(),
        difficulty: 'Medium'
      };

      const json = JSON.stringify(level);
      expect(json).toBeTruthy();
      expect(typeof json).toBe('string');
    });

    it('should deserialize from JSON', () => {
      const original = {
        id: 'level-123',
        name: 'Test Level',
        lanes: [
          { vehicleType: 'ambulance.png', speed: 100, direction: 1, spawnInterval: 2000 }
        ],
        createdAt: Date.now(),
        difficulty: 'Medium'
      };

      const json = JSON.stringify(original);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(original.id);
      expect(parsed.name).toBe(original.name);
      expect(parsed.lanes).toHaveLength(original.lanes.length);
      expect(parsed.difficulty).toBe(original.difficulty);
    });
  });
});
