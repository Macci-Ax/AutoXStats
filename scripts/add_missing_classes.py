import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Classes that might be missing
missing_classes = [
    ('d_sc_div4', 'Super Cup Div 4', 'DRCV'),
    ('d_cb_690', 'Crossbuggy bis 690ccm', 'DRCV'),
    ('d_cb_over690', 'Crossbuggy über 690ccm', 'DRCV'),
]

print("Adding missing DRCV classes...")
for class_id, name, champ in missing_classes:
    try:
        cursor.execute("INSERT OR IGNORE INTO classes (id, name, championship_id) VALUES (?, ?, ?)", 
                      (class_id, name, champ))
        print(f"  Added: {class_id} ({name})")
    except Exception as e:
        print(f"  Error: {e}")

conn.commit()

# Verify
print("\nAll DRCV classes now:")
cursor.execute("SELECT id, name FROM classes WHERE championship_id = 'DRCV' ORDER BY id")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
