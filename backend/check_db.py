import sqlite3

conn = sqlite3.connect('game.db')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM scores')
count = cursor.fetchone()[0]
print(f'Total scores in database: {count}')

cursor.execute('SELECT player_name, score, game_mode, created_at FROM scores ORDER BY score DESC LIMIT 10')
rows = cursor.fetchall()

print('\nTop 10 scores:')
for i, row in enumerate(rows, 1):
    print(f'{i}. {row[0]} - Score: {row[1]} - Mode: {row[2]} - Date: {row[3]}')

conn.close()
