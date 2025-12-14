"""Strict deduplication of ranks in Sachsenberg 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Get Sachsenberg 2024 event ID
cursor.execute("SELECT id FROM events WHERE name LIKE '%Sachsenberg%' AND strftime('%Y', date)='2024'")
eid = cursor.fetchone()[0]
print(f"Sachsenberg 2024 Event ID: {eid}")

# Find duplicated ranks
print("--- Finding duplicates ---")
cursor.execute("""
    SELECT rank, COUNT(*) as c
    FROM race_results 
    WHERE event_id=? AND class_id='d_lang'
    GROUP BY rank
    HAVING c > 1
""", (eid,))
dupes = cursor.fetchall()

deleted = 0
for rank, count in dupes:
    print(f"Rank {rank} has {count} entries. Keeping 1, deleting {count-1}.")
    # Keep the one with the longest driver name (heuristic for better parsing?)
    # Get IDs and driver names
    cursor.execute("""
        SELECT rr.id, d.name
        FROM race_results rr
        JOIN drivers d ON rr.driver_id = d.id
        WHERE rr.event_id=? AND rr.class_id='d_lang' AND rr.rank=?
    """, (eid, rank))
    rows = cursor.fetchall()
    # Sort by name length descending
    rows.sort(key=lambda x: len(x[1]), reverse=True)
    keeper = rows[0]
    to_delete = rows[1:]
    
    print(f"  Keeping: {keeper[1]} (ID: {keeper[0]})")
    for row in to_delete:
        print(f"  Deleting: {row[1]} (ID: {row[0]})")
        cursor.execute("DELETE FROM race_results WHERE id=?", (row[0],))
        deleted += 1

print(f"Deleted {deleted} rows.")
conn.commit()
conn.close()
