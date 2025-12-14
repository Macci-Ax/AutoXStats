"""Delete ALL 2024 data to prepare for clean re-import"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== DELETING 2024 DATA ===")

# Count before
cursor.execute("SELECT COUNT(*) FROM events WHERE strftime('%Y', date) = '2024'")
events_count = cursor.fetchone()[0]
print(f"Found {events_count} events for 2024")

cursor.execute("""
    SELECT COUNT(*) 
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    WHERE strftime('%Y', e.date) = '2024'
""")
results_count = cursor.fetchone()[0]
print(f"Found {results_count} race results for 2024")

# Delete results
cursor.execute("""
    DELETE FROM race_results 
    WHERE event_id IN (SELECT id FROM events WHERE strftime('%Y', date) = '2024')
""")
print(f"Deleted {cursor.rowcount} race results")

# Delete events
cursor.execute("DELETE FROM events WHERE strftime('%Y', date) = '2024'")
print(f"Deleted {cursor.rowcount} events")

conn.commit()
conn.close()
