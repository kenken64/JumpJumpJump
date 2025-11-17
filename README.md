# Jump Jump Jump! 🚗🏃

A Frogger-style platformer game built with Phaser 3, React, and TypeScript. Navigate through increasingly challenging traffic levels, create your own custom levels, and compete on the leaderboard!

[![License: CC0](https://img.shields.io/badge/License-CC0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Phaser 3](https://img.shields.io/badge/Phaser-3.90.0-blue.svg)](https://phaser.io/)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)

## 📋 Table of Contents

- [Features](#features)
- [Documentation](#-documentation)
- [Quick Start](#quick-start)
- [Manual Installation & Running](#manual-installation--running)
- [Testing](#-testing)
- [Controls](#controls)
- [How to Play](#how-to-play)
- [Difficulty Progression](#difficulty-progression)
- [Level Editor](#level-editor)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Development Status](#development-status)
- [Asset Credits](#asset-credits)
- [License](#license)

## Features

### Game Modes
- **Campaign Mode**: Progressive difficulty with 10+ levels
- **Custom Levels**: Play community-created levels with pagination (8 per page)
- **Level Editor**: Create your own custom levels!

### Gameplay Features
- **Progressive Difficulty System**: 10+ levels with increasing challenge
- **Multiple Difficulty Tiers**: Easy (1-3), Medium (4-6), Hard (7-9), Expert (10+)
- **Dual Input Support**: Play with keyboard or game controller
- **Smooth Animations**: Character walking, idle, and fall states
- **Fire Blast Effects**: Dynamic particle effects from player feet when moving
- **Dynamic Traffic System**: More lanes and faster vehicles as you progress
- **Score Multipliers**: Higher scores on harder levels
- **Level Transitions**: Visual feedback when advancing to next level
- **Persistent Settings**: Audio preferences saved to browser storage
- **Hyperspace Menu**: Animated star field effect on main menu
- **Responsive**: Automatically scales to fit your screen

### Audio & Visual Effects
- **Background Music**: Looping soundtrack with volume control
- **Sound Effects**: Walking sounds and car engine audio
- **Settings Menu**: Adjust music/SFX volume and enable/disable audio
- **Fire Particles**: Rocket-boost style effects when player moves
- **Hyperspace Background**: 200 animated stars creating space travel effect

### Level Editor Features
- **Visual Editor**: Drag-and-drop level creation
- **Lane Configuration**: Set speed, direction, and vehicle type
- **Real-time Preview**: See your level as you build
- **Save/Load System**: Store levels in browser with backend sync
- **Level Name Editing**: Rename levels with modal dialog interface
- **Pagination**: Browse levels 8 at a time with Previous/Next navigation
- **Test Mode**: Play your levels instantly
- **Custom Difficulty**: Create levels from easy to impossible
- **ESC Navigation**: Quick return to menu from editor and level select

### Controls

### Keyboard
- **Arrow Keys** or **WASD**: Move character
- **Space**: Restart game (when game over)
- **ESC**: Return to menu (from editor/custom levels)

### Game Controller
- **D-Pad** or **Left Analog Stick**: Move character
- **A Button** (Xbox) / **Cross** (PlayStation): Restart game
- **Start Button**: Pause (future feature)

## How to Play

1. Guide your character from the bottom to the goal at the top
2. Avoid the moving vehicles in the traffic lanes
3. Reach the goal 3 times to advance to the next level
4. Each level increases difficulty with more lanes, faster cars, and more frequent spawns
5. Score multipliers increase with each level
6. You have 3 lives - don't get hit!
7. Try to reach the highest level possible!

## Difficulty Progression

### Easy (Levels 1-3)
- 5-7 lanes
- Speed: 50-110 pixels/second
- Spawn interval: 2.4-4.2 seconds
- Score multiplier: 1x-3x

### Medium (Levels 4-6)
- 7-9 lanes
- Speed: 120-190 pixels/second
- Spawn interval: 1.8-3.2 seconds
- Score multiplier: 4x-6x

### Hard (Levels 7-9)
- 8 lanes
- Speed: 220-320 pixels/second
- Spawn interval: 1.3-2.5 seconds
- Score multiplier: 7x-9x

### Expert (Level 10+)
- 8 lanes
- Speed: 350+ pixels/second
- Spawn interval: 0.8-1.5 seconds
- Score multiplier: 20x+
- INSANE MODE!

## 📚 Documentation

Comprehensive documentation is available to help you understand and build this project:

- **[Project Requirements & Planning (PRPs)](./PRPs/README.md)** - Complete project documentation broken into phases
- **[Step-by-Step Tutorial](./TUTORIAL_COMPLETE.md)** - Build the game from scratch, code by code
- **[Level Editor Guide](./frontend/LEVEL_EDITOR.md)** - Complete level editor documentation
- **[Game Flow](./GAME_FLOW.md)** - Detailed game mechanics and flow

### Quick Links to PRP Phases
- [Phase 0: Foundation](./PRPs/Phase_0_Foundation.md) - Project setup & basic gameplay
- [Phase 1: Core Gameplay](./PRPs/Phase_1_Core_Gameplay.md) - Campaign mode & progression
- [Phase 2: Level Editor](./PRPs/Phase_2_Level_Editor.md) - Custom level creation
- [Phase 3: Polish & Enhancement](./PRPs/Phase_3_Polish_Enhancement.md) - Sound, effects, and UI

## Quick Start

### Mac/Linux

```bash
# Start both frontend and backend
./scripts/start.sh

# Stop all servers
./scripts/stop.sh
```

### Windows PowerShell

```powershell
# Start both frontend and backend
.\scripts\start.ps1

# Stop all servers
.\scripts\stop.ps1
```

## Manual Installation & Running

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+
- Git

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The game will be available at `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The API will be available at `http://localhost:8000`

## 🧪 Testing

Comprehensive test suites are available for both frontend and backend with 280+ test cases.

### Quick Test Commands

**Frontend Tests:**
```bash
cd frontend
npm test                    # Run tests (watch mode)
npm run test:ui            # Run with interactive UI
npm run test:coverage      # Run with coverage report
```

**Backend Tests:**
```bash
cd backend
pytest                     # Run all tests
pytest -v                  # Run with verbose output
pytest --cov=. --cov-report=html  # Run with coverage
```

**Run All Tests:**
```powershell
# Windows
.\scripts\run-tests.ps1

# Unix/Linux/Mac
./scripts/run-tests.sh
```

### Test Coverage

- **Frontend**: 230+ tests covering LevelManager, API config, custom levels
  - LevelManager: 100% coverage (200+ tests)
  - API Config: 100% coverage
  - Custom Level Types: 100% coverage

- **Backend**: 50+ tests covering all API endpoints
  - Score submission: 10+ tests with validation
  - Leaderboard: 10+ tests with sorting
  - User scores: 6+ tests
  - Database operations: Full coverage

**For detailed testing guide, see [TESTING.md](./TESTING.md)**

## API Endpoints

- `POST /api/scores` - Submit a new score
- `GET /api/scores/leaderboard?limit=10` - Get top scores
- `GET /api/scores/user/{username}?limit=5` - Get user's scores
- `GET /` - Health check

View the leaderboard at: `http://localhost:8000/api/scores/leaderboard`

## Project Structure

```
JumpJumpJump/
├── frontend/                       # React + Phaser frontend
│   ├── src/
│   │   ├── game/
│   │   │   ├── scenes/
│   │   │   │   ├── PreloadScene.ts         # Asset loading
│   │   │   │   ├── MenuScene.ts            # Main menu with hyperspace effect
│   │   │   │   ├── MainGameScene.ts        # Campaign mode
│   │   │   │   ├── SettingsScene.ts        # Audio settings with persistence
│   │   │   │   ├── LevelEditorScene.ts     # Level editor
│   │   │   │   ├── CustomLevelSelectScene.ts # With pagination
│   │   │   │   └── CustomGameScene.ts      # Custom level play
│   │   │   ├── entities/
│   │   │   │   ├── Player.ts               # Player character
│   │   │   │   └── Vehicle.ts              # Traffic vehicles
│   │   │   ├── managers/
│   │   │   │   ├── InputManager.ts         # Keyboard + Gamepad
│   │   │   │   └── LevelManager.ts         # Level progression
│   │   │   ├── types/
│   │   │   │   └── CustomLevel.ts          # Level type definitions
│   │   │   ├── config.ts                   # Phaser configuration
│   │   │   └── apiConfig.ts                # Backend API config
│   │   ├── components/
│   │   │   └── GameContainer.tsx           # React wrapper
│   │   ├── App.tsx                         # Main React app
│   │   └── main.tsx                        # Entry point
│   ├── public/
│   │   └── assets/                         # Game sprites
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                        # FastAPI backend
│   ├── main.py                     # API server
│   ├── requirements.txt            # Python dependencies
│   └── README.md                   # Backend documentation
│
├── scripts/                        # Automation scripts
│   ├── start.ps1                   # Windows start script
│   ├── start.sh                    # Unix start script
│   ├── stop.ps1                    # Windows stop script
│   └── stop.sh                     # Unix stop script
│
├── PRPs/                           # Project Requirements & Planning
│   ├── README.md                   # PRP master index
│   ├── JumpJumpJump_PRP.md        # Complete project requirements
│   ├── Phase_0_Foundation.md       # Phase 0 documentation
│   ├── Phase_1_Core_Gameplay.md    # Phase 1 documentation
│   ├── Phase_2_Level_Editor.md     # Phase 2 documentation
│   └── Phase_3_Polish_Enhancement.md
│
├── TUTORIAL_COMPLETE.md            # Step-by-step tutorial
├── GAME_FLOW.md                    # Game mechanics guide
└── README.md                       # This file
```

## Technologies Used

### Frontend
- **Phaser 3.90.0**: Game engine with arcade physics
- **React 19.2.0**: UI framework
- **TypeScript 5.9.3**: Type safety
- **Vite 5.4.21**: Build tool and dev server with HMR
- **Zustand 5.0.8**: State management

### Backend
- **FastAPI 0.104.0+**: Modern Python web framework
- **Uvicorn 0.24.0+**: ASGI server
- **SQLite 3**: Serverless database for scores
- **Pydantic 2.0.0+**: Data validation

## Game Mechanics

### Player Movement
- Grid-based movement (32px increments)
- Smooth interpolation between grid cells
- Automatic boundary clamping

### Level Progression
- Reach the goal 3 times per level
- Each level increases difficulty dynamically
- Background color changes with difficulty tier
- Level intro/outro screens with difficulty info
- Score multipliers increase with level

### Traffic System
- 5-8 lanes depending on level
- Alternating traffic directions
- Dynamic vehicle spawning based on level
- Vehicle speeds increase with difficulty
- 15+ different vehicle types unlock as you progress

### Collision Detection
- Real-time AABB collision checks
- Lives system with respawn
- Goal detection for scoring and level advancement

## Level Editor

Create your own custom levels with the built-in level editor!

### Features
- Add up to 8 traffic lanes
- Configure vehicle type, speed, and direction for each lane
- Adjust spawn intervals for traffic density
- Real-time preview of your level
- Save levels to browser storage
- Test levels instantly
- Share levels (coming soon!)

### Quick Start
1. Select "Level Editor" from main menu
2. Click "+ Add Lane" to add traffic lanes
3. Click on lanes to edit properties
4. Use +/- buttons to adjust speed
5. Click "Test Level" to play immediately
6. Click "Save Level" to store permanently

**See [frontend/LEVEL_EDITOR.md](./frontend/LEVEL_EDITOR.md) for complete guide**

## Asset Credits

Sprites from **Kenney.nl** (Pixel Car Pack)
- License: Creative Commons Zero (CC0)
- Free for personal, educational, and commercial use

## Development Status

### ✅ Completed (Phases 0-3)
- ✅ Project setup with React, Phaser, TypeScript, FastAPI
- ✅ Player movement with keyboard and gamepad support
- ✅ Vehicle system with 15+ vehicle types
- ✅ Campaign mode with 10+ progressive levels
- ✅ Difficulty tiers (Easy, Medium, Hard, Expert)
- ✅ Scoring system with multipliers
- ✅ Level editor with visual interface
- ✅ Custom level save/load/play/edit
- ✅ Custom level pagination (8 per page)
- ✅ Backend API with leaderboard and level management
- ✅ Sound effects and background music
- ✅ Settings menu with localStorage persistence
- ✅ Fire blast particle effects
- ✅ Hyperspace star field animation on menu
- ✅ Level name editing with backend sync
- ✅ ESC key navigation
- ✅ Score and lives persistence between levels
- ✅ Automation scripts for starting/stopping servers

### 🚧 In Progress (Phase 3 Polish)
- 🔄 Tutorial system for new players
- 🔄 Pause functionality
- 🔄 Help/instructions screen
- 🔄 Additional particle effects for collisions

### 📋 Planned (Phases 4-5)
- Power-ups and bonuses
- Additional character selection
- More lane types (rivers, logs, etc.)
- Mobile touch controls
- Multiplayer mode
- Achievement system
- Level sharing via cloud

**For detailed roadmap, see [PRPs/README.md](./PRPs/README.md)**

## Development

The game uses a clean separation between React (UI) and Phaser (game logic):

- React handles the container and future menu systems
- Phaser manages all game rendering and physics
- InputManager provides unified input abstraction
- Communication through events (can be extended)

## License

This project uses CC0 licensed assets from Kenney.nl.
Game code is available for educational purposes.

---

Built with Phaser and React
