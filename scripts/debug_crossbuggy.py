import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== DRCV Driver Check for Crossbuggy ===\n")

# Check if driver 1503 exists
cursor.execute("""
    SELECT d.id, d.name, d.start_number, d.team, dp.class_id, c.name as class_name, c.championship_id
    FROM drivers d
    LEFT JOIN driver_participations dp ON d.id = dp.driver_id
    LEFT JOIN classes c ON dp.class_id = c.id
    WHERE d.start_number = 1503
""")
rows = cursor.fetchall()
if rows:
    print("Driver #1503 found:")
    for r in rows:
        print(f"  ID: {r[0]}, Name: {r[1]}, Team: {r[3]}")
        print(f"  Class: {r[5]} ({r[4]}), Championship: {r[6]}")
else:
    print("Driver #1503 NOT FOUND in database!")
    
# Check DRCV classes for 'buggy' or 'Cross'
print("\n--- DRCV Classes containing 'cross' or 'buggy' ---")
cursor.execute("""
    SELECT id, name FROM classes 
    WHERE championship_id = 'DRCV' 
    AND (name LIKE '%cross%' OR name LIKE '%buggy%' OR name LIKE '%Cross%' OR name LIKE '%Buggy%')
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Check all DRCV classes
print("\n--- All DRCV Classes ---")
cursor.execute("SELECT id, name FROM classes WHERE championship_id = 'DRCV'")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Check if maybe these are WACV drivers
print("\n--- Check Championship for start_number 1503 ---")
cursor.execute("""
    SELECT d.id, d.name, c.championship_id, c.name
    FROM drivers d
    JOIN driver_participations dp ON d.id = dp.driver_id
    JOIN classes c ON dp.class_id = c.id
    WHERE d.start_number = 1503
""")
for row in cursor.fetchall():
    print(f"  {row[1]}: {row[2]} - {row[3]}")

conn.close()
