# GitHub Copilot Instructions for JumpJumpJump Project

## Project Overview
JumpJumpJump is a web-based platformer game built with React, Phaser, and FastAPI.

## Technology Stack
- **Frontend**: React 19.2.0 + Vite 5.4.21 + Phaser 3.90.0 + TypeScript 5.9.3
- **Backend**: FastAPI + SQLite
- **Package Manager**: pnpm (for frontend)

## Development Rules

### 1. Server Management
**ALWAYS use the start/stop scripts** located in `scripts/` folder:
- ✅ **Start services**: `.\scripts\start.ps1` or `.\scripts\start.bat`
- ✅ **Stop services**: `.\scripts\stop.ps1` or `.\scripts\stop.bat`
- ❌ **Never run directly**: `pnpm dev`, `npm start`, `python -m uvicorn`, etc.

### 2. Package Management
- Use **pnpm** for all frontend dependencies
- Never use npm directly (due to npm cache issues on this system)

### 3. File Structure
```
JumpJumpJump/
├── frontend/          # React + Phaser + Vite
│   ├── assets/       # Game assets (Kenney packs)
│   ├── src/          # Source code
│   └── package.json
├── backend/           # FastAPI server
├── scripts/           # Start/stop automation scripts
├── PRPs/             # Project documentation
└── README.md
```

### 4. Game Assets
All game assets are from Kenney asset packs, organized in `frontend/assets/`:
- `kenney_platformer-art-requests/` - Platform tiles and objects
- `kenney_platformer-art-extended-enemies/` - Player and enemy sprites
- `kenney_sci-fi-rts/` - Sci-fi themed assets
- `kenney_ui-pack-space-expansion/` - UI elements
- `kenny_planets/` - Planet and space backgrounds

### 5. Code Conventions
- **TypeScript**: Strict mode enabled
- **File naming**: camelCase for files, PascalCase for components
- **Imports**: Use absolute paths where configured
- **Phaser scenes**: Place in `frontend/src/scenes/`

### 6. Git Workflow
- Document changes clearly
- Test before committing
- Use descriptive commit messages

### 7. Port Configuration
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 8. Safety & Data Integrity
- **File System**: **DO NOT DELETE** any files outside this project directory.
- **Database**: 
  - Deleting data from the SQLite database requires explicit permission from the user.
  - **DO NOT DROP** any table without explicit permission from the user.

## Common Commands

### Development
```powershell
# Start all services
.\scripts\start.ps1

# Stop all services
.\scripts\stop.ps1
```

### Frontend Only
```powershell
cd frontend
pnpm install          # Install dependencies
pnpm dev              # Only via start script!
pnpm build            # Build for production
```

### Backend Only
```powershell
cd backend
python -m venv venv                    # Create virtual environment
.\venv\Scripts\Activate.ps1            # Activate venv
pip install -r requirements.txt        # Install dependencies
# Run via start script only!
```

## Notes
- This project uses PowerShell on Windows
- pnpm was installed standalone due to npm issues
- Always check both frontend and backend are running via scripts
