
import sqlite3

DB_PATH = './autox.db'

def investigate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Find the events
    print("--- Searching for Events ---")
    c.execute("SELECT id, name, date FROM events WHERE (name LIKE '%Sachsenberg%' OR name LIKE '%Herbern%') AND strftime('%Y', date) = '2024'")
    events = c.fetchall()
    for e in events:
        print(f"Event found: ID={e[0]}, Name={e[1]}, Date={e[2]}")
    
    event_ids = [e[0] for e in events]
    if not event_ids:
        print("No events found.")
        conn.close()
        return

    # 2. Find Class IDs for 'Langstrecke' and potential target class
    print("\n--- Class IDs ---")
    c.execute("SELECT id, name FROM classes WHERE name LIKE '%Langstrecke%' OR name LIKE '%Klasse 11%' OR name LIKE '%Jugend%'")
    classes = c.fetchall()
    
    langstrecke_id = None
    klasse11_id = None
    
    for cl in classes:
        print(f"Class: ID={cl[0]}, Name={cl[1]}")
        if cl[1] == 'Langstrecke':
            langstrecke_id = cl[0]
        if 'Klasse 11' in cl[1] or 'Jugend Langstrecke' in cl[1]:
            # Assuming Klasse 11 is the target, verify exact name later
            if 'Klasse 11' in cl[1]:
                klasse11_id = cl[0]

    if not langstrecke_id:
        print("Error: Could not find 'Langstrecke' class ID.")
        conn.close()
        return

    # 3. Check for suspicious entries in Langstrecke
    print(f"\n--- Suspicious Entries in Langstrecke (ID: {langstrecke_id}) ---")
    placeholders = ','.join(['?'] * len(event_ids))
    query = f"""
        SELECT 
            e.name,
            rr.start_number, 
            rr.car, 
            d.name,
            rr.class_id,
            rr.id
        FROM race_results rr
        JOIN events e ON rr.event_id = e.id
        JOIN drivers d ON rr.driver_id = d.id
        WHERE rr.event_id IN ({placeholders}) 
        AND rr.class_id = ?
        ORDER BY e.name, rr.start_number
    """
    
    params = event_ids + [langstrecke_id]
    c.execute(query, params)
    rows = c.fetchall()

    suspicious_count = 0
    for row in rows:
        evt_name, start_nr, car, driver, class_id, rr_id = row
        # Assuming Klasse 11/Jugend start numbers are high (e.g., > 1000) or specific known drivers
        # User mentioned 'Marlon Anderseck' (1102) and 'Max Mürmann' (1146) in screenshot
        
        is_suspicious = False
        try:
            if int(start_nr) > 1000: # Heuristic for Jugend Langstrecke numbers
                is_suspicious = True
        except:
            pass
            
        if is_suspicious:
            print(f"SUSPICIOUS: Event={evt_name}, StartNr={start_nr}, Driver={driver}, RR_ID={rr_id}")
            suspicious_count += 1
        else:
            # print(f"Normal: Event={evt_name}, StartNr={start_nr}, Driver={driver}")
            pass

    print(f"\nFound {suspicious_count} suspicious entries.")

    conn.close()

if __name__ == "__main__":
    investigate()
