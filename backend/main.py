from fastapi import FastAPI, HTTPException, Security, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from datetime import datetime
import os
import secrets

from rooms import room_manager, GameRoom

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

# Allow all Railway domains for easier deployment
if any(".railway.app" in origin for origin in ALLOWED_ORIGINS):
    ALLOWED_ORIGINS.append("https://*.railway.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("ALLOW_ALL_ORIGINS") == "true" else ALLOWED_ORIGINS,
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


# ============================================================================
# WebSocket Endpoints for Online Multiplayer
# ============================================================================

@app.get("/api/rooms")
def get_available_rooms():
    """Get list of available game rooms that can be joined"""
    return room_manager.get_available_rooms()

@app.get("/api/rooms/all")
def get_all_rooms():
    """Get list of all game rooms"""
    return room_manager.get_all_rooms()

@app.websocket("/ws/room/{room_id}")
async def websocket_room_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for game room communication
    
    Message types:
    - create_room: Create a new room (room_id should be 'new')
    - join_room: Join an existing room
    - player_ready: Mark player as ready
    - player_state: Update player position/state
    - game_action: Game actions (shoot, damage, etc.)
    - chat: Chat messages
    - start_game: Host starts the game
    - leave_room: Leave the room
    """
    await websocket.accept()
    
    player_id = None
    current_room: Optional[GameRoom] = None
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "create_room":
                # Create a new room
                room_name = data.get("room_name", "Game Room")
                player_name = data.get("player_name", "Player")
                player_id = data.get("player_id") or secrets.token_hex(8)
                
                current_room = await room_manager.create_room(
                    room_name=room_name,
                    host_id=player_id,
                    host_name=player_name,
                    websocket=websocket
                )
                
                await websocket.send_json({
                    "type": "room_created",
                    "room_id": current_room.room_id,
                    "player_id": player_id,
                    "player_number": 1,
                    "room_info": current_room.get_room_info()
                })
            
            elif message_type == "join_room":
                # Join an existing room
                join_room_id = data.get("room_id", room_id)
                player_name = data.get("player_name", "Player")
                player_id = data.get("player_id") or secrets.token_hex(8)
                
                current_room = await room_manager.join_room(
                    room_id=join_room_id,
                    player_id=player_id,
                    player_name=player_name,
                    websocket=websocket
                )
                
                if current_room:
                    await websocket.send_json({
                        "type": "room_joined",
                        "room_id": current_room.room_id,
                        "player_id": player_id,
                        "player_number": current_room.get_player_number(player_id),
                        "room_info": current_room.get_room_info()
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to join room. Room may be full or game already started."
                    })
            
            elif message_type == "player_ready":
                # Toggle player ready status
                if current_room and player_id:
                    player = current_room.players.get(player_id)
                    if player:
                        player.is_ready = data.get("is_ready", not player.is_ready)
                        await current_room.broadcast({
                            "type": "player_ready_changed",
                            "player_id": player_id,
                            "is_ready": player.is_ready,
                            "room_info": current_room.get_room_info()
                        })
            
            elif message_type == "player_state":
                # Update player position and state
                if current_room and player_id:
                    state_update = data.get("state", {})
                    current_room.update_player_state(player_id, state_update)
                    
                    # Broadcast to other players
                    await current_room.broadcast({
                        "type": "player_state_update",
                        "player_id": player_id,
                        "state": state_update
                    }, exclude=player_id)
            
            elif message_type == "game_action":
                # Handle game actions (shooting, damage, etc.)
                if current_room:
                    action = data.get("action")
                    action_data = data.get("data", {})
                    # Special-case: assist requests — allow host to adjust partner position
                    if action == 'assist' and player_id == current_room.host_id:
                        target_id = action_data.get('target_player_id')
                        new_x = action_data.get('x')
                        new_y = action_data.get('y')
                        if target_id and target_id in current_room.players:
                            # Update authoritative server-side player position
                            p = current_room.players[target_id]
                            if isinstance(new_x, (int, float)):
                                p.x = float(new_x)
                            if isinstance(new_y, (int, float)):
                                p.y = float(new_y)
                            # Broadcast updated player position to all clients
                            await current_room.broadcast({
                                "type": "player_state_update",
                                "player_id": target_id,
                                "state": {"x": p.x, "y": p.y}
                            })
                    # Broadcast the game action to other clients for visual/UX feedback
                    await current_room.broadcast({
                        "type": "game_action",
                        "player_id": player_id,
                        "action": action,
                        "data": action_data
                    }, exclude=player_id)
            
            elif message_type == "collect_item":
                # Handle item collection (coins, powerups)
                if current_room and player_id:
                    item_type = data.get("item_type", "coin")
                    item_id = data.get("item_id", "")
                    
                    # Check if item was already collected
                    if current_room.mark_item_collected(item_type, item_id, player_id):
                        # First to collect - update server's player totals where applicable
                        player_state = current_room.players.get(player_id)
                        if player_state:
                            if item_type == 'coin':
                                # Increment player's coins and award score
                                player_state.coins = (player_state.coins or 0) + 1
                                player_state.score = (player_state.score or 0) + 10
                            # For powerups we currently do not change coins but could adjust score/effects server-side
                        player_coins = player_state.coins if player_state else None
                        player_score = player_state.score if player_state else None
                        await current_room.broadcast({
                            "type": "item_collected",
                            "player_id": player_id,
                            "item_type": item_type,
                            "item_id": item_id,
                            "player_coins": player_coins,
                            "player_score": player_score
                        })
                    else:
                        # Item already collected by other player
                        await websocket.send_json({
                            "type": "item_already_collected",
                            "item_id": item_id
                        })
            
            elif message_type == "enemy_state":
                # Handle enemy state update (host sends, all receive)
                if current_room and player_id:
                    enemy_id = data.get("enemy_id", "")
                    state_update = data.get("state", {})
                    
                    # Logging for diagnostics
                    print(f"[ROOM {current_room.room_id}] enemy_state from {player_id}: {enemy_id} -> {state_update}")

                    # Update enemy state on server
                    current_room.update_enemy_state(enemy_id, state_update)
                    
                    # Broadcast to other players
                    await current_room.broadcast({
                        "type": "enemy_state_update",
                        "enemy_id": enemy_id,
                        "state": state_update
                    }, exclude=player_id)
            
            elif message_type == "enemy_spawn":
                # Host spawns an enemy, register and broadcast
                if current_room and player_id == current_room.host_id:
                    enemy_data = data.get("enemy", {})
                    print(f"[ROOM {current_room.room_id}] enemy_spawn from host: {enemy_data}")
                    enemy_id = current_room.spawn_enemy(enemy_data)
                    
                    # Broadcast spawn to all players (including host for confirmation)
                    await current_room.broadcast({
                        "type": "enemy_spawned",
                        "enemy": current_room.enemies.get(enemy_id, enemy_data)
                    })
            
            elif message_type == "enemy_killed":
                # Handle enemy death (first killer wins)
                if current_room and player_id:
                    enemy_id = data.get("enemy_id", "")
                    print(f"[ROOM {current_room.room_id}] enemy_killed reported by {player_id}: {enemy_id}")
                    
                    # Check if enemy is still alive
                    if current_room.kill_enemy(enemy_id, player_id):
                        # First to kill - broadcast to all
                        await current_room.broadcast({
                            "type": "enemy_killed",
                            "enemy_id": enemy_id,
                            "killed_by": player_id
                        })

                        # Server (authoritative) will spawn coins for the killed enemy
                        enemy_info = current_room.enemies.get(enemy_id, {})
                        try:
                            x = float(enemy_info.get('x', 0))
                            y = float(enemy_info.get('y', 0))
                        except Exception:
                            x = 0.0
                            y = 0.0

                        # coin_reward may be provided by host or default
                        coin_count = int(enemy_info.get('coin_reward', 0) or 0)

                        # If there are coins to spawn, create deterministic spread and broadcast each coin
                        for i in range(coin_count):
                            # Deterministic offsets so all clients compute same motion later
                            offset_x = ((int(x) * 7 + i * 13) % 61) - 30
                            offset_y = ((int(y) * 11 + i * 17) % 21) - 20
                            coin_x = x + offset_x
                            coin_y = y + offset_y

                            # Deterministic velocities so clients animate drops similarly
                            vel_x = ((int(x) * 3 + i * 19) % 201) - 100
                            vel_y = -200 + ((int(y) * 5 + i * 23) % 101)

                            coin_data = {
                                'x': coin_x,
                                'y': coin_y,
                                'value': 1,
                                'velocity_x': vel_x,
                                'velocity_y': vel_y
                            }
                            # Use deterministic coin_id so host-local coin IDs (coin_drop_...) match
                            # the server-assigned id. This prevents mismatch when host spawns
                            # coins locally and the server also registers them.
                            coin_data['coin_id'] = f"coin_drop_{int(x)}_{int(y)}_{i}"
                            coin_id = current_room.spawn_coin(coin_data)
                            # Broadcast spawn to all players
                            await current_room.broadcast({
                                "type": "coin_spawned",
                                "coin": current_room.coins.get(coin_id, coin_data)
                            })
                    else:
                        # Enemy already dead
                        await websocket.send_json({
                            "type": "enemy_already_dead",
                            "enemy_id": enemy_id
                        })
            
            elif message_type == "coin_spawn":
                # Host spawns a coin, register and broadcast
                if current_room and player_id == current_room.host_id:
                    coin_data = data.get("coin", {})
                    print(f"[ROOM {current_room.room_id}] coin_spawn from host: {coin_data}")
                    coin_id = current_room.spawn_coin(coin_data)
                    
                    # Broadcast spawn to all players
                    await current_room.broadcast({
                        "type": "coin_spawned",
                        "coin": current_room.coins.get(coin_id, coin_data)
                    })
            
            elif message_type == "sync_entities":
                # Host sends full entity state periodically for sync verification
                if current_room and player_id == current_room.host_id:
                    enemies = data.get("enemies", [])
                    coins = data.get("coins", [])
                    print(f"[ROOM {current_room.room_id}] sync_entities from host (enemies: {len(enemies)}, coins: {len(coins)})")
                    
                    # Update server state from host
                    for enemy in enemies:
                        eid = enemy.get("enemy_id")
                        if eid:
                            current_room.enemies[eid] = enemy
                    
                    for coin in coins:
                        cid = coin.get("coin_id")
                        if cid and cid not in current_room.collected_coins:
                            current_room.coins[cid] = coin
                    
                    # Broadcast to non-host players for sync
                    await current_room.broadcast({
                        "type": "entities_sync",
                        "enemies": current_room.get_active_enemies(),
                        "coins": current_room.get_uncollected_coins(),
                        "sequence_id": current_room.get_next_sequence()
                    }, exclude=player_id)
            
            elif message_type == "reconnect":
                # Handle reconnection attempt
                reconnect_token = data.get("token", "")
                reconnect_room_id = data.get("room_id", "")
                reconnect_player_id = data.get("player_id", "")
                
                room = room_manager.get_room(reconnect_room_id)
                if room and await room.reconnect_player(reconnect_player_id, websocket, reconnect_token):
                    current_room = room
                    player_id = reconnect_player_id
                    
                    # Send full game state to reconnected player
                    await websocket.send_json({
                        "type": "reconnected",
                        "room_id": room.room_id,
                        "player_id": player_id,
                        "player_number": room.get_player_number(player_id),
                        "game_state": room.get_game_state()
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Reconnection failed. Token invalid or session expired."
                    })
            
            elif message_type == "start_game":
                # Host starts the game
                if current_room and player_id == current_room.host_id:
                    # Check if all players are ready
                    all_ready = all(p.is_ready for p in current_room.players.values())
                    
                    if all_ready and current_room.player_count >= 2:
                        import time
                        current_room.game_started = True
                        # Schedule game to start 500ms in the future
                        # This gives all clients time to receive and prepare
                        current_room.game_start_timestamp = time.time() * 1000 + 500
                        
                        game_state = current_room.get_game_state()
                        # Broadcast to ALL clients in the same tick
                        await current_room.broadcast({
                            "type": "game_starting",
                            "game_state": game_state,
                            "sequence_id": current_room.get_next_sequence()
                        })
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Cannot start game. All players must be ready and at least 2 players needed."
                        })
            
            elif message_type == "chat":
                # Chat message (works both in lobby and during game)
                if current_room and player_id:
                    player = current_room.players.get(player_id)
                    chat_msg = {
                        "type": "chat",
                        "player_id": player_id,
                        "player_name": player.player_name if player else "Unknown",
                        "message": data.get("message", ""),
                        "timestamp": datetime.now().isoformat()
                    }
                    # Store in chat history if game is in progress
                    if current_room.game_started:
                        current_room.chat_history.append(chat_msg)
                    await current_room.broadcast(chat_msg)
            
            elif message_type == "leave_room":
                # Leave the room
                if current_room and player_id:
                    await room_manager.leave_room(current_room.room_id, player_id)
                    await websocket.send_json({
                        "type": "room_left"
                    })
                    current_room = None
            
            elif message_type == "ping":
                # Keep-alive ping
                await websocket.send_json({"type": "pong"})
            
            elif message_type == "time_sync":
                # NTP-style time synchronization
                # Client sends their timestamp, server responds with server time
                import time
                client_time = data.get("client_time", 0)
                server_time = time.time() * 1000  # Server time in ms
                await websocket.send_json({
                    "type": "time_sync_response",
                    "client_time": client_time,  # Echo back for RTT calculation
                    "server_time": server_time,
                    "sequence_id": current_room.get_next_sequence() if current_room else 0
                })
    
    except WebSocketDisconnect:
        # Clean up on disconnect - allow reconnection if game is in progress
        if current_room and player_id:
            allow_reconnect = current_room.game_started
            await current_room.remove_player(player_id, allow_reconnect=allow_reconnect)
            
            # Send reconnection token if allowed
            if allow_reconnect and player_id in current_room.reconnect_tokens:
                # Note: Can't send to disconnected player, but token is stored for when they reconnect
                pass
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        if current_room and player_id:
            allow_reconnect = current_room.game_started
            await current_room.remove_player(player_id, allow_reconnect=allow_reconnect)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
