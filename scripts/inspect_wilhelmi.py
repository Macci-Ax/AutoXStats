
import sqlite3
conn = sqlite3.connect('autox.db')
c = conn.cursor()
c.execute("SELECT * FROM drivers WHERE name LIKE '%Wilhelmi%'")
res = c.fetchall()
print(f"Driver: {res}")
if res:
    did = res[0][0] # ID
    c.execute("SELECT points FROM driver_participations WHERE driver_id = ?", (did,))
    pts = c.fetchall()
    print(f"Points for Wilhelmi: {pts}")
conn.close()
