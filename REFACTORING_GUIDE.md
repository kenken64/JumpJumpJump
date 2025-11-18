# Frontend Refactoring Guide

## 📊 Current State Analysis

### Code Complexity Issues

**Scene Files:**
- `MainGameScene.ts`: **~1549 lines** ⚠️ (God Object anti-pattern)
- `CustomGameScene.ts`: **~1100+ lines** ⚠️ (Similar complexity)
- `MenuScene.ts`: **~398 lines**
- `SettingsScene.ts`: **~420 lines**
- `LevelEditorScene.ts`: **Large file**
- `CustomLevelSelectScene.ts`: **Moderate complexity**

### Problems Identified

1. **God Object Anti-Pattern**: MainGameScene and CustomGameScene do too much
2. **Code Duplication**: Similar logic between MainGameScene and CustomGameScene
3. **Poor Separation of Concerns**: UI, game logic, and state management mixed together
4. **Static State Management**: Using static variables for persistence (not ideal)
5. **Long Methods**: Methods with 100+ lines
6. **Missing Abstractions**: No clear service layer or utilities
7. **Hardcoded Values**: Magic numbers scattered throughout

---

## 🎯 Refactoring Recommendations

### Priority 1: Extract Game Logic (High Impact)

#### 1.1 Create Separate Managers

**Current Problem:**
```typescript
// MainGameScene.ts - Everything in one place
export class MainGameScene extends Phaser.Scene {
  private lanes: Lane[] = [];
  private score: number = 0;
  private lives: number = 3;
  // ... 50+ more properties
  
  create(): void {
    // 200+ lines of mixed concerns
  }
}
```

**Solution: Create Specialized Managers**

```typescript
// game/managers/GameStateManager.ts
export class GameStateManager {
  private score: number = 0;
  private lives: number = 3;
  private level: number = 1;
  
  constructor(initialState?: Partial<GameState>) {
    // Initialize from saved state
  }
  
  incrementScore(points: number): void { }
  loseLife(): boolean { /* returns true if game over */ }
  saveState(): void { }
  loadState(): GameState | null { }
}

// game/managers/LaneManager.ts
export class LaneManager {
  private lanes: Lane[] = [];
  
  constructor(private scene: Phaser.Scene) {}
  
  createLanes(config: LevelConfig): void { }
  updateLanes(delta: number): void { }
  checkCollisions(player: Player): Vehicle | null { }
  spawnVehicle(laneIndex: number): void { }
}

// game/managers/UIManager.ts
export class UIManager {
  private scoreText?: Phaser.GameObjects.Text;
  private livesText?: Phaser.GameObjects.Text;
  
  constructor(private scene: Phaser.Scene) {}
  
  createGameUI(width: number, height: number): void { }
  updateScore(score: number): void { }
  updateLives(lives: number): void { }
  showGameOver(finalScore: number): void { }
  showLevelTransition(level: number): void { }
}
```

**Refactored Scene:**
```typescript
// MainGameScene.ts - Much cleaner!
export class MainGameScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private laneManager!: LaneManager;
  private uiManager!: UIManager;
  private inputManager!: InputManager;
  private player!: Player;
  
  create(): void {
    // Initialize managers
    this.gameState = new GameStateManager();
    this.laneManager = new LaneManager(this);
    this.uiManager = new UIManager(this);
    this.inputManager = new InputManager(this);
    
    // Setup game
    this.setupBackground();
    this.laneManager.createLanes(levelConfig);
    this.player = new Player(this, startX, startY);
    this.uiManager.createGameUI(width, height);
  }
  
  update(time: number, delta: number): void {
    this.inputManager.update();
    this.player.update();
    this.laneManager.updateLanes(delta);
    
    const collision = this.laneManager.checkCollisions(this.player);
    if (collision) {
      this.handleCollision(collision);
    }
  }
}
```

#### 1.2 Extract UI Components

**Create Reusable UI Components:**

