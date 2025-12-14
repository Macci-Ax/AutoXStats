"""Check and restore Tobias Hönicke in Sachsenberg 2024"""
import sqlite3
import uuid

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Get Driver ID
cursor.execute("SELECT id FROM drivers WHERE name LIKE '%Tobias%Hönicke%'")
row = cursor.fetchone()
if not row:
    print("Driver Tobias Hönicke not found!")
    exit()
did = row[0]
print(f"Driver ID: {did}")

# Get Event ID
cursor.execute("SELECT id FROM events WHERE name LIKE '%Sachsenberg%' AND strftime('%Y', date)='2024'")
row = cursor.fetchone()
if not row:
    print("Sachsenberg 2024 event not found!")
    exit()
eid = row[0]
print(f"Event ID: {eid}")

# Check result
cursor.execute("""
    SELECT id, rank, points 
    FROM race_results 
    WHERE event_id=? AND driver_id=? AND class_id='d_lang'
""", (eid, did))
result = cursor.fetchone()

if result:
    print(f"Found result: {result}")
else:
    print("Result MISSING. Restoring...")
    rid = f"res_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO race_results (id, event_id, driver_id, class_id, rank, points, championship_points, license_type)
        VALUES (?, ?, ?, 'd_lang', 1, 40, 40, 'DRCV')
    """, (rid, eid, did))
    print(f"Inserted result {rid}")
    conn.commit()

conn.close()
