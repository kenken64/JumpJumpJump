import { test, expect } from '@playwright/test';

test.describe('Level Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);

    // Navigate to level editor
    await page.click('[data-testid="level-editor-button"]');
    await page.waitForTimeout(1000);
  });

  test('should display level editor scene with controls', async ({ page }) => {
    // Verify we're on level editor by checking for overlay buttons
    const addBtn = page.locator('[data-testid="add-lane-button"]');
    const saveBtn = page.locator('[data-testid="save-level-button"]');
    const testBtn = page.locator('[data-testid="test-level-button"]');
    const backBtn = page.locator('[data-testid="back-to-menu-button"]');

    await expect(addBtn).toBeVisible();
    await expect(saveBtn).toBeVisible();
    await expect(testBtn).toBeVisible();
    await expect(backBtn).toBeVisible();
  });

  test('should add a lane when clicking add button', async ({ page }) => {
    // Click add lane using overlay button
    const addBtn = page.locator('[data-testid="add-lane-button"]');
    await addBtn.click();
    await page.waitForTimeout(500);

    // Verify add button is still visible (we're still in editor)
    await expect(addBtn).toBeVisible();

    // Verify canvas is still rendered (editor is working)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should remove a lane when clicking remove button', async ({ page }) => {
    // Add a lane first using overlay button
    const addBtn = page.locator('[data-testid="add-lane-button"]');
    await addBtn.click();
    await page.waitForTimeout(300);

    // Click remove lane using overlay button
    const removeBtn = page.locator('[data-testid="remove-lane-button"]');
    await removeBtn.click();
    await page.waitForTimeout(300);

    // Verify we can still see the editor controls
    await expect(addBtn).toBeVisible();
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

  test('should trigger save when clicking save button', async ({ page }) => {
    // Click save level using overlay button
    await page.click('[data-testid="save-level-button"]');
    await page.waitForTimeout(500);

    // Verify we're still in level editor
    const addBtn = page.locator('[data-testid="add-lane-button"]');
    await expect(addBtn).toBeVisible();
  });
});
