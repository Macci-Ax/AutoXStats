import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("--- Championship Standings (Drivers Top 20) ---")
query = """
    SELECT 
        d.name as driver,
        c.name as class,
        e.name as event,
        r.rank,
        r.points
    FROM race_results r
    JOIN drivers d ON r.driver_id = d.id
    JOIN events e ON r.event_id = e.id
    JOIN classes c ON r.class_id = c.id
    ORDER BY e.date, c.name, r.rank
    LIMIT 20
"""

print(f"{'Event':<25} {'Class':<15} {'Rank':<5} {'Driver':<20} {'Points':<5}")
print("-" * 75)

for row in cursor.execute(query):
    driver, cls, evt, rank, pts = row
    print(f"{evt[:25]:<25} {cls[:15]:<15} {rank:<5} {driver[:20]:<20} {pts:<5}")

print("\n--- Total Results Count ---")
cursor.execute("SELECT COUNT(*) FROM race_results")
print(cursor.fetchone()[0])

print("\n--- Drivers Count ---")
cursor.execute("SELECT COUNT(*) FROM drivers")
print(cursor.fetchone()[0])

conn.close()
