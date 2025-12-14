"""Find all events in 2024 for Tobias Hönicke"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# List ALL events where Tobias participated in 2024 Langstrecke
print("=== ALL TOBIAS HÖNICKE 2024 LANGSTRECKE EVENTS ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Tobias%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1][:20]:20} ({row[2]}) rank={row[3]}, pts={row[4]}")

# Count unique events
print("\n=== ALL 2024 LANGSTRECKE EVENTS ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, COUNT(rr.id) as results
    FROM events e
    JOIN race_results rr ON e.id = rr.event_id
    WHERE rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1][:20]:20} ({row[2]}) - {row[3]} results")

# Official PDF shows 8 events with points: Bohnhorst(40), Extertal(40), Hoope(?), Gleidorf(35), Eppe(30), Sachsenberg(40), Herbern(40), Vellern(40), Löhne(?), Dauborn(40)
# Actually looking at image 1: columns are Bohnhorst, Extertal, Hoope, Gleidorf, Eppe, Sachsenberg, Herbern, Vellern, Löhne, Dauborn
# Tobias has: 40+40+35+30+40+40+40+40=305 (8 events with points)
print("\n=== EXPECTED EVENTS FROM PDF ===")
print("  Bohnhorst, Extertal, Hoope, Gleidorf, Eppe, Sachsenberg, Herbern, Vellern, Löhne, Dauborn")
print("  Tobias: 40+40+35+30+40+40+40+40 = 305 (8 events)")

conn.close()
