import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Check what class_id Sachsenberg results are using
print("=== Sachsenberg Import Analysis ===\n")

# Sample: Check class_id for Felix Rüelmann (#1503)
cursor.execute("""
    SELECT d.name, d.start_number, r.class_id, c.name as class_name, r.points
    FROM race_results r
    JOIN drivers d ON r.driver_id = d.id
    LEFT JOIN classes c ON r.class_id = c.id
    WHERE r.event_id = 'evt_sachsenberg_2025_rec'
    AND d.start_number IN (1503, 1508, 1501, 1518)
""")
print("Sachsenberg results for test drivers:")
for row in cursor.fetchall():
    print(f"  {row[0]} (#{row[1]}): class_id={row[2]}, class_name={row[3]}, points={row[4]}")

# Check what class these drivers SHOULD be in
print("\n--- Expected Classes (from driver_participations) ---")
cursor.execute("""
    SELECT d.name, d.start_number, dp.class_id, c.name
    FROM drivers d
    JOIN driver_participations dp ON d.id = dp.driver_id
    LEFT JOIN classes c ON dp.class_id = c.id
    WHERE d.start_number IN (1503, 1508, 1501, 1518)
""")
for row in cursor.fetchall():
    print(f"  {row[0]} (#{row[1]}): class_id={row[2]}, class_name={row[3]}")

# Check what PDF says (from screenshot: these are "Crossbuggy bis 690cm" class)
print("\n--- Problem Analysis ---")
print("The PDF shows these drivers are in 'Crossbuggy bis 690cm' class.")
print("But the import might be using a different class_id from d.current_class_id or dp.class_id")

# Check if there's a Crossbuggy class
cursor.execute("SELECT id, name FROM classes WHERE name LIKE '%buggy%' OR name LIKE '%Buggy%'")
print("\nClasses containing 'buggy':")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
