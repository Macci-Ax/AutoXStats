import sqlite3

db_path = 'autox.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

output_file = 'schema_info.txt'

with open(output_file, 'w') as f:
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table';")
    rows = cursor.fetchall()
    for row in rows:
        f.write(row[0] + ";\n\n")

conn.close()
