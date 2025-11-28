# Building JumpJumpJump: A Full-Stack Game Development Guide
## From Infinite Worlds to Reinforcement Learning AI

**Author:** AidenPhangRuiYin-CMYK & GitHub Copilot  
**Date:** November 2025  
**Version:** 1.0

---

## 📖 Introduction

This technical guide documents the complete development journey of **JumpJumpJump**, a modern web-based platformer featuring infinite procedural generation, machine learning AI agents, and a full-stack architecture. This book is designed for developers who want to understand how to build complex browser games using React, Phaser, and Python.

### What You Will Learn
- How to architect a scalable game loop with **Phaser 3** and **React**
- Implementing **procedural generation** for infinite terrain
- Building **Reinforcement Learning (DQN)** agents that learn to play your game
- Creating a **Python FastAPI** backend for persistent data
- Deploying a full-stack application using **Docker** and **Railway**

---

## 📑 Table of Contents

1.  [**Chapter 1: Architecture & Setup**](#chapter-1-architecture--setup)
    *   Tech Stack Decisions
    *   Project Structure
    *   The Game Loop
2.  [**Chapter 2: The Infinite World Engine**](#chapter-2-the-infinite-world-engine)
    *   Procedural Generation Strategy
    *   Chunk Management System
    *   Difficulty Scaling
3.  [**Chapter 3: Player Mechanics & Physics**](#chapter-3-player-mechanics--physics)
    *   Arcade Physics Implementation
    *   Movement & Combat Systems
    *   Gamepad Integration
4.  [**Chapter 4: The Boss System**](#chapter-4-the-boss-system)
    *   Boss Logic & Spawning
    *   Persistence & Gallery
5.  [**Chapter 5: Artificial Intelligence**](#chapter-5-artificial-intelligence)
    *   Behavioral Cloning (Imitation Learning)
    *   Deep Q-Network (DQN) Implementation
6.  [**Chapter 6: Backend & Infrastructure**](#chapter-6-backend--infrastructure)
    *   FastAPI & SQLite
    *   Docker & Deployment

---

## Chapter 1: Architecture & Setup

### 1.1 The Tech Stack

We chose a hybrid stack to leverage the best tools for each domain:

*   **Frontend**: **React 19** manages the UI/HUD, while **Phaser 3.90** handles the canvas rendering and physics engine. This separation allows for complex React-based interfaces (like the Leaderboard or AI Training UI) overlaying the high-performance game canvas.
*   **Backend**: **FastAPI** (Python) was selected for its speed and native support for async operations, making it ideal for handling real-time score submissions and serving AI models.
*   **Database**: **SQLite** provides a lightweight, serverless SQL engine perfect for storing leaderboards and boss defeat states without heavy infrastructure overhead.

### 1.2 Project Structure

The codebase is organized as a monorepo:

```
JumpJumpJump/
├── frontend/           # The Game Client
│   ├── src/
│   │   ├── scenes/     # Phaser Scenes (Game, Menu, Training)
│   │   ├── utils/      # Game Logic (WorldGen, AI, Physics)
│   │   └── services/   # API Communication
│   └── assets/         # Sprites, Audio, Tilemaps
├── backend/            # The API Server
│   ├── main.py         # FastAPI Application
│   └── game.db         # SQLite Database
└── scripts/            # DevOps & Utility Scripts
```

---

## Chapter 2: The Infinite World Engine

### 2.1 The Problem of Infinity

Creating an endless runner requires a system that generates terrain just ahead of the player and cleans up terrain behind them to manage memory. We implemented a **Chunk-Based Generation System**.

### 2.2 The Chunk System

The world is divided into 800-pixel wide "chunks". The `WorldGenerator` class manages these chunks.

**Key Algorithm:**
1.  **Generation**: As the player moves right (`player.x`), we calculate the current chunk index.
2.  **Look-Ahead**: If the player is within 2 chunks of the edge, generate the next chunk.
3.  **Cleanup**: If a chunk is >2 units behind the player, destroy its GameObjects (platforms, enemies, coins).

```typescript
// Simplified Logic from WorldGenerator.ts
generateChunk(chunkIndex) {
  const startX = chunkIndex * CHUNK_WIDTH;
  
  // 1. Generate Platforms
  // Randomize height (200-500px) and width
  // Ensure jumpable gaps (50-200px)
  
  // 2. Spawn Entities
  // 20% chance for Enemy
  // 40% chance for Coin
  // 15% chance for Spike
}
```

### 2.3 Difficulty Scaling

To keep the game engaging, difficulty scales with distance:
*   **Enemy Density**: Increases every 5 chunks.
*   **Gap Width**: Widens progressively.
*   **Boss Encounters**: Triggered every 5 levels (Level 5, 10, 15...).

---

## Chapter 3: Player Mechanics & Physics

### 3.1 Arcade Physics

We utilize Phaser's Arcade Physics for performant AABB (Axis-Aligned Bounding Box) collision detection.

*   **Gravity**: Set to 1000 to provide a "heavy", responsive feel.
*   **Velocity**: Capped at 200px/s for movement, with -500px/s for jumps.

### 3.2 Combat Mechanics

The player has two primary offensive capabilities:
1.  **Stomp**: Landing on top of an enemy destroys it and bounces the player up. This is detected by checking if the player's bottom touches the enemy's top while moving downward.
2.  **Shooting**: A raygun weapon that rotates to follow the mouse/gamepad aim. Projectiles are physics bodies that destroy enemies on overlap.

### 3.3 Gamepad Integration

We implemented a custom `ControlManager` to unify Keyboard and Gamepad inputs.
*   **Analog Control**: Left stick for movement (with deadzone), Right stick for aiming.
*   **Jetpack Mode**: Holding 'Up' on the analog stick activates a thrust mechanic, allowing for flight at the cost of control precision.

---

## Chapter 4: The Boss System

### 4.1 Architecture

The game features 22 unique bosses, appearing every 5th level.
*   **Data Source**: Boss stats (Name, HP, Title) are stored in the SQLite database and fetched via API.
*   **Visuals**: A single 1024x1024 spritesheet contains all boss frames. We programmatically extract the correct frame based on the Boss ID.

### 4.2 The Boss Gallery

A dedicated React/Phaser scene (`BossGalleryScene`) allows players to view defeated bosses.
*   **Persistence**: Defeat status is stored in `localStorage` and synced with the backend.
*   **Pagination**: Displays 8 bosses per page using a grid layout system.

---

## Chapter 5: Artificial Intelligence

This project implements two distinct AI approaches.

### 5.1 Behavioral Cloning (The "Ghost")

The `MLAIPlayer` records human gameplay (position, velocity, nearest enemy) and trains a neural network to predict the next action (Jump, Shoot, Move).
*   **Input**: 17 features (Player State + Environment State).
*   **Output**: 4 discrete actions.
*   **Result**: An AI that mimics the player's style but struggles with new situations.

### 5.2 Deep Q-Learning (DQN)

The `DQNAgent` learns through trial and error, optimizing for a Reward Function.

**State Space (14 inputs):**
*   Normalized Player Position & Velocity
*   Distance to nearest Platform, Enemy, Spike
*   Boss Active Status

**Reward Function:**
*   `+0.1` per unit moved right (Progress)
*   `+5.0` for killing an enemy
*   `-2.0` for dying
*   `-0.1` for getting stuck

**Training Loop:**
1.  **Observe** state $S_t$
2.  **Select** action $A_t$ (Epsilon-Greedy strategy)
3.  **Execute** action, receive Reward $R_t$ and new state $S_{t+1}$
4.  **Store** tuple $(S_t, A_t, R_t, S_{t+1})$ in Replay Buffer
5.  **Train** network on random batch from buffer

---

## Chapter 6: Backend & Infrastructure

### 6.1 FastAPI Server

The backend serves two main purposes:
1.  **Leaderboard API**: `POST /api/scores` and `GET /api/scores/leaderboard`.
2.  **Game Data**: Serving Boss configurations.

### 6.2 Deployment Pipeline

We use **Railway** for hosting, with a multi-stage Docker build:

**Stage 1: Build**
*   Node.js image
*   Install dependencies (`pnpm`)
*   Build React/Phaser bundle

**Stage 2: Serve**
*   Nginx Alpine image
*   Copy build artifacts
*   Configure Nginx for SPA routing and Gzip compression

This ensures a production-ready, high-performance delivery of the game assets.

---

# Part II: Step-by-Step Implementation Guide

This section provides a hands-on tutorial to build the JumpJumpJump game from scratch.

## Step 1: Environment Setup

Before writing code, ensure your development environment is ready.

### 1.1 Prerequisites
*   **Node.js** (v18+): For the frontend build chain.
*   **Python** (v3.10+): For the backend API.
*   **Git**: For version control.
*   **VS Code**: Recommended IDE.

### 1.2 Project Initialization
Create the monorepo structure:

```bash
mkdir JumpJumpJump
cd JumpJumpJump
mkdir frontend backend scripts PRPs
```

## Step 2: Backend Implementation (FastAPI)

We start with the backend to establish our data layer.

### 2.1 Setup Python Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
pip install fastapi uvicorn pydantic sqlite3
```

### 2.2 Create the API (`backend/main.py`)
Initialize the FastAPI app and SQLite database.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def init_db():
    conn = sqlite3.connect("game.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY,
            player_name TEXT,
            score INTEGER
        )
    """)
    conn.commit()

@app.get("/api/bosses")
def get_bosses():
    # Return list of 22 bosses
    return [{"id": i, "name": f"Boss {i}", "hp": 1000 + (i*500)} for i in range(22)]
```

## Step 3: Frontend Implementation (React + Phaser)

The frontend is a complex application combining React's UI capabilities with Phaser's rendering engine.

### 3.1 Project Structure
The `frontend/src` directory is organized by function:

```
src/
├── scenes/             # Phaser Scenes
│   ├── GameScene.ts        # Main gameplay loop
│   ├── MenuScene.ts        # Main menu
│   ├── BossGalleryScene.ts # Boss viewing gallery
│   ├── DQNTrainingScene.ts # AI training visualization
│   └── ... (Shop, Inventory, Leaderboard)
├── utils/              # Game Logic & Managers
│   ├── WorldGenerator.ts   # Procedural terrain
│   ├── DQNAgent.ts         # Reinforcement Learning AI
│   ├── ControlManager.ts   # Gamepad/Keyboard unifier
│   ├── AudioManager.ts     # Sound management
│   └── ... (MLAIPlayer, GameplayRecorder)
├── services/           # Networking
│   └── api.ts              # Backend API calls
└── App.tsx             # React UI Overlay
```

### 3.2 Initialize Vite Project
```bash
cd ../frontend
npm create vite@latest . -- --template react-ts
pnpm install phaser axios react-router-dom @tensorflow/tfjs
```

### 3.3 The Infinite World Generator (`frontend/src/utils/WorldGenerator.ts`)
The heart of the game is the procedural generation system. Instead of a static level, we generate "chunks" of terrain on the fly.

```typescript
import Phaser from 'phaser'

export class WorldGenerator {
  // ...existing code...
  
  generateChunk(startX: number) {
    const tileSize = 70
    const chunkWidth = 800
    const floorY = 650
    
    // 1. Generate Platforms
    // We create 3-5 platforms per chunk with random heights
    const numPlatforms = Phaser.Math.Between(3, 5)
    
    for (let i = 0; i < numPlatforms; i++) {
      const x = startX + Phaser.Math.Between(0, chunkWidth)
      const y = floorY - Phaser.Math.Between(100, 400)
      
      // Create platform sprite
      const platform = this.scene.add.sprite(x, y, 'metalMid')
      this.scene.physics.add.existing(platform, true) // Static body
      this.platforms.add(platform)
      
      // 2. Spawn Entities (Probabilistic)
      this.spawnEntitiesOnPlatform(x, y)
    }
  }

  private spawnEntitiesOnPlatform(x: number, y: number) {
    // 20% chance for Enemy
    if (Math.random() < 0.2) {
      const enemy = this.scene.physics.add.sprite(x, y - 50, 'slime')
      // ... setup enemy AI ...
    }
    
    // 40% chance for Coin
    if (Math.random() < 0.4) {
      this.scene.add.sprite(x, y - 40, 'coin')
    }
  }
  
  update(playerX: number) {
    // Generate new chunks ahead of player
    if (playerX > this.lastGeneratedX - 1600) {
      this.generateChunk(this.lastGeneratedX)
      this.lastGeneratedX += 800
    }
    
    // Cleanup old chunks behind player to save memory
    // ... cleanup logic ...
  }
}
```

### 3.4 The Game Scene (`frontend/src/scenes/GameScene.ts`)
The `GameScene` is the central hub that orchestrates all other systems. It initializes physics, inputs, and the game loop.

**Key Responsibilities:**
1.  **Physics Setup**: Gravity, collisions, and world bounds.
2.  **Manager Initialization**: Instantiates `WorldGenerator`, `DQNAgent`, `ControlManager`, etc.
3.  **Update Loop**: Handles input, updates AI, and triggers world generation.

```typescript
import Phaser from 'phaser';
import { WorldGenerator } from '../utils/WorldGenerator';
import { DQNAgent } from '../utils/DQNAgent';
import { ControlManager } from '../utils/ControlManager';

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private worldGenerator!: WorldGenerator;
    private dqnAgent!: DQNAgent;
    private controls!: ControlManager;
    
    create() {
        // 1. Setup Physics World
        this.physics.world.gravity.y = 1000; // Heavy gravity for platformer feel
        
        // 2. Create Player
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setCollideWorldBounds(false); // Infinite world
        
        // 3. Initialize Systems
        this.controls = new ControlManager(this);
        this.worldGenerator = new WorldGenerator(this, this.platforms, ...);
        this.dqnAgent = new DQNAgent(this);
        
        // 4. Setup Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    }

    update(time: number, delta: number) {
        // 1. Handle Input (Human or AI)
        if (this.aiEnabled) {
            const state = this.extractGameState();
            const action = this.dqnAgent.selectAction(state);
            this.applyAction(action);
        } else {
            // Use ControlManager for unified Gamepad/Keyboard input
            const input = this.controls.getInput();
            this.handlePlayerMovement(input);
        }
        
        // 2. Infinite Generation
        this.worldGenerator.update(this.player.x);
        
        // 3. Game Over Check
        if (this.player.y > 800) {
            this.restartGame();
        }
    }
}
```

### 3.5 AI Integration (`frontend/src/utils/DQNAgent.ts`)
We implement a Deep Q-Network using TensorFlow.js to learn how to play.

```typescript
import * as tf from '@tensorflow/tfjs'

export class DQNAgent {
    private policyNet: tf.Sequential
    private targetNet: tf.Sequential
    
    constructor() {
        // Neural Network Architecture
        this.policyNet = tf.sequential();
        this.policyNet.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [14] })); // 14 inputs
        this.policyNet.add(tf.layers.dense({ units: 128, activation: 'relu' }));
        this.policyNet.add(tf.layers.dense({ units: 9 })); // 9 actions (Left, Right, Jump, Shoot combinations)
        
        // ... compile model ...
    }

    async train(batchSize: number) {
        // 1. Sample from Replay Buffer
        const batch = this.getBatch(batchSize);
        
        // 2. Calculate Loss (Bellman Equation)
        // Q(s,a) = r + gamma * max(Q(s', a'))
        
        // 3. Backpropagate
        await this.policyNet.fit(batch.states, batch.targets, { epochs: 1 });
    }
}
```

### 3.6 React UI Overlay (`frontend/src/App.tsx`)
React sits "on top" of the Phaser canvas, providing complex UI elements like the HUD, menus, and training dashboards.

```tsx
import { useState, useEffect } from 'react';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import MenuScene from './scenes/MenuScene';
import DQNTrainingScene from './scenes/DQNTrainingScene';

function App() {
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Initialize Phaser Game
    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      scene: [MenuScene, GameScene, DQNTrainingScene],
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 1000 } }
      }
    };
    const newGame = new Phaser.Game(config);
    setGame(newGame);
    
    return () => newGame.destroy(true);
  }, []);

  return (
    <div className="app-container">
      <div id="phaser-container" />
      {/* React UI Overlay */}
      <div className="hud-overlay">
        <div className="score">Score: {score}</div>
        {/* Other React Components */}
      </div>
    </div>
  );
}
```

## Step 4: Connecting the Systems

### 4.1 API Service (`frontend/src/services/api.ts`)
Create a bridge between Phaser and FastAPI.

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const GameAPI = {
    getBosses: async () => {
        const res = await axios.get(`${API_URL}/bosses`);
        return res.data;
    },
    submitScore: async (name: string, score: number) => {
        await axios.post(`${API_URL}/scores`, { name, score });
    }
};
```

## Step 5: Running the Game

Create automation scripts to launch everything together.

### 5.1 Start Script (`scripts/start.ps1`)
```powershell
# Start Backend
Start-Process -FilePath "python" -ArgumentList "-m uvicorn main:app --reload" -WorkingDirectory "../backend"

# Start Frontend
Start-Process -FilePath "pnpm" -ArgumentList "dev" -WorkingDirectory "../frontend"
```

### 5.2 Launch
Run the script and open `http://localhost:3000` in your browser.

```powershell
.\scripts\start.ps1
```

---

*This guide summarizes the technical achievements of the JumpJumpJump project. For detailed implementation specifics, refer to the individual PRP documents in the `PRPs/` directory.*
