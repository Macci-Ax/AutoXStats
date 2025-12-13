"""Direct query to check exact championship_points sum for René Bouma"""
import sqlite3

DB_PATH = 'autox.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Find René Bouma
cursor.execute("SELECT id, name FROM drivers WHERE name LIKE '%Bouma%'")
driver = cursor.fetchone()
if not driver:
    print("Driver not found!")
    exit()

driver_id = driver[0]
print(f"Driver: {driver[1]} (id: {driver_id})")

# Get exact sum
cursor.execute("""
    SELECT SUM(championship_points) as total
    FROM race_results
    WHERE driver_id = ? AND class_id = 'd_lang'
""", (driver_id,))
total = cursor.fetchone()[0]
print(f"\nSUM(championship_points) in d_lang: {total}")

# Get individual values
cursor.execute("""
    SELECT e.name, rr.rank, rr.points, rr.championship_points, rr.license_type
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    WHERE rr.driver_id = ? AND rr.class_id = 'd_lang'
    ORDER BY e.date
""", (driver_id,))

print("\nIndividual results:")
for r in cursor.fetchall():
    print(f"  {r[0]}: rank={r[1]}, pts={r[2]}, champ_pts={r[3]}, license={r[4]}")

# Check if driver_participations has correct sum
cursor.execute("""
    SELECT dp.points
    FROM driver_participations dp
    WHERE dp.driver_id = ? AND dp.class_id = 'd_lang'
""", (driver_id,))
dp_pts = cursor.fetchone()
print(f"\ndriver_participations.points: {dp_pts}")

# Check license_type distribution 
cursor.execute("""
    SELECT license_type, COUNT(*) as cnt
    FROM race_results
    GROUP BY license_type
""")
print("\nLicense type distribution:")
for r in cursor.fetchall():
    print(f"  {r[0]}: {r[1]}")

conn.close()
