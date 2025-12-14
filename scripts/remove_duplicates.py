"""Remove duplicate events by date"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Find events with same date (duplicates)
print("=== CHECKING FOR DUPLICATE DATES IN 2024 ===")
cursor.execute("""
    SELECT e.date, COUNT(*) as count
    FROM events e
    WHERE strftime('%Y', e.date) = '2024'
    GROUP BY e.date
    HAVING count > 1
""")
duplicate_dates = cursor.fetchall()
for row in duplicate_dates:
    print(f"  Date {row[0]} has {row[1]} events!")

# Show all 2024 events with their IDs
print("\n=== ALL 2024 EVENTS ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    WHERE strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date, results DESC
""")
events = {}
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1][:25]:25} ({row[2]}) - {row[3]} results")
    date = row[2]
    if date not in events:
        events[date] = []
    events[date].append((row[0], row[1], row[3]))

# Remove duplicates - keep the one with most results
print("\n=== REMOVING DUPLICATES ===")
for date, evts in events.items():
    if len(evts) > 1:
        evts.sort(key=lambda x: x[2], reverse=True)  # Sort by results count
        keeper = evts[0]
        print(f"  Date {date}: Keeping {keeper[0]} ({keeper[1]}) with {keeper[2]} results")
        for evt in evts[1:]:
            print(f"    Deleting {evt[0]} ({evt[1]}) with {evt[2]} results")
            cursor.execute("DELETE FROM race_results WHERE event_id = ?", (evt[0],))
            cursor.execute("DELETE FROM events WHERE id = ?", (evt[0],))

conn.commit()

# Verify Tobias now
print("\n=== TOBIAS HÖNICKE AFTER CLEANUP ===")
cursor.execute("""
    SELECT e.name, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Tobias%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total = 0
count = 0
for row in cursor.fetchall():
    total += row[2] if row[2] else 0
    count += 1
    print(f"  {row[0][:20]:20}: rank={row[1]}, pts={row[2]}")
print(f"\n  TOTAL: {total} pts from {count} events")
print(f"  EXPECTED: 305 pts from 8 events")

conn.close()
