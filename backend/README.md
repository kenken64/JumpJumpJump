# JumpJumpJump Backend

FastAPI backend for storing game scores and leaderboard data.

## Features

- **Score Submission**: Players can submit their game scores
- **Leaderboard**: Top 10 scores with filtering by game mode
- **Player Stats**: View individual player high scores
- **Score Ranking**: Get rank for any score
- **SQLite Database**: Lightweight, file-based storage

## Setup

### Install Dependencies

```powershell
# Create virtual environment (optional but recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

### Run the Server

```powershell
# Using uvicorn directly
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the start script from root directory
cd ..
.\scripts\start.ps1
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### GET `/`
Health check endpoint

### POST `/api/scores`
Submit a new score
```json
{
  "player_name": "Player1",
  "score": 1500,
  "coins": 45,
  "enemies_defeated": 12,
  "distance": 350,
  "level": 5,
  "game_mode": "levels"
}
```

### GET `/api/scores/leaderboard?limit=10&game_mode=levels`
Get top scores (optional: filter by game_mode)

### GET `/api/scores/player/{player_name}`
Get a player's highest score

### GET `/api/scores/rank/{score}?game_mode=levels`
Get the rank of a specific score (optional: filter by game_mode)

## Database

The SQLite database (`game.db`) is automatically created on first run with the following schema:

### scores table
- `id`: Primary key
- `player_name`: Player's name
- `score`: Total score
- `coins`: Coins collected
- `enemies_defeated`: Number of enemies defeated
- `distance`: Distance traveled (meters)
- `level`: Level reached
- `game_mode`: 'levels' or 'endless'
- `created_at`: Timestamp

## CORS

The backend is configured to accept requests from:
- http://localhost:3000
- http://localhost:5173

## Tech Stack

- **FastAPI**: Modern web framework
- **Pydantic**: Data validation
- **SQLite**: Lightweight database
- **Uvicorn**: ASGI server
