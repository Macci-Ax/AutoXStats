"""Verify Tobias Hönicke has 305 points in 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Check Tobias Hönicke 2024 Langstrecke
cursor.execute("""
    SELECT e.name, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Tobias%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
print("=== TOBIAS HÖNICKE 2024 LANGSTRECKE ===")
total = 0
for row in cursor.fetchall():
    total += row[2] if row[2] else 0
    print(f"  {row[0][:20]:20}: rank={row[1]}, pts={row[2]}")
print(f"\n  TOTAL: {total}")
print(f"  EXPECTED: 305")
print(f"  STATUS: {'OK' if total == 305 else 'MISMATCH'}")

conn.close()
