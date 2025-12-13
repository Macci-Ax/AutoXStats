"""Check Itterbeck event for dummy data"""
import sqlite3

DB_PATH = 'autox.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check Itterbeck events
print("=== ITTERBECK EVENTS ===")
cursor.execute("SELECT id, name, date, status FROM events WHERE name LIKE '%Itter%'")
events = cursor.fetchall()
for e in events:
    print(f"  {e[0]}: {e[1]} ({e[2]}) - status: {e[3]}")

# Check race results for Itterbeck
print("\n=== ITTERBECK RACE RESULTS ===")
for event in events:
    event_id = event[0]
    cursor.execute("""
        SELECT rr.class_id, rr.rank, d.name, rr.points, rr.championship_points, rr.license_type
        FROM race_results rr
        JOIN drivers d ON rr.driver_id = d.id
        WHERE rr.event_id = ?
        ORDER BY rr.class_id, rr.rank
        LIMIT 20
    """, (event_id,))
    results = cursor.fetchall()
    print(f"\n{event[1]} ({event_id}): {len(results)} results")
    if results:
        for r in results:
            print(f"  {r[0]}: rank {r[1]} - {r[2]} - pts: {r[3]}, champ: {r[4]}, license: {r[5]}")

# Does Itterbeck.pdf exist?
import os
pdf_path = 'pdf/2025/Itterbeck.pdf'
print(f"\n=== PDF CHECK ===")
print(f"Itterbeck.pdf exists: {os.path.exists(pdf_path)}")

# Check all events with result counts
print("\n=== ALL EVENTS WITH RESULT COUNTS ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, e.status, COUNT(rr.id) as result_count
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    GROUP BY e.id
    ORDER BY e.date
""")
for e in cursor.fetchall():
    print(f"  {e[0]}: {e[1]} ({e[2]}) - {e[3]} - {e[4]} results")

conn.close()
