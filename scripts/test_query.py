import sqlite3

db = sqlite3.connect('autox.db')
cursor = db.cursor()

query = """
    SELECT 
        d.id, 
        d.name, 
        d.team, 
        d.car, 
        d.start_number as number, 
        c.name as driverClass,
        d.bio,
        d.season_rank,
        SUM(r.points) as total_points,
        COUNT(CASE WHEN r.rank = 1 THEN 1 END) as wins,
        SUM(r.heat_wins) as heatWins,
        SUM(r.points) as points,
        COUNT(r.id) as races,
        COUNT(CASE WHEN r.rank <= 3 THEN 1 END) as podiums
    FROM drivers d
    LEFT JOIN race_results r ON d.id = r.driver_id
    LEFT JOIN classes c ON d.current_class_id = c.id
    WHERE d.name LIKE '%Hönicke%' OR d.name LIKE '%Raiser%'
    GROUP BY d.id
    ORDER BY d.current_class_id, total_points DESC
"""

try:
    cursor.execute(query)
    rows = cursor.fetchall()
    print(f"Query Success. Rows: {len(rows)}")
    for row in rows:
        # 1:Name, 9:Wins, 10:HeatWins, 11:Points
        print(f"Name: {row[1]}, Wins: {row[9]}, HeatWins: {row[10]}")
except Exception as e:
    print(f"Query Error: {e}")

db.close()
