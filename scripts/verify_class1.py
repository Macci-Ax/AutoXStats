
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("--- Checking Klasse 1 (w_k1) ---")
cursor.execute("SELECT count(*) FROM driver_participations WHERE class_id = 'w_k1'")
count = cursor.fetchone()[0]
print(f"Total Entries in w_k1: {count}")

print("\n--- Checking Winner Jerrentrup ---")
cursor.execute("""
    SELECT d.name, c.id, dp.points 
    FROM drivers d 
    JOIN driver_participations dp ON d.id = dp.driver_id 
    JOIN classes c ON dp.class_id = c.id
    WHERE d.name LIKE '%Jerrentrup%'
""")
for row in cursor.fetchall():
    print(f"  Found: {row}")

# Check Clobes (Rank 3)
print("\n--- Checking Clobes ---")
cursor.execute("SELECT * FROM drivers WHERE name LIKE '%Clobes%'")
print(cursor.fetchall())

conn.close()
