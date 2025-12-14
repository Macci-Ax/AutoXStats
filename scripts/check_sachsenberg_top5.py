"""Check Sachsenberg 2024 top 5"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== SACHSENBERG 2024 TOP 5 ===")
cursor.execute("""
    SELECT rr.rank, d.name, rr.points, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Sachsenberg%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang'
    ORDER BY rr.rank
    LIMIT 5
""")
for row in cursor.fetchall():
    print(f"  Rank {row[0]}: {row[1]} (Pts {row[2]}, Champ {row[3]})")
conn.close()
