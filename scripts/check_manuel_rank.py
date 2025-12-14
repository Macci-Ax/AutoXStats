import sqlite3
conn = sqlite3.connect('autox.db')
c = conn.cursor()
c.execute("""
    SELECT rr.rank, rr.points, rr.championship_points, rr.laps 
    FROM race_results rr 
    JOIN drivers d ON rr.driver_id = d.id 
    JOIN events e ON rr.event_id = e.id 
    WHERE d.name LIKE '%Friedewald%' 
    AND e.name LIKE '%Sachsenberg%' 
    AND strftime('%Y', e.date) = '2024' 
    AND rr.class_id = 'd_lang'
""")
print(c.fetchall())
