# End-to-End Tests with Playwright

This directory contains end-to-end tests for the Jump Jump Jump game using Playwright.

## ⚠️ Important: Start Servers Before Testing

**You MUST start the frontend and backend servers manually before running tests.**

```powershell
# Use existing scripts
.\scripts\start.ps1      # Starts both servers
# Run specific test file
.\scripts\playwright.ps1 -Test menu
.\scripts\playwright.ps1 -Project chromiums
.\scripts\stop.ps1        # Stop servers when done
```

The automatic `webServer` startup is disabled in `playwright.config.ts` because it doesn't work reliably on Windows.

## Setup

### Install Playwright

```bash
# From project root (or use .\playwright.ps1 -Install)
npm install -D @playwright/test
npx playwright install
```

### Common Windows Warning (SAFE TO IGNORE)
```
Executable doesn't exist at C:\Users\...\winldd-1007\PrintDeps.exe
```
This is a Windows dependency checking tool. Tests run fine without it.

### Install Dependencies

```bash
# Install TypeScript and node types if not already installed
npm install -D typescript @types/node
```

## Running Tests

### Run all tests

```bash
npx playwright test
```

### Run tests in UI mode

```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run specific test file

```bash
npx playwright test tests/e2e/menu.spec.ts
```

### Run tests in specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug tests

```bash
npx playwright test --debug
```

### Generate test report

```bash
npx playwright show-report
```

## Test Structure

### Test Files

- **menu.spec.ts** - Main menu tests (title, buttons, leaderboard, animations)
- **campaign.spec.ts** - Campaign mode gameplay tests (movement, scoring, levels)
- **settings.spec.ts** - Settings menu tests (audio controls, persistence)
- **custom-levels.spec.ts** - Custom levels UI tests (pagination, navigation)
- **level-editor.spec.ts** - Level editor tests (add/remove lanes, save, test)
- **leaderboard.spec.ts** - Leaderboard display and API integration tests
- **api.spec.ts** - Backend API endpoint tests (scores, levels, CRUD operations)

## Test Coverage

### Features Tested

✅ **Main Menu**
- Game title display
- Navigation buttons
- Leaderboard display
- Hyperspace animation
- Instructions text

✅ **Campaign Mode**
- Game start
- Player movement (arrow keys, WASD)
- Score and lives display
- Level display
- Game state persistence

✅ **Settings**
- Volume controls
- Audio toggles
- localStorage persistence
- Settings restoration
- Back navigation

✅ **Custom Levels**
- Level list display
- Pagination (8 per page)
- Navigation buttons
- Empty state handling
- ESC key navigation

✅ **Level Editor**
- Add/remove lanes
- Save functionality
- Test mode
- Back navigation
- ESC key navigation

✅ **Leaderboard**
- Data fetching
- Top 10 display
- Empty state handling
- Error handling
- Name truncation

✅ **Backend API**
- Health check
- Score submission/retrieval
- Level CRUD operations
- Level name updates
- Validation
- Error handling

## Configuration

### playwright.config.ts

The configuration file includes:
- Multiple browser support (Chromium, Firefox, WebKit)
- Automatic server startup (frontend + backend)
- Screenshot on failure
- Video recording on failure
- HTML report generation
- Retry on CI

### Environment Variables

- `CI` - Enables CI-specific behavior (retries, workers)

## Best Practices

### Writing Tests

1. **Use descriptive test names**
   ```typescript
   test('should display game title', async ({ page }) => {
   ```

2. **Wait for elements**
   ```typescript
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

3. **Use page.waitForTimeout sparingly**
   - Only for Phaser game loading
   - Prefer waiting for specific elements

4. **Clean up test data**
   ```typescript
   test.afterEach(async ({ page }) => {
     await page.evaluate(() => localStorage.clear());
   });
   ```

5. **Use fixtures for common setup**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.goto('/');
     await page.waitForTimeout(2000); // Wait for game load
   });
   ```

### Phaser-Specific Testing

Since this is a Phaser game rendered on canvas:

1. **Text detection** - Phaser renders text on canvas, making it hard to locate
   - Use canvas screenshots
   - Check for visible canvas
   - Use gamepad/keyboard input directly

2. **Canvas interactions**
   ```typescript
   const canvas = page.locator('canvas');
   await canvas.click(); // Focus
   await page.keyboard.press('ArrowUp'); // Input
   ```

3. **Game state verification**
   - Check canvas visibility
   - Verify no crashes
   - Use localStorage for state
   - Test API integration

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run tests
        run: npx playwright test
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests timing out
- Increase timeout in config: `timeout: 60000`
- Check if servers are starting correctly
- Verify network connectivity

### Canvas not rendering
- Ensure browser supports WebGL
- Check console for Phaser errors
- Verify assets are loading

### API tests failing
- Check backend is running on port 8000
- Verify database is initialized
- Check CORS settings

### Flaky tests
- Add explicit waits
- Use retry logic
- Check for race conditions
- Verify test isolation

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Phaser Testing Guide](https://phaser.io/tutorials/testing-phaser)
- [Project README](../../README.md)
