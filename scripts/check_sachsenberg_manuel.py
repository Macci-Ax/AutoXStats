"""Check Sachsenberg 2024 results for Manuel Friedewald"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== SACHSENBERG 2024 RESULTS ===")
cursor.execute("""
    SELECT e.name, e.date, rr.rank, rr.points, rr.championship_points, rr.total_time, rr.laps
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND e.name LIKE '%Sachsenberg%'
    ORDER BY e.date
""")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}): Rank {row[2]}, Pts {row[3]}, Champ {row[4]}, Laps {row[6]}")

conn.close()
