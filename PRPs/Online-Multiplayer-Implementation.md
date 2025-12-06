# PRP: Online Multiplayer Implementation

## Problem Statement
To expand the game beyond local co-op, we need a robust online multiplayer system that allows players to connect remotely, share the same game world, and interact in real-time without desynchronization or lag affecting the gameplay experience.

## Requirements
- Real-time player position and state synchronization
- Shared world generation (seeds)
- Synchronized enemy spawning and behavior
- Low-latency communication
- Reconnection handling
- Debugging capabilities for network issues

## Proposed Solution

### Architecture
1. **Client-Server Model**: 
   - **Frontend**: React/Phaser client acts as the view and input layer.
   - **Backend**: FastAPI server with WebSockets manages room state and message broadcasting.
2. **Communication Protocol**: JSON-based WebSocket messages for events (move, jump, spawn, damage).
3. **Host-Authoritative Logic**: The "Host" (first player) is responsible for non-deterministic game logic (e.g., enemy spawning) to ensure consistency.

## Implementation Details

### 1. WebSocket Service (`frontend/src/services/OnlineCoopService.ts`)
- Manages the WebSocket connection to `ws://localhost:8000/ws`.
- Handles connection lifecycle (connect, disconnect, error).
- Dispatches incoming network events to the `GameScene`.
- Throttles outgoing position updates to prevent network congestion.

### 2. Synchronization Strategy

#### Player Sync
- **Position**: Clients send `PLAYER_MOVE` events with (x, y, velocity, animation).
- **Interpolation**: Remote players are smoothed visually to prevent jitter.
- **ID Verification**: Strict checks ensure a client only controls their assigned player ID (Player 1 or Player 2).

#### World Sync
- **Seed Sharing**: The host generates a random seed and broadcasts it to the joining player.
- **Deterministic Generation**: Both clients use the same seed in `WorldGenerator` to create identical terrain.

#### Enemy Sync (Host Authority)
- **Problem**: If both clients spawn enemies randomly, they will desync.
- **Solution**: 
  - Only the **Host** (Player 1) runs the enemy spawning logic.
  - Host sends `ENEMY_SPAWN` events with type, position, and ID.
  - Guest (Player 2) listens for these events and instantiates "Ghost" enemies that mirror the host's simulation.

### 3. Backend Infrastructure (`backend/main.py`)
- **FastAPI WebSocketEndpoint**: Handles concurrent connections.
- **Room Management**: Groups connections into game sessions.
- **Broadcasting**: Relays messages from one client to others in the same room.
- **Logging**: Detailed `game_state.log` captures all sync events for debugging (excluded from git).

### 4. Recent Improvements (Fixes)
- **Invisible Enemy Fix**: Added guard clauses in `GameScene` to prevent the Guest from running spawn logic locally. Added `setVisible(true)` enforcement for synced enemies.
- **Platform Jitter Fix**: Implemented one-way collision and full-width hitboxes in `WorldGenerator` to stabilize multiplayer movement on floating platforms.
- **Save/Load System**: Enabled persistence of multiplayer session state (lives, scores) via backend database.

## Technical Specifications

### Message Types
```json
// Player Movement
{
  "type": "PLAYER_MOVE",
  "payload": {
    "id": "player-1",
    "x": 100,
    "y": 200,
    "anim": "run"
  }
}

// Enemy Spawn (Host -> Guest)
{
  "type": "ENEMY_SPAWN",
  "payload": {
    "enemyId": "e_123",
    "x": 500,
    "y": 300,
    "type": "slime"
  }
}
```
