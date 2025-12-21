import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== SACHSENBERG EVENT STATUS ===")
cursor.execute("SELECT id, title, start_date, status FROM physical_events WHERE title LIKE '%Sachsenberg%'")
for row in cursor.fetchall():
    print(row)

print("\n=== ALL UPCOMING EVENTS IN THE PAST ===")
# Find events that are 'upcoming' but have a date before today (2025-12-21)
cursor.execute("SELECT id, title, start_date, status FROM physical_events WHERE status != 'finished' AND start_date < '2025-12-21'")
for row in cursor.fetchall():
    print(row)

conn.close()
