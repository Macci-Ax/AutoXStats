"""Check if Langstrecke driver totals match official PDF"""
import sqlite3

DB_PATH = 'autox.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("=== Top Langstrecke Drivers ===")
cursor.execute("""
    SELECT d.name, d.start_number, SUM(rr.championship_points) as total
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    WHERE rr.class_id = 'd_lang'
    GROUP BY rr.driver_id
    ORDER BY total DESC
    LIMIT 15
""")
for i, row in enumerate(cursor.fetchall(), 1):
    print(f"  {i}. #{row[1]} {row[0]}: {row[2]} pts")

# Check René Bouma specifically
print("\n=== René Bouma Per-Event ===")
cursor.execute("SELECT id FROM drivers WHERE name LIKE '%Bouma%'")
driver = cursor.fetchone()
if driver:
    cursor.execute("""
        SELECT e.name, rr.rank, rr.points, rr.championship_points, rr.license_type
        FROM race_results rr
        JOIN events e ON rr.event_id = e.id
        WHERE rr.driver_id = ? AND rr.class_id = 'd_lang'
        ORDER BY e.date
    """, (driver[0],))
    total = 0
    for r in cursor.fetchall():
        total += r[3] if r[3] else 0
        print(f"  {r[0]}: rank={r[1]}, pts={r[2]}, champ={r[3]}, license={r[4]}")
    print(f"\nTotal: {total} pts")
    print(f"Expected (from official): 218 pts")

conn.close()
