import { test, expect } from '@playwright/test';

test.describe('Settings Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);

    // Navigate to settings
    await page.click('[data-testid="settings-button"]');
    await page.waitForTimeout(1000);
  });

  test('should display settings scene', async ({ page }) => {
    // Verify we're on settings by checking for the back button overlay
    const backBtn = page.locator('[data-testid="back-to-menu-button"]');
    await expect(backBtn).toBeVisible();

    // Verify canvas is rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should save settings to localStorage', async ({ page }) => {
    // Wait for settings scene to initialize and save to localStorage
    await page.waitForTimeout(1500);

    // Check localStorage after initialization
    const settings = await page.evaluate(() => {
      return localStorage.getItem('jumpJumpJumpSettings');
    });

    expect(settings).not.toBeNull();

    const parsed = JSON.parse(settings!);
    expect(parsed).toHaveProperty('musicVolume');
    expect(parsed).toHaveProperty('sfxVolume');
    expect(parsed).toHaveProperty('musicEnabled');
    expect(parsed).toHaveProperty('sfxEnabled');
  });

  test('should navigate back to menu', async ({ page }) => {
    await page.click('[data-testid="back-to-menu-button"]');
    await page.waitForTimeout(1000);

    // Verify we're back on menu by checking for menu buttons
    const campaignBtn = page.locator('[data-testid="campaign-mode-button"]');
    await expect(campaignBtn).toBeVisible();
  });

  test('should persist settings after reload', async ({ page }) => {
    // Get initial settings
    const settingsBefore = await page.evaluate(() => {
      return localStorage.getItem('jumpJumpJumpSettings');
    });
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Get settings after reload
    const settingsAfter = await page.evaluate(() => {
      return localStorage.getItem('jumpJumpJumpSettings');
    });
    
    expect(settingsAfter).toBe(settingsBefore);
  });
});
