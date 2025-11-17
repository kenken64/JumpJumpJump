from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from datetime import datetime
import uvicorn
import json

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
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS custom_levels (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            author TEXT NOT NULL,
            description TEXT,
            background_color INTEGER NOT NULL,
            lanes_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

class CustomLane(BaseModel):
    vehicleType: str
    speed: int
    direction: int
    spawnInterval: int

class CustomLevel(BaseModel):
    id: str
    name: str
    author: str
    description: str
    backgroundColor: int
    lanes: List[CustomLane]
    createdAt: Optional[int] = None

class CustomLevelResponse(BaseModel):
    id: str
    name: str
    author: str
    description: str
    backgroundColor: int
    lanes: List[CustomLane]
    created_at: str
    updated_at: str

class UpdateLevelName(BaseModel):
    name: str

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

@app.post("/api/levels", response_model=dict)
async def save_custom_level(level_data: CustomLevel):
    """Save or update a custom level"""
    if not level_data.name or len(level_data.name.strip()) == 0:
        raise HTTPException(status_code=400, detail="Level name cannot be empty")
    
    if not level_data.author or len(level_data.author.strip()) == 0:
        raise HTTPException(status_code=400, detail="Author name cannot be empty")
    
    if len(level_data.lanes) == 0:
        raise HTTPException(status_code=400, detail="Level must have at least one lane")

    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()

    # Serialize lanes to JSON
    lanes_json = json.dumps([lane.model_dump() for lane in level_data.lanes])
    
    # Check if level exists
    cursor.execute("SELECT id FROM custom_levels WHERE id = ?", (level_data.id,))
    existing = cursor.fetchone()

    if existing:
        # Update existing level
        cursor.execute(
            """UPDATE custom_levels 
               SET name = ?, author = ?, description = ?, background_color = ?, 
                   lanes_data = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?""",
            (level_data.name, level_data.author, level_data.description, 
             level_data.backgroundColor, lanes_json, level_data.id)
        )
        message = "Level updated successfully"
    else:
        # Insert new level
        cursor.execute(
            """INSERT INTO custom_levels (id, name, author, description, background_color, lanes_data)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (level_data.id, level_data.name, level_data.author, level_data.description, 
             level_data.backgroundColor, lanes_json)
        )
        message = "Level saved successfully"

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": message,
        "id": level_data.id
    }

@app.get("/api/levels", response_model=List[CustomLevelResponse])
async def get_all_levels():
    """Get all custom levels"""
    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()

    cursor.execute(
        """SELECT id, name, author, description, background_color, lanes_data, 
                  created_at, updated_at
           FROM custom_levels
           ORDER BY updated_at DESC"""
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "name": row[1],
            "author": row[2],
            "description": row[3],
            "backgroundColor": row[4],
            "lanes": json.loads(row[5]),
            "created_at": row[6],
            "updated_at": row[7]
        }
        for row in rows
    ]

@app.get("/api/levels/{level_id}", response_model=CustomLevelResponse)
async def get_level(level_id: str):
    """Get a specific custom level by ID"""
    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()

    cursor.execute(
        """SELECT id, name, author, description, background_color, lanes_data, 
                  created_at, updated_at
           FROM custom_levels
           WHERE id = ?""",
        (level_id,)
    )

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Level not found")

    return {
        "id": row[0],
        "name": row[1],
        "author": row[2],
        "description": row[3],
        "backgroundColor": row[4],
        "lanes": json.loads(row[5]),
        "created_at": row[6],
        "updated_at": row[7]
    }

@app.delete("/api/levels/{level_id}", response_model=dict)
async def delete_level(level_id: str):
    """Delete a custom level"""
    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()

    cursor.execute("DELETE FROM custom_levels WHERE id = ?", (level_id,))
    deleted_count = cursor.rowcount
    
    conn.commit()
    conn.close()

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Level not found")

    return {
        "success": True,
        "message": "Level deleted successfully"
    }

@app.patch("/api/levels/{level_id}/name", response_model=dict)
async def update_level_name(level_id: str, update_data: UpdateLevelName):
    """Update only the name of a custom level"""
    if not update_data.name or len(update_data.name.strip()) == 0:
        raise HTTPException(status_code=400, detail="Level name cannot be empty")
    
    conn = sqlite3.connect('game_scores.db')
    cursor = conn.cursor()

    cursor.execute(
        """UPDATE custom_levels 
           SET name = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (update_data.name.strip(), level_id)
    )
    updated_count = cursor.rowcount
    
    conn.commit()
    conn.close()

    if updated_count == 0:
        raise HTTPException(status_code=404, detail="Level not found")

    return {
        "success": True,
        "message": "Level name updated successfully"
    }

@app.get("/")
async def root():
    return {"message": "Jump Jump Jump Score API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
