"""Find and remove ALL duplicate 2024 events by name pattern"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# List ALL 2024 Langstrecke events
print("=== ALL 2024 LANGSTRECKE EVENTS ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    JOIN race_results rr ON e.id = rr.event_id
    WHERE rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date
""")
events = cursor.fetchall()
for row in events:
    print(f"  {row[0]}: {row[1][:30]:30} ({row[2]}) - {row[3]} results")

print(f"\n  Total events: {len(events)}")

# Check for Eppe duplicates
print("\n=== EPPE EVENTS (ALL YEARS) ===")  
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    WHERE e.name LIKE '%Eppe%'
    GROUP BY e.id
    ORDER BY e.date
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1][:30]:30} ({row[2]}) - {row[3]} results")

# Delete the old Eppe 2024 manual import (the one with evt_eppe_)
print("\n=== REMOVING OLD MANUAL EPPE IMPORT ===")
cursor.execute("SELECT id FROM events WHERE id LIKE 'evt_eppe_%'")
old_eppe = cursor.fetchall()
for row in old_eppe:
    print(f"  Deleting {row[0]}")
    cursor.execute("DELETE FROM race_results WHERE event_id = ?", (row[0],))
    cursor.execute("DELETE FROM events WHERE id = ?", (row[0],))
conn.commit()

# Verify
print("\n=== 2024 LANGSTRECKE EVENTS AFTER CLEANUP ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    JOIN race_results rr ON e.id = rr.event_id
    WHERE rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1][:30]:30} ({row[2]}) - {row[3]} results")

conn.close()
