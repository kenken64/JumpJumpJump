# Jump Jump Jump! 🚗🏃

A Frogger-style platformer game built with Phaser 3, React, and TypeScript.

## Features

### Game Modes
- **Campaign Mode**: Progressive difficulty with 10+ levels
- **Custom Levels**: Play community-created levels
- **Level Editor**: Create your own custom levels!

### Gameplay Features
- **Progressive Difficulty System**: 10+ levels with increasing challenge
- **Multiple Difficulty Tiers**: Easy (1-3), Medium (4-6), Hard (7-9), Expert (10+)
- **Dual Input Support**: Play with keyboard or game controller
- **Smooth Animations**: Character walking, idle, and fall states
- **Dynamic Traffic System**: More lanes and faster vehicles as you progress
- **Score Multipliers**: Higher scores on harder levels
- **Level Transitions**: Visual feedback when advancing to next level
- **Responsive**: Automatically scales to fit your screen

### Level Editor Features
- **Visual Editor**: Drag-and-drop level creation
- **Lane Configuration**: Set speed, direction, and vehicle type
- **Real-time Preview**: See your level as you build
- **Save/Load System**: Store levels in browser
- **Test Mode**: Play your levels instantly
- **Custom Difficulty**: Create levels from easy to impossible

## Controls

### Keyboard
- **Arrow Keys** or **WASD**: Move character
- **Space**: Restart game (when game over)
- **ESC**: Pause (future feature)

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

## Quick Start

### Mac/Linux

```bash
# Start both frontend and backend
./start.sh

# Stop all servers
./stop.sh
```

### Windows PowerShell

```powershell
# Start both frontend and backend
.\start.ps1

# Stop all servers
.\stop.ps1
```

## Manual Installation & Running

### Frontend Setup

```bash
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

## API Endpoints

- `POST /api/scores` - Submit a new score
- `GET /api/scores/leaderboard?limit=10` - Get top scores
- `GET /api/scores/user/{username}?limit=5` - Get user's scores
- `GET /` - Health check

View the leaderboard at: `http://localhost:8000/api/scores/leaderboard`

## Project Structure

```
src/
├── game/
│   ├── scenes/
│   │   ├── PreloadScene.ts    # Asset loading
│   │   └── MainGameScene.ts   # Main game logic
│   ├── entities/
│   │   ├── Player.ts          # Player character
│   │   └── Vehicle.ts         # Traffic vehicles
│   ├── managers/
│   │   ├── InputManager.ts    # Keyboard + Gamepad handling
│   │   └── LevelManager.ts    # Level progression & difficulty
│   └── config.ts              # Phaser configuration
├── components/
│   └── GameContainer.tsx      # React wrapper for Phaser
├── App.tsx                    # Main React app
└── App.css                    # Styling

public/
└── assets/
    ├── spritesheet_complete.png  # Game sprites
    └── spritesheet_complete.xml  # Sprite atlas definition
```

## Technologies Used

- **Phaser 3**: Game engine
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Zustand**: State management (for future features)

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

**See LEVEL_EDITOR.md for complete guide**

## Asset Credits

Sprites from **Kenney.nl** (Pixel Car Pack)
- License: Creative Commons Zero (CC0)
- Free for personal, educational, and commercial use

## Future Enhancements

- Sound effects and music
- Power-ups and bonuses
- Multiple difficulty levels
- Leaderboard/high scores
- Additional character selection
- More lane types (rivers, logs, etc.)
- Mobile touch controls

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
