import { test, expect } from '@playwright/test';

test.describe('JumpJumpJump Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Click the start overlay to unlock audio and start the game
    await page.getByText('▶ START GAME').click();
    await expect(page.getByText('Click anywhere to start with audio')).not.toBeVisible();
  });

  test('should load game canvas', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/JumpJumpJump/);
  });

  test('should initialize Phaser game', async ({ page }) => {
    // Wait for window.game to be defined
    await page.waitForFunction(() => (window as any).game !== undefined);
    
    const isBooted = await page.evaluate(() => {
      const game = (window as any).game;
      return game.isBooted;
    });
    expect(isBooted).toBe(true);
  });

  test('should start in MenuScene', async ({ page }) => {
    await page.waitForFunction(() => (window as any).game !== undefined);
    
    // Wait for MenuScene to be active
    await page.waitForFunction(() => {
      const game = (window as any).game;
      const menuScene = game.scene.getScene('MenuScene');
      return menuScene && game.scene.isActive('MenuScene');
    });
  });

  test('should navigate to GameScene when Level Mode is clicked', async ({ page }) => {
    await page.waitForFunction(() => (window as any).game !== undefined);
    
    // Wait for MenuScene to be active
    await page.waitForFunction(() => {
      const game = (window as any).game;
      return game.scene.isActive('MenuScene');
    });

    // Simulate clicking "LEVEL MODE"
    await page.evaluate(() => {
      const game = (window as any).game;
      const menuScene = game.scene.getScene('MenuScene');
      
      // Find the "LEVEL MODE" button (Rectangle at 640, 430)
      const children = menuScene.children.list;
      const levelModeBtn = children.find((child: any) => 
        child.type === 'Rectangle' && child.x === 640 && child.y === 430
      );
      
      if (levelModeBtn) {
        // Simulate pointer down event
        levelModeBtn.emit('pointerdown');
      } else {
        // Fallback: try to find by checking listeners or just the first interactive rectangle
        const interactive = children.find((child: any) => 
          child.input && child.input.enabled && child.type === 'Rectangle'
        );
        if (interactive) {
             // This is risky, might click the wrong button. 
             // But let's stick to coordinates if possible.
             console.log('Found interactive rectangle at', interactive.x, interactive.y);
        }
        throw new Error('Could not find LEVEL MODE button');
      }
    });

    // Wait for GameScene to become active
    await page.waitForFunction(() => {
      const game = (window as any).game;
      return game.scene.isActive('GameScene');
    });
  });

  test('should have player in GameScene', async ({ page }) => {
    // Navigate to GameScene first (reuse logic or make a helper)
    await page.waitForFunction(() => (window as any).game !== undefined);
    await page.waitForFunction(() => (window as any).game.scene.isActive('MenuScene'));
    
    await page.evaluate(() => {
      const game = (window as any).game;
      const menuScene = game.scene.getScene('MenuScene');
      const children = menuScene.children.list;
      // Find the "LEVEL MODE" button (Rectangle at 640, 430)
      const levelModeBtn = children.find((child: any) => 
        child.type === 'Rectangle' && child.x === 640 && child.y === 430
      );
      if (levelModeBtn) levelModeBtn.emit('pointerdown');
    });

    await page.waitForFunction(() => (window as any).game.scene.isActive('GameScene'));

    // Check for player existence
    const hasPlayer = await page.evaluate(() => {
      const game = (window as any).game;
      const gameScene = game.scene.getScene('GameScene');
      return !!gameScene.player;
    });
    
    expect(hasPlayer).toBe(true);
  });
});
