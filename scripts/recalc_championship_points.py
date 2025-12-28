"""
Recalculate championship_points applying TL (Tagesstarter) rule:
- TL drivers get 0 championship points
- DRCV drivers move up in rank when TL drivers are removed
- Points are assigned based on adjusted rank
"""
import sqlite3

DB_PATH = 'autox.db'

def get_points_for_rank(rank, is_langstrecke):
    """Calculate championship points based on adjusted rank."""
    if is_langstrecke:
        lang_points = {1: 40, 2: 35, 3: 30, 4: 27, 5: 25, 6: 23, 7: 21, 8: 19, 9: 17}
        if rank in lang_points:
            return lang_points[rank]
        elif 10 <= rank <= 25:
            return 26 - rank
        else:
            return 0
    else:
        points_map = {1: 9, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1}
        return points_map.get(rank, 0)

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all DRCV championship events
    cursor.execute("""
        SELECT DISTINCT r.championship_event_id, r.class_id
        FROM race_results r
        JOIN classes c ON r.class_id = c.id
        WHERE c.championship_id = 'DRCV' AND r.championship_event_id IS NOT NULL
    """)
    event_class_combos = cursor.fetchall()
    
    print(f"Processing {len(event_class_combos)} event/class combinations...")
    
    total_updated = 0
    
    for ce_id, class_id in event_class_combos:
        is_langstrecke = 'lang' in class_id.lower()
        
        # Get all results for this event/class ordered by original rank
        cursor.execute("""
            SELECT id, driver_id, rank, license_type
            FROM race_results
            WHERE championship_event_id = ? AND class_id = ?
            ORDER BY rank ASC
        """, (ce_id, class_id))
        results = cursor.fetchall()
        
        # Separate TL and DRCV drivers
        drcv_results = [(r[0], r[1], r[2]) for r in results if r[3] != 'TL']
        tl_results = [(r[0], r[1], r[2]) for r in results if r[3] == 'TL']
        
        # Set TL drivers to 0 championship points
        for res_id, _, _ in tl_results:
            cursor.execute("UPDATE race_results SET championship_points = 0 WHERE id = ?", (res_id,))
            total_updated += 1
        
        # Recalculate championship points for DRCV drivers based on adjusted rank
        adjusted_rank = 1
        for res_id, _, original_rank in drcv_results:
            champ_points = get_points_for_rank(adjusted_rank, is_langstrecke)
            cursor.execute("UPDATE race_results SET championship_points = ? WHERE id = ?", (champ_points, res_id))
            adjusted_rank += 1
            total_updated += 1
    
    conn.commit()
    print(f"Updated {total_updated} race results.")
    
    # Verify with a sample
    print("\nSample verification (Langstrecke, first event with TL drivers):")
    cursor.execute("""
        SELECT r.rank, d.name, r.license_type, r.championship_points
        FROM race_results r
        JOIN drivers d ON r.driver_id = d.id
        WHERE r.class_id = 'd_lang' 
        ORDER BY r.championship_event_id, r.rank
        LIMIT 15
    """)
    for row in cursor.fetchall():
        marker = " <-- TL" if row[2] == 'TL' else ""
        print(f"  Rank {row[0]}: {row[1]} ({row[2]}) -> {row[3]} champ pts{marker}")
    
    conn.close()

if __name__ == '__main__':
    main()
