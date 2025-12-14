
import sqlite3

def check():
    conn = sqlite3.connect('./autox.db')
    c = conn.cursor()
    c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='classes'")
    print(c.fetchone()[0])
    conn.close()

if __name__ == "__main__":
    check()
