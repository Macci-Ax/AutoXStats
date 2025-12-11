import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("--- Dominik Hönicke Results ---")
cursor.execute("""
    SELECT 
        r.id, 
        d.name, 
        c.name as class_name,
        r.rank, 
        r.points,
        r.heat_wins
    FROM race_results r
    JOIN drivers d ON r.driver_id = d.id
    JOIN classes c ON r.class_id = c.id
    WHERE d.name LIKE '%Dominik Hönicke%'
""")

rows = cursor.fetchall()
for row in rows:
    print(row)

conn.close()
