"""
Investigate points discrepancy.
Official PDF shows René Bouma with 218 pts but app shows 214 pts.
Let's examine the data for René Bouma specifically.
"""
import sqlite3
import os

DB_PATH = 'autox.db'

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

lines = []

# Find René Bouma
cursor.execute("SELECT id, name, start_number FROM drivers WHERE name LIKE '%Bouma%' OR name LIKE '%René%'")
drivers = cursor.fetchall()
lines.append("Drivers matching 'Bouma' or 'René':")
for d in drivers:
    lines.append(f"  {d}")

if drivers:
    driver_id = drivers[0][0]
    lines.append(f"\nChecking results for driver: {drivers[0][1]} (id: {driver_id})")
    
    # Get all race results for this driver
    cursor.execute("""
        SELECT e.name as event, rr.class_id, rr.rank, rr.points, rr.license_type, rr.championship_points
        FROM race_results rr
        JOIN events e ON rr.event_id = e.id
        WHERE rr.driver_id = ?
        ORDER BY e.date
    """, (driver_id,))
    
    results = cursor.fetchall()
    lines.append(f"\nResults ({len(results)} total):")
    total_points = 0
    total_champ_pts = 0
    for r in results:
        lines.append(f"  {r[0]}: rank={r[2]}, points={r[3]}, license={r[4]}, champ_pts={r[5]}")
        total_points += r[3] if r[3] else 0
        total_champ_pts += r[5] if r[5] else 0
    lines.append(f"\nTotal points: {total_points}")
    lines.append(f"Total championship_points: {total_champ_pts}")

# List all events
lines.append("\n=== ALL EVENTS IN DB ===")
cursor.execute("SELECT id, name, date FROM events ORDER BY date")
for e in cursor.fetchall():
    lines.append(f"  {e[0]}: {e[1]} ({e[2]})")

# Official PDF events (from image):
# Daubo, Hoope, Exte, Gleidg, Eppe, Sachse, Löhne, Herbe, Veller, Osnab
# -> Dauborn, Hoope(?), Extertal, Gleidorf, Eppe, Sachsenberg, Löhne, Herbern, Vellern, Osnabrück
lines.append("\n=== OFFICIAL PDF COLUMNS (from image 2) ===")
lines.append("  Daubo -> Dauborn")
lines.append("  Hoope -> ???")
lines.append("  Exte -> Extertal")
lines.append("  Gleidg -> Gleidorf")
lines.append("  Eppe -> Eppe")
lines.append("  Sachse -> Sachsenberg")
lines.append("  Löhne -> Löhne")
lines.append("  Herbe -> Herbern")
lines.append("  Veller -> Vellern")
lines.append("  Osnab -> Osnabrück")

conn.close()

output = '\n'.join(lines)
print(output)

with open('scripts/bouma_investigation.txt', 'w', encoding='utf-8') as f:
    f.write(output)

print("\nOutput written to scripts/bouma_investigation.txt")
