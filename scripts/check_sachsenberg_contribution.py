import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Check if Sachsenberg event contributes to totals
print("=== Punkt-Beitrag von Sachsenberg ===\n")

# Sample: Tobias Hönicke (#1)
cursor.execute("""
    SELECT e.name, SUM(r.points) as event_points
    FROM race_results r
    JOIN events e ON r.event_id = e.id  
    JOIN drivers d ON r.driver_id = d.id
    WHERE d.start_number = 1
    GROUP BY e.id
""")
print("Tobias Hönicke (#1) Punkte pro Event:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} Punkte")

# Total
cursor.execute("""
    SELECT SUM(r.points) FROM race_results r
    JOIN drivers d ON r.driver_id = d.id
    WHERE d.start_number = 1
""")
total = cursor.fetchone()[0]
print(f"\nGesamt: {total} Punkte")

conn.close()
