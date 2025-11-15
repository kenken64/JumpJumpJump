# Level Editor Guide

## Overview

The Level Editor allows you to create custom levels with complete control over traffic patterns, speeds, and difficulty. Create your own challenges and share them!

## Accessing the Level Editor

1. Launch the game
2. From the main menu, select **"Level Editor"**

## Creating a Level

### Step 1: Add Lanes

Click the **"+ Add Lane"** button to add traffic lanes to your level.

- **Maximum Lanes**: 8
- **Lane Direction**: Automatically alternates (right → left → right...)
- **Default Settings**: Each new lane starts with balanced settings

### Step 2: Configure Lane Properties

Click on any lane in the list to edit its properties:

#### Vehicle Type
- Choose from 15 different vehicle types
- Each vehicle has unique visual appearance
- Available vehicles:
  - ambulance, truck, police, taxi, bus
  - sedan, sports_red, sports_green, sports_yellow
  - van, suv, convertible, firetruck, hotdog, tractor

#### Speed
- **Range**: 25 - 500 pixels/second
- **Adjust**: Use +/- buttons to change speed by 25 px/s
- **Low Speed** (25-100): Easy to dodge
- **Medium Speed** (100-200): Moderate challenge
- **High Speed** (200-350): Difficult
- **Extreme Speed** (350-500): Expert only!

#### Direction
- **Right (→)**: Vehicles move left to right
- **Left (←)**: Vehicles move right to left
- **Toggle**: Click the ↔ button to flip direction

#### Spawn Interval
- **Default**: 3000ms (3 seconds between spawns)
- Controls how frequently vehicles appear
- Lower values = more traffic = harder

### Step 3: Arrange Lanes

Use the preview panel to see your lane configuration:
- Preview shows vehicle sprites
- Arrows indicate direction
- Visual spacing represents actual game layout

### Step 4: Fine-Tune Difficulty

**For Easy Levels:**
- 3-5 lanes
- Speed: 50-120 px/s
- Spawn: 3000-5000ms
- Mix of directions

**For Medium Levels:**
- 5-7 lanes
- Speed: 120-200 px/s
- Spawn: 2000-3500ms
- Varied vehicle types

**For Hard Levels:**
- 7-8 lanes
- Speed: 200-350 px/s
- Spawn: 1500-2500ms
- Fast alternating patterns

**For Expert Levels:**
- 8 lanes (max)
- Speed: 350-500 px/s
- Spawn: 1000-2000ms
- Chaotic patterns!

## Editor Controls

### Control Panel Buttons

| Button | Function |
|--------|----------|
| **+ Add Lane** | Add a new traffic lane (max 8) |
| **- Remove Lane** | Delete the last lane |
| **Clear All** | Remove all lanes (start fresh) |
| **Save Level** | Save your level to browser storage |
| **Test Level** | Play your level immediately |
| **Back to Menu** | Return to main menu (unsaved changes lost) |

### Lane Edit Controls

| Control | Function |
|---------|----------|
| **Speed +** | Increase speed by 25 px/s |
| **Speed -** | Decrease speed by 25 px/s |
| **Direction ↔** | Toggle between left/right |

## Saving Your Level

1. Configure all lanes to your liking
2. Click **"Save Level"** button
3. Level is saved to browser's local storage
4. Confirmation message appears

**Level Metadata:**
- **Name**: "My Custom Level" (default)
- **Author**: "Player"
- **Lanes**: Number of configured lanes
- **Timestamp**: Auto-generated

## Testing Your Level

Click **"Test Level"** to immediately play your creation:
- Opens in a temporary test session
- Same gameplay as campaign mode
- 3 lives, score tracking
- Press ESC to exit back to editor

**Tips for Testing:**
- Test early and often
- Ensure level is beatable
- Check spawn timing doesn't create impossible gaps
- Verify speeds are appropriate

## Playing Custom Levels

