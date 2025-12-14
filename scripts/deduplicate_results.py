"""Deduplicate race_results for 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== CHECKING FOR DUPLICATE RESULTS IN 2024 ===")
cursor.execute("""
    SELECT rr.event_id, rr.driver_id, rr.class_id, COUNT(*) as c
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    WHERE strftime('%Y', e.date) = '2024'
    GROUP BY rr.event_id, rr.driver_id, rr.class_id
    HAVING c > 1
""")
duplicates = cursor.fetchall()
print(f"Found {len(duplicates)} duplicate driver entries.")

count = 0
for row in duplicates:
    eid, did, cid, c = row
    # Keep one, delete others
    cursor.execute("""
        SELECT id FROM race_results 
        WHERE event_id=? AND driver_id=? AND class_id=?
        LIMIT ? OFFSET 1
    """, (eid, did, cid, c-1))
    to_delete = cursor.fetchall()
    
    for (rid,) in to_delete:
        cursor.execute("DELETE FROM race_results WHERE id=?", (rid,))
        count += 1

print(f"Deleted {count} duplicate result rows.")
conn.commit()
conn.close()
