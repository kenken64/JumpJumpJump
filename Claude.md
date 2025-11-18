# JumpJumpJump - Technology Stack

## Frontend
- **React** - UI framework for building the game interface
- **Phaser** - HTML5 game framework for game mechanics and rendering

## Backend
- **FastAPI** - Modern, fast Python web framework for building APIs
- **SQLite** - Lightweight, serverless database for data persistence

## Architecture Overview

### Frontend Stack
The frontend combines React's component-based architecture with Phaser's powerful game engine capabilities. React handles the UI layer (menus, HUD, overlays) while Phaser manages the core game loop, physics, and rendering.

### Backend Stack
FastAPI provides a high-performance REST API with automatic documentation and async support. SQLite serves as the database for storing game data, user information, and scores without requiring a separate database server.

## Key Features of Each Technology

### React
- Component-based architecture
- Virtual DOM for efficient updates
- Rich ecosystem of libraries and tools

### Phaser
- WebGL and Canvas rendering
- Built-in physics engines
- Asset loading and management
- Scene management system

### FastAPI
- Automatic API documentation (Swagger/OpenAPI)
- Async/await support
- Type hints and validation with Pydantic
- High performance (comparable to Node.js and Go)

### SQLite
- Zero configuration
- Serverless architecture
- ACID compliant
- Cross-platform compatibility
