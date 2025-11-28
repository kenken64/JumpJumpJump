# JumpJumpJump 🎮

[![JumpJumpJump Gameplay](https://img.youtube.com/vi/zEqMF7u_XrI/0.jpg)](https://youtu.be/zEqMF7u_XrI)

A web-based platformer game built with React, Phaser, and FastAPI featuring online leaderboards and procedurally generated levels!

## ✨ Features

- 🎮 **Two Game Modes**: Level progression or endless mode
- 🏆 **Online Leaderboards**: Compete with players worldwide (paginated - 6 records per page)
- 💰 **Shop System**: Buy weapons and character skins
- 👾 **Enemy AI**: Multiple enemy types with difficulty scaling
- 🎯 **Combat System**: Multiple weapons (raygun, laser, sword)
- 💎 **Power-ups**: Speed boost, shield, extra lives
- 🐲 **Boss System**: 24 unique bosses on every 5th level with intelligent rotation
- 🖼️ **Boss Gallery**: View all 24 notorious bosses with pagination (8 per page)
- 👤 **Player Names**: Custom player name system for personalized tracking
- 📊 **Score Tracking**: Comprehensive scoring system (coins, enemies, distance)
- 🎨 **Procedural Generation**: Grid-based platform spawning with 7 Y-levels
- 🔧 **Debug Mode**: F3 toggle with god mode, flight, and FPS display
- 🌐 **Railway Deployment**: Docker-ready for production deployment

## 📁 Project Structure

```
JumpJumpJump/
├── frontend/           # React + Phaser game client
│   ├── src/
│   │   ├── scenes/    # Game, Menu, Leaderboard, Shop, Inventory, BossGallery scenes
│   │   └── services/  # API communication layer
│   ├── assets/        # Kenney asset packs
│   ├── Dockerfile     # Multi-stage Docker build
│   ├── nginx.conf     # Production Nginx config
│   └── railway.json   # Railway deployment config
├── backend/           # FastAPI + SQLite backend
│   ├── main.py       # API endpoints (scores + bosses)
│   ├── game.db       # SQLite database
│   └── requirements.txt
├── scripts/          # Start/stop automation scripts
└── PRPs/            # Project documentation
```

## 🚀 Getting Started

### Quick Start (Recommended)

Use the provided scripts to start both frontend and backend:

```powershell
# Windows PowerShell
.\scripts\start.ps1    # Start all services
.\scripts\stop.ps1     # Stop all services

# Windows Command Prompt
.\scripts\start.bat
.\scripts\stop.bat
```

Services will be available at:
- **🎮 Game**: http://localhost:3000 (or :5173)
- **🔧 Backend API**: http://localhost:8000
- **📚 API Docs**: http://localhost:8000/docs

### Manual Setup

#### Frontend Setup
```powershell
cd frontend
pnpm install          # Install dependencies
cp .env.example .env  # Copy environment config
pnpm dev              # Start dev server
```

#### Backend Setup
```powershell
cd backend
python -m venv venv                    # Create virtual environment
.\venv\Scripts\Activate.ps1            # Activate (Windows)
pip install -r requirements.txt        # Install dependencies
python -m uvicorn main:app --reload    # Start server
```

### Environment Variables

Create `frontend/.env`:
```bash
VITE_API_BASE_URL=http://localhost:8000
# For production: https://your-backend.railway.app
```

## 🐳 Docker & Railway Deployment

### Local Docker Testing
```bash
cd frontend
docker build -t jumpjumpjump-frontend .
docker run -p 8080:80 jumpjumpjump-frontend
# Visit http://localhost:8080
```

### Deploy to Railway
1. Push code to GitHub
2. Create Railway project from repo
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_BASE_URL=<your-backend-url>`
5. Deploy automatically

See `frontend/RAILWAY.md` for detailed deployment guide.

## 🛠️ Technologies

### Frontend
- **React** 19.2.0 - UI framework
- **Phaser** 3.90.0 - Game engine with Arcade Physics
- **Vite** 5.4.21 - Build tool and dev server
- **TypeScript** 5.9.3 - Type-safe JavaScript

### Backend
- **FastAPI** - High-performance Python API framework
- **SQLite** - Embedded database for scores
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

### Deployment
- **Docker** - Multi-stage builds with Nginx
- **Railway** - Cloud platform deployment
- **Nginx** - Production static file server

### Assets
- **Kenney Asset Packs** - All game sprites and tiles
  - Platformer Art (Extended + Requests)
  - Sci-Fi RTS Pack
  - UI Pack Space Expansion
  - Planets Pack

## 📚 Project Documentation (PRPs)

Detailed technical documentation is available in both English and Chinese:

| Topic | English | 中文 |
|-------|---------|------|
| ML AI Implementation | [ML-AI-Implementation.md](PRPs/ML-AI-Implementation.md) | [ML-AI-Implementation_cn.md](PRPs/ML-AI-Implementation_cn.md) |
| Core Game Mechanics | [Core-Game-Mechanics-World-Generation.md](PRPs/Core-Game-Mechanics-World-Generation.md) | [Core-Game-Mechanics-World-Generation_cn.md](PRPs/Core-Game-Mechanics-World-Generation_cn.md) |
| Boss Gallery System | [Boss-Gallery-System.md](PRPs/Boss-Gallery-System.md) | [Boss-Gallery-System_cn.md](PRPs/Boss-Gallery-System_cn.md) |
| Player Movement & Combat | [Player-Movement-Combat-System.md](PRPs/Player-Movement-Combat-System.md) | [Player-Movement-Combat-System_cn.md](PRPs/Player-Movement-Combat-System_cn.md) |
| Gamepad Controls | [Gamepad-Controls-Enhancement.md](PRPs/Gamepad-Controls-Enhancement.md) | [Gamepad-Controls-Enhancement_cn.md](PRPs/Gamepad-Controls-Enhancement_cn.md) |
| Railway Deployment | [Railway-Deployment-Infrastructure.md](PRPs/Railway-Deployment-Infrastructure.md) | [Railway-Deployment-Infrastructure_cn.md](PRPs/Railway-Deployment-Infrastructure_cn.md) |
| Local Co-op | [Local-Coop-Implementation.md](PRPs/Local-Coop-Implementation.md) | [Local-Coop-Implementation_cn.md](PRPs/Local-Coop-Implementation_cn.md) |

## 🎮 Game Controls

| Action | Keys |
|--------|------|
| **Move Left/Right** | Arrow Keys or A/D |
| **Jump** | Space or W |
| **Shoot** | Mouse Click |
| **Aim** | Mouse Position |
| **Teleport to Level** | F4 (debug) |
| **Clear Defeated Bosses** | F5 (debug) |
| **Debug Mode** | F3 or Shift+D |
| **Test Game Over** | F8 (debug) |
| **Exit to Menu** | ESC (saves score) |

### Debug Mode Features
- 🛡️ God mode (no damage)
- ✈️ Flight mode (W/S for vertical movement)
- 🏃 2x speed
- 📊 FPS and coordinate display
- 🔍 Physics body visualization

## 📊 API Endpoints

The backend provides RESTful API endpoints:

### Scores
- `POST /api/scores` - Submit new score
- `GET /api/scores/leaderboard` - Get top scores (with mode filtering & pagination support)
- `GET /api/scores/player/{name}` - Player high score
- `GET /api/scores/rank/{score}` - Get rank for score

### Bosses
- `GET /api/bosses` - Get all 24 boss data (names, titles, frame positions)

See `backend/README.md` for detailed API documentation.

## 🎯 Scoring System

| Action | Points |
|--------|--------|
| Coins | 10 pts |
| Small Enemy | 50 pts |
| Medium Enemy | 100 pts |
| Large Enemy | 200 pts |
| Boss Enemy | 1000 pts |
| Distance | 1 pt/meter |

## 🐲 Boss System

### Boss Mechanics
- **24 Unique Bosses**: Each with notorious names and titles stored in database
- **Boss Spawning**: Appears on every 5th level (5, 10, 15, 20, etc.)
- **Boss Scaling**: 1x player size, hovers above ground without gravity
- **Boss Health**: 50 + (level × 20) HP, takes 10 damage per bullet
- **Smart Rotation**: If a boss is defeated, the next undefeated boss spawns instead
- **Player-Specific Tracking**: Boss defeats tracked per player using localStorage
- **Gallery View**: Boss gallery scene displays all 24 bosses with pagination (8 per page)

### Boss Names Examples
- "Vortex Reaper - The Dimensional Destroyer"
- "Shadow Tyrant - The Eclipse Bringer"
- "Inferno Warlord - The Scorched Earth Commander"

### Debug Features
- **F4**: Teleport to specific level (useful for testing boss spawns)
- **F5**: Clear all defeated bosses for current player

## 🔧 Development Notes

- **Package Manager**: Use `pnpm` for frontend (not npm due to cache issues)
- **Server Management**: Always use scripts in `scripts/` folder
- **Git**: May need full path `"C:\Program Files\Git\bin\git.exe"` if not in PATH
- **Debug Mode**: Press F3 to toggle, automatically resets on level completion
- **Platform Spawning**: 7 Y-levels (300, 370, 440, 510, 580, 650, ground)
- **Hitboxes**: Solid blocks use 95% size, thin platforms use 80% height
- **Boss Spritesheet**: 1024x1024 PNG with 256x256 frames (4×6 grid = 24 bosses)
- **Boss Index Calculation**: `Math.floor((level / 5) - 1) % 24`
- **localStorage Keys**:
  - `player_name` - Current player name
  - `{playerName}_boss_{bossIndex}` - Boss defeat tracking
  - `playerCoins` - Coin balance
  - `defeatedBossLevels` - Session-based tracking

## 📝 License

All game assets are from Kenney (www.kenney.nl) and are licensed under CC0 1.0 Universal.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally using `.\scripts\start.ps1`
5. Commit with descriptive messages
6. Push and create a Pull Request

## 📧 Contact

For issues or questions, please open an issue on GitHub
