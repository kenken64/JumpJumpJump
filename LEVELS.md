# Level System Documentation

## Overview

Jump Jump Jump features a progressive difficulty system with unlimited levels. The game gets progressively harder as you advance through levels, with increasing traffic speeds, more lanes, and faster vehicle spawning.

## Level Requirements

- **Goals per Level**: Reach the goal zone 3 times to advance to the next level
- **Lives**: You start with 3 lives and keep them between levels
- **Score Multiplier**: Increases with each level

## Difficulty Tiers

### 🟢 EASY (Levels 1-3)
**Level 1: Easy Street**
- Lanes: 5
- Speed Range: 50-90 px/s
- Spawn Interval: 2.4-4.4s
- Score Multiplier: 1x
- Background: Light blue (#87ceeb)
- Available Vehicles: 6 types

**Level 2: Easy Street**
- Lanes: 6
- Speed Range: 60-100 px/s
- Spawn Interval: 2.3-4.3s
- Score Multiplier: 2x
- Available Vehicles: 7 types

**Level 3: Easy Street**
- Lanes: 7
- Speed Range: 70-110 px/s
- Spawn Interval: 2.2-4.2s
- Score Multiplier: 3x
- Available Vehicles: 8 types

---

### 🟡 MEDIUM (Levels 4-6)
**Level 4: Busy Highway**
- Lanes: 7
- Speed Range: 120-160 px/s
- Spawn Interval: 1.9-3.3s
- Score Multiplier: 4x
- Background: Medium blue (#7ba8d4)
- Available Vehicles: 9 types

**Level 5: Busy Highway**
- Lanes: 8
- Speed Range: 135-175 px/s
- Spawn Interval: 1.85-3.25s
- Score Multiplier: 5x
- Available Vehicles: 10 types

**Level 6: Busy Highway**
- Lanes: 9
- Speed Range: 150-190 px/s
- Spawn Interval: 1.8-3.2s
- Score Multiplier: 6x
- Available Vehicles: 11 types

---

### 🟠 HARD (Levels 7-9)
**Level 7: Rush Hour**
- Lanes: 8
- Speed Range: 220-280 px/s
- Spawn Interval: 1.29-2.59s
- Score Multiplier: 7x
- Background: Dark blue (#6b95c4)
- Available Vehicles: 12 types

**Level 8: Rush Hour**
- Lanes: 8
- Speed Range: 240-300 px/s
- Spawn Interval: 1.26-2.56s
- Score Multiplier: 8x
- Available Vehicles: 13 types

**Level 9: Rush Hour**
- Lanes: 8
- Speed Range: 260-320 px/s
- Spawn Interval: 1.23-2.53s
- Score Multiplier: 9x
- Available Vehicles: 14 types

---

### 🔴 EXPERT (Level 10+)
**Level 10+: INSANE MODE**
- Lanes: 8 (max)
- Speed Range: Increases by 25 px/s per level
  - Level 10: 350-430 px/s
  - Level 15: 475-555 px/s
  - Level 20: 600-680 px/s
- Spawn Interval: Decreases by 20ms per level (minimum 800-1500ms)
- Score Multiplier: Level × 2 (Level 10 = 20x, Level 20 = 40x)
- Background: Navy blue (#5a7fb0)
- Available Vehicles: All 15 types

---

## Progression Formula

### Lane Count
```
Levels 1-3:  4 + level
Levels 4-6:  6 + (level - 3)
Levels 7+:   8 (maximum)
```

### Speed Range
```
Easy:    minSpeed = 40 + (level × 10), maxSpeed = 80 + (level × 10)
Medium:  minSpeed = 60 + (level × 15), maxSpeed = 100 + (level × 15)
Hard:    minSpeed = 80 + (level × 20), maxSpeed = 140 + (level × 20)
Expert:  minSpeed = 100 + (level × 25), maxSpeed = 180 + (level × 25)
```

### Spawn Intervals
```
Easy:    2500 - (level × 100) to 4500 - (level × 100)
Medium:  2000 - (level × 50) to 3500 - (level × 50)
Hard:    1500 - (level × 30) to 2800 - (level × 30)
Expert:  max(800, 1200 - (level × 20)) to max(1500, 2000 - (level × 20))
```

### Score Calculation
```
Easy:     100 × level
Medium:   100 × level
Hard:     100 × level
Expert:   100 × (level × 2)
```

## Vehicle Unlock System

As you progress through levels, more vehicle types become available:

- Level 1: 6 vehicles (ambulance, truck, police, taxi, bus, sedan)
- Level 2: 7 vehicles (adds sports_red)
- Level 3: 8 vehicles (adds van)
- Level 4: 9 vehicles (adds sports_green)
- Level 5: 10 vehicles (adds sports_yellow)
- Level 6: 11 vehicles (adds suv)
- Level 7: 12 vehicles (adds convertible)
- Level 8: 13 vehicles (adds firetruck)
- Level 9: 14 vehicles (adds hotdog)
- Level 10+: 15 vehicles (adds tractor)

## Visual Indicators

### Difficulty Colors
- **EASY**: Green (#00ff00)
- **MEDIUM**: Yellow (#ffff00)
- **HARD**: Orange (#ff9900)
- **EXPERT**: Red (#ff0000)

### Background Colors
- **Easy**: Sky Blue (#87ceeb)
- **Medium**: Medium Blue (#7ba8d4)
- **Hard**: Dark Blue (#6b95c4)
- **Expert**: Navy Blue (#5a7fb0)

## Level Transitions

When you complete a level (reach goal 3 times):

1. **Level Complete Screen** appears showing:
   - "LEVEL COMPLETE!" message
   - Current level number
   - Next level preview
   - 3-second display time

2. **Scene Restart** with new level configuration

3. **Level Intro Screen** shows:
   - Level name and number
   - Difficulty tier
   - Goal requirement (3 reaches)
   - 2-second display with fade-out

## Tips for High Levels

1. **Pattern Recognition**: Learn vehicle patterns and timing
2. **Stay Calm**: Don't rush, plan your movements
3. **Use Grid Movement**: Take advantage of the grid-based system
4. **Watch Spawn Times**: Higher levels have tighter spawn windows
5. **Multiple Lives**: Use all 3 lives strategically across levels

## Game Over

When all lives are lost:
- Displays final level reached
- Shows total score accumulated
- Option to restart from Level 1
- Level progress resets but you gain experience!

---

Good luck reaching the highest level! 🏆
