"""Delete Marlon Anderseck from Sachsenberg 2024 Langstrecke"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("Deleting Marlon Anderseck from Sachsenberg 2024...")
cursor.execute("""
    DELETE FROM race_results 
    WHERE driver_id IN (SELECT id FROM drivers WHERE name LIKE '%Marlon%Anderseck%')
    AND event_id IN (
        SELECT id FROM events WHERE name LIKE '%Sachsenberg%' AND strftime('%Y', date)='2024'
    )
    AND class_id = 'd_lang'
""")
print(f"Deleted {cursor.rowcount} row(s).")

conn.commit()
conn.close()
