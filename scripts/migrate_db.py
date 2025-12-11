import sqlite3

DB_PATH = 'autox.db'

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE race_results ADD COLUMN heat_wins INTEGER DEFAULT 0")
        print("Column 'heat_wins' added successfully.")
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e):
            print("Column 'heat_wins' already exists.")
        else:
            print(f"Error adding column: {e}")
            
    conn.commit()
    conn.close()

if __name__ == '__main__':
    migrate()
