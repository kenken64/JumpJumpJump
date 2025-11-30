"""
WebSocket Room Manager for Online Multiplayer

Handles:
- Room creation and joining
- Player state synchronization
- Game state broadcasting
- Connection management
"""

from fastapi import WebSocket
from typing import Dict, List, Optional, Set
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio
import secrets


class PlayerState(BaseModel):
    """Represents a player's current state in the game"""
    player_id: str
    player_name: str
    x: float
    y: float
    velocity_x: float = 0
    velocity_y: float = 0
    health: int = 100
    lives: int = 3
    score: int = 0
    skin: str = "alienGreen"
    weapon: str = "raygun"
    is_alive: bool = True
    is_ready: bool = False
    facing_right: bool = True
    is_jumping: bool = False
    is_shooting: bool = False
    checkpoint: int = 0  # Current checkpoint index
    coins: int = 0  # Collected coins


class GameRoom:
    """Represents an online multiplayer game room"""
    
    def __init__(self, room_id: str, room_name: str, host_id: str, max_players: int = 2):
        self.room_id = room_id
        self.room_name = room_name
        self.host_id = host_id
        self.max_players = max_players
        self.created_at = datetime.now()
        self.game_started = False
        self.game_paused = False
        self.level = 1
        self.game_mode = "online_coop"
        
        # Player management
        self.players: Dict[str, PlayerState] = {}
        self.connections: Dict[str, WebSocket] = {}
        self.player_order: List[str] = []  # Track join order for player 1/2 assignment
        
        # Reconnection support - store disconnected players temporarily
        self.disconnected_players: Dict[str, PlayerState] = {}
        self.reconnect_tokens: Dict[str, str] = {}  # player_id -> token
        self.disconnect_time: Dict[str, datetime] = {}
        self.reconnect_timeout = 60  # 60 seconds to reconnect
        
        # Game state
        self.seed: int = secrets.randbelow(1000000)  # Random seed for world generation
        self.enemies: List[dict] = []
        self.projectiles: List[dict] = []
        
        # Synchronization - server is the single source of truth
        self.game_start_timestamp: Optional[float] = None  # Unix timestamp when game should start
        self.sequence_id: int = 0  # Monotonic sequence for ordering messages
        self.server_time_offset: float = 0  # For clock sync
        
        # Collected items tracking (to prevent double collection)
        self.collected_coins: Set[str] = set()  # Set of coin IDs that have been collected
        self.collected_powerups: Set[str] = set()  # Set of powerup IDs that have been collected
        
        # Chat messages during game
        self.chat_history: List[dict] = []
        
    @property
    def player_count(self) -> int:
        return len(self.players)
    
    @property
    def is_full(self) -> bool:
        return self.player_count >= self.max_players
    
    @property
    def is_empty(self) -> bool:
        return self.player_count == 0
    
    def get_player_number(self, player_id: str) -> int:
        """Get player number (1 or 2) based on join order"""
        if player_id in self.player_order:
            return self.player_order.index(player_id) + 1
        return 0
    
    async def add_player(self, player_id: str, player_name: str, websocket: WebSocket) -> bool:
        """Add a player to the room"""
        if self.is_full:
            return False
        
        player_number = len(self.player_order) + 1
        skin = "alienGreen" if player_number == 1 else "alienPink"
        
        self.players[player_id] = PlayerState(
            player_id=player_id,
            player_name=player_name,
            x=400 if player_number == 1 else 500,
            y=550,
            skin=skin
        )
        self.connections[player_id] = websocket
        self.player_order.append(player_id)
        
        # Notify all players about the new player
        await self.broadcast({
            "type": "player_joined",
            "player_id": player_id,
            "player_name": player_name,
            "player_number": player_number,
            "room_info": self.get_room_info()
        })
        
        return True
    
    async def remove_player(self, player_id: str, allow_reconnect: bool = False):
        """Remove a player from the room"""
        player_name = "Unknown"
        
        if player_id in self.players:
            player_name = self.players[player_id].player_name
            
            # If game is in progress and reconnect is allowed, save state for reconnection
            if self.game_started and allow_reconnect:
                self.disconnected_players[player_id] = self.players[player_id]
                self.disconnect_time[player_id] = datetime.now()
                # Generate reconnection token
                self.reconnect_tokens[player_id] = secrets.token_urlsafe(16)
            
            del self.players[player_id]
            
        if player_id in self.connections:
            del self.connections[player_id]
            
        # Don't remove from player_order if allowing reconnect
        if not allow_reconnect and player_id in self.player_order:
            self.player_order.remove(player_id)
        
        # If host left, assign new host
        if player_id == self.host_id and self.player_order:
            self.host_id = self.player_order[0]
        
        # Notify remaining players
        await self.broadcast({
            "type": "player_left" if not allow_reconnect else "player_disconnected",
            "player_id": player_id,
            "player_name": player_name,
            "can_reconnect": allow_reconnect,
            "room_info": self.get_room_info()
        })
    
    async def reconnect_player(self, player_id: str, websocket: WebSocket, token: str) -> bool:
        """Reconnect a disconnected player"""
        # Verify token
        if player_id not in self.reconnect_tokens or self.reconnect_tokens[player_id] != token:
            return False
        
        # Check if reconnect timeout has passed
        if player_id in self.disconnect_time:
            elapsed = (datetime.now() - self.disconnect_time[player_id]).total_seconds()
            if elapsed > self.reconnect_timeout:
                # Clean up expired reconnect data
                self.cleanup_reconnect_data(player_id)
                return False
        
        # Restore player state
        if player_id in self.disconnected_players:
            self.players[player_id] = self.disconnected_players[player_id]
            self.connections[player_id] = websocket
            
            # Clean up reconnect data
            self.cleanup_reconnect_data(player_id)
            
            # Notify all players
            await self.broadcast({
                "type": "player_reconnected",
                "player_id": player_id,
                "player_name": self.players[player_id].player_name,
                "room_info": self.get_room_info()
            })
            
            return True
        
        return False
    
    def cleanup_reconnect_data(self, player_id: str):
        """Clean up reconnection data for a player"""
        if player_id in self.disconnected_players:
            del self.disconnected_players[player_id]
        if player_id in self.reconnect_tokens:
            del self.reconnect_tokens[player_id]
        if player_id in self.disconnect_time:
            del self.disconnect_time[player_id]
        if player_id in self.player_order:
            self.player_order.remove(player_id)
    
    def is_item_collected(self, item_type: str, item_id: str) -> bool:
        """Check if an item has already been collected"""
        if item_type == "coin":
            return item_id in self.collected_coins
        elif item_type == "powerup":
            return item_id in self.collected_powerups
        return False
    
    def mark_item_collected(self, item_type: str, item_id: str, player_id: str) -> bool:
        """Mark an item as collected, returns True if this was the first collection"""
        if item_type == "coin":
            if item_id not in self.collected_coins:
                self.collected_coins.add(item_id)
                return True
        elif item_type == "powerup":
            if item_id not in self.collected_powerups:
                self.collected_powerups.add(item_id)
                return True
        return False
    
    async def broadcast(self, message: dict, exclude: Optional[str] = None):
        """Send a message to all connected players"""
        disconnected = []
        
        for player_id, websocket in self.connections.items():
            if player_id != exclude:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.append(player_id)
        
        # Clean up disconnected players
        for player_id in disconnected:
            await self.remove_player(player_id)
    
    async def send_to_player(self, player_id: str, message: dict):
        """Send a message to a specific player"""
        if player_id in self.connections:
            try:
                await self.connections[player_id].send_json(message)
            except Exception:
                await self.remove_player(player_id)
    
    def update_player_state(self, player_id: str, state_update: dict):
        """Update a player's state"""
        if player_id in self.players:
            player = self.players[player_id]
            for key, value in state_update.items():
                if hasattr(player, key):
                    setattr(player, key, value)
    
    def get_room_info(self) -> dict:
        """Get room information for lobby display"""
        return {
            "room_id": self.room_id,
            "room_name": self.room_name,
            "host_id": self.host_id,
            "player_count": self.player_count,
            "max_players": self.max_players,
            "game_started": self.game_started,
            "players": [
                {
                    "player_id": p.player_id,
                    "player_name": p.player_name,
                    "player_number": self.get_player_number(p.player_id),
                    "is_ready": p.is_ready,
                    "skin": p.skin
                }
                for p in self.players.values()
            ]
        }
    
    def get_next_sequence(self) -> int:
        """Get next sequence ID for message ordering"""
        self.sequence_id += 1
        return self.sequence_id
    
    def get_game_state(self) -> dict:
        """Get full game state for synchronization"""
        import time
        return {
            "seed": self.seed,
            "level": self.level,
            "game_mode": self.game_mode,
            # Sync data - server is authoritative
            "server_timestamp": time.time() * 1000,  # Current server time in ms
            "game_start_timestamp": self.game_start_timestamp,  # When game should start
            "sequence_id": self.sequence_id,
            "players": {
                pid: {
                    "player_id": p.player_id,
                    "player_name": p.player_name,
                    "player_number": self.get_player_number(pid),
                    "x": p.x,
                    "y": p.y,
                    "velocity_x": p.velocity_x,
                    "velocity_y": p.velocity_y,
                    "health": p.health,
                    "lives": p.lives,
                    "score": p.score,
                    "skin": p.skin,
                    "weapon": p.weapon,
                    "is_alive": p.is_alive,
                    "facing_right": p.facing_right,
                    "is_jumping": p.is_jumping,
                    "is_shooting": p.is_shooting,
                    "checkpoint": p.checkpoint,
                    "coins": p.coins
                }
                for pid, p in self.players.items()
            },
            "enemies": self.enemies,
            "projectiles": self.projectiles,
            "collected_coins": list(self.collected_coins),
            "collected_powerups": list(self.collected_powerups),
            "chat_history": self.chat_history[-20:]  # Last 20 messages
        }


