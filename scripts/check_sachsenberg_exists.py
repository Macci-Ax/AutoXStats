"""Check if Sachsenberg 2024 exists"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name FROM events WHERE name LIKE '%Sachsenberg%' AND strftime('%Y', date)='2024'")
rows = cursor.fetchall()
if rows:
    print(f"Found Sachsenberg 2024: {rows[0]}")
else:
    print("Sachsenberg 2024 NOT found")

conn.close()
