import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== CURRENT SACHSENBERG EVENTS ===")
cursor.execute("SELECT id, name, date FROM events WHERE name LIKE '%Sachsenberg%'")
for row in cursor.fetchall():
    print(row)

# Fix Sachsenberg
print("\n=== FIXING SACHSENBERG ===")
cursor.execute("UPDATE events SET name = 'Sachsenberg', date = '2025-07-19' WHERE name LIKE '%Sachsenberg (Reconstructed)%'")
print(f"Updated {cursor.rowcount} rows")

# Check for events with missing dates
print("\n=== EVENTS WITH MISSING DATES ===")
cursor.execute("SELECT id, name, date FROM events WHERE date IS NULL OR date = ''")
rows = cursor.fetchall()
for row in rows:
    print(row)

conn.commit()
conn.close()
