"""Check 2024 events vs expected events from official PDF"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# The official PDF header shows these events:
# Bohnhorst, Extertal, Hoope, Gleidorf, Eppe, Sachsenberg, Herbern, Vellern, Löhne, Dauborn
expected_events = ['Bohnhorst', 'Extertal', 'Hoope', 'Gleidorf', 'Eppe', 'Sachsenberg', 'Herbern', 'Vellern', 'Löhne', 'Dauborn']

print("=== 2024 EVENTS IN DATABASE ===")
cursor.execute("""
    SELECT e.name, e.date, COUNT(rr.id) as results
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    WHERE strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date
""")
db_events = []
for row in cursor.fetchall():
    db_events.append(row[0])
    print(f"  {row[0]} ({row[1]}): {row[2]} results")

print(f"\n=== EVENTS IN DATABASE: {len(db_events)} ===")

print("\n=== MISSING EVENTS ===")
for exp in expected_events:
    found = any(exp.lower() in db.lower() for db in db_events)
    if not found:
        print(f"  MISSING: {exp}")
    else:
        print(f"  FOUND: {exp}")

# Check Tobias Hönicke - count his events
print("\n=== TOBIAS HÖNICKE 2024 EVENT COUNT ===")
cursor.execute("""
    SELECT COUNT(DISTINCT e.id)
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
""")
print(f"  Events participated: {cursor.fetchone()[0]}")

# Check points sum
cursor.execute("""
    SELECT SUM(rr.championship_points)
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
""")
print(f"  Championship points: {cursor.fetchone()[0]} (Expected: 305)")

conn.close()
