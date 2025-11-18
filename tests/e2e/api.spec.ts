import { test, expect } from '@playwright/test';

test.describe('Backend API Integration', () => {
  const API_BASE_URL = 'http://localhost:8000';

  test('should have backend API running', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('should get leaderboard data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/scores/leaderboard?limit=10`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeLessThanOrEqual(10);
  });

  test('should accept score submission', async ({ request }) => {
    const scoreData = {
      username: 'playwright-test',
      score: 1000,
      level_reached: 5
    };

    const response = await request.post(`${API_BASE_URL}/api/scores`, {
      data: scoreData
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result).toHaveProperty('id');
    expect(result.username).toBe(scoreData.username);
    expect(result.score).toBe(scoreData.score);
  });

  test('should get custom levels', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/levels`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should create custom level', async ({ request }) => {
    const levelData = {
      name: 'Playwright Test Level',
      author: 'playwright-tester',
      lanes: [
        {
          speed: 100,
          direction: 'left',
          vehicle_type: 'car_blue',
          spawn_interval: 2.0
        }
      ]
    };

    const response = await request.post(`${API_BASE_URL}/api/levels`, {
      data: levelData
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result).toHaveProperty('id');
    expect(result.name).toBe(levelData.name);
  });

  test('should update level name', async ({ request }) => {
    // First create a level
    const levelData = {
      name: 'Test Level Original',
      author: 'playwright',
      lanes: []
    };

    const createResponse = await request.post(`${API_BASE_URL}/api/levels`, {
      data: levelData
    });

    const createdLevel = await createResponse.json();
    const levelId = createdLevel.id;

    // Update the name
    const updateResponse = await request.patch(
      `${API_BASE_URL}/api/levels/${levelId}/name`,
      {
        data: { name: 'Test Level Updated' }
      }
    );

    expect(updateResponse.ok()).toBeTruthy();
    const result = await updateResponse.json();
    expect(result.name).toBe('Test Level Updated');
  });

  test('should delete custom level', async ({ request }) => {
    // First create a level
    const levelData = {
      name: 'Level To Delete',
      author: 'playwright',
      lanes: []
    };

    const createResponse = await request.post(`${API_BASE_URL}/api/levels`, {
      data: levelData
    });

    const createdLevel = await createResponse.json();
    const levelId = createdLevel.id;

    // Delete the level
    const deleteResponse = await request.delete(`${API_BASE_URL}/api/levels/${levelId}`);
    expect(deleteResponse.ok()).toBeTruthy();

    // Verify it's deleted
    const getResponse = await request.get(`${API_BASE_URL}/api/levels/${levelId}`);
    expect(getResponse.status()).toBe(404);
  });

  test('should validate score submission', async ({ request }) => {
    const invalidData = {
      username: '', // Empty username
      score: -100, // Negative score
      level_reached: 0
    };

    const response = await request.post(`${API_BASE_URL}/api/scores`, {
      data: invalidData
    });

    // Should return validation error
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(422);
  });

  test('should handle API rate limiting', async ({ request }) => {
    // Make multiple rapid requests
    const requests = Array(10).fill(null).map(() => 
      request.get(`${API_BASE_URL}/api/scores/leaderboard?limit=10`)
    );

    const responses = await Promise.all(requests);
    
    // All should succeed or some may be rate limited
    const successCount = responses.filter(r => r.ok()).length;
    expect(successCount).toBeGreaterThan(0);
  });
});
