# Jump Jump Jump - Complete Build Tutorial
## From Zero to Hero: Building a Frogger-Style Game

**Tutorial Version:** 1.0  
**Date:** November 16, 2025  
**Difficulty:** Intermediate  
**Time to Complete:** 8-12 hours (across multiple sessions)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Phase 0: Foundation](#phase-0-foundation)
4. [Phase 1: Core Gameplay](#phase-1-core-gameplay)
5. [Phase 2: Level Editor](#phase-2-level-editor)
6. [Phase 3: Polish & Enhancement](#phase-3-polish--enhancement)
7. [Testing & Deployment](#testing--deployment)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

This tutorial will guide you through building **Jump Jump Jump**, a complete Frogger-style platformer game from scratch. You'll learn:

- React + Phaser 3 integration
- Game state management
- Backend API with FastAPI
- Level progression systems
- Visual level editor
- Save/load functionality

### What You'll Build

- ✅ Campaign mode with 10+ progressive levels
- ✅ Custom level editor
- ✅ Persistent leaderboards
- ✅ Keyboard and gamepad support
- ✅ Complete UI/UX

---

## Prerequisites

### Required Knowledge
- JavaScript/TypeScript basics
- React fundamentals
- Python basics
- Command line usage
- Git basics

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

### Verify Installation

```bash
# Check Node.js
node --version  # Should be v18+

# Check Python
python --version  # Should be 3.8+

# Check Git
git --version
```

---

## Phase 0: Foundation

**Goal:** Set up project structure and basic game mechanics  
**Duration:** 2-3 hours

### Step 1: Project Initialization

#### 1.1 Create Project Structure

```bash
# Create project directory
mkdir JumpJumpJump
cd JumpJumpJump

# Create subdirectories
mkdir frontend backend scripts PRPs

# Initialize Git
git init
```

#### 1.2 Create .gitignore

Create `.gitignore` in root:

```gitignore
# Dependencies
node_modules/
__pycache__/
*.pyc
venv/

# Build outputs
dist/
build/
*.log

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.db
*.sqlite

# OS
.DS_Store
Thumbs.db

# Process IDs
*.pid
```

---

### Step 2: Frontend Setup

#### 2.1 Initialize React + Vite + TypeScript

```bash
cd frontend
npm create vite@latest . -- --template react-ts

# When prompted:
# - Select "React"
# - Select "TypeScript"
```

#### 2.2 Install Dependencies

```bash
npm install phaser zustand
npm install --save-dev @types/node
```

#### 2.3 Update package.json

Edit `frontend/package.json`:

```json
{
  "name": "jumpjumpjump-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.90.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/node": "^24.10.0",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "@vitejs/plugin-react": "^4.7.0",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.3",
    "vite": "^5.4.21"
  }
}
```

#### 2.4 Configure TypeScript

Update `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

#### 2.5 Configure Vite

Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
```

---

### Step 3: Download Game Assets

#### 3.1 Create Assets Directory

```bash
mkdir -p frontend/public/assets
cd frontend/public/assets
```

#### 3.2 Download Kenney Assets

Download these free assets from [Kenney.nl](https://kenney.nl/):

1. **Spritesheet Pack Complete**
   - URL: https://kenney.nl/assets/spritesheet-pack-complete
   - Download and extract
   - Copy `spritesheet_complete.png` and `spritesheet_complete.xml` to `public/assets/`

You should have:
```
frontend/public/assets/
├── spritesheet_complete.png
└── spritesheet_complete.xml
```

---

### Step 4: Create Game Foundation

#### 4.1 Create Directory Structure

```bash
cd frontend/src
mkdir -p game/scenes game/entities game/managers game/types components
```

#### 4.2 Create Phaser Config

Create `frontend/src/game/config.ts`:

```typescript
import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { MainGameScene } from './scenes/MainGameScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#2c3e50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [
    PreloadScene,
    MenuScene,
    MainGameScene
  ],
  input: {
    gamepad: true
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
```

#### 4.3 Create GameContainer Component

Create `frontend/src/components/GameContainer.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';

export const GameContainer = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Create game instance
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="game-wrapper">
      <div id="game-container" />
    </div>
  );
};
```

#### 4.4 Create PreloadScene

Create `frontend/src/game/scenes/PreloadScene.ts`:

```typescript
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff'
    });
    loadingText.setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff'
    });
    percentText.setOrigin(0.5);

    // Loading progress
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      percentText.setText(Math.floor(value * 100) + '%');
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load the spritesheet atlas (XML format)
    this.load.atlasXML(
      'sprites',
      'assets/spritesheet_complete.png',
      'assets/spritesheet_complete.xml'
    );
  }

  create(): void {
    // Start the menu scene
    this.scene.start('MenuScene');
  }
}
```

#### 4.5 Create Basic MenuScene

Create `frontend/src/game/scenes/MenuScene.ts`:

```typescript
import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Title
    this.add.text(width / 2, height / 3, 'JUMP JUMP JUMP!', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Start button
    const startButton = this.add.text(width / 2, height / 2, 'START GAME', {
      fontSize: '32px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
      .setInteractive()
      .on('pointerover', () => startButton.setStyle({ color: '#ffff00' }))
      .on('pointerout', () => startButton.setStyle({ color: '#00ff00' }))
      .on('pointerdown', () => {
        this.scene.start('MainGameScene');
      });

    // Instructions
    this.add.text(width / 2, height * 0.7, 'Use Arrow Keys or WASD to Move', {
      fontSize: '16px',
      color: '#cccccc'
    }).setOrigin(0.5);
  }
}
```

#### 4.6 Create Placeholder MainGameScene

Create `frontend/src/game/scenes/MainGameScene.ts`:

```typescript
import Phaser from 'phaser';

export class MainGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainGameScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.text(width / 2, height / 2, 'Game Scene - Coming Soon!', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Return to menu on ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }
}
```

#### 4.7 Update App.tsx

Replace `frontend/src/App.tsx`:

```tsx
import { GameContainer } from './components/GameContainer'
import './App.css'

function App() {
  return (
    <div className="App">
      <GameContainer />
    </div>
  )
}

export default App
```

#### 4.8 Update App.css

Replace `frontend/src/App.css`:

```css
#root {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1a1a1a;
}

.App {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-wrapper {
  width: 100%;
  max-width: 1200px;
  height: 100%;
  max-height: 900px;
  display: flex;
  justify-content: center;
  align-items: center;
}

#game-container {
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  margin: 0 auto;
}
```

#### 4.9 Update index.css

Replace `frontend/src/index.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #1a1a1a;
  overflow: hidden;
}

#root {
  width: 100vw;
  height: 100vh;
}
```

---

### Step 5: Backend Setup

#### 5.1 Create Backend Structure

```bash
cd ../../backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

#### 5.2 Create requirements.txt

Create `backend/requirements.txt`:

```
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.0.0
```

#### 5.3 Install Dependencies

```bash
pip install -r requirements.txt
```

#### 5.4 Create main.py

Create `backend/main.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sqlite3
from datetime import datetime
import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database initialization
def init_db():
    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            score INTEGER NOT NULL,
            level_reached INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Pydantic models
class ScoreSubmit(BaseModel):
    username: str
    score: int
    level_reached: int

class ScoreResponse(BaseModel):
    id: int
    username: str
    score: int
    level_reached: int
    created_at: str

# API endpoints
@app.get("/")
async def root():
    return {"message": "Jump Jump Jump API"}

@app.post("/api/scores", response_model=dict)
async def submit_score(score_data: ScoreSubmit):
    """Submit a new score to the database"""
    if not score_data.username or len(score_data.username.strip()) == 0:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO scores (username, score, level_reached) VALUES (?, ?, ?)",
        (score_data.username, score_data.score, score_data.level_reached)
    )

    conn.commit()
    score_id = cursor.lastrowid
    conn.close()

    return {
        "success": True,
        "message": "Score saved successfully",
        "id": score_id
    }

@app.get("/api/scores/leaderboard", response_model=List[ScoreResponse])
async def get_leaderboard(limit: int = 10):
    """Get top scores (leaderboard)"""
    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, username, score, level_reached, created_at
        FROM scores
        ORDER BY score DESC, level_reached DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "username": row[1],
            "score": row[2],
            "level_reached": row[3],
            "created_at": row[4]
        }
        for row in rows
    ]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Step 6: Create Automation Scripts

#### 6.1 Windows PowerShell Scripts

Create `scripts/start.ps1`:

```powershell
# Jump Jump Jump - Start Script (Windows PowerShell)

Write-Host "Starting Jump Jump Jump Game..." -ForegroundColor Cyan
Write-Host ""

# Get the project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Check if backend virtual environment exists
if (-not (Test-Path "backend\venv")) {
    Write-Host "Setting up backend virtual environment..." -ForegroundColor Yellow
    Set-Location backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Set-Location ..
    Write-Host "Backend setup complete!" -ForegroundColor Green
    Write-Host ""
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    .\venv\Scripts\Activate.ps1
    python main.py
}
Start-Sleep -Seconds 2
Write-Host "Backend running on http://localhost:8000 (Job ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host ""

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    npm run dev
}
Start-Sleep -Seconds 2
Write-Host "Frontend running on http://localhost:5173 (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Write-Host ""

# Save job IDs
$backendJob.Id | Out-File -FilePath ".backend.pid" -Encoding utf8
$frontendJob.Id | Out-File -FilePath ".frontend.pid" -Encoding utf8

Write-Host "Game is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "Game URL: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To stop the servers, run: .\scripts\stop.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 1
        $backendRunning = Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
        $frontendRunning = Get-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue

        if (-not $backendRunning -or -not $frontendRunning) {
            Write-Host "One or more servers stopped unexpectedly" -ForegroundColor Red
            break
        }
    }
}
finally {
    Write-Host ""
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    if (Test-Path ".backend.pid") { Remove-Item ".backend.pid" }
    if (Test-Path ".frontend.pid") { Remove-Item ".frontend.pid" }
}
```

Create `scripts/stop.ps1`:

```powershell
# Jump Jump Jump - Stop Script (Windows PowerShell)

Write-Host "Stopping Jump Jump Jump Game..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (Test-Path ".backend.pid") {
    $backendJobId = Get-Content ".backend.pid"
    $backendJob = Get-Job -Id $backendJobId -ErrorAction SilentlyContinue

    if ($backendJob) {
        Write-Host "Stopping backend server..." -ForegroundColor Yellow
        Stop-Job -Id $backendJobId
        Remove-Job -Id $backendJobId
        Write-Host "Backend stopped" -ForegroundColor Green
    }
    Remove-Item ".backend.pid"
}

if (Test-Path ".frontend.pid") {
    $frontendJobId = Get-Content ".frontend.pid"
    $frontendJob = Get-Job -Id $frontendJobId -ErrorAction SilentlyContinue

    if ($frontendJob) {
        Write-Host "Stopping frontend server..." -ForegroundColor Yellow
        Stop-Job -Id $frontendJobId
        Remove-Job -Id $frontendJobId
        Write-Host "Frontend stopped" -ForegroundColor Green
    }
    Remove-Item ".frontend.pid"
}

Get-Job | Stop-Job
Get-Job | Remove-Job

Write-Host ""
Write-Host "All servers stopped!" -ForegroundColor Green
```

#### 6.2 Unix/Linux/Mac Scripts

Create `scripts/start.sh`:

```bash
#!/bin/bash

echo "Starting Jump Jump Jump Game..."
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Setting up backend virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "Backend setup complete!"
    echo ""
fi

# Start backend server
echo "Starting backend server..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..
echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"
echo ""

sleep 2

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo "Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""

# Save PIDs
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo "Game is ready!"
echo ""
echo "Backend API: http://localhost:8000"
echo "Game URL: http://localhost:5173"
echo ""
echo "To stop the servers, run: ./scripts/stop.sh"
echo ""

wait
```

Create `scripts/stop.sh`:

```bash
#!/bin/bash

echo "Stopping Jump Jump Jump Game..."
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping backend server..."
        kill $BACKEND_PID
        echo "Backend stopped"
    fi
    rm .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "Stopping frontend server..."
        kill $FRONTEND_PID
        echo "Frontend stopped"
    fi
    rm .frontend.pid
fi

echo ""
echo "All servers stopped!"
```

Make scripts executable:

```bash
chmod +x scripts/start.sh scripts/stop.sh
```

---

### Step 7: Test Phase 0

#### 7.1 Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 7.2 Start the Application

```bash
# From project root
# Windows:
.\scripts\start.ps1

# Mac/Linux:
./scripts/start.sh
```

#### 7.3 Verify

1. Open browser to `http://localhost:5173`
2. You should see "JUMP JUMP JUMP!" title
3. Click "START GAME" - should see placeholder
4. Open `http://localhost:8000/docs` - should see API documentation
5. Press ESC to return to menu

#### 7.4 Stop Servers

```bash
# Windows:
.\scripts\stop.ps1

# Mac/Linux:
./scripts/stop.sh
```

---

## ✅ Phase 0 Complete!

You've successfully:
- ✅ Set up React + Phaser 3
- ✅ Created FastAPI backend
- ✅ Loaded game assets
- ✅ Created basic scenes
- ✅ Implemented automation scripts

**Next:** [Continue to Phase 1: Core Gameplay](#phase-1-core-gameplay)

---

## Phase 1: Core Gameplay

**Goal:** Implement complete campaign mode  
**Duration:** 4-6 hours

### Step 8: Create Input Manager

Create `frontend/src/game/managers/InputManager.ts`:

```typescript
import Phaser from 'phaser';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

export class InputManager {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  } | null = null;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupInputs();
  }

  private setupInputs(): void {
    // Keyboard
    if (this.scene.input.keyboard) {
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      this.wasdKeys = this.scene.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE
      }) as any;
    }

    // Gamepad
    this.scene.input.gamepad?.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
      this.gamepad = pad;
    });
  }

  public getInputState(): InputState {
    const state: InputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false
    };

    // Keyboard - Arrow keys
    if (this.cursors) {
      state.up = this.cursors.up?.isDown || false;
      state.down = this.cursors.down?.isDown || false;
      state.left = this.cursors.left?.isDown || false;
      state.right = this.cursors.right?.isDown || false;
      state.space = this.cursors.space?.isDown || false;
    }

    // Keyboard - WASD
    if (this.wasdKeys) {
      state.up = state.up || this.wasdKeys.w?.isDown || false;
      state.down = state.down || this.wasdKeys.s?.isDown || false;
      state.left = state.left || this.wasdKeys.a?.isDown || false;
      state.right = state.right || this.wasdKeys.d?.isDown || false;
      state.space = state.space || this.wasdKeys.space?.isDown || false;
    }

    // Gamepad
    if (this.gamepad) {
      const dpad = this.gamepad.buttons;
      state.up = state.up || dpad[12]?.pressed || false;
      state.down = state.down || dpad[13]?.pressed || false;
      state.left = state.left || dpad[14]?.pressed || false;
      state.right = state.right || dpad[15]?.pressed || false;
      state.space = state.space || dpad[0]?.pressed || false; // A button
    }

    return state;
  }
}
```

**Continue reading in Part 2...**

---

## Phase 3: Polish & Enhancement

**Goal:** Add audio, visual effects, settings, and UI polish  
**Duration:** 3-4 hours

### Recent Implementations (November 2025)

#### Step 30: Settings Menu with localStorage

**File:** `frontend/src/game/scenes/SettingsScene.ts`

```typescript
import Phaser from 'phaser';
import { MenuScene } from './MenuScene';

interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  initialized: boolean;
}

export class SettingsScene extends Phaser.Scene {
  private static musicVolume: number = 0.5;
  private static sfxVolume: number = 0.4;
  private static musicEnabled: boolean = true;
  private static sfxEnabled: boolean = true;
  private static initialized: boolean = false;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  // Static methods for cross-scene access
  public static initializeSettings(): void {
    if (!this.initialized) {
      this.loadSettings();
      this.initialized = true;
    }
  }

  public static loadSettings(): void {
    const saved = localStorage.getItem('jumpJumpJumpSettings');
    if (saved) {
      const settings: AudioSettings = JSON.parse(saved);
      this.musicVolume = settings.musicVolume ?? 0.5;
      this.sfxVolume = settings.sfxVolume ?? 0.4;
      this.musicEnabled = settings.musicEnabled ?? true;
      this.sfxEnabled = settings.sfxEnabled ?? true;
    }
  }

  public static saveSettings(): void {
    const settings: AudioSettings = {
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      musicEnabled: this.musicEnabled,
      sfxEnabled: this.sfxEnabled,
      initialized: true
    };
    localStorage.setItem('jumpJumpJumpSettings', JSON.stringify(settings));
  }

  // Getters and setters
  public static getMusicVolume(): number { return this.musicVolume; }
  public static getSfxVolume(): number { return this.sfxVolume; }
  public static isMusicEnabled(): boolean { return this.musicEnabled; }
  public static isSfxEnabled(): boolean { return this.sfxEnabled; }
  
  public static setMusicVolume(volume: number): void {
    this.musicVolume = volume;
    this.saveSettings();
    this.applyMusicSettings();
  }
  
  public static setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    this.saveSettings();
    this.applyMusicSettings();
  }

  private static applyMusicSettings(): void {
    const bgMusic = MenuScene.getBgMusic();
    if (bgMusic) {
      bgMusic.setVolume(this.musicVolume);
      if (this.musicEnabled && !bgMusic.isPlaying) {
        bgMusic.play();
      } else if (!this.musicEnabled && bgMusic.isPlaying) {
        bgMusic.pause();
      }
    }
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0x2c3e50).setOrigin(0);

    // Title
    this.add.text(width / 2, 80, 'SETTINGS', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Music controls
    this.createVolumeSlider(width / 2, 200, 'Music Volume', 
      SettingsScene.musicVolume, (vol) => SettingsScene.setMusicVolume(vol));
    
    this.createToggle(width / 2, 280, 'Music Enabled',
      SettingsScene.musicEnabled, (enabled) => SettingsScene.setMusicEnabled(enabled));

    // SFX controls
    this.createVolumeSlider(width / 2, 360, 'SFX Volume',
      SettingsScene.sfxVolume, (vol) => {
        SettingsScene.sfxVolume = vol;
        SettingsScene.saveSettings();
      });
    
    this.createToggle(width / 2, 440, 'SFX Enabled',
      SettingsScene.sfxEnabled, (enabled) => {
        SettingsScene.sfxEnabled = enabled;
        SettingsScene.saveSettings();
      });

    // Back button
    const backBtn = this.createButton(width / 2, height - 80, 'Back');
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private createVolumeSlider(x: number, y: number, label: string, 
    initialValue: number, onChange: (value: number) => void): void {
    // Implementation with draggable slider
    // See full code in SettingsScene.ts
  }

  private createToggle(x: number, y: number, label: string,
    initialState: boolean, onChange: (state: boolean) => void): void {
    // Implementation with toggle switch
    // See full code in SettingsScene.ts
  }

  private createButton(x: number, y: number, text: string): Phaser.GameObjects.Container {
    // Standard button creation
  }
}
```

**Key Features:**
- ✅ Static properties for cross-scene access
- ✅ localStorage persistence
- ✅ Draggable volume sliders (0-100%)
- ✅ Enable/disable toggles for music and SFX
- ✅ Real-time audio adjustments
- ✅ Settings loaded on PreloadScene

---

#### Step 31: Fire Blast Particle Effects

**File:** `frontend/src/game/entities/Player.ts`

Add fire particle effects to player feet:

```typescript
export class Player {
  private fireParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  private createFireEffect(): void {
    // Create particle texture
    if (!this.scene.textures.exists('fireParticle')) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xff6600);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture('fireParticle', 8, 8);
      graphics.destroy();
    }

    // Create emitter
    this.fireParticles = this.scene.add.particles(0, 0, 'fireParticle', {
      speed: { min: 50, max: 100 },
      angle: { min: 180, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 300,
      frequency: 30,
      tint: [0xff3300, 0xff6600, 0xff9900, 0xffcc00],
      blendMode: 'ADD',
      follow: this.sprite,
      followOffset: { x: 0, y: 12 },
      emitting: false
    });

    this.fireParticles.setDepth(this.sprite.depth - 1);
  }

  public update(inputState: InputState): void {
    // Enable fire particles when moving
    if (this.isMoving) {
      if (this.fireParticles && !this.fireParticles.emitting) {
        this.fireParticles.start();
      }
    } else {
      if (this.fireParticles && this.fireParticles.emitting) {
        this.fireParticles.stop();
      }
    }
  }
}
```

**Key Features:**
- ✅ Rocket-boost style fire effect
- ✅ Orange-red-yellow gradient
- ✅ Activates on movement, stops when idle
- ✅ Positioned at player feet
- ✅ ADD blend mode for glow

---

#### Step 32: Hyperspace Star Field Menu

**File:** `frontend/src/game/scenes/MenuScene.ts`

Add animated star field background:

```typescript
export class MenuScene extends Phaser.Scene {
  private stars: { x: number; y: number; z: number; graphics: Phaser.GameObjects.Graphics }[] = [];

  private createHyperspaceEffect(width: number, height: number): void {
    const numStars = 200;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < numStars; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.max(width, height);
      const z = Math.random() * 1000 + 1;
      
      const star = {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        z: z,
        graphics: this.add.graphics().setDepth(10)
      };
      
      this.stars.push(star);
    }
  }

  update(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const speed = 8;

    for (const star of this.stars) {
      star.z -= speed;

      if (star.z <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * Math.max(width, height);
        star.x = centerX + Math.cos(angle) * distance;
        star.y = centerY + Math.sin(angle) * distance;
        star.z = 1000;
      }

      // Perspective projection
      const k = 128 / star.z;
      const px = (star.x - centerX) * k + centerX;
      const py = (star.y - centerY) * k + centerY;
      const size = (1 - star.z / 1000) * 3;
      const alpha = Math.min(1, (1000 - star.z) / 500);

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        star.graphics.clear();
        star.graphics.fillStyle(0xffffff, alpha);
        star.graphics.fillCircle(px, py, size);

        // Draw motion trail
        const prevK = 128 / (star.z + speed);
        const prevPx = (star.x - centerX) * prevK + centerX;
        const prevPy = (star.y - centerY) * prevK + centerY;
        
        star.graphics.lineStyle(size, 0xffffff, alpha * 0.5);
        star.graphics.lineBetween(prevPx, prevPy, px, py);
      }
    }
  }
}
```

**Key Features:**
- ✅ 200 animated stars
- ✅ 3D perspective projection
- ✅ Motion trails for speed effect
- ✅ Infinite looping
- ✅ Depth layering (behind UI)

---

#### Step 33: Custom Level Pagination

**File:** `frontend/src/game/scenes/CustomLevelSelectScene.ts`

Add pagination (8 levels per page):

```typescript
export class CustomLevelSelectScene extends Phaser.Scene {
  private currentPage: number = 0;
  private levelsPerPage: number = 8;

  private displayLevels(): void {
    const totalPages = Math.ceil(this.levels.length / this.levelsPerPage);
    const startIndex = this.currentPage * this.levelsPerPage;
    const endIndex = Math.min(startIndex + this.levelsPerPage, this.levels.length);
    const levelsToDisplay = this.levels.slice(startIndex, endIndex);

    // Display levels...

    // Page indicator
    this.add.text(width / 2, height - 120, 
      `Page ${this.currentPage + 1} of ${totalPages}`, 
      { fontSize: '20px', color: '#ecf0f1' }
    ).setOrigin(0.5);

    // Navigation buttons
    if (this.currentPage > 0) {
      const prevBtn = this.createButton(width / 2 - 150, height - 120, '< Previous');
      prevBtn.on('pointerdown', () => {
        this.currentPage--;
        this.scene.restart();
      });
    }

    if (this.currentPage < totalPages - 1) {
      const nextBtn = this.createButton(width / 2 + 150, height - 120, 'Next >');
      nextBtn.on('pointerdown', () => {
        this.currentPage++;
        this.scene.restart();
      });
    }
  }
}
```

**Key Features:**
- ✅ 8 levels per page
- ✅ Previous/Next navigation
- ✅ Page indicator
- ✅ Automatic page calculation
- ✅ Clean level card layout

---

#### Step 34: Level Name Editing

**File:** `frontend/src/game/scenes/CustomLevelSelectScene.ts` and `backend/main.py`

**Frontend:**
```typescript
private editLevelName(level: CustomLevel): void {
  // Create modal dialog with input field
  const input = document.createElement('input');
  input.value = level.name;
  // Position and style input...
  
  // Save button handler
  saveBtn.on('pointerdown', async () => {
    const newName = input.value.trim();
    if (newName && newName !== level.name) {
      await this.updateLevelName(level.id, newName);
      this.scene.restart();
    }
  });
}

private async updateLevelName(levelId: string, newName: string): Promise<boolean> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LEVELS}/${levelId}/name`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    }
  );
  return response.ok;
}
```

**Backend (`backend/main.py`):**
```python
class UpdateLevelName(BaseModel):
    name: str

@app.patch("/api/levels/{level_id}/name")
async def update_level_name(level_id: str, update: UpdateLevelName):
    if not update.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE custom_levels SET name = ?, updated_at = ? WHERE id = ?",
        (update.name, datetime.now().isoformat(), level_id)
    )
    conn.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Level not found")
    
    return {"message": "Level name updated", "name": update.name}