class RoomManager:
    """Manages all active game rooms"""
    
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}
        self._lock = asyncio.Lock()
    
    def generate_room_id(self) -> str:
        """Generate a unique 6-character room code"""
        while True:
            code = ''.join(secrets.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789') for _ in range(6))
            if code not in self.rooms:
                return code
    
    async def create_room(self, room_name: str, host_id: str, host_name: str, websocket: WebSocket) -> GameRoom:
        """Create a new game room"""
        async with self._lock:
            room_id = self.generate_room_id()
            room = GameRoom(room_id, room_name, host_id)
            self.rooms[room_id] = room
            await room.add_player(host_id, host_name, websocket)
            return room
    
    async def join_room(self, room_id: str, player_id: str, player_name: str, websocket: WebSocket) -> Optional[GameRoom]:
        """Join an existing room"""
        room = self.rooms.get(room_id)
        if room and not room.is_full and not room.game_started:
            await room.add_player(player_id, player_name, websocket)
            return room
        return None
    
    async def leave_room(self, room_id: str, player_id: str):
        """Leave a room"""
        room = self.rooms.get(room_id)
        if room:
            await room.remove_player(player_id)
            
            # Remove room if empty
            if room.is_empty:
                async with self._lock:
                    if room_id in self.rooms:
                        del self.rooms[room_id]
    
    def get_room(self, room_id: str) -> Optional[GameRoom]:
        """Get a room by ID"""
        return self.rooms.get(room_id)
    
    def get_available_rooms(self) -> List[dict]:
        """Get list of available (joinable) rooms"""
        return [
            room.get_room_info()
            for room in self.rooms.values()
            if not room.is_full and not room.game_started
        ]
    
    def get_all_rooms(self) -> List[dict]:
        """Get list of all rooms"""
        return [room.get_room_info() for room in self.rooms.values()]


# Global room manager instance
room_manager = RoomManager()
