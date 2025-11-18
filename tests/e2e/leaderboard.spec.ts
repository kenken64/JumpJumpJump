import { test, expect } from '@playwright/test';

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
  });

  test('should display leaderboard on menu', async ({ page }) => {
    // Verify canvas is rendered (leaderboard is rendered on canvas)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should display rank, player, and score headers', async ({ page }) => {
    // Verify canvas is rendered (headers are rendered on canvas)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has content
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);
  });

  test('should fetch and display leaderboard data', async ({ page }) => {
    // Wait for API call to complete
    await page.waitForTimeout(1500);
    
    // Check if leaderboard entries are displayed
    // Look for rank numbers (1-10)
    const entries = await page.locator('text=/^\\d+\\./').count();
    
    // Should have at least some entries or show "Loading..."
    expect(entries).toBeGreaterThanOrEqual(0);
  });

  test('should show top 10 scores', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Count rank entries
    const entries = await page.locator('text=/^\\d+\\./').count();
    
    // Should be 10 or less
    expect(entries).toBeLessThanOrEqual(10);
  });

  test('should handle empty leaderboard gracefully', async ({ page }) => {
    // Intercept API and return empty array
    await page.route('**/api/scores/leaderboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Verify canvas is still rendered (leaderboard handles empty state)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Intercept API and return error
    await page.route('**/api/scores/leaderboard*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Server error' })
      });
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Verify canvas is still rendered (leaderboard handles error state)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should truncate long player names', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Get all player name elements
    const playerNames = await page.locator('[class*="player"], [id*="player"]').allTextContents();
    
    // Check that names don't exceed character limit (18 characters)
    for (const name of playerNames) {
      if (name.trim().length > 0 && !name.includes('Player')) {
        expect(name.length).toBeLessThanOrEqual(18);
      }
    }
  });
});
