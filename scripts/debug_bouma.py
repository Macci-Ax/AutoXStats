"""Debug: Check René Bouma's actual points in database - output to file"""
import sqlite3

DB_PATH = 'autox.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

lines = []

# Find René Bouma
cursor.execute("SELECT id, name FROM drivers WHERE name LIKE '%Bouma%'")
driver = cursor.fetchone()
if not driver:
    print("Driver not found!")
    exit()

driver_id = driver[0]
lines.append(f"Driver: {driver[1]} (id: {driver_id})")

# Get all Langstrecke results with full detail
lines.append("\n=== LANGSTRECKE RESULTS ===")
cursor.execute("""
    SELECT e.name, e.date, rr.rank, rr.points, rr.championship_points, rr.license_type
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    WHERE rr.driver_id = ? AND rr.class_id = 'd_lang'
    ORDER BY e.date
""", (driver_id,))

total_points = 0
total_champ = 0
for r in cursor.fetchall():
    total_points += r[3] if r[3] else 0
    total_champ += r[4] if r[4] else 0
    lines.append(f"  {r[0]} ({r[1]}): rank={r[2]}, pts={r[3]}, champ={r[4]}, license={r[5]}")

lines.append(f"\nTotal points (sporting): {total_points}")
lines.append(f"Total championship_points: {total_champ}")
lines.append(f"Expected from official PDF: 218")
lines.append(f"Difference: {218 - total_champ} points")

# Official PDF shows for René Bouma row:
# Columns: Itterbo, Daubo, Hoope, Exte, Gleidg, Eppe, Sachse, Löhne, Herbe, Veller, Osnab
# Values: 25, blank, blank, 40, 35, 30, 8, 40, 40, blank = 218
lines.append("\n=== EXPECTED FROM OFFICIAL PDF ===")
lines.append("Itterbeck: 25")
lines.append("Dauborn: blank (maybe 0 or not participating)")  
lines.append("Gleidorf: 40")
lines.append("Eppe: 35")
lines.append("Sachsenberg: 30")
lines.append("Löhne: 8")
lines.append("Herbern: 40")
lines.append("Vellern: 40")
lines.append("= 25 + 40 + 35 + 30 + 8 + 40 + 40 = 218")

conn.close()

output = '\n'.join(lines)
print(output)
