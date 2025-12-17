import sqlite3

conn = sqlite3.connect('autox.db')
cur = conn.cursor()

print('=== WACV Import Verification ===\n')

# Classes
print('Classes:', cur.execute("SELECT count(*) FROM classes WHERE championship_id = 'WACV'").fetchone()[0])

# Events structure
print('\nWACV Physical Events:')
for r in cur.execute("SELECT id, title, start_date FROM physical_events WHERE id LIKE 'pe_wacv_%' ORDER BY start_date").fetchall():
    print(f'  {r[0]}: {r[1]} ({r[2]})')

print('\nWACV Championship Events:')
print('  Count:', cur.execute("SELECT count(*) FROM championship_events WHERE championship_id = 'WACV'").fetchone()[0])

print('\nWACV Class Events:')
print('  Count:', cur.execute("SELECT count(*) FROM class_events WHERE class_id LIKE 'w_%'").fetchone()[0])

print('\nWACV Race Results:')
print('  Total:', cur.execute("SELECT count(*) FROM race_results WHERE class_id LIKE 'w_%'").fetchone()[0])

# Test the API query
print('\n=== Testing API Query (Driver Results) ===')
test_driver = cur.execute("SELECT id, name FROM drivers WHERE id LIKE 'w_%' LIMIT 1").fetchone()
if test_driver:
    print(f'Testing with driver: {test_driver[1]} ({test_driver[0]})')
    
    query = """
        SELECT 
            pe.title as event_name, 
            pe.start_date as event_date, 
            c.name as class_name, 
            r.rank, 
            COALESCE(r.championship_points, r.points) as points
        FROM race_results r
        JOIN championship_events ce ON r.championship_event_id = ce.id
        JOIN physical_events pe ON ce.physical_event_id = pe.id
        LEFT JOIN classes c ON r.class_id = c.id
        WHERE r.driver_id = ?
        ORDER BY pe.start_date DESC
    """
    
    results = cur.execute(query, (test_driver[0],)).fetchall()
    print(f'Results found: {len(results)}')
    for r in results[:3]:
        print(f'  {r[0]} ({r[1]}): Rank {r[3]}, {r[4]} pts in {r[2]}')

conn.close()
print('\n=== Verification Complete ===')
