"""List all 2024 events with Tobias Hönicke's points"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Show ALL events for Tobias in 2024 with full details
print("=== TOBIAS HÖNICKE ALL 2024 LANGSTRECKE EVENTS ===")
cursor.execute("""
    SELECT e.name, e.date, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Tobias%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total = 0
events = []
for row in cursor.fetchall():
    total += row[3] if row[3] else 0
    events.append(row)
    print(f"  {row[0][:25]:25} ({row[1]}): rank={row[2]:2}, pts={row[3]:3}")

print(f"\n  Total events: {len(events)}")
print(f"  Total points: {total}")
print(f"  Expected: 305 from 8 events")

# Check PDF date - Stand: 07.09.2024
print("\n=== NOTES ===")
print("  The PDF shows 'Stand: 07.09.2024' - standings as of Sep 7, 2024")
print("  Events AFTER this date would not be in the PDF!")

# From image 1, Tobias has: 40+40+35 in first 3 columns + 30+40+40+40+40 = 40+40+35+30+40+40+40+40 = 305
# Columns: Bohnhorst(40), Extertal(40), Hoope(?), Gleidorf(35), Eppe(30), Sachsenberg(40), Herbern(40), Vellern(40), Löhne(?), Dauborn(40)
# Wait, looking again: 40+40+35+30+40+40+40+40 = 305... but which events?

conn.close()
