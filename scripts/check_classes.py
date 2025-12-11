import sqlite3

conn = sqlite3.connect('autox.db')
query = """
    SELECT c.name as ClassName, c.id as ClassID, COUNT(r.id) as ResultCount
    FROM classes c
    LEFT JOIN race_results r ON c.id = r.class_id
    GROUP BY c.id
    ORDER BY c.id
"""

cursor = conn.cursor()
cursor.execute(query)
rows = cursor.fetchall()
print(f"{'ClassName':<30} {'ClassID':<10} {'ResultCount'}")
print("-" * 55)
for row in rows:
    print(f"{row[0]:<30} {row[1]:<10} {row[2]}")

conn.close()
