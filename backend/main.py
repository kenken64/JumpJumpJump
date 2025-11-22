from fastapi import FastAPI, HTTPException, Security, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from datetime import datetime
import os

app = FastAPI(title="JumpJumpJump API")

# API Key configuration
API_KEY = os.getenv("API_KEY", "your-secret-api-key-here")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify the API key from request header"""
    if api_key != API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing API key"
        )
    return api_key

# CORS middleware to allow frontend requests
# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
# Use /app/data for persistent storage in Railway
DATA_DIR = os.getenv("DATA_DIR", os.path.dirname(__file__))
DB_PATH = os.path.join(DATA_DIR, "game.db")

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
    
    # Create bosses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bosses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boss_index INTEGER NOT NULL UNIQUE,
            boss_name TEXT NOT NULL,
            notorious_title TEXT NOT NULL,
            frame_x INTEGER NOT NULL,
            frame_y INTEGER NOT NULL
        )
    """)
    
    # Insert boss data if not exists (22 bosses from individual images)
    cursor.execute("SELECT COUNT(*) FROM bosses")
    if cursor.fetchone()[0] == 0:
        boss_names = [
            ("Vortex Reaper", "The Dimensional Destroyer"),
            ("Nebula Dragon", "Cosmic Annihilator"),
            ("Quantum Mech", "Master of Reality"),
            ("Steel Colossus", "The Iron Tyrant"),
            ("Inferno Demon", "Harbinger of Flames"),
            ("Wing Commander", "Sky Dominator"),
            ("Titan Crusher", "Mountain Breaker"),
            ("Void Sentinel", "Guardian of Darkness"),
            ("Plasma King", "Emperor of Energy"),
            ("Astral Behemoth", "Star Devourer"),
            ("Eclipse Warlord", "Shadow Conqueror"),
            ("Nova Juggernaut", "The Supernova Beast"),
            ("Chrono Mech", "Time's End"),
            ("Cyber Overlord", "Digital Destroyer"),
            ("Omega Titan", "The Final Terror"),
            ("Genesis Machine", "First of Many"),
            ("Blade Knight", "Master of Combat"),
            ("Fortress Prime", "The Unbreakable"),
            ("Plasma Destroyer", "Energy Incarnate"),
            ("Void Enforcer", "The Abyss Walker"),
            ("Tentacle Horror", "Deep Space Terror"),
            ("Ancient Evil", "Primordial Nightmare")
        ]
        
        for idx, (name, title) in enumerate(boss_names):
            # Map to individual boss image files
            frame_x = 0  # Not used for individual images
            frame_y = 0  # Not used for individual images
            cursor.execute("""
                INSERT INTO bosses (boss_index, boss_name, notorious_title, frame_x, frame_y)
                VALUES (?, ?, ?, ?, ?)
            """, (idx, name, title, frame_x, frame_y))
    
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

class Boss(BaseModel):
    id: int
    boss_index: int
    boss_name: str
    notorious_title: str
    frame_x: int
    frame_y: int
    image_url: Optional[str] = None

# API Endpoints
@app.get("/")
def read_root():
    return {"message": "JumpJumpJump API is running!"}

@app.post("/api/scores", response_model=ScoreResponse)
def submit_score(score_data: ScoreSubmit, api_key: str = Security(verify_api_key)):
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
def get_leaderboard(limit: int = 10, game_mode: Optional[str] = None, api_key: str = Security(verify_api_key)):
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
def get_player_high_score(player_name: str, api_key: str = Security(verify_api_key)):
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
def get_score_rank(score: int, game_mode: Optional[str] = None, api_key: str = Security(verify_api_key)):
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

@app.get("/api/bosses", response_model=List[Boss])
def get_all_bosses(api_key: str = Security(verify_api_key)):
    """Get all boss data from the database with individual image URLs"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, boss_index, boss_name, notorious_title, frame_x, frame_y
            FROM bosses
            ORDER BY boss_index
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        # Map to individual boss images
        bosses = []
        for row in rows:
            boss_index = row[1]
            boss = Boss(
                id=row[0],
                boss_index=boss_index,
                boss_name=row[2],
                notorious_title=row[3],
                frame_x=row[4],
                frame_y=row[5],
                image_url=f"/api/bosses/images/{boss_index:02d}"
            )
            bosses.append(boss)
        
        return bosses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bosses/images/{boss_index}")
def get_boss_image(boss_index: int):
    """Serve individual boss image by index"""
    try:
        # Path to individual boss images
        boss_images_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "assets", "bosses_individual")
        image_path = os.path.join(boss_images_dir, f"boss_{boss_index:02d}.png")
        
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Boss image {boss_index} not found")
        
        return FileResponse(image_path, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
