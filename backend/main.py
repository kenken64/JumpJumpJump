from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sqlite3
from datetime import datetime
import uvicorn

app = FastAPI()

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
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

@app.get("/api/scores/user/{username}", response_model=List[ScoreResponse])
async def get_user_scores(username: str, limit: int = 5):
    """Get scores for a specific user"""
    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, username, score, level_reached, created_at
        FROM scores
        WHERE username = ?
        ORDER BY score DESC
        LIMIT ?
        """,
        (username, limit)
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

@app.get("/")
async def root():
    return {"message": "Jump Jump Jump Score API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
