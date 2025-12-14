"""Check Sachsenberg event dates and fix reconstructed event date"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Find all Sachsenberg events
print("=== ALL SACHSENBERG EVENTS ===")
cursor.execute("SELECT id, name, date FROM events WHERE name LIKE '%Sachsenberg%' OR name LIKE '%sachsenberg%'")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} ({row[2]})")

# Check for events with NULL or wrong dates
print("\n=== CHECKING FOR WRONG DATES ===")
cursor.execute("SELECT id, name, date FROM events WHERE date IS NULL OR date LIKE '%2024%' OR date LIKE '%2025-04%'")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} ({row[2]})")

# Fix Sachsenberg Reconstructed to 19.07.2025
print("\n=== FIXING SACHSENBERG RECONSTRUCTED DATE ===")
cursor.execute("""
    UPDATE events 
    SET date = '2025-07-19' 
    WHERE name LIKE '%Sachsenberg%Recon%' OR (name LIKE '%Sachsenberg%' AND date = '2025-04-27')
""")
print(f"  Updated {cursor.rowcount} rows")

conn.commit()

# Verify 
print("\n=== SACHSENBERG EVENTS AFTER FIX ===")
cursor.execute("SELECT id, name, date FROM events WHERE name LIKE '%Sachsenberg%' OR name LIKE '%sachsenberg%'")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} ({row[2]})")

conn.close()
