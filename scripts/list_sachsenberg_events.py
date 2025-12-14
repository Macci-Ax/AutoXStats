"""List all Sachsenberg 2024 events"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== SACHSENBERG 2024 EVENTS ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    WHERE e.name LIKE '%Sachsenberg%' AND strftime('%Y', e.date) = '2024'
    GROUP BY e.id
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} ({row[2]}) - {row[3]} results")

conn.close()
