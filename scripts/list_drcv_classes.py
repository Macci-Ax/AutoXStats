import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== All DRCV Classes in Database ===\n")
cursor.execute("SELECT id, name FROM classes WHERE championship_id = 'DRCV' ORDER BY id")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
