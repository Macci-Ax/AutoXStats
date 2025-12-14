"""Investigate Orphan Result vs Hoope Event"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== CURRENT HOOPE EVENT ===")
cursor.execute("SELECT id, name, date FROM events WHERE name LIKE '%Hoope%' AND strftime('%Y', date)='2024'")
row = cursor.fetchone()
if row:
    print(f"ID: {row[0]}, Name: {row[1]}, Date: {row[2]}")
else:
    print("Hoope 2024 NOT FOUND in events table")

print("\n=== ORPHAN RESULTS FOR MANUEL ===")
cursor.execute("SELECT id FROM drivers WHERE name LIKE '%Manuel%Friedewald%'")
did = cursor.fetchone()[0]

cursor.execute("""
    SELECT rr.id, rr.event_id, rr.points, rr.championship_points, rr.rank
    FROM race_results rr
    LEFT JOIN events e ON rr.event_id = e.id
    WHERE rr.driver_id = ? AND e.id IS NULL
""", (did,))

orphans = cursor.fetchall()
for row in orphans:
    print(f"Orphan ID: {row[0]}")
    print(f"  EventID (Bad): {row[1]}")
    print(f"  Points: {row[2]}")
    print(f"  Champ Pts: {row[3]}")
    print(f"  Rank: {row[4]}")

conn.close()
