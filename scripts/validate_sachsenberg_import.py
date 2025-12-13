import sqlite3

def validate():
    conn = sqlite3.connect('autox.db')
    cursor = conn.cursor()
    
    event_id = 'evt_sachsenberg_2025_rec'
    
    # 8.1 Check Event
    print("=== 8.1 Event Check ===")
    row = cursor.execute("SELECT id, status FROM events WHERE id = ?", (event_id,)).fetchone()
    if row:
        print(f"Event ID: {row[0]}, Status: {row[1]}")
    else:
        print("EVENT NOT FOUND!")
    
    # 8.2 Check Results
    print("\n=== 8.2 Results Sample (first 15) ===")
    rows = cursor.execute("""
        SELECT d.name, d.start_number, r.class_id, r.rank, r.points
        FROM race_results r
        JOIN drivers d ON r.driver_id = d.id
        WHERE r.event_id = ?
        ORDER BY r.class_id, r.rank
        LIMIT 15
    """, (event_id,)).fetchall()
    for r in rows:
        print(f"  {r[0]} (#{r[1]}) - Class: {r[2]}, Rank: {r[3]}, Points: {r[4]}")
    
    # 8.3 Consistency Check
    print("\n=== 8.3 Consistency Check ===")
    # No NULL driver_id
    null_drivers = cursor.execute("""
        SELECT COUNT(*) FROM race_results WHERE event_id = ? AND driver_id IS NULL
    """, (event_id,)).fetchone()[0]
    print(f"NULL driver_id count: {null_drivers}")
    
    # No NULL class_id
    null_classes = cursor.execute("""
        SELECT COUNT(*) FROM race_results WHERE event_id = ? AND class_id IS NULL
    """, (event_id,)).fetchone()[0]
    print(f"NULL class_id count: {null_classes}")
    
    # All marked reconstructed
    non_reconstructed = cursor.execute("""
        SELECT COUNT(*) FROM race_results WHERE event_id = ? AND (reconstructed IS NULL OR reconstructed = 0)
    """, (event_id,)).fetchone()[0]
    print(f"Non-reconstructed count (should be 0): {non_reconstructed}")
    
    # Total count
    total = cursor.execute("""
        SELECT COUNT(*) FROM race_results WHERE event_id = ?
    """, (event_id,)).fetchone()[0]
    print(f"\nTotal results imported: {total}")
    
    # Verify key drivers
    print("\n=== Key Driver Verification ===")
    key_drivers = cursor.execute("""
        SELECT d.name, d.start_number, r.points
        FROM race_results r
        JOIN drivers d ON r.driver_id = d.id
        WHERE r.event_id = ? AND d.start_number IN (210, 1)
    """, (event_id,)).fetchall()
    for r in key_drivers:
        print(f"  {r[0]} (#{r[1]}): {r[2]} points")
    
    conn.close()

if __name__ == "__main__":
    validate()
