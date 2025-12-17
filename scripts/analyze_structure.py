import sqlite3

conn = sqlite3.connect('autox.db')
cur = conn.cursor()

print('=== race_results schema ===')
for r in cur.execute('PRAGMA table_info(race_results)').fetchall():
    print(r)

print('\n=== Sample DRCV result ===')
drcv = cur.execute("SELECT * FROM race_results WHERE class_id LIKE 'd_%' LIMIT 1").fetchone()
print(drcv)

print('\n=== Sample WACV result ===')
wacv = cur.execute("SELECT * FROM race_results WHERE class_id LIKE 'w_%' LIMIT 1").fetchone()
print(wacv)

print('\n=== championship_events for WACV ===')
for r in cur.execute("SELECT * FROM championship_events WHERE championship_id = 'WACV'").fetchall():
    print(r)

print('\n=== physical_events sample ===')
for r in cur.execute("SELECT * FROM physical_events LIMIT 5").fetchall():
    print(r)

print('\n=== class_events for WACV ===')
count = cur.execute("SELECT count(*) FROM class_events WHERE class_id LIKE 'w_%'").fetchone()[0]
print(f'Total WACV class_events: {count}')

conn.close()
