"""Check fill rate of car column in race_results for 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== CHECKING CAR DATA IN RACE_RESULTS (2024) ===")
cursor.execute("""
    SELECT 
        COUNT(*) as total,
        COUNT(car) as with_car,
        COUNT(start_number) as with_number
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    WHERE strftime('%Y', e.date) = '2024'
""")
row = cursor.fetchone()
print(f"Total Results: {row[0]}")
print(f"With Car: {row[1]} ({row[1]/row[0]*100:.1f}%)")
print(f"With StartNr: {row[2]} ({row[2]/row[0]*100:.1f}%)")

print("\nSample entries (first 5):")
cursor.execute("""
    SELECT rr.id, d.name, rr.car, rr.start_number
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    JOIN drivers d ON rr.driver_id = d.id
    WHERE strftime('%Y', e.date) = '2024'
    LIMIT 5
""")
for r in cursor.fetchall():
    print(f"Driver: {r[1]}, Car: {r[2]}, Nr: {r[3]}")

conn.close()
