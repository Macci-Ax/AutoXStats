"""
Compare events in database vs PDFs vs official standings.
"""
import sqlite3
import os

DB_PATH = 'autox.db'

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("=== EVENTS IN DATABASE ===")
cursor.execute("SELECT id, name, date, status FROM events ORDER BY date")
events = cursor.fetchall()
for e in events:
    print(f"  {e[0]}: {e[1]} ({e[2]}) - {e[3]}")

print("\n=== PDFs IN pdf/2025/ ===")
pdf_dir = 'pdf/2025'
if os.path.exists(pdf_dir):
    for f in sorted(os.listdir(pdf_dir)):
        print(f"  {f}")

# Look up René Bouma's points per event
print("\n=== RENÉ BOUMA'S RESULTS ===")
cursor.execute("SELECT id, name FROM drivers WHERE name LIKE '%Bouma%'")
driver = cursor.fetchone()
if driver:
    driver_id = driver[0]
    cursor.execute("""
        SELECT e.name, rr.rank, rr.points, rr.license_type, rr.championship_points
        FROM race_results rr
        JOIN events e ON rr.event_id = e.id
        WHERE rr.driver_id = ? AND rr.class_id = 'd_lang'
        ORDER BY e.date
    """, (driver_id,))
    results = cursor.fetchall()
    total = 0
    for r in results:
        print(f"  {r[0]}: rank={r[1]}, pts={r[2]}, champ_pts={r[4]}")
        total += r[4] if r[4] else 0
    print(f"\nTotal championship_points in Langstrecke: {total}")
    
    # Official PDF shows: 25, 40, 4, 40, 40
    # -> 25 (Itterb) + 40 (?) + 4 (?) + 40 (?) + 40 (?) = ?
    # From image 2: 25, blank, blank, 40, 35, 30, 8, 40, 40, blank = 258 total (but shows 218?)
    
print("\n=== OFFICIAL PDF EVENT DATA (from image 2) ===")
print("Columns: Itterbo, Daubo, Hoope, Exte, Gleidg, Eppe, Sachse, Löhne, Herbe, Veller, Osnab")
print("René Bouma values: 25, blank, blank, 40, 35, 30, 8, 40, 40, blank = 218")
print("(That's: 25 + 40 + 35 + 30 + 8 + 40 + 40 = 218)")

conn.close()
