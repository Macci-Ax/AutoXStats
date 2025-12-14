"""Debug Manuel Friedewald 2024 points"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== MANUEL FRIEDEWALD 2024 DETAIL ===")
cursor.execute("""
    SELECT e.name, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total = 0
for row in cursor.fetchall():
    total += row[2] if row[2] else 0
    print(f"  {row[0][:20]:20}: rank={row[1]}, pts={row[2]}")
print(f"\n  TOTAL DB: {total}")
print("  EXPECTED: 191")
print("  PDF VALUES: Bohnhorst(13), Extertal(30), Gleidorf(27), Eppe(40), Sachsenberg(27), Herbern(10), Vellern(21), Löhne(23)")

conn.close()
