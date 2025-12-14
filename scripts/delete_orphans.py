"""Delete orphan results (no matching event)"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== DELETING ORPHAN RESULTS ===")
cursor.execute("""
    DELETE FROM race_results 
    WHERE event_id NOT IN (SELECT id FROM events)
""")
print(f"Deleted {cursor.rowcount} orphan results.")

conn.commit()
conn.close()
