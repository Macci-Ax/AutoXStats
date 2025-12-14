"""Check if Eppe 2024 exists"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name FROM events WHERE name LIKE '%Eppe%' AND strftime('%Y', date)='2024'")
rows = cursor.fetchall()
if rows:
    print(f"Found Eppe 2024: {rows[0]}")
else:
    print("Eppe 2024 NOT found")

conn.close()
