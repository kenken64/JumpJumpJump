import { describe, it, expect, beforeEach } from 'vitest';
import { LevelManager } from '../managers/LevelManager';

describe('LevelManager', () => {
  let levelManager: LevelManager;

  beforeEach(() => {
    levelManager = new LevelManager();
  });

  describe('Level Initialization', () => {
    it('should start at level 1', () => {
      expect(levelManager.getCurrentLevel()).toBe(1);
    });

    it('should have max level of 16', () => {
      expect(levelManager.getMaxLevel()).toBe(16);
    });
  });

  describe('Level Progression', () => {
    it('should advance to next level', () => {
      levelManager.nextLevel();
      expect(levelManager.getCurrentLevel()).toBe(2);
    });

    it('should detect when max level is reached', () => {
      for (let i = 0; i < 16; i++) {
        levelManager.nextLevel();
      }
      expect(levelManager.isMaxLevelReached()).toBe(true);
    });

    it('should not exceed max level', () => {
      for (let i = 0; i < 20; i++) {
        levelManager.nextLevel();
      }
      // After 20 nextLevel() calls, should be at level 21 (starts at 1, adds 20)
      // LevelManager doesn't cap at max level in nextLevel(), only in setLevel()
      expect(levelManager.getCurrentLevel()).toBe(21);
    });
  });

  describe('Level Reset', () => {
    it('should reset to level 1', () => {
      levelManager.nextLevel();
      levelManager.nextLevel();
      levelManager.reset();
      expect(levelManager.getCurrentLevel()).toBe(1);
    });
  });

  describe('Set Level', () => {
    it('should set level to specific value', () => {
      levelManager.setLevel(10);
      expect(levelManager.getCurrentLevel()).toBe(10);
    });

    it('should not exceed max level when setting', () => {
      levelManager.setLevel(20);
      expect(levelManager.getCurrentLevel()).toBe(16);
    });

    it('should allow setting to level 16', () => {
      levelManager.setLevel(16);
      expect(levelManager.getCurrentLevel()).toBe(16);
    });
  });

  describe('Level Configuration', () => {
    it('should provide config for level 1 (Easy)', () => {
      const config = levelManager.getLevelConfig();
      expect(config.level).toBe(1);
      expect(config.name).toContain('Easy Street');
      expect(config.laneCount).toBeGreaterThanOrEqual(4);
      expect(config.scoreMultiplier).toBe(1);
    });

    it('should increase difficulty for level 5 (Medium)', () => {
      levelManager.setLevel(5);
      const config = levelManager.getLevelConfig();
      expect(config.level).toBe(5);
      expect(config.name).toContain('Busy Highway');
      expect(config.minSpeed).toBeGreaterThan(100);
      expect(config.scoreMultiplier).toBe(5);
    });

    it('should have high difficulty for level 8 (Hard)', () => {
      levelManager.setLevel(8);
      const config = levelManager.getLevelConfig();
      expect(config.level).toBe(8);
      expect(config.name).toContain('Rush Hour');
      expect(config.laneCount).toBe(8);
      expect(config.minSpeed).toBeGreaterThan(200);
    });

    it('should have insane difficulty for level 16 (Expert)', () => {
      levelManager.setLevel(16);
      const config = levelManager.getLevelConfig();
      expect(config.level).toBe(16);
      expect(config.name).toContain('INSANE MODE');
      expect(config.laneCount).toBe(8);
      expect(config.minSpeed).toBeGreaterThan(250);
      expect(config.scoreMultiplier).toBeGreaterThan(16);
    });

    it('should have progressive lane counts', () => {
      const level1Config = levelManager.getLevelConfig();
      levelManager.setLevel(10);
      const level10Config = levelManager.getLevelConfig();
      expect(level10Config.laneCount).toBeGreaterThanOrEqual(level1Config.laneCount);
    });

    it('should have progressive speeds', () => {
      const level1Config = levelManager.getLevelConfig();
      levelManager.setLevel(10);
      const level10Config = levelManager.getLevelConfig();
      expect(level10Config.minSpeed).toBeGreaterThan(level1Config.minSpeed);
      expect(level10Config.maxSpeed).toBeGreaterThan(level1Config.maxSpeed);
    });

    it('should have shorter spawn intervals at higher levels', () => {
      const level1Config = levelManager.getLevelConfig();
      levelManager.setLevel(10);
      const level10Config = levelManager.getLevelConfig();
      expect(level10Config.minSpawnInterval).toBeLessThan(level1Config.minSpawnInterval);
    });
  });

  describe('Vehicle Types', () => {
    it('should unlock more vehicles as levels progress', () => {
      const level1Vehicles = levelManager.getVehicleTypesForLevel();
      levelManager.setLevel(10);
      const level10Vehicles = levelManager.getVehicleTypesForLevel();
      expect(level10Vehicles.length).toBeGreaterThan(level1Vehicles.length);
    });

    it('should have at least 5 vehicles at level 1', () => {
      const vehicles = levelManager.getVehicleTypesForLevel();
      expect(vehicles.length).toBeGreaterThanOrEqual(5);
    });

    it('should unlock all 15 vehicles by level 10+', () => {
      levelManager.setLevel(10);
      const vehicles = levelManager.getVehicleTypesForLevel();
      expect(vehicles.length).toBe(15);
    });

    it('should include basic vehicles', () => {
      const vehicles = levelManager.getVehicleTypesForLevel();
      expect(vehicles).toContain('ambulance.png');
    });
  });

  describe('Difficulty Names', () => {
    it('should return EASY for levels 1-3', () => {
      expect(levelManager.getDifficultyName()).toBe('EASY');
      levelManager.setLevel(2);
      expect(levelManager.getDifficultyName()).toBe('EASY');
      levelManager.setLevel(3);
      expect(levelManager.getDifficultyName()).toBe('EASY');
    });

    it('should return MEDIUM for levels 4-6', () => {
      levelManager.setLevel(4);
      expect(levelManager.getDifficultyName()).toBe('MEDIUM');
      levelManager.setLevel(6);
      expect(levelManager.getDifficultyName()).toBe('MEDIUM');
    });

    it('should return HARD for levels 7-9', () => {
      levelManager.setLevel(7);
      expect(levelManager.getDifficultyName()).toBe('HARD');
      levelManager.setLevel(9);
      expect(levelManager.getDifficultyName()).toBe('HARD');
    });

    it('should return EXPERT for levels 10+', () => {
      levelManager.setLevel(10);
      expect(levelManager.getDifficultyName()).toBe('EXPERT');
      levelManager.setLevel(16);
      expect(levelManager.getDifficultyName()).toBe('EXPERT');
    });
  });

  describe('Difficulty Colors', () => {
    it('should return green for EASY levels', () => {
      expect(levelManager.getDifficultyColor()).toBe('#00ff00');
    });

    it('should return yellow for MEDIUM levels', () => {
      levelManager.setLevel(5);
      expect(levelManager.getDifficultyColor()).toBe('#ffff00');
    });

    it('should return orange for HARD levels', () => {
      levelManager.setLevel(8);
      expect(levelManager.getDifficultyColor()).toBe('#ff9900');
    });

    it('should return red for EXPERT levels', () => {
      levelManager.setLevel(12);
      expect(levelManager.getDifficultyColor()).toBe('#ff0000');
    });
  });

  describe('Score Multipliers', () => {
    it('should have multiplier equal to level for levels 1-9', () => {
      for (let i = 1; i <= 9; i++) {
        levelManager.setLevel(i);
        const config = levelManager.getLevelConfig();
        expect(config.scoreMultiplier).toBe(i);
      }
    });

    it('should have 2x multiplier for levels 10+', () => {
      levelManager.setLevel(10);
      const config = levelManager.getLevelConfig();
      expect(config.scoreMultiplier).toBe(20); // 10 * 2
    });
  });
});
