# PRP: Ending Scene Implementation

## Problem Statement
The game requires a narrative conclusion to reward players who complete the game. This scene should provide closure to the story, display credits or narrative text, and handle the transition back to the main menu while cleaning up game state (save files) to allow for a fresh start.

## Requirements
- Display a scrolling story text (Star Wars style or vertical scroll)
- "The Chrysalis Protocol" narrative content
- Starfield background animation
- Background music specific to the ending
- Skip functionality (Button and ESC key)
- Automatic return to menu after text finishes
- Cleanup of save data (localStorage) upon completion

## Proposed Solution

### Architecture
1. **Scene**: `EndingScene.ts` extending `Phaser.Scene`.
2. **Visuals**: 
   - Procedural starfield generation (200+ stars with varying speeds/sizes).
   - Text object with word wrap and specific styling (Yellow/Gold color).
3. **Audio**: 
   - Stop all previous game sounds.
   - Play `music_ending` track.
4. **State Management**:
   - Clear `player_name`, `defeatedBossLevels`, and boss records from `localStorage`.

## Implementation Details

### 1. Scene Structure (`frontend/src/scenes/EndingScene.ts`)
- **preload()**: Loads the ending music.
- **create()**: 
  - Sets black background.
  - Generates starfield using `add.circle`.
  - Creates the story text with `The Chrysalis Protocol` content.
  - Adds a "SKIP [ESC]" button.
  - Sets up input listeners.
  - Clears save data.
- **update()**:
  - Scrolls the text upward based on `delta` time.
  - Checks if text has scrolled off-screen to trigger `returnToMenu`.

### 2. Narrative Content
The story "The Chrysalis Protocol" describes Dr. Maya Chen's transformation and her journey on Kepler-442b. It touches on themes of humanity, transformation, and the choice to return home.

### 3. Technical Specifications
- **Scroll Speed**: 50 pixels per second (adjustable).
- **Text Style**:
  - Font: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif
  - Size: 32px
  - Color: #FFE81F (Star Wars Yellow)
  - Align: Justify
  - Word Wrap: 60% of screen width
- **Starfield**:
  - 200 stars
  - Random positions (x, y)
  - Random alpha (0.5 - 1.0)
  - Parallax effect (not fully implemented, but stars are static in current version, text moves).

### 4. Save Data Cleanup
When the ending scene starts, the following `localStorage` keys are removed to reset the game progress:
- `player_name`
- `defeatedBossLevels`
- `boss_record_*`

## Files Created/Modified
- `frontend/src/scenes/EndingScene.ts`
- `frontend/src/__tests__/ending-scene.test.ts`
