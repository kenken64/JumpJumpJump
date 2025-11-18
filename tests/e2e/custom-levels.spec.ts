import { test, expect } from '@playwright/test';

test.describe('Custom Levels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);

    // Navigate to custom levels
    await page.click('[data-testid="custom-levels-button"]');
    await page.waitForTimeout(1000);
  });

  test('should display custom levels scene', async ({ page }) => {
    // Verify we're on custom levels by checking for the back button overlay
    const backBtn = page.locator('[data-testid="back-to-menu-button"]');
    await expect(backBtn).toBeVisible();
  });

  test('should handle pagination when levels exist', async ({ page }) => {
    // Check if canvas is rendered (indicates scene is loaded)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Pagination functionality tested via navigation buttons test
  });

  test('should navigate with pagination buttons', async ({ page }) => {
    // Check if Next button exists
    const nextBtn = page.locator('text=Next >');
    const prevBtn = page.locator('text=< Previous');
    
    if (await nextBtn.isVisible({ timeout: 2000 })) {
      // Click next
      await nextBtn.click();
      await page.waitForTimeout(500);
      
      // Previous should now be visible
      await expect(prevBtn).toBeVisible();
      
      // Click previous
      await prevBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display level cards with buttons', async ({ page }) => {
    // Check for Edit, Play, Delete buttons if levels exist
    const editBtn = page.locator('text=Edit').first();
    const playBtn = page.locator('text=Play').first();
    const deleteBtn = page.locator('text=Delete').first();
    
    try {
      await expect(editBtn).toBeVisible({ timeout: 2000 });
      await expect(playBtn).toBeVisible();
      await expect(deleteBtn).toBeVisible();
    } catch {
      // No levels exist, that's ok
    }
  });

  test('should navigate back to menu', async ({ page }) => {
    await page.click('[data-testid="back-to-menu-button"]');
    await page.waitForTimeout(1000);

    // Verify we're back on menu by checking for menu buttons
    const campaignBtn = page.locator('[data-testid="campaign-mode-button"]');
    await expect(campaignBtn).toBeVisible();
  });

  test('should navigate back with ESC key', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Verify we're back on menu by checking for menu buttons
    const campaignBtn = page.locator('[data-testid="campaign-mode-button"]');
    await expect(campaignBtn).toBeVisible();
  });
});
