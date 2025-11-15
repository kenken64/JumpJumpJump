# Jump Jump Jump - Backend API

FastAPI backend for storing and retrieving game scores.

## Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /api/scores` - Submit a new score
- `GET /api/scores/leaderboard?limit=10` - Get top scores
- `GET /api/scores/user/{username}?limit=5` - Get scores for a specific user
- `GET /` - Health check

## Database

SQLite database (`game_scores.db`) will be created automatically on first run.