1. Return to main menu
2. Select **"Custom Levels"**
3. Choose your saved level
4. Click **"Play"** to start

## Managing Custom Levels

### Custom Levels Menu

From the Custom Levels screen you can:
- **View All Saved Levels**: See name, author, lane count
- **Play Level**: Start playing immediately
- **Delete Level**: Remove unwanted levels

### Level List Information

Each level card shows:
- Level name
- Author name
- Number of lanes
- Play and Delete buttons

## Storage Information

**Where are levels stored?**
- Browser's localStorage
- Survives browser restarts
- Specific to your browser/computer

**Storage Limits:**
- Depends on browser (typically 5-10MB)
- Each level is very small (~1KB)
- Can store hundreds of levels

**Clearing Data:**
- Deleting browser data clears levels
- Export/import feature coming soon!

## Level Design Tips

### Creating Balanced Levels

1. **Progressive Difficulty**: Start easy, get harder
2. **Safe Spaces**: Leave gaps for player to rest
3. **Pattern Recognition**: Create learnable patterns
4. **Visual Variety**: Use different vehicle types
5. **Test Thoroughly**: Make sure it's beatable!

### Common Mistakes to Avoid

❌ **Too Many Fast Lanes**: Unbeatable
❌ **No Gaps**: Player can't cross
❌ **Too Slow**: Boring
❌ **Same Vehicle Type**: Visually dull
❌ **Inconsistent Spawns**: Frustrating randomness

### Level Archetypes

**The Speedway**
- All lanes same direction
- Varying speeds
- Tests timing

**The Zigzag**
- Alternating directions
- Similar speeds
- Tests positioning

**The Gauntlet**
- Fast outer lanes
- Slow center lanes
- Tests nerve

**The Puzzle**
- Specific patterns
- Memorization required
- Tests learning

## Advanced Techniques

### Creating "Waves"

Set spawn intervals to create synchronized waves:
- All lanes: 2000ms spawn
- Creates rhythmic pattern
- Player can time movements

### Speed Gradients

Arrange lanes by speed:
- Bottom to top: 50, 100, 150, 200, 250...
- Progressive difficulty
- Natural learning curve

### Direction Patterns

**Alternating**: R-L-R-L-R-L
**Blocked**: R-R-L-L-R-R
**Chaos**: R-R-R-L-R-L-L-R

### Vehicle Theming

Create themed levels:
- **Emergency**: ambulance, police, firetruck
- **Commercial**: taxi, bus, truck
- **Sports**: sports_red, sports_green, convertible
- **Heavy**: truck, bus, van

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Click | Select/edit lane |
| ESC | Exit to menu |

## Troubleshooting

**"Maximum 8 lanes allowed!"**
- Remove a lane before adding more

**"Add lanes first!"**
- Can't save/test empty levels
- Add at least 1 lane

**"No lanes to remove!"**
- All lanes already cleared

**Level too hard?**
- Reduce speeds
- Increase spawn intervals
- Add more gaps between patterns

**Level too easy?**
- Increase speeds
- Decrease spawn intervals
- Add more lanes
- Use more varied directions

## Example Levels

### Beginner's First
- 3 lanes
- Speeds: 75, 100, 75
- Spawn: 4000ms all
- Directions: R-L-R

### Rush Hour
- 6 lanes
- Speeds: 150, 180, 160, 170, 155, 165
- Spawn: 2500ms all
- Directions: R-L-R-L-R-L

### The Impossible Dream
- 8 lanes
- Speeds: 400-500 (random)
- Spawn: 1200ms all
- Directions: Chaotic mix

## Future Features (Coming Soon)

- Level naming interface
- Custom background colors
- Import/export levels (share with friends)
- Level difficulty rating
- Community level sharing
- More vehicle unlock system
- Sound effect customization

## Need Help?

If you create an interesting level:
1. Test it thoroughly
2. Share screenshots
3. Describe the challenge

Happy level editing! 🎮🚗
