"""Check raw data for Tobias Hönicke in 2024"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Find all Hönicke drivers
print("=== ALL DRIVERS NAMED HÖNICKE ===")
cursor.execute("SELECT id, name, team FROM drivers WHERE name LIKE '%Hönicke%'")
for row in cursor.fetchall():
    print(f"  ID: {row[0]}, Name: {row[1]}, Team: {row[2]}")

# Check Tobias Hönicke's results across ALL years
print("\n=== TOBIAS HÖNICKE ALL RESULTS ===")
cursor.execute("""
    SELECT e.name, e.date, rr.rank, rr.points, rr.championship_points, rr.license_type
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Tobias%Hönicke%' AND rr.class_id = 'd_lang'
    ORDER BY e.date
""")
for row in cursor.fetchall():
    print(f"  {row[0][:20]:20} ({row[1]}): rank={row[2]:2}, pts={row[3]:3}, champ={row[4]:3}, license={row[5]}")

# Check what 2024 Langstrecke results look like for top positions
print("\n=== 2024 LANGSTRECKE RANKS 1-5 FOR EACH EVENT ===")
cursor.execute("""
    SELECT e.name, e.date
    FROM events e
    JOIN race_results rr ON e.id = rr.event_id
    WHERE rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    GROUP BY e.id
    ORDER BY e.date
""")
events = cursor.fetchall()
for event_name, event_date in events:
    print(f"\n  {event_name} ({event_date}):")
    cursor.execute("""
        SELECT d.name, rr.rank, rr.points, rr.championship_points, rr.license_type
        FROM race_results rr
        JOIN drivers d ON rr.driver_id = d.id  
        JOIN events e ON rr.event_id = e.id
        WHERE e.date = ? AND rr.class_id = 'd_lang'
        ORDER BY rr.rank
        LIMIT 5
    """, (event_date,))
    for row in cursor.fetchall():
        print(f"    {row[0][:25]:25} rank={row[1]:2}, pts={row[2]:3}, champ={row[3]:3}, license={row[4]}")

conn.close()
