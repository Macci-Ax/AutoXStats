"""Check what 2024 data exists in database"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Check events by year
print("=== EVENTS BY YEAR ===")
cursor.execute("""
    SELECT strftime('%Y', date) as year, COUNT(*) as count
    FROM events
    GROUP BY year
    ORDER BY year
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} events")

# List all 2024 events
print("\n=== 2024 EVENTS ===")
cursor.execute("""
    SELECT id, name, date
    FROM events
    WHERE strftime('%Y', date) = '2024'
    ORDER BY date
""")
events_2024 = cursor.fetchall()
for row in events_2024:
    print(f"  {row[0]}: {row[1]} ({row[2]})")

# Check race results for 2024
print("\n=== RACE RESULTS BY YEAR ===")
cursor.execute("""
    SELECT strftime('%Y', e.date) as year, COUNT(rr.id) as results
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    GROUP BY year
    ORDER BY year
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} results")

# Check classes in 2024
print("\n=== 2024 CLASSES ===")
cursor.execute("""
    SELECT c.name, COUNT(rr.id) as count
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    JOIN classes c ON rr.class_id = c.id
    WHERE strftime('%Y', e.date) = '2024'
    GROUP BY c.id
    ORDER BY count DESC
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} results")

conn.close()
