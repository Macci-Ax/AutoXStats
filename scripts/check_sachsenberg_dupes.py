"""Check for duplicate results in Sachsenberg 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== SACHSENBERG 2024 RESULT COUNT ===")
cursor.execute("""
    SELECT count(*) 
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Sachsenberg%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang'
""")
print(f"Total results: {cursor.fetchone()[0]}")

print("\n=== DUPLICATE RANKS? ===")
cursor.execute("""
    SELECT rr.rank, COUNT(*) as c
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Sachsenberg%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang'
    GROUP BY rr.rank
    HAVING c > 1
    ORDER BY rr.rank
""")
for row in cursor.fetchall():
    print(f"  Rank {row[0]}: {row[1]} entries")

print("\n=== MANUEL'S ENTRY === ")
cursor.execute("""
    SELECT rr.id, rr.driver_id, rr.rank
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' 
    AND e.name LIKE '%Sachsenberg%' 
    AND strftime('%Y', e.date) = '2024' 
    AND rr.class_id = 'd_lang'
""")
for row in cursor.fetchall():
    print(f"  ID: {row[0]}, DriverID: {row[1]}, Rank: {row[2]}")

conn.close()
