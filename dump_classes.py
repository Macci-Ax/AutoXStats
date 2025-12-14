import sqlite3

db_path = 'autox.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

output_file = 'classes_info.txt'

with open(output_file, 'w') as f:
    cursor.execute("SELECT id, name FROM classes;")
    rows = cursor.fetchall()
    for row in rows:
        f.write(str(row) + "\n")

conn.close()
