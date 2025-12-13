import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

# Reference from PDF screenshot:
# Felix Rüelmann (#1503): 80 points total
# Björn Willmann (#1508): 68 points total  
# Theo Lüske (#1501): 52 points total

print("=== Points Comparison: PDF vs Database ===\n")

test_drivers = [
    (1503, "Felix Rüelmann", 80),
    (1508, "Björn Willmann", 68),
    (1501, "Theo Lüske", 52),
    (1518, "Luca Kiepe", 32),
]

for start_num, name, expected in test_drivers:
    # Get sum from DB
    cursor.execute("""
        SELECT SUM(r.points) as total
        FROM race_results r
        JOIN drivers d ON r.driver_id = d.id
        WHERE d.start_number = ?
    """, (start_num,))
    actual = cursor.fetchone()[0] or 0
    
    diff = expected - actual
    status = "✅" if diff == 0 else f"❌ (diff: {diff:+d})"
    print(f"{name} (#{start_num}): Expected={expected}, Actual={actual} {status}")
    
    # Show breakdown by event
    cursor.execute("""
        SELECT e.name, r.points
        FROM race_results r
        JOIN drivers d ON r.driver_id = d.id
        JOIN events e ON r.event_id = e.id
        WHERE d.start_number = ?
        ORDER BY e.name
    """, (start_num,))
    print("  Events:")
    for row in cursor.fetchall():
        print(f"    - {row[0]}: {row[1]}")
    print()

conn.close()
