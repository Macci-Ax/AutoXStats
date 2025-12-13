import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Check if these drivers even exist
print("=== Driver Existence Check ===\n")

for num in [1503, 1508, 1501, 1518]:
    cursor.execute("SELECT id, name, start_number FROM drivers WHERE start_number = ?", (num,))
    row = cursor.fetchone()
    if row:
        print(f"#{num}: {row[1]} (id={row[0]})")
    else:
        print(f"#{num}: NOT FOUND in drivers table!")

# Check what championship the Sachsenberg results are for
print("\n=== Sachsenberg Event Info ===")
cursor.execute("SELECT * FROM events WHERE id = 'evt_sachsenberg_2025_rec'")
row = cursor.fetchone()
print(f"Event: {row}")

# Check total Sachsenberg results
cursor.execute("SELECT COUNT(*) FROM race_results WHERE event_id = 'evt_sachsenberg_2025_rec'")
print(f"Total Sachsenberg results: {cursor.fetchone()[0]}")

# Check what classes have Sachsenberg results
cursor.execute("""
    SELECT c.id, c.name, c.championship_id, COUNT(*) as result_count
    FROM race_results r
    JOIN classes c ON r.class_id = c.id
    WHERE r.event_id = 'evt_sachsenberg_2025_rec'
    GROUP BY c.id
""")
print("\nClasses with Sachsenberg results:")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}) - {row[2]}: {row[3]} results")

conn.close()
