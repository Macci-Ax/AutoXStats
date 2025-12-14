
import sqlite3
import sys

DB_PATH = './autox.db'


def log(msg):
    print(msg)
    with open('fix_log.txt', 'a') as f:
        f.write(msg + '\n')

def fix_classes():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    log("--- 1. Identify Classes ---")
    c.execute("SELECT id, name FROM classes WHERE name LIKE 'Klasse 11%' OR name LIKE 'Langstrecke%'")
    rows = c.fetchall()
    
    k11_ids = []
    lang_ids = []
    
    for r in rows:
        log(f"Found Class: {r}")
        if 'Klasse 11' in r[1]:
            k11_ids.append(r[0])
        elif 'Langstrecke' in r[1]: # Collect ALL Langstrecke to be safe
             lang_ids.append((r[0], r[1]))
            
    # Heuristic: Pick the Langstrecke that doesn't have 'Jugend' if possible, but list all
    target_lang_id = None
    for lid, lname in lang_ids:
        if 'Jugend' not in lname:
            target_lang_id = lid
            break
    
    # Fallback or specific logic
    if not target_lang_id and lang_ids:
        target_lang_id = lang_ids[0][0]

    # Target K11
    target_k11_id = k11_ids[0] if k11_ids else None

    if not target_k11_id or not target_lang_id:
        log("Error: Could not identify Class IDs.")
        log(f"K11: {k11_ids}, Lang: {lang_ids}")
        conn.close()
        return

    log(f"Target: Move from {target_lang_id} (Langstrecke) to {target_k11_id} (Klasse 11)")

    log("\n--- 2. Identify Events ---")
    c.execute("SELECT id, name FROM events WHERE (name LIKE '%Sachsenberg%' OR name LIKE '%Herbern%') AND strftime('%Y', date) = '2024'")
    events = c.fetchall()
    event_ids = [e[0] for e in events]
    
    for e in events:
        log(f"Event: {e}")
        
    if not event_ids:
        log("No events found.")
        conn.close()
        return

    log("\n--- 3. Execute Fix ---")
    placeholders = ','.join(['?'] * len(event_ids))
    
    # Debug: List all rows in Langstrecke for these events
    debug_query = f"""
        SELECT id, start_number, class_id FROM race_results 
        WHERE event_id IN ({placeholders}) 
        AND class_id = ?
    """
    c.execute(debug_query, event_ids + [target_lang_id])
    all_rows = c.fetchall()
    log(f"DEBUG: Found {len(all_rows)} total Langstrecke rows in class {target_lang_id}.")
    for r in all_rows:
        log(f"  Row: {r}")

    # Check count first
    check_query = f"""
        SELECT COUNT(*) FROM race_results 
        WHERE event_id IN ({placeholders}) 
        AND class_id = ? 
        AND CAST(start_number AS INTEGER) > 1000
    """
    c.execute(check_query, event_ids + [target_lang_id])
    count = c.fetchone()[0]
    log(f"Found {count} rows to update.")

    if count > 0:
        update_query = f"""
            UPDATE race_results 
            SET class_id = ? 
            WHERE event_id IN ({placeholders}) 
            AND class_id = ? 
            AND CAST(start_number AS INTEGER) > 1000
        """
        c.execute(update_query, [target_k11_id] + event_ids + [target_lang_id])
        log(f"Updated {c.rowcount} rows.")
        conn.commit()
    else:
        log("No rows to update.")

    conn.close()

if __name__ == "__main__":
    # Clear log
    with open('fix_log.txt', 'w') as f:
        f.write('')
    fix_classes()
