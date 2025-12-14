"""Check raw Hoope result by IDs"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

did = 'drv_104ee749'
eid = 'evt_dd677774'

print(f"Checking result for Driver {did} in Event {eid}...")
cursor.execute("""
    SELECT id, rank, points, championship_points, class_id
    FROM race_results
    WHERE event_id=? AND driver_id=?
""", (eid, did))
row = cursor.fetchone()
if row:
    print(f"Found: ID={row[0]}, Rank={row[1]}, Pts={row[2]}, Champ={row[3]}, Class={row[4]}")
else:
    print("Result not found!")

conn.close()
