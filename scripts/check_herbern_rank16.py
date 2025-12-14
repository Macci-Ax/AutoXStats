"""Check Rank 16 in Herbern 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== HERBERN 2024 RANK 16 ===")
cursor.execute("""
    SELECT d.name, rr.rank, rr.points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Herbern%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang' AND rr.rank = 16
""")
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"  Rank {row[1]}: {row[0]} (Pts {row[2]})")
else:
    print("  Rank 16 is empty.")

print("=== HERBERN 2024 RANK 17 ===")
cursor.execute("""
    SELECT d.name, rr.rank, rr.points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Herbern%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang' AND rr.rank = 17
""")
for row in cursor.fetchall():
    print(f"  Rank {row[1]}: {row[0]} (Pts {row[2]})")

conn.close()
