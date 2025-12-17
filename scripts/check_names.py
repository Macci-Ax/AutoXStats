import sqlite3

conn = sqlite3.connect('autox.db')
cur = conn.cursor()

print('=== Formatted WACV Driver Names (Sample) ===')
for r in cur.execute("SELECT name FROM drivers WHERE id LIKE 'w_%' ORDER BY name LIMIT 15").fetchall():
    print(f'  {r[0]}')

conn.close()
