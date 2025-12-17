import sqlite3

conn = sqlite3.connect('autox.db')
cur = conn.cursor()

print('=== Drivers matching Hönicke ===')
for r in cur.execute("SELECT * FROM drivers WHERE name LIKE '%Hönicke%'").fetchall():
    print(r)

print('\n=== Participations ===')
# Joined with classes to see which class specifically
for r in cur.execute("""
    SELECT dp.class_id, c.name, dp.points, dp.rank, d.name, d.id
    FROM driver_participations dp 
    JOIN drivers d ON dp.driver_id = d.id 
    JOIN classes c ON dp.class_id = c.id 
    WHERE d.name LIKE '%Hönicke%'
""").fetchall():
    print(r)

print('\n=== Race Results ===')
for r in cur.execute("""
    SELECT rr.id, rr.class_id, rr.championship_points, rr.rank, d.name
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    WHERE d.name LIKE '%Hönicke%'
""").fetchall():
    print(r)

conn.close()
