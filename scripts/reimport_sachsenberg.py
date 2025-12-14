"""Delete and re-import Sachsenberg 2024"""
import sqlite3
import os

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== DELETING SACHSENBERG 2024 ===")
cursor.execute("SELECT id, name FROM events WHERE name LIKE '%Sachsenberg%' AND strftime('%Y', date)='2024'")
events = cursor.fetchall()

if not events:
    print("No Sachsenberg 2024 events found to delete.")
else:
    for eid, name in events:
        print(f"Deleting event {name} ({eid})")
        cursor.execute("DELETE FROM race_results WHERE event_id = ?", (eid,))
        cursor.execute("DELETE FROM events WHERE id = ?", (eid,))
    conn.commit()
    print("Deletion complete.")

conn.close()
