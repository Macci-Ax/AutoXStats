"""Check Herbern result for Manuel"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== HERBERN 2024 MANUEL ===")
cursor.execute("""
    SELECT e.name, rr.rank, rr.points, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND e.name LIKE '%Herbern%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang'
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: Rank {row[1]}, Pts {row[2]}, Champ {row[3]}")
    
conn.close()
