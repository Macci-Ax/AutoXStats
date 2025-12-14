"""Verify Manuel Friedewald points per event"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

expected = {
    'Bohnhorst': 13,
    'Extertal': 30,
    'Gleidorf': 27,
    'Eppe': 40,
    'Sachsenberg': 27,
    'Herbern': 10,
    'Vellern': 21,
    'Löhne': 23
}

print("=== CHECKING MANUEL FRIEDEWALD ===")
cursor.execute("""
    SELECT e.name, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
""")
db_vals = {}
for row in cursor.fetchall():
    # Normalize name to match keys
    name = row[0]
    pts = row[1] if row[1] else 0
    found_key = None
    for key in expected:
        if key.lower() in name.lower():
            found_key = key
            break
    
    if found_key:
        db_vals[found_key] = pts
        if pts != expected[found_key]:
            print(f"  MISMATCH {found_key}: DB={pts}, Expected={expected[found_key]}")
        else:
            print(f"  OK {found_key}: {pts}")
    else:
        print(f"  UNKNOWN EVENT: {name} ({pts} pts)")

print("\n=== MISSING EVENTS ===")
for key in expected:
    if key not in db_vals:
        print(f"  MISSING: {key} (Expected {expected[key]})")

conn.close()