```

**Key Features:**
- ✅ Modal dialog for editing
- ✅ HTML input with styling
- ✅ Backend PATCH endpoint
- ✅ Database update with timestamp
- ✅ UI refresh after save

---

### Testing Phase 3 Features

```bash
# Start servers
.\scripts\start.ps1  # Windows
./scripts/start.sh   # Mac/Linux

# Test checklist:
- [ ] Settings menu accessible from main menu
- [ ] Volume sliders adjust audio in real-time
- [ ] Settings persist after browser reload
- [ ] Fire particles appear when player moves
- [ ] Hyperspace stars animate on menu
- [ ] Custom levels paginate (8 per page)
- [ ] Level names can be edited
- [ ] ESC returns to menu from editor
```

---

## ✅ Phase 3 Progress Complete!

You've successfully implemented:
- ✅ Settings menu with localStorage
- ✅ Background music and sound effects
- ✅ Fire blast particle effects
- ✅ Hyperspace star field animation
- ✅ Custom level pagination
- ✅ Level name editing with backend sync
- ✅ UI/UX polish (score persistence, visual parity, etc.)

**Remaining Phase 3 Tasks:**
- [ ] Tutorial system
- [ ] Pause functionality
- [ ] Help/instructions screen
- [ ] Additional particle effects (collision, goal)

---

*Tutorial continues with Steps 9-30 covering Player entity, Vehicle system, Level Manager, Scoring, and more...*

*Due to length constraints, this tutorial would continue in additional parts. Would you like me to continue with the next sections?*
