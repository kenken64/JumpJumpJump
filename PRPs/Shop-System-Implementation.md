# PRP: Shop System Implementation

## Problem Statement
To provide a sense of progression and utility for collected coins, the game needs a shop system where players can purchase upgrades, new weapons, and cosmetic skins. This adds a meta-game loop of collecting resources to improve future runs.

## Requirements
- Display current coin balance
- List available items (Weapons, Skins, Powerups)
- Handle purchase transactions (deduct coins, unlock items)
- Persist purchased items across sessions
- Equip purchased items immediately or select them
- Paginated interface to support many items
- Visual feedback for affordable/unaffordable items

## Proposed Solution

### Architecture
1. **Scene**: `ShopScene.ts`
2. **Data Storage**: `localStorage` keys:
   - `player_coins`: Total coins available.
   - `purchased_items`: JSON array of unlocked item IDs.
   - `equipped_skin`: ID of currently selected skin.
   - `equipped_weapon`: ID of currently selected weapon.
3. **Item Types**:
   - **Weapons**: Change projectile behavior (Spread, Speed, Damage).
   - **Skins**: Change player sprite appearance.
   - **Powerups**: Consumables like Health Potions (restore lives).

## Implementation Details

### 1. Shop Items
The shop offers a variety of items with different costs:

#### Weapons
- **Basic Blaster** (Default): Standard projectile.
- **Rapid Fire** (500 coins): Faster shooting rate.
- **Spread Shot** (1000 coins): Fires 3 projectiles in a cone.
- **Laser Beam** (2000 coins): High speed, piercing projectile.

#### Skins
- **Blue Alien** (Default)
- **Green Alien** (200 coins)
- **Pink Alien** (500 coins)
- **Yellow Alien** (1000 coins)

#### Powerups
- **Health Potion** (100 coins): Restores 1 life (Consumable).

### 2. Interface Design
- **Grid Layout**: 2 rows x 3 columns (6 items per page).
- **Item Card**:
  - Icon (Procedurally generated or sprite).
  - Name & Price.
  - Buy/Equip button.
- **Navigation**: Previous/Next page buttons.
- **Feedback**:
  - "Buy" button grayed out if insufficient funds.
  - "Equipped" label for active items.
  - "Sold" label for non-consumable purchased items.

### 3. Technical Implementation
- **Procedural Icons**: Weapon icons are generated using `Phaser.Graphics` to avoid external asset dependencies for prototypes.
- **Transaction Logic**:
  ```typescript
  buyItem(item) {
    if (coins >= item.price) {
      coins -= item.price
      if (!item.consumable) {
        purchasedItems.add(item.id)
      }
      saveData()
      updateUI()
    }
  }
  ```

## Files Created/Modified
- `frontend/src/scenes/ShopScene.ts`
- `frontend/src/__tests__/shop-scene.test.ts`
