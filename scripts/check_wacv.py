
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("Checking WACV Events:")
cursor.execute("SELECT id, name FROM events WHERE championship_id = 'WACV'")
for row in cursor.fetchall():
    print(row)

print("\nChecking WACV Race Results Sample:")
cursor.execute("SELECT * FROM race_results WHERE event_id LIKE 'w_ev_%' LIMIT 5")
rows = cursor.fetchall()
if not rows:
    print("No race results found for WACV events.")
else:
    for row in rows:
        print(row)

print(f"\nTotal WACV Race Results: {cursor.execute('SELECT count(*) FROM race_results WHERE event_id LIKE \"w_ev_%\"').fetchone()[0]}")
