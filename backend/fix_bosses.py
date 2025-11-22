import sqlite3

# Connect to database
conn = sqlite3.connect('game.db')
cursor = conn.cursor()

# Check current boss count
cursor.execute('SELECT COUNT(*) FROM bosses')
current_count = cursor.fetchone()[0]
print(f'Current bosses in database: {current_count}')

if current_count < 22:
    print(f'Missing {22 - current_count} bosses! Adding them...')
    
    # Get existing boss indices
    cursor.execute('SELECT boss_index FROM bosses ORDER BY boss_index')
    existing_indices = set(row[0] for row in cursor.fetchall())
    
    # Full list of 22 bosses
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
    
    # Add missing bosses
    for idx, (name, title) in enumerate(boss_names):
        if idx not in existing_indices:
            print(f'Adding boss {idx}: {name}')
            cursor.execute("""
                INSERT INTO bosses (boss_index, boss_name, notorious_title, frame_x, frame_y)
                VALUES (?, ?, ?, ?, ?)
            """, (idx, name, title, 0, 0))
    
    conn.commit()
    print('✅ Database updated!')
else:
    print('✅ All 22 bosses are present!')

# Show all bosses
cursor.execute('SELECT boss_index, boss_name, notorious_title FROM bosses ORDER BY boss_index')
rows = cursor.fetchall()

print(f'\nAll {len(rows)} bosses:')
for row in rows:
    print(f'{row[0]:2d}. {row[1]} - {row[2]}')

conn.close()
