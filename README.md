# JumpJumpJump

A web-based platformer game built with React, Phaser, and FastAPI featuring online leaderboards!

## Features

- 🎮 **Two Game Modes**: Level progression or endless mode
- 🏆 **Online Leaderboards**: Compete with players worldwide
- 💰 **Shop System**: Buy weapons and character skins
- 👾 **Enemy AI**: Multiple enemy types with difficulty scaling
- 🎯 **Combat System**: Multiple weapons (raygun, laser, sword)
- 💎 **Power-ups**: Speed boost, shield, extra lives
- 📊 **Score Tracking**: Comprehensive scoring system
- 🎨 **Procedural Generation**: Infinite world with multiple biomes

## Project Structure

- **frontend/** - React + Phaser game client (Vite + TypeScript)
- **backend/** - FastAPI server with SQLite database for scores
- **scripts/** - Start/stop scripts for development
- **PRPs/** - Project documentation

## Getting Started

### Quick Start

Use the provided scripts to start both frontend and backend:

```powershell
# Start both services
.\scripts\start.ps1

# Stop all services
.\scripts\stop.ps1
```

Services will be available at:
- **Game**: http://localhost:3000 (or :5173)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Manual Setup

#### Frontend
```powershell
cd frontend
pnpm install
pnpm dev
```

#### Backend
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

## Technologies

- **Frontend**: React 19.2.0, Phaser 3.90.0, Vite 5.4.21, TypeScript 5.9.3
- **Backend**: FastAPI, SQLite, Pydantic
- **Package Manager**: pnpm (frontend)

## Game Controls

- **Movement**: Arrow Keys or A/D
- **Jump**: Space or W
- **Shoot**: Mouse Click / Left Click
- **Aim**: Mouse Position
- **Flight Mode** (Debug): W/S for vertical movement
- **Debug Mode**: F3 or Shift+D
