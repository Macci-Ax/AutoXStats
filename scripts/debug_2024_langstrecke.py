"""Investigate 2024 Langstrecke discrepancy"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Get 2024 Langstrecke standings
print("=== 2024 LANGSTRECKE TOP 10 ===")
cursor.execute("""
    SELECT 
        d.name,
        d.team,
        SUM(rr.championship_points) as total_pts,
        COUNT(rr.id) as races
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    GROUP BY d.id
    ORDER BY total_pts DESC
    LIMIT 10
""")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}): {row[2]} pts ({row[3]} races)")

# Check Tobias Hönicke's individual results
print("\n=== TOBIAS HÖNICKE 2024 RESULTS ===")
cursor.execute("""
    SELECT e.name, e.date, rr.rank, rr.points, rr.championship_points, rr.license_type
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total = 0
for row in cursor.fetchall():
    total += row[4] if row[4] else 0
    print(f"  {row[0]} ({row[1]}): rank={row[2]}, pts={row[3]}, champ={row[4]}, license={row[5]}")
print(f"  TOTAL: {total} (Expected: 305)")

# Check Manuel Friedewald
print("\n=== MANUEL FRIEDEWALD 2024 RESULTS ===")
cursor.execute("""
    SELECT e.name, e.date, rr.rank, rr.points, rr.championship_points, rr.license_type
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total2 = 0
for row in cursor.fetchall():
    total2 += row[4] if row[4] else 0
    print(f"  {row[0]} ({row[1]}): rank={row[2]}, pts={row[3]}, champ={row[4]}, license={row[5]}")
print(f"  TOTAL: {total2} (Expected: 191)")

# List all 2024 Langstrecke events
print("\n=== 2024 LANGSTRECKE EVENTS ===")
cursor.execute("""
    SELECT e.name, e.date, COUNT(rr.id) as results
    FROM events e
    JOIN race_results rr ON e.id = rr.event_id
    WHERE rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date
""")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}): {row[2]} results")

conn.close()
