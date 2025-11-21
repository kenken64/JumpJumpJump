from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from datetime import datetime
import os

app = FastAPI(title="JumpJumpJump API")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), "game.db")

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create scores table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            coins INTEGER NOT NULL,
            enemies_defeated INTEGER NOT NULL,
            distance INTEGER NOT NULL,
            level INTEGER NOT NULL,
            game_mode TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create index for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_score_desc ON scores(score DESC)
    """)
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Pydantic models
class ScoreSubmit(BaseModel):
    player_name: str
    score: int
    coins: int
    enemies_defeated: int
    distance: int
    level: int
    game_mode: str

class ScoreResponse(BaseModel):
    id: int
    player_name: str
    score: int
    coins: int
    enemies_defeated: int
    distance: int
    level: int
    game_mode: str
    created_at: str
    rank: Optional[int] = None

# API Endpoints
@app.get("/")
def read_root():
    return {"message": "JumpJumpJump API is running!"}

@app.post("/api/scores", response_model=ScoreResponse)
def submit_score(score_data: ScoreSubmit):
    """Submit a new score to the leaderboard"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO scores (player_name, score, coins, enemies_defeated, distance, level, game_mode)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            score_data.player_name,
            score_data.score,
            score_data.coins,
            score_data.enemies_defeated,
            score_data.distance,
            score_data.level,
            score_data.game_mode
        ))
        
        score_id = cursor.lastrowid
        conn.commit()
        
        # Get the inserted score
        cursor.execute("""
            SELECT id, player_name, score, coins, enemies_defeated, distance, level, game_mode, created_at
            FROM scores WHERE id = ?
        """, (score_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        return ScoreResponse(
            id=row[0],
            player_name=row[1],
            score=row[2],
            coins=row[3],
            enemies_defeated=row[4],
            distance=row[5],
            level=row[6],
            game_mode=row[7],
            created_at=row[8]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scores/leaderboard", response_model=List[ScoreResponse])
def get_leaderboard(limit: int = 10, game_mode: Optional[str] = None):
    """Get top scores from the leaderboard"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        if game_mode:
            cursor.execute("""
                SELECT id, player_name, score, coins, enemies_defeated, distance, level, game_mode, created_at
                FROM scores
                WHERE game_mode = ?
                ORDER BY score DESC
                LIMIT ?
            """, (game_mode, limit))
        else:
            cursor.execute("""
                SELECT id, player_name, score, coins, enemies_defeated, distance, level, game_mode, created_at
                FROM scores
                ORDER BY score DESC
                LIMIT ?
            """, (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for idx, row in enumerate(rows):
            results.append(ScoreResponse(
                id=row[0],
                player_name=row[1],
                score=row[2],
                coins=row[3],
                enemies_defeated=row[4],
                distance=row[5],
                level=row[6],
                game_mode=row[7],
                created_at=row[8],
                rank=idx + 1
            ))
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scores/player/{player_name}", response_model=ScoreResponse)
def get_player_high_score(player_name: str):
    """Get a player's highest score"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, player_name, score, coins, enemies_defeated, distance, level, game_mode, created_at
            FROM scores
            WHERE player_name = ?
            ORDER BY score DESC
            LIMIT 1
        """, (player_name,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Player not found")
        
        return ScoreResponse(
            id=row[0],
            player_name=row[1],
            score=row[2],
            coins=row[3],
            enemies_defeated=row[4],
            distance=row[5],
            level=row[6],
            game_mode=row[7],
            created_at=row[8]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scores/rank/{score}")
def get_score_rank(score: int, game_mode: Optional[str] = None):
    """Get the rank of a specific score"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        if game_mode:
            cursor.execute("""
                SELECT COUNT(*) + 1
                FROM scores
                WHERE score > ? AND game_mode = ?
            """, (score, game_mode))
        else:
            cursor.execute("""
                SELECT COUNT(*) + 1
                FROM scores
                WHERE score > ?
            """, (score,))
        
        rank = cursor.fetchone()[0]
        conn.close()
        
        return {"score": score, "rank": rank}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
