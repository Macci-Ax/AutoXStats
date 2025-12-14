"""Fix Manuel Friedewald Herbern 2024 result (Rank 17 -> 16)"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Get Driver ID
cursor.execute("SELECT id FROM drivers WHERE name LIKE '%Manuel%Friedewald%'")
did = cursor.fetchone()[0]

# Fix Herbern result
print("Fixing Herbern result...")
cursor.execute("""
    UPDATE race_results 
    SET rank=16, championship_points=10
    WHERE driver_id=? AND class_id='d_lang' AND event_id IN (
        SELECT id FROM events WHERE name LIKE '%Herbern%' AND strftime('%Y', date)='2024'
    )
""", (did,))
print(f"Updated {cursor.rowcount} row(s) for Herbern.")

conn.commit()
conn.close()
