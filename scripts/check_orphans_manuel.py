"""Check for orphan race results for Manuel Friedewald"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== CHECKING ORPHAN RESULTS ===")
cursor.execute("SELECT id FROM drivers WHERE name LIKE '%Manuel%Friedewald%'")
did = cursor.fetchone()[0]
print(f"Driver ID: {did}")

cursor.execute("""
    SELECT rr.id, rr.event_id, rr.points, rr.championship_points
    FROM race_results rr
    LEFT JOIN events e ON rr.event_id = e.id
    WHERE rr.driver_id = ? AND e.id IS NULL
""", (did,))

orphans = cursor.fetchall()
if orphans:
    print(f"FOUND {len(orphans)} ORPHAN RESULTS:")
    for row in orphans:
        print(f"  ID: {row[0]}, EventID: {row[1]}, Pts: {row[2]}, Champ: {row[3]}")
else:
    print("No orphan results found.")

conn.close()
