import { test, expect } from '@playwright/test';

test.describe('Campaign Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
  });

  test('should start campaign mode', async ({ page }) => {
    // Click campaign mode button
    await page.click('[data-testid="campaign-mode-button"]');
    await page.waitForTimeout(1000);

    // Verify game scene loaded
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load game scene and render canvas', async ({ page }) => {
    // Wait for button to be visible before clicking
    const campaignBtn = page.locator('[data-testid="campaign-mode-button"]');
    await expect(campaignBtn).toBeVisible({ timeout: 10000 });

    await page.click('[data-testid="campaign-mode-button"]');
    await page.waitForTimeout(1500);

    // Verify canvas is present and has content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has dimensions (game is rendered)
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);
  });

  test('should allow player movement with arrow keys', async ({ page }) => {
    await page.click('[data-testid="campaign-mode-button"]');
    await page.waitForTimeout(1500);
    
    const canvas = page.locator('canvas');
    
    // Focus on canvas
    await canvas.click();
    
    // Press arrow keys
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    
    // Verify game is still running (no crash)
    await expect(canvas).toBeVisible();
  });

  test('should allow player movement with WASD keys', async ({ page }) => {
    await page.click('[data-testid="campaign-mode-button"]');
    await page.waitForTimeout(1500);
    
    const canvas = page.locator('canvas');
    await canvas.click();
    
    // Press WASD keys
    await page.keyboard.press('W');
    await page.waitForTimeout(300);
    await page.keyboard.press('S');
    await page.waitForTimeout(300);
    await page.keyboard.press('A');
    await page.waitForTimeout(300);
    await page.keyboard.press('D');
    await page.waitForTimeout(300);
    
    await expect(canvas).toBeVisible();
  });

  test('should transition from menu to game scene', async ({ page }) => {
    // Verify we start on menu (button is visible)
    const campaignBtn = page.locator('[data-testid="campaign-mode-button"]');
    await expect(campaignBtn).toBeVisible({ timeout: 15000 });

    await page.click('[data-testid="campaign-mode-button"]');
    await page.waitForTimeout(2000);

    // Verify button is no longer visible (we left menu scene)
    await expect(campaignBtn).not.toBeVisible({ timeout: 5000 });

    // Verify canvas is still present (game is running)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should return to menu on ESC', async ({ page }) => {
    await page.click('[data-testid="campaign-mode-button"]');
    await page.waitForTimeout(1000);

    // Press ESC to return to menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify we're back on menu (button is visible again)
    const campaignBtn = page.locator('[data-testid="campaign-mode-button"]');
    await expect(campaignBtn).toBeVisible({ timeout: 2000 });
  });
});
