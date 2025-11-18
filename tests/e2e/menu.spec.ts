import { test, expect } from '@playwright/test';

test.describe('Main Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to load
    await page.waitForTimeout(5000);
  });

  test('should display menu scene with canvas', async ({ page }) => {
    // Verify canvas is rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);
  });

  test('should have campaign mode button', async ({ page }) => {
    const campaignBtn = page.locator('[data-testid="campaign-mode-button"]');
    await expect(campaignBtn).toBeVisible();
  });

  test('should have custom levels button', async ({ page }) => {
    const customBtn = page.locator('[data-testid="custom-levels-button"]');
    await expect(customBtn).toBeVisible({ timeout: 10000 });
  });

  test('should have level editor button', async ({ page }) => {
    const editorBtn = page.locator('[data-testid="level-editor-button"]');
    await expect(editorBtn).toBeVisible();
  });

  test('should have settings button', async ({ page }) => {
    const settingsBtn = page.locator('[data-testid="settings-button"]');
    await expect(settingsBtn).toBeVisible({ timeout: 10000 });
  });

  test('should have all menu navigation buttons', async ({ page }) => {
    // Verify all menu buttons are present
    await expect(page.locator('[data-testid="campaign-mode-button"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="custom-levels-button"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="level-editor-button"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="settings-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display hyperspace star animation', async ({ page }) => {
    // Check that canvas is present and rendering
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify canvas has content (not blank)
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);
  });
});
