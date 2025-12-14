"""List all championship points for Manuel Friedewald in 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== MANUEL FRIEDEWALD 2024 CHAMPIONSHIP POINTS ===")
print(f"{'Date':<12} | {'Event':<30} | {'Rank':<4} | {'Points':<6}")
print("-" * 60)

cursor.execute("""
    SELECT e.date, e.name, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Manuel%Friedewald%' 
    AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")

total = 0
for row in cursor.fetchall():
    date = row[0]
    event = row[1]
    rank = row[2]
    points = row[3] if row[3] else 0
    total += points
    print(f"{date:<12} | {event:<30} | {rank:<4} | {points:<6}")

print("-" * 60)
print(f"TOTAL: {total}")

conn.close()
