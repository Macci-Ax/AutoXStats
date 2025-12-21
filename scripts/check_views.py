import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()
cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='view';")
views = cursor.fetchall()
for view in views:
    print(f"View: {view[0]}")
    print(f"Definition: {view[1]}")
    print("-" * 20)

# Also check physical_events content
print("\n=== PHYSICAL EVENTS ===")
try:
    cursor.execute("SELECT id, title, start_date FROM physical_events WHERE title LIKE '%Sachsenberg%' OR title LIKE '%Herbern%'")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print(f"Error querying physical_events: {e}")

conn.close()
