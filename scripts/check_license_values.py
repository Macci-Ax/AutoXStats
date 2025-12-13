"""Check all distinct license_type values in race_results"""
import sqlite3

DB_PATH = 'autox.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("=== DISTINCT LICENSE_TYPE VALUES ===")
cursor.execute("SELECT DISTINCT license_type FROM race_results")
values = cursor.fetchall()
for v in values:
    print(f"  '{v[0]}'")

print("\n=== LICENSE_TYPE DISTRIBUTION ===")
cursor.execute("""
    SELECT license_type, COUNT(*) as cnt 
    FROM race_results 
    GROUP BY license_type
    ORDER BY cnt DESC
""")
for row in cursor.fetchall():
    print(f"  {row[0]!r}: {row[1]}")

# Check for values other than DRCV/TL
print("\n=== NON-STANDARD VALUES ===")
cursor.execute("""
    SELECT DISTINCT license_type 
    FROM race_results 
    WHERE license_type NOT IN ('DRCV', 'TL') AND license_type IS NOT NULL
""")
non_standard = cursor.fetchall()
if non_standard:
    print("Found non-standard values:")
    for v in non_standard:
        print(f"  '{v[0]}'")
        # Show sample rows
        cursor.execute("""
            SELECT d.name, e.name, rr.rank, rr.points, rr.license_type
            FROM race_results rr
            JOIN drivers d ON rr.driver_id = d.id
            JOIN events e ON rr.event_id = e.id
            WHERE rr.license_type = ?
            LIMIT 3
        """, (v[0],))
        for r in cursor.fetchall():
            print(f"    {r}")
else:
    print("  All values are DRCV or TL")

conn.close()
