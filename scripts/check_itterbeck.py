import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("--- Check Itterbeck (e7) Results ---")
cursor.execute("""
    SELECT count(*) FROM race_results WHERE event_id = 'e7'
""")
count = cursor.fetchone()[0]
print(f"Total Results for Itterbeck: {count}")

if count > 0:
    print("\nSample Results:")
    cursor.execute("""
        SELECT r.id, d.name, c.name, r.points 
        FROM race_results r
        JOIN drivers d ON r.driver_id = d.id
        JOIN classes c ON r.class_id = c.id
        WHERE r.event_id = 'e7'
        LIMIT 10
    """)
    for row in cursor.fetchall():
        print(row)
else:
    print("WARNING: No results found for Itterbeck!")

conn.close()
