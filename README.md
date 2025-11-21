# JumpJumpJump 🎮

A web-based platformer game built with React, Phaser, and FastAPI featuring online leaderboards and procedurally generated levels!

## ✨ Features

- 🎮 **Two Game Modes**: Level progression or endless mode
- 🏆 **Online Leaderboards**: Compete with players worldwide
- 💰 **Shop System**: Buy weapons and character skins
- 👾 **Enemy AI**: Multiple enemy types with difficulty scaling
- 🎯 **Combat System**: Multiple weapons (raygun, laser, sword)
- 💎 **Power-ups**: Speed boost, shield, extra lives
- 📊 **Score Tracking**: Comprehensive scoring system (coins, enemies, distance)
- 🎨 **Procedural Generation**: Grid-based platform spawning with 7 Y-levels
- 🔧 **Debug Mode**: F3 toggle with god mode, flight, and FPS display
- 🌐 **Railway Deployment**: Docker-ready for production deployment

## 📁 Project Structure

```
JumpJumpJump/
├── frontend/           # React + Phaser game client
│   ├── src/
│   │   ├── scenes/    # Game, Menu, Leaderboard, Shop scenes
│   │   └── services/  # API communication layer
│   ├── assets/        # Kenney asset packs
│   ├── Dockerfile     # Multi-stage Docker build
│   ├── nginx.conf     # Production Nginx config
│   └── railway.json   # Railway deployment config
├── backend/           # FastAPI + SQLite backend
│   ├── main.py       # API endpoints
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

## 🎮 Game Controls

| Action | Keys |
|--------|------|
| **Move Left/Right** | Arrow Keys or A/D |
| **Jump** | Space or W |
| **Shoot** | Mouse Click |
| **Aim** | Mouse Position |
| **Debug Mode** | F3 or Shift+D |
| **Test Game Over** | F8 (debug) |

### Debug Mode Features
- 🛡️ God mode (no damage)
- ✈️ Flight mode (W/S for vertical movement)
- 🏃 2x speed
- 📊 FPS and coordinate display
- 🔍 Physics body visualization

## 📊 API Endpoints

The backend provides RESTful API endpoints:

- `POST /api/scores` - Submit new score
- `GET /api/scores/leaderboard` - Get top scores (with filtering)
- `GET /api/scores/player/{name}` - Player high score
- `GET /api/scores/rank/{score}` - Get rank for score

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

## 🔧 Development Notes

- **Package Manager**: Use `pnpm` for frontend (not npm due to cache issues)
- **Server Management**: Always use scripts in `scripts/` folder
- **Git**: May need full path `"C:\Program Files\Git\bin\git.exe"` if not in PATH
- **Debug Mode**: Press F3 to toggle, automatically resets on level completion
- **Platform Spawning**: 7 Y-levels (300, 370, 440, 510, 580, 650, ground)
- **Hitboxes**: Solid blocks use 95% size, thin platforms use 80% height

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
