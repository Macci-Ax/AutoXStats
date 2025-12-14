"""Check Sachsenberg 2024 top 4 concise"""
import sqlite3
conn = sqlite3.connect('autox.db')
c = conn.cursor()
c.execute("""
    SELECT rr.rank, d.name
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE e.name LIKE '%Sachsenberg%' AND strftime('%Y', e.date) = '2024'
    AND rr.class_id = 'd_lang'
    ORDER BY rr.rank
    LIMIT 4
""")
print(c.fetchall())
conn.close()
