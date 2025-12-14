"""Check schema of race_results"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(race_results)")
cols = cursor.fetchall()

print("Columns in race_results:")
for col in cols:
    print(f"  {col[1]} ({col[2]})")

conn.close()
