"""Verify Hoope and Löhne for Manuel"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== CHECKING HOOPE (HELLINGST) AND LÖHNE ===")
cursor.execute("""
    SELECT e.name, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND rr.class_id = 'd_lang' 
    AND (e.name LIKE '%Hoope%' OR e.name LIKE '%Löhne%')
    AND strftime('%Y', e.date) = '2024'
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: Rank {row[1]}, Pts {row[2]}")
