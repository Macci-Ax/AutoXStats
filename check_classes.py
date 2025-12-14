import sqlite3

db_path = 'autox.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

with open('check_classes_output.txt', 'w') as f:
    f.write("Checking class_events coverage for 'Klasse' discipline...\n")
    cursor.execute("""
        SELECT c.name, ce.discipline, COUNT(*) as event_count
        FROM class_events ce
        JOIN classes c ON ce.class_id = c.id
        WHERE c.name LIKE 'Klasse %'
        GROUP BY c.name, ce.discipline
        ORDER BY c.name
    """)
    rows = cursor.fetchall()
    for r in rows:
        f.write(str(r) + "\n")

conn.close()