```typescript
// game/ui/Button.ts
export class Button extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    options?: ButtonOptions
  ) {
    super(scene, x, y);
    this.createButton(text, options);
  }
  
  private createButton(text: string, options?: ButtonOptions): void {
    const bg = new Phaser.GameObjects.Rectangle(
      this.scene,
      0, 0,
      options?.width || 300,
      options?.height || 60,
      options?.color || 0x3498db
    );
    
    const label = new Phaser.GameObjects.Text(
      this.scene,
      0, 0,
      text,
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5);
    
    this.add([bg, label]);
    this.setInteractive(new Phaser.Geom.Rectangle(-150, -30, 300, 60), Phaser.Geom.Rectangle.Contains);
  }
  
  onClick(callback: () => void): this {
    this.on('pointerdown', callback);
    return this;
  }
}

// game/ui/Leaderboard.ts
export class Leaderboard extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.createLeaderboard();
  }
  
  async loadData(): Promise<void> {
    // Fetch and display leaderboard
  }
  
  private createLeaderboard(): void {
    // UI creation logic
  }
}
```

### Priority 2: Reduce Code Duplication

#### 2.1 Create Base Game Scene

**Problem: MainGameScene and CustomGameScene share 80% of code**

```typescript
// game/scenes/BaseGameScene.ts
export abstract class BaseGameScene extends Phaser.Scene {
  protected gameState!: GameStateManager;
  protected laneManager!: LaneManager;
  protected uiManager!: UIManager;
  protected inputManager!: InputManager;
  protected player!: Player;
  protected isPaused: boolean = false;
  
  create(): void {
    this.initializeManagers();
    this.setupBackground();
    this.createGameElements();
    this.setupEventListeners();
  }
  
  update(time: number, delta: number): void {
    if (this.isPaused) return;
    
    this.updateGameLogic(delta);
    this.checkCollisions();
    this.checkGoalReached();
  }
  
  protected abstract getLevelConfig(): LevelConfig;
  protected abstract onLevelComplete(): void;
  protected abstract onGameOver(): void;
  
  protected initializeManagers(): void {
    this.gameState = new GameStateManager();
    this.laneManager = new LaneManager(this);
    this.uiManager = new UIManager(this);
    this.inputManager = new InputManager(this);
  }
  
  protected handleCollision(vehicle: Vehicle): void {
    // Shared collision logic
  }
  
  protected pauseGame(): void {
    this.isPaused = true;
    this.uiManager.showPauseMenu();
  }
}

// MainGameScene.ts - Much simpler!
export class MainGameScene extends BaseGameScene {
  private static levelManager = new LevelManager();
  
  protected getLevelConfig(): LevelConfig {
    return MainGameScene.levelManager.getLevelConfig();
  }
  
  protected onLevelComplete(): void {
    MainGameScene.levelManager.nextLevel();
    this.scene.restart();
  }
  
  protected onGameOver(): void {
    this.submitScore();
    this.scene.start('MenuScene');
  }
}

// CustomGameScene.ts - Also simpler!
export class CustomGameScene extends BaseGameScene {
  private customLevel!: CustomLevel;
  
  init(data: { level: CustomLevel }): void {
    this.customLevel = data.level;
  }
  
  protected getLevelConfig(): LevelConfig {
    return this.convertCustomLevel(this.customLevel);
  }
  
  protected onLevelComplete(): void {
    this.uiManager.showLevelComplete();
  }
  
  protected onGameOver(): void {
    this.scene.start('CustomLevelSelectScene');
  }
}
```

### Priority 3: Configuration and Constants

#### 3.1 Extract Magic Numbers

```typescript
// game/config/GameConstants.ts
export const GAME_CONSTANTS = {
  PLAYER: {
    DEFAULT_LIVES: 3,
    SPRITE_SIZE: 32,
    MOVEMENT_SPEED: 4,
    INVULNERABILITY_DURATION: 2000, // ms
  },
  LANE: {
    HEIGHT: 64,
    MIN_SPAWN_INTERVAL: 800,
    MAX_SPAWN_INTERVAL: 3000,
  },
  GOALS: {
    PER_LEVEL: 3,
    TREE_OFFSET_X: 40,
  },
  UI: {
    BUTTON_WIDTH: 300,
    BUTTON_HEIGHT: 60,
    PANEL_PADDING: 40,
  },
  AUDIO: {
    DEFAULT_MUSIC_VOLUME: 0.5,
    DEFAULT_SFX_VOLUME: 0.4,
  },
  SCORING: {
    GOAL_REACHED: 100,
    LEVEL_COMPLETE_BONUS: 500,
  }
} as const;

// game/config/Colors.ts
export const COLORS = {
  BACKGROUNDS: {
    EASY: 0x2ecc71,
    MEDIUM: 0x3498db,
    HARD: 0xe74c3c,
    EXTREME: 0x9b59b6,
  },
  UI: {
    PRIMARY: 0x3498db,
    SUCCESS: 0x27ae60,
    DANGER: 0xe74c3c,
    DARK: 0x2c3e50,
  }
} as const;
```

