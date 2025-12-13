import sqlite3

def verify():
    conn = sqlite3.connect('autox.db')
    cursor = conn.cursor()
    
    event_id = 'evt_sachsenberg_2025_rec'
    
    # Check Rene Bouma (210)
    # Get distinct points
    rows = cursor.execute("""
        SELECT d.name, d.start_number, r.points, r.class_id
        FROM race_results r
        JOIN drivers d ON r.driver_id = d.id
        WHERE r.event_id = ? AND (d.start_number = 210 OR d.start_number = 1)
    """, (event_id,)).fetchall()
    
    print("Verification Data:")
    for r in rows:
        print(f"Driver: {r[0]} (#{r[1]}) - Class: {r[3]} - Points: {r[2]}")

    conn.close()

if __name__ == "__main__":
    verify()
