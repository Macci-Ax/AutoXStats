"""Check duplicated ranks in Sachsenberg 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== SACHSENBERG 2024 RANK 1 ===")
cursor.execute("""
    SELECT d.name, d.team, rr.points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Sachsenberg%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang' AND rr.rank = 1
""")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}) - {row[2]}")

print("\n=== SACHSENBERG 2024 RANK 4 ===")
cursor.execute("""
    SELECT d.name, d.team, rr.points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Sachsenberg%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang' AND rr.rank = 4
""")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}) - {row[2]}")

conn.close()
