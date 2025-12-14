"""Check Hoope 2024 result for Manuel"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== HOOPE 2024 MANUEL FRIEDEWALD ===")
cursor.execute("""
    SELECT e.name, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND rr.class_id = 'd_lang' 
    AND e.name LIKE '%Hoope%'
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: Rank {row[1]}, Pts {row[2]}")

print("\n=== EXPECTED ===")
print("  Rank 4 -> 27 pts (according to Langstrecke table)")
print("  Rank 8 -> 19 pts")

conn.close()
