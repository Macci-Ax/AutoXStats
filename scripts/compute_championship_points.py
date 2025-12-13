"""
CORRECT: Compute championship points based on championship POSITION, not sporting points.

The PDF's "GP/Zeit" column contains sporting points (based on finishing position).
But DRCV drivers behind TL drivers should get HIGHER championship points.

Example:
  Rank 1: DRCV (champ pos 1) -> champ pts for position 1 (40 for Langstrecke)
  Rank 2: TL -> 0 champ pts
  Rank 3: DRCV (champ pos 2) -> champ pts for position 2 (35 for Langstrecke)
  
NOT just copying the PDF's points column!
"""
import sqlite3

DB_PATH = 'autox.db'

# Points by championship position (NOT sporting rank)
STANDARD_POINTS = {1: 9, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1}

LANGSTRECKE_POINTS = {
    1: 40, 2: 35, 3: 30, 4: 27, 5: 25, 6: 23, 7: 21, 8: 19, 9: 17,
    10: 16, 11: 15, 12: 14, 13: 13, 14: 12, 15: 11, 16: 10,
    17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2, 25: 1
}

def get_points_for_champ_position(champ_pos, is_langstrecke):
    if is_langstrecke:
        return LANGSTRECKE_POINTS.get(champ_pos, 0)
    else:
        return STANDARD_POINTS.get(champ_pos, 0)

def compute_championship_points():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # First, set all to 0
    cursor.execute("UPDATE race_results SET championship_points = 0")
    
    # Get distinct event/class combinations
    cursor.execute("""
        SELECT DISTINCT event_id, class_id 
        FROM race_results 
        ORDER BY event_id, class_id
    """)
    event_class_pairs = cursor.fetchall()
    
    total_updated = 0
    
    for event_id, class_id in event_class_pairs:
        is_langstrecke = 'lang' in class_id.lower()
        
        # Get sporting results ordered by rank (sporting position)
        cursor.execute("""
            SELECT id, driver_id, rank, license_type, points
            FROM race_results 
            WHERE event_id = ? AND class_id = ?
            ORDER BY rank ASC
        """, (event_id, class_id))
        rows = cursor.fetchall()
        
        # Assign championship positions to DRCV drivers only
        champ_pos = 1
        for res_id, driver_id, rank, license_type, sporting_points in rows:
            if license_type == 'DRCV':
                # Calculate championship points based on championship position
                champ_pts = get_points_for_champ_position(champ_pos, is_langstrecke)
                cursor.execute(
                    "UPDATE race_results SET championship_points = ? WHERE id = ?",
                    (champ_pts, res_id)
                )
                champ_pos += 1
                total_updated += 1
            # TL drivers already have championship_points = 0
    
    conn.commit()
    
    print(f"Updated {total_updated} DRCV results with championship points")
    
    # Verify René Bouma
    cursor.execute("SELECT id FROM drivers WHERE name LIKE '%Bouma%'")
    driver = cursor.fetchone()
    if driver:
        cursor.execute("""
            SELECT e.name, rr.rank, rr.points, rr.championship_points, rr.license_type
            FROM race_results rr
            JOIN events e ON rr.event_id = e.id
            WHERE rr.driver_id = ? AND rr.class_id = 'd_lang'
            ORDER BY e.date
        """, (driver[0],))
        print("\nRené Bouma Langstrecke:")
        total = 0
        for r in cursor.fetchall():
            total += r[3]
            print(f"  {r[0]}: rank={r[1]}, sporting_pts={r[2]}, champ_pts={r[3]}, license={r[4]}")
        print(f"\nTotal championship_points: {total}")
        print(f"Expected: 218")
    
    conn.close()
    print("\nDone!")

if __name__ == "__main__":
    compute_championship_points()
