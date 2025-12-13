import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== Understanding the Mismatch ===\n")

# The Sachsenberg import script reads Column 13 for all pages
# But the PDF has different class pages with different column layouts

# Check what Sachsenberg result Felix Rüelmann has (if any)
cursor.execute("""
    SELECT r.points, r.class_id, c.name
    FROM race_results r
    JOIN classes c ON r.class_id = c.id
    WHERE r.event_id = 'evt_sachsenberg_2025_rec'
    AND r.driver_id IN (SELECT id FROM drivers WHERE start_number = 1503)
""")
rows = cursor.fetchall()
print(f"Sachsenberg results for #1503 (Felix Rüelmann):")
if rows:
    for r in rows:
        print(f"  Points: {r[0]}, Class: {r[2]} ({r[1]})")
else:
    print("  NONE - Not imported!")

# Check driver_participations for #1503
print("\nDriver participations for #1503:")
cursor.execute("""
    SELECT dp.class_id, c.name
    FROM driver_participations dp
    JOIN classes c ON dp.class_id = c.id
    WHERE dp.driver_id IN (SELECT id FROM drivers WHERE start_number = 1503)
""")
for r in cursor.fetchall():
    print(f"  {r[1]} ({r[0]})")

# The import script uses: 
# cursor.execute("SELECT d.id, d.start_number, dp.class_id FROM drivers d JOIN driver_participations dp...")
# So it will only import for classes where driver has participation

# Check if there's a Crossbuggy class
print("\nSearching for 'Crossbuggy' class:")
cursor.execute("SELECT id, name, championship_id FROM classes WHERE name LIKE '%buggy%' OR name LIKE '%Crossbuggy%'")
for r in cursor.fetchall():
    print(f"  {r[0]}: {r[1]} ({r[2]})")

conn.close()
