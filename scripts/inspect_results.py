import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("--- Inspecting Race Results (First 20) ---")
cursor.execute("""
    SELECT 
        r.id, 
        d.name, 
        c.name as class_name,
        r.rank, 
        r.heat_wins,
        r.points
    FROM race_results r
    JOIN drivers d ON r.driver_id = d.id
    JOIN classes c ON r.class_id = c.id
    WHERE r.rank <= 3 OR r.heat_wins > 0
    LIMIT 20
""")

rows = cursor.fetchall()
print(f"{'Driver':<20} {'Class':<15} {'Rank':<5} {'HeatWins':<8} {'Points'}")
print("-" * 60)
for row in rows:
    # row: id, name, class, rank, heat_wins, points
    print(f"{row[1]:<20} {row[2]:<15} {row[3]!s:<5} {row[4]!s:<8} {row[5]}")

print("\n--- Check Data Types ---")
cursor.execute("PRAGMA table_info(race_results)")
cols = cursor.fetchall()
for c in cols:
    if c[1] in ['rank', 'heat_wins']:
        print(f"Column {c[1]}: Type {c[2]}")

conn.close()
