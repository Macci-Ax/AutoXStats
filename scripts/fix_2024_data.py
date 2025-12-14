"""Fix 2024 data: Remove duplicate events and recompute championship points"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Check for duplicate 2024 events
print("=== 2024 EVENTS BEFORE CLEANUP ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    WHERE strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date
""")
events_2024 = cursor.fetchall()
for row in events_2024:
    print(f"  {row[0]}: {row[1]} ({row[2]}) - {row[3]} results")

# Check for Eppe duplicates
print("\n=== CHECKING FOR EPPE DUPLICATES ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    WHERE e.name LIKE '%Eppe%' AND strftime('%Y', e.date) = '2024'
    GROUP BY e.id
""")
eppe_events = cursor.fetchall()
for row in eppe_events:
    print(f"  {row[0]}: {row[1]} ({row[2]}) - {row[3]} results")

# If there are duplicates, keep only the one with more results
if len(eppe_events) > 1:
    print("\n  Removing duplicate Eppe events...")
    # Sort by results count descending
    eppe_events.sort(key=lambda x: x[3], reverse=True)
    keeper = eppe_events[0][0]
    for row in eppe_events[1:]:
        eid = row[0]
        print(f"  Deleting {eid} with {row[3]} results...")
        cursor.execute("DELETE FROM race_results WHERE event_id = ?", (eid,))
        cursor.execute("DELETE FROM events WHERE id = ?", (eid,))
    conn.commit()

# Now verify Tobias Hönicke's 2024 Langstrecke results
print("\n=== TOBIAS HÖNICKE 2024 LANGSTRECKE AFTER CLEANUP ===")
cursor.execute("""
    SELECT e.name, e.date, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Tobias%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total = 0
for row in cursor.fetchall():
    total += row[3] if row[3] else 0
    print(f"  {row[0][:20]:20} ({row[1]}): rank={row[2]}, champ={row[3]}")
print(f"\n  CURRENT TOTAL: {total}")
print(f"  EXPECTED: 305")

conn.close()
print("\nNow run compute_championship_points.py to recalculate!")
