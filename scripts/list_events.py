import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== ALL PHYSICAL EVENTS ===")
try:
    cursor.execute("SELECT id, title, start_date FROM physical_events")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print(e)

conn.close()
