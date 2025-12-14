"""List all 2024 events to a file"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

events = []
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    WHERE strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date
""")
for row in cursor.fetchall():
    events.append(f"{row[0]}: {row[1]} ({row[2]}) - {row[3]} results")

with open('events_2024.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(events))

print("Wrote events_2024.txt")
conn.close()
