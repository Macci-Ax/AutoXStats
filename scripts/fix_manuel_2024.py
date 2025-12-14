"""Fix Manuel Friedewald 2024 results: Add Hoope and fix Sachsenberg"""
import sqlite3
import uuid

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Get Driver ID
cursor.execute("SELECT id FROM drivers WHERE name LIKE '%Manuel%Friedewald%'")
did = cursor.fetchone()[0]
print(f"Driver ID: {did}")

# 1. Insert Hoope result (evt_dd677774)
hoope_id = 'evt_dd677774'
# Check if exists first
cursor.execute("SELECT id FROM race_results WHERE event_id=? AND driver_id=? AND class_id='d_lang'", (hoope_id, did))
if cursor.fetchone():
    print("Hoope result already exists (unexpected). Updating...")
    cursor.execute("""
        UPDATE race_results 
        SET rank=4, points=27, championship_points=27 
        WHERE event_id=? AND driver_id=? AND class_id='d_lang'
    """, (hoope_id, did))
else:
    print("Inserting Hoope result...")
    rid = f"res_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO race_results (id, event_id, driver_id, class_id, rank, points, championship_points, license_type)
        VALUES (?, ?, ?, 'd_lang', 4, 27, 27, 'DRCV')
    """, (rid, hoope_id, did))

# 2. Fix Sachsenberg result (Rank 5 -> 4)
print("Fixing Sachsenberg result...")
cursor.execute("""
    UPDATE race_results 
    SET rank=4, points=27, championship_points=27
    WHERE driver_id=? AND class_id='d_lang' AND event_id IN (
        SELECT id FROM events WHERE name LIKE '%Sachsenberg%' AND strftime('%Y', date)='2024'
    )
""", (did,))
print(f"Updated {cursor.rowcount} row(s) for Sachsenberg.")

conn.commit()
conn.close()
