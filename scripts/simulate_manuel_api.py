"""Simulate API request for Manuel Friedewald"""
import sqlite3
import datetime

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

DRIVER_NAME = "Manuel Friedewald"
YEAR = "2024"

print(f"Simulating API request for {DRIVER_NAME} in {YEAR}...")

# 1. Get Driver ID
cursor.execute("SELECT id FROM drivers WHERE name LIKE ?", (f"%{DRIVER_NAME}%",))
did = cursor.fetchone()[0]
print(f"Driver ID: {did}")

# 2. Replicate server.js query logic
# server.js: 
# SELECT d.id, d.name, d.team, d.car, d.start_number, c.name as class_name, 
#        SUM(rr.championship_points) as total_points, ...
# FROM race_results rr ... WHERE strftime('%Y', e.date) = ? ...

cursor.execute("""
    SELECT 
        d.name,
        c.name as class_name,
        SUM(rr.championship_points) as total_points,
        GROUP_CONCAT(rr.championship_points) as points_breakdown
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    JOIN classes c ON rr.class_id = c.id
    WHERE d.id = ? AND strftime('%Y', e.date) = ?
    GROUP BY d.id, c.id
""", (did, YEAR))

rows = cursor.fetchall()
for row in rows:
    print(f"Class: {row[1]}, Total: {row[2]}, Breakdown: {row[3]}")

# 3. Check for specific event duplication in the breakdown
print("\nChecking for duplicate event entries in breakdown:")
points = rows[0][3].split(',') if rows else []
print(f"Points list: {points}")
print(f"Sum check: {sum(float(p) for p in points) if points else 0}")

conn.close()
