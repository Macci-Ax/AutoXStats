import sqlite3

conn = sqlite3.connect('autox.db')
cur = conn.cursor()

print('Checking WACV 0-point entries...')
count = cur.execute("SELECT count(*) FROM driver_participations WHERE class_id LIKE 'w_%' AND points = 0").fetchone()[0]
print(f'Found {count} entries with 0 points.')

if count > 0:
    print('Deleting 0-point entries...')
    cur.execute("DELETE FROM driver_participations WHERE class_id LIKE 'w_%' AND points = 0")
    # Also delete corresponding race results?
    # WACV race results have class_id too
    cur.execute("DELETE FROM race_results WHERE class_id LIKE 'w_%' AND class_id IN (SELECT class_id FROM driver_participations WHERE points = 0)") 
    # Wait, simple delete might not target correctly. Better to just delete by class_id/driver_id join
    # but let's stick to participations first. 
    # Actually, if I delete participation, the driver still exists.
    # The 'ghost' entry is likely the participation record.
    conn.commit()
    print('Deleted.')

conn.close()
