# Tutorial: JumpJumpJump

JumpJumpJump is an *exciting web-based platformer game* where players **jump and shoot through endless, procedurally generated levels**. It features **challenging boss fights**, *online leaderboards* for global competition, and even a **DQN AI agent that learns to play** the game on its own. Players can also enjoy **local and online co-op** modes, all built with React, Phaser, and a FastAPI backend.


## Visual Overview

```mermaid
flowchart TD
    A0["Phaser Scene System
"]
    A1["World Generator
"]
    A2["Player & Combat System
"]
    A3["DQN AI Agent
"]
    A4["FastAPI Backend
"]
    A5["Multiplayer System
"]
    A6["UI Manager
"]
    A0 -- "Orchestrates Generation" --> A1
    A0 -- "Manages Player Logic" --> A2
    A0 -- "Hosts Training" --> A3
    A0 -- "Interacts With" --> A4
    A0 -- "Integrates Co-op" --> A5
    A0 -- "Initializes & Updates" --> A6
    A1 -- "Spawns Entities For" --> A2
    A1 -- "Informs Display Of" --> A6
    A2 -- "Controlled By" --> A3
    A2 -- "Managed By" --> A5
    A3 -- "Observes Game State" --> A0
    A4 -- "Supports Online Rooms" --> A5
    A5 -- "Provides Stats To" --> A6
```

## Chapters

1. [Player & Combat System
](01_player___combat_system_.md)
2. [Phaser Scene System
](02_phaser_scene_system_.md)
3. [World Generator
](03_world_generator_.md)
4. [UI Manager
](04_ui_manager_.md)
5. [Multiplayer System
](05_multiplayer_system_.md)
6. [FastAPI Backend
](06_fastapi_backend_.md)
7. [DQN AI Agent
](07_dqn_ai_agent_.md)