### Priority 4: Services Layer

#### 4.1 API Service

```typescript
// game/services/ApiService.ts
export class ApiService {
  private static instance: ApiService;
  
  private constructor() {}
  
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  
  async submitScore(scoreData: ScoreSubmit): Promise<ScoreResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit score: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/scores/leaderboard?limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async saveCustomLevel(level: CustomLevel): Promise<void> {
    // Implementation
  }
  
  async getCustomLevels(): Promise<CustomLevel[]> {
    // Implementation
  }
}

// Usage in scenes:
const apiService = ApiService.getInstance();
await apiService.submitScore({ username, score, level_reached });
```

#### 4.2 Storage Service

```typescript
// game/services/StorageService.ts
export class StorageService {
  private static instance: StorageService;
  private readonly prefix = 'jumpjump_';
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  save<T>(key: string, data: T): void {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, json);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }
  
  load<T>(key: string, defaultValue: T): T {
    try {
      const json = localStorage.getItem(this.prefix + key);
      return json ? JSON.parse(json) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }
  
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  // Type-safe methods for specific data
  saveSettings(settings: GameSettings): void {
    this.save('settings', settings);
  }
  
  loadSettings(): GameSettings {
    return this.load('settings', DEFAULT_SETTINGS);
  }
  
  saveGameState(state: GameState): void {
    this.save('game_state', state);
  }
  
  loadGameState(): GameState | null {
    return this.load('game_state', null);
  }
}
```

### Priority 5: Type Safety and Interfaces

#### 5.1 Centralized Type Definitions

```typescript
// game/types/index.ts
export interface GameState {
  score: number;
  lives: number;
  level: number;
  timestamp: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface LevelConfig {
  levelNumber: number;
  difficulty: Difficulty;
  backgroundColor: number;
  lanes: LaneConfig[];
  goalsRequired: number;
}

export interface LaneConfig {
  vehicleType: VehicleType;
  speed: number;
  direction: Direction;
  spawnInterval: number;
}

export type VehicleType = 'car' | 'truck' | 'bus' | 'taxi';
export type Direction = 1 | -1; // 1 = right, -1 = left
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface ButtonOptions {
  width?: number;
  height?: number;
  color?: number;
  fontSize?: string;
  onClick?: () => void;
}
```

---

## 📁 Proposed New Structure

```
frontend/src/game/
├── config/
│   ├── GameConstants.ts        # All magic numbers
│   ├── Colors.ts               # Color schemes
│   └── LevelConfigs.ts         # Level definitions
├── managers/
│   ├── GameStateManager.ts     # Score, lives, level tracking
│   ├── LaneManager.ts          # Lane creation and updates
│   ├── UIManager.ts            # All UI elements
│   ├── InputManager.ts         # (exists)
│   ├── LevelManager.ts         # (exists)
│   ├── CollisionManager.ts     # Collision detection
│   └── AudioManager.ts         # Sound management
├── services/
│   ├── ApiService.ts           # Backend API calls
│   ├── StorageService.ts       # localStorage wrapper
│   └── ValidationService.ts    # Input validation
├── ui/
│   ├── Button.ts               # Reusable button
│   ├── Panel.ts                # Reusable panel
│   ├── Leaderboard.ts          # Leaderboard component
│   ├── PauseMenu.ts            # Pause menu
│   └── GameOverScreen.ts       # Game over UI
├── entities/
│   ├── Player.ts               # (exists)
│   ├── Vehicle.ts              # (exists)
│   └── TreeGoal.ts             # Extract goal logic
├── scenes/
│   ├── BaseGameScene.ts        # Base class for game scenes
│   ├── MainGameScene.ts        # 200 lines (was 1549)
│   ├── CustomGameScene.ts      # 200 lines (was 1100+)
│   ├── MenuScene.ts            # Refactored
│   ├── SettingsScene.ts        # Refactored
│   ├── LevelEditorScene.ts     # Refactored
│   ├── CustomLevelSelectScene.ts
│   └── PreloadScene.ts         # (exists)
├── utils/
│   ├── MathUtils.ts            # Math helpers
│   ├── ColorUtils.ts           # Color conversions
│   └── TextUtils.ts            # Text formatting
└── types/
    ├── index.ts                # All type definitions
    └── CustomLevel.ts          # (exists)
```

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1)
1. Create configuration files (GameConstants, Colors)
2. Set up services layer (ApiService, StorageService)
3. Define all TypeScript interfaces in `types/index.ts`
4. Add comprehensive JSDoc comments

