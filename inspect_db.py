import sqlite3

db_path = 'autox.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

output_file = 'db_inspection_results.txt'

def query(q, f):
    f.write(f"Query: {q}\n")
    try:
        cursor.execute(q)
        rows = cursor.fetchall()
        for row in rows:
            f.write(str(row) + "\n")
        f.write("-" * 20 + "\n")
    except Exception as e:
        f.write(f"Error: {e}\n")

with open(output_file, 'w') as f:
    # Check tables
    query("SELECT name FROM sqlite_master WHERE type='table';", f)

    # Check content of events
    query("SELECT * FROM events LIMIT 5;", f)
    
    # Check content of classes
    query("SELECT * FROM classes LIMIT 5;", f)

    # Check if class_events exists
    query("SELECT name FROM sqlite_master WHERE type='table' AND name='class_events';", f)

conn.close()
