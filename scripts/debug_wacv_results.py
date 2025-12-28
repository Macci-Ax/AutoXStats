import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== SEARCHING FOR CLASS 'Endlauf Spezial' ===")
cursor.execute("SELECT id, name FROM classes WHERE name LIKE '%Endlauf Spezial%'")
classes = cursor.fetchall()

for class_id, class_name in classes:
    print(f"\nClass: {class_name} (ID: {class_id})")
    print("-" * 40)
    
    query = """
    SELECT 
        pe.title, 
        d.name, 
        r.rank, 
        r.points,
        r.championship_points
    FROM race_results r
    JOIN championship_events ce ON r.championship_event_id = ce.id
    JOIN physical_events pe ON ce.physical_event_id = pe.id
    JOIN drivers d ON r.driver_id = d.id
    WHERE r.class_id = ?
    ORDER BY pe.start_date DESC, r.rank ASC
    """
    
    cursor.execute(query, (class_id,))
    results = cursor.fetchall()
    for row in results:
        print(f"Event: {row[0]} | Driver: {row[1]} | Rank: {row[2]} | Pts: {row[3]} | ChampPts: {row[4]}")

conn.close()