### Phase 2: Manager Extraction (Week 2)
1. Create GameStateManager
2. Create LaneManager
3. Create UIManager
4. Create AudioManager
5. Update existing managers to use new configs

### Phase 3: UI Components (Week 3)
1. Create reusable Button component
2. Create Panel component
3. Create Leaderboard component
4. Extract PauseMenu and GameOverScreen

### Phase 4: Scene Refactoring (Week 4)
1. Create BaseGameScene abstract class
2. Refactor MainGameScene (reduce from 1549 to ~200 lines)
3. Refactor CustomGameScene (reduce from 1100+ to ~200 lines)
4. Refactor MenuScene and SettingsScene

### Phase 5: Testing & Documentation (Week 5)
1. Update all unit tests
2. Add integration tests for managers
3. Write developer onboarding guide
4. Create architecture diagrams

---

## 📚 Benefits of Refactoring

### For New Developers
- **Faster onboarding**: Clear structure and smaller files
- **Easier debugging**: Each component has single responsibility
- **Better discoverability**: Logical folder structure

### For Maintenance
- **Reduced duplication**: Shared logic in base classes
- **Easier testing**: Isolated components
- **Better type safety**: Comprehensive type definitions

### For Features
- **Faster development**: Reusable components
- **Less risk**: Changes isolated to specific files
- **Better quality**: Consistent patterns throughout

---

## 🎓 Code Quality Metrics Goals

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Avg lines per scene | 800+ | <300 | ⚠️ |
| Code duplication | High | Low | ⚠️ |
| Cyclomatic complexity | 50+ | <10 | ⚠️ |
| Test coverage | Partial | >80% | ⚠️ |
| Type safety | Good | Excellent | ✅ |
| Documentation | Minimal | Comprehensive | ⚠️ |

---

## 💡 Quick Wins (Can Start Immediately)

1. **Extract constants** - Replace magic numbers with named constants
2. **Add JSDoc comments** - Document public methods
3. **Create ApiService** - Centralize API calls
4. **Extract Button component** - Remove duplicate button creation code
5. **Add TypeScript strict mode** - Catch more errors at compile time

---

## 📖 Example Migration

### Before (MenuScene.ts - 398 lines, mixed concerns):
```typescript
create(): void {
  // 50 lines of background setup
  // 30 lines of button creation
  // 80 lines of leaderboard logic
  // 40 lines of hyperspace effect
  // 100+ lines of event handlers
}
```

### After (MenuScene.ts - ~150 lines, focused):
```typescript
create(): void {
  this.setupBackground();
  this.createButtons();
  this.leaderboard = new Leaderboard(this, x, y);
  this.hyperspaceEffect = new HyperspaceEffect(this);
}

private createButtons(): void {
  const buttonConfigs = [
    { text: 'Campaign Mode', color: COLORS.UI.SUCCESS, scene: 'MainGameScene' },
    { text: 'Custom Levels', color: COLORS.UI.PRIMARY, scene: 'CustomLevelSelectScene' },
    // ...
  ];
  
  buttonConfigs.forEach((config, index) => {
    new Button(this, width / 2, 250 + index * 80, config.text, { color: config.color })
      .onClick(() => this.scene.start(config.scene));
  });
}
```

---

## 🔗 Additional Resources

- [Phaser 3 Examples](https://phaser.io/examples)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [SOLID Principles in TypeScript](https://khalilstemmler.com/articles/solid-principles/solid-typescript/)
- [Clean Code Concepts](https://github.com/labs42io/clean-code-typescript)

---

## ✅ Checklist for New Developers

- [ ] Read this refactoring guide
- [ ] Understand the current architecture issues
- [ ] Review proposed new structure
- [ ] Start with "Quick Wins" section
- [ ] Follow the implementation plan phases
- [ ] Write tests for new components
- [ ] Update documentation as you go
- [ ] Get code reviews from team

---

*Last Updated: November 19, 2025*
