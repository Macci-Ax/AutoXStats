
import sqlite3
conn = sqlite3.connect('autox.db')
c = conn.cursor()
c.execute("SELECT count(*) FROM drivers WHERE id LIKE 'w_%'")
print(f"DRV: {c.fetchone()[0]}")
c.execute("SELECT count(*) FROM driver_participations WHERE class_id LIKE 'w_%'")
print(f"PART: {c.fetchone()[0]}")
c.execute("SELECT d.name, dp.points FROM drivers d JOIN driver_participations dp ON d.id=dp.driver_id WHERE dp.class_id LIKE 'w_%' ORDER BY dp.points DESC LIMIT 5")
rows = c.fetchall()
for r in rows:
    print(f"Top: {r[0]} - {r[1]}")
conn.close()
