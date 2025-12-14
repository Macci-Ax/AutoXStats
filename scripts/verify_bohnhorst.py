"""Verify championship points for one 2024 event"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Look at Bohnhorst 2024 specifically (first event in 2024)
print("=== BOHNHORST 2024 LANGSTRECKE TOP 10 ===")
cursor.execute("""
    SELECT d.name, rr.rank, rr.points, rr.championship_points, rr.license_type
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id  
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Bohnhorst%' AND strftime('%Y', e.date) = '2024' AND rr.class_id = 'd_lang'
    ORDER BY rr.rank
    LIMIT 15
""")
for row in cursor.fetchall():
    expected_pts = {1:40, 2:35, 3:30, 4:27, 5:25, 6:23, 7:21, 8:19, 9:17, 10:16}.get(row[1], 0)
    match = "OK" if row[3] == expected_pts else f"WRONG (expected {expected_pts})"
    print(f"  {row[0][:25]:25} rank={row[1]:2}, pts={row[2]:3}, champ={row[3]:3}, license={row[4]} - {match}")

# Expected Langstrecke points table:
print("\n=== EXPECTED LANGSTRECKE POINTS TABLE ===")
print("  1st: 40,  2nd: 35,  3rd: 30,  4th: 27,  5th: 25")
print("  6th: 23,  7th: 21,  8th: 19,  9th: 17, 10th: 16")

conn.close()
