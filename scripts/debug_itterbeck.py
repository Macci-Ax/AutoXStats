"""Debug: Check what's in Itterbeck for René Bouma"""
import sqlite3

DB_PATH = 'autox.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Find René Bouma
cursor.execute("SELECT id, name FROM drivers WHERE name LIKE '%Bouma%'")
driver = cursor.fetchone()
driver_id = driver[0]
print(f"Driver: {driver[1]}")

# Check Itterbeck event
cursor.execute("SELECT id, name FROM events WHERE name LIKE '%Itter%'")
itterbeck = cursor.fetchall()
print(f"\nItterbeck events: {itterbeck}")

# Check Bouma's Itterbeck result
for event in itterbeck:
    event_id = event[0]
    cursor.execute("""
        SELECT rr.rank, rr.points, rr.championship_points, rr.license_type
        FROM race_results rr
        WHERE rr.driver_id = ? AND rr.event_id = ? AND rr.class_id = 'd_lang'
    """, (driver_id, event_id))
    result = cursor.fetchone()
    if result:
        print(f"  {event[1]}: rank={result[0]}, pts={result[1]}, champ={result[2]}, license={result[3]}")
    else:
        print(f"  {event[1]}: NO RESULT FOUND")

# List ALL of Bouma's Langstrecke results
print("\n=== ALL LANGSTRECKE RESULTS ===")
cursor.execute("""
    SELECT e.name, rr.rank, rr.points, rr.championship_points
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    WHERE rr.driver_id = ? AND rr.class_id = 'd_lang'
    ORDER BY e.date
""", (driver_id,))
total = 0
for r in cursor.fetchall():
    total += r[3] if r[3] else 0
    print(f"  {r[0]}: rank={r[1]}, pts={r[2]}, champ={r[3]}")
print(f"\nTotal championship_points: {total}")

# Expected: 25 + 40 + 35 + 30 + 8 + 40 + 40 = 218
# What's missing?
print(f"\nExpected: 218, Got: {total}, Missing: {218 - total}")

conn.close()
