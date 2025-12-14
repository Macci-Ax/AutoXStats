
import sqlite3

DB_PATH = './autox.db'

def verify():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    print("--- Verifying Fix ---")
    
    # Check for any remaining suspicious entries
    c.execute("SELECT id FROM classes WHERE name LIKE 'Langstrecke%' AND name NOT LIKE '%Jugend%'")
    rows = c.fetchall()
    if not rows:
        print("Error: Could not find Langstrecke class")
        return
        
    lang_ids = [r[0] for r in rows]
    placeholders = ','.join(['?'] * len(lang_ids))

    query = f"""
        SELECT COUNT(*) FROM race_results rr
        JOIN events e ON rr.event_id = e.id
        WHERE (e.name LIKE '%Sachsenberg%' OR e.name LIKE '%Herbern%')
        AND strftime('%Y', e.date) = '2024'
        AND rr.class_id IN ({placeholders})
        AND CAST(rr.start_number AS INTEGER) > 1000
    """
    
    c.execute(query, lang_ids)
    count = c.fetchone()[0]
    
    if count == 0:
        print("SUCCESS: No suspicious entries found in Langstrecke.")
    else:
        print(f"FAILURE: Found {count} suspicious entries remaining in Langstrecke!")

    # Check that they are in Klasse 11 now
    c.execute("SELECT id FROM classes WHERE name LIKE 'Klasse 11%'")
    k11_id = c.fetchone()[0]
    
    query_k11 = f"""
        SELECT COUNT(*) FROM race_results rr
        JOIN events e ON rr.event_id = e.id
        WHERE (e.name LIKE '%Sachsenberg%' OR e.name LIKE '%Herbern%')
        AND strftime('%Y', e.date) = '2024'
        AND rr.class_id = ?
        AND CAST(rr.start_number AS INTEGER) > 1000
    """
    c.execute(query_k11, [k11_id])
    count_k11 = c.fetchone()[0]
    print(f"INFO: Found {count_k11} moved entries in Klasse 11 (should be > 0).")

    conn.close()

if __name__ == "__main__":
    verify()
