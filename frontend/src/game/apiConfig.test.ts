import { describe, it, expect } from 'vitest';
import { API_CONFIG } from '../apiConfig';

describe('API Configuration', () => {
  describe('BASE_URL', () => {
    it('should have correct base URL', () => {
      expect(API_CONFIG.BASE_URL).toBe('http://localhost:8000');
    });

    it('should not have trailing slash', () => {
      expect(API_CONFIG.BASE_URL).not.toMatch(/\/$/);
    });
  });

  describe('ENDPOINTS', () => {
    it('should have scores endpoint', () => {
      expect(API_CONFIG.ENDPOINTS.SCORES).toBe('/api/scores');
    });

    it('should have leaderboard endpoint', () => {
      expect(API_CONFIG.ENDPOINTS.LEADERBOARD).toBe('/api/scores/leaderboard');
    });

    it('should have user scores endpoint', () => {
      expect(API_CONFIG.ENDPOINTS.USER_SCORES).toBeDefined();
    });

    it('endpoints should start with slash', () => {
      Object.values(API_CONFIG.ENDPOINTS).forEach(endpoint => {
        expect(endpoint).toMatch(/^\//);
      });
    });
  });

  describe('Full URL Construction', () => {
    it('should construct full scores URL correctly', () => {
      const fullUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCORES}`;
      expect(fullUrl).toBe('http://localhost:8000/api/scores');
    });

    it('should construct full leaderboard URL correctly', () => {
      const fullUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LEADERBOARD}`;
      expect(fullUrl).toBe('http://localhost:8000/api/scores/leaderboard');
    });
  });
});
