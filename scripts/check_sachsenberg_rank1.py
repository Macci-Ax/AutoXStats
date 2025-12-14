"""Check Rank 1 drivers in Sachsenberg 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== SACHSENBERG 2024 RANK 1 ===")
cursor.execute("""
    SELECT d.name, rr.rank, rr.points, rr.championship_points, rr.license_type
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Sachsenberg%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang' AND rr.rank = 1
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: Rank {row[1]}, Pts {row[2]}, Champ {row[3]}, Lic {row[4]}")

conn.close()
