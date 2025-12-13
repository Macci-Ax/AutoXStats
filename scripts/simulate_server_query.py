"""Simulate the exact server query for René Bouma"""
import sqlite3

DB_PATH = 'autox.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Find René Bouma
cursor.execute("SELECT id FROM drivers WHERE name LIKE '%Bouma%'")
driver_id = cursor.fetchone()[0]

# Run the same query as the server
query = """
    SELECT 
        d.id as driver_id,
        dp.class_id,
        d.name, 
        dp.points as static_points,
        c.championship_id as champ_id,
        SUM(r.championship_points) as calc_points,
        COUNT(r.id) as races
    FROM drivers d
    JOIN driver_participations dp ON d.id = dp.driver_id
    JOIN classes c ON dp.class_id = c.id
    LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
    WHERE d.id = ?
    GROUP BY d.id, dp.class_id
"""

cursor.execute(query, (driver_id,))
results = cursor.fetchall()
print("Server query results for Bouma:")
for r in results:
    print(f"  class={r[1]}, static={r[3]}, calc_points={r[5]}, races={r[6]}")
    # The driver display uses: hasRaces ? calc_points : static_points
    hasRaces = r[6] > 0
    displayed = r[5] if hasRaces else r[3]
    print(f"    -> Displayed points: {displayed}")

conn.close()
