"""Dump Manuel's points for manual verification"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

results = []
cursor.execute("""
    SELECT e.name, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total = 0
for row in cursor.fetchall():
    pts = row[1] if row[1] else 0
    total += pts
    results.append(f"{row[0]}: {pts}")

results.append(f"TOTAL: {total}")

print("\n".join(results))

conn.close()
