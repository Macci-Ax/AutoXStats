"""
Clean up and verify all events.
- Look for duplicate Itterbeck events
- Remove dummy events with 0 results
- Verify total point counts
"""
import sqlite3

DB_PATH = 'autox.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("=== ALL EVENTS WITH RESULT COUNTS ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, e.status, 
           COUNT(rr.id) as result_count,
           SUM(CASE WHEN rr.license_type = 'TL' THEN 1 ELSE 0 END) as tl_count
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    GROUP BY e.id
    ORDER BY e.date
""")
events = cursor.fetchall()
for e in events:
    print(f"  {e[0]}: {e[1]} ({e[2]}) - {e[3]} - {e[4]} results ({e[5]} TL)")

# Find and remove events with 0 results
print("\n=== CLEANING UP EVENTS WITH 0 RESULTS ===")
cursor.execute("""
    SELECT e.id, e.name FROM events e
    WHERE NOT EXISTS (SELECT 1 FROM race_results rr WHERE rr.event_id = e.id)
""")
empty_events = cursor.fetchall()
for e in empty_events:
    print(f"  Deleting empty event: {e[0]} - {e[1]}")
    cursor.execute("DELETE FROM events WHERE id = ?", (e[0],))

conn.commit()

# Final event list
print("\n=== FINAL EVENTS ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as cnt
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    GROUP BY e.id
    ORDER BY e.date
""")
for e in cursor.fetchall():
    print(f"  {e[0]}: {e[1]} ({e[2]}) - {e[3]} results")

# Final standings check
print("\n=== TOP 10 LANGSTRECKE (should match official) ===")
cursor.execute("""
    SELECT d.name, SUM(rr.championship_points) as total
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    WHERE rr.class_id = 'd_lang'
    GROUP BY rr.driver_id
    ORDER BY total DESC
    LIMIT 10
""")
for i, r in enumerate(cursor.fetchall(), 1):
    print(f"  {i}. {r[0]}: {r[1]} pts")

conn.close()
print("\nDone!")
