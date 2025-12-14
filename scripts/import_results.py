import sqlite3
import pdfplumber
import os
import re
import uuid
import datetime

DB_PATH = 'autox.db'

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def parse_date(date_str):
    try:
        return datetime.datetime.strptime(date_str, '%d.%m.%Y').strftime('%Y-%m-%d')
    except ValueError:
        return None

def find_event(cursor, date_str, location_hint):
    cursor.execute("SELECT id, name FROM events WHERE date = ?", (date_str,))
    rows = cursor.fetchall()
    if len(rows) == 1:
        return rows[0][0]
    elif len(rows) > 1:
        for eid, name in rows:
            if location_hint.lower() in name.lower():
                return eid
        return rows[0][0]
    return None

def find_or_create_driver(cursor, name, team, car, start_number, class_id):
    # Try to find by Name (loose match?)
    cursor.execute("SELECT id FROM drivers WHERE name = ? COLLATE NOCASE", (name,))
    row = cursor.fetchone()
    if row:
        return row[0]
    
    new_id = f"drv_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO drivers (id, name, team, car, start_number, current_class_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (new_id, name, team, car, start_number, class_id))
    return new_id

def find_or_create_class(cursor, class_name, champ_id):
    # Normalize class name "Klasse 01" -> "Klasse 1" -> id "d_k1" (assuming DRCV)
    # Heuristic for ID generation:
    # Langstrecke -> d_lang
    # Klasse \d+ -> d_k\d
    
    clean_name = class_name.strip()
    class_id = None
    
    # ID Generation Logic
    if 'langstrecke' in clean_name.lower():
        class_id = f"{champ_id.lower()[0]}_lang" # d_lang or w_lang
    elif 'klasse' in clean_name.lower():
        match = re.search(r'klasse\s*0*(\d+)', clean_name.lower())
        if match:
            num = match.group(1)
            class_id = f"{champ_id.lower()[0]}_k{num}" # d_k1
        else:
            class_id = f"{champ_id.lower()[0]}_{clean_name.lower().replace(' ', '_')}"
    elif 'super cup' in clean_name.lower() or 'supercup' in clean_name.lower():
        # Super Cup Div 1 -> d_sc_div1
        match = re.search(r'div\s*(\S+)', clean_name.lower())
        if match:
            div = match.group(1)
            class_id = f"{champ_id.lower()[0]}_sc_div{div}"
        else:
            class_id = f"{champ_id.lower()[0]}_sc_{uuid.uuid4().hex[:4]}"
    elif 'endlauf' in clean_name.lower():
        # Endlauf Div 1 -> d_el_div1
        match = re.search(r'div\s*(\S+)', clean_name.lower())
        if match:
             div = match.group(1)
             class_id = f"{champ_id.lower()[0]}_el_div{div}"
        else:
             class_id = f"{champ_id.lower()[0]}_el_{uuid.uuid4().hex[:4]}"
    else:
         class_id = f"{champ_id.lower()[0]}_{clean_name.lower().replace(' ', '_')}"
         
    # Check if exists
    cursor.execute("SELECT id FROM classes WHERE id = ?", (class_id,))
    if not cursor.fetchone():
        print(f"  Creating new class: {clean_name} -> {class_id}")
        cursor.execute("INSERT INTO classes (id, championship_id, name) VALUES (?, ?, ?)", 
                       (class_id, champ_id, clean_name))
                       
    return class_id

def process_pdf(pdf_path):
    print(f"Processing {os.path.basename(pdf_path)}...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    with pdfplumber.open(pdf_path) as pdf:
        # Detect Event (Page 0)
        first_page_text = pdf.pages[0].extract_text()
        lines = first_page_text.split('\n')
        header_line = lines[0]
        match = re.search(r'(\d{2}\.\d{2}\.\d{4})', header_line)
        
        event_id = None
        champ_id = 'DRCV' # Default to DRCV unless detected otherwise
        
        if match:
            date_str = match.group(1)
            event_date = parse_date(date_str)
            loc = header_line.split('-')[0].strip()
            event_id = find_event(cursor, event_date, loc)
            
        if not event_id:
            print(f"  [INFO] Creating new event for {loc} on {date_str}")
            event_id = f"evt_{uuid.uuid4().hex[:8]}"
            cursor.execute("INSERT INTO events (id, championship_id, name, date, location, status) VALUES (?, ?, ?, ?, ?, ?)", 
                           (event_id, champ_id, f"{loc} {match.group(1)}", event_date, loc, 'COMPLETED'))
            # Continue with this new event_id

        print(f"  Event: {event_id} ({loc})")

        for i, page in enumerate(pdf.pages):
            current_class_id = None # Reset per page to enforce strict matching
            
            text = page.extract_text()
            if not text: continue
            lines = text.split('\n')
            
            # Class Detection (Line 1 usually)
            # Strategy: If line 1 contains "Klasse" or "Langstrecke", it's a class header
            candidate = lines[1].strip() if len(lines) > 1 else ""
            
            if "klasse" in candidate.lower() or "langstrecke" in candidate.lower() or "jugend" in candidate.lower() or "super" in candidate.lower() or "endlauf" in candidate.lower():
                current_class_id = find_or_create_class(cursor, candidate, champ_id)
                # print(f"  Page {i+1}: Class {candidate} -> {current_class_id}")
            
            if not current_class_id:
                # print(f"  Page {i+1}: No class found. Skipping.")
                continue

            # Extract Table
            tables = page.extract_tables()
            for table in tables:
                header = table[0]
                
                # Identify Columns
                try:
                    col_map = {}
                    heat_cols = []
                    for idx, col in enumerate(header):
                        if not col: continue
                        c = col.replace('.', '').strip().lower()
                        if c == 'pl': col_map['rank'] = idx
                        elif 'startnr' in c: col_map['nr'] = idx
                        elif 'fahrer' in c: col_map['driver'] = idx
                        elif 'team' in c: col_map['team'] = idx
                        elif 'gp' in c: col_map['points'] = idx
                        elif 'runden' in c: col_map['laps'] = idx
                        elif c in ['1', '2', '3', '4']: heat_cols.append(idx)
                    
                    # License type column is typically column 2 (unnamed, between Startnr and Teamname)
                    # It contains 'DRCV' or 'TL'
                    col_map['license_type'] = 2
                    
                    if 'rank' not in col_map or 'driver' not in col_map: 
                        continue

                    for row in table[1:]: # Skip header
                        if not row or not row[col_map['rank']]: continue
                        
                        rank_str = row[col_map['rank']].replace('.', '')
                        if not rank_str.isdigit(): continue
                        rank = int(rank_str)
                        
                        driver_raw = row[col_map['driver']]
                        # Might contain newlines: "Tobias Hönicke\nChristian..."
                        driver_name = driver_raw.split('\n')[0].strip()
                        
                        team = ""
                        if 'team' in col_map and row[col_map['team']]:
                            team = row[col_map['team']].replace('\n', ' ')

                        nr = 0
                        if 'nr' in col_map and row[col_map['nr']]:
                           try:
                               nr = int(row[col_map['nr']].split('\n')[0])
                           except: pass
                        
                        # Extract license type (DRCV or TL) from column 2
                        license_type = 'DRCV'  # Default
                        if 'license_type' in col_map and col_map['license_type'] < len(row):
                            lic_raw = row[col_map['license_type']]
                            if lic_raw:
                                lic_raw = lic_raw.strip().upper()
                                if lic_raw == 'TL':
                                    license_type = 'TL'
                                elif lic_raw == 'DRCV':
                                    license_type = 'DRCV'
                           
                        # Calculate points based on Rank
                        # Standard (Classes): 1->9, 2->7, 3->6... 8->1
                        # Langstrecke: 40, 35, 30, 27, 25, 23, 21, 19, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
                        
                        points = 0
                        is_langstrecke = 'lang' in current_class_id.lower()
                        
                        if is_langstrecke:
                            # 1=40, 2=35, 3=30
                            lang_top_three = {1: 40, 2: 35, 3: 30}
                            if rank in lang_top_three:
                                points = lang_top_three[rank]
                            elif rank == 4: points = 27
                            elif rank == 5: points = 25
                            elif rank == 6: points = 23
                            elif rank == 7: points = 21
                            elif rank == 8: points = 19
                            elif rank == 9: points = 17
                            elif rank >= 10 and rank <= 25:
                                # 10->16, 11->15 ... 25->1
                                # Formula: 16 - (rank - 10) = 26 - rank
                                points = 26 - rank
                            else:
                                points = 0
                        else:
                            # Standard Class Points
                            points_map = {1: 9, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1}
                            points = points_map.get(rank, 0)

                        if 'points' in col_map and row[col_map['points']]:
                            # Still parse total_time if present in points column (sometimes mixed)
                            val = row[col_map['points']]
                            parts = val.split('\n')
                            for p in parts:
                                if ',' in p: total_time = p
                                # We ignore the points value from PDF as we calculated it from rank
                        
                        laps = 0
                        if 'laps' in col_map and row[col_map['laps']]:
                             try: laps = int(row[col_map['laps']])
                             except: pass

                        # Calc Heat Wins
                        # Assume 9 points = Win (DRCV standard usually 9 or 10 depending on year/class)
                        # We will count how many heats have score >= 9
                        heat_wins = 0
                        for hc in heat_cols:
                            if hc < len(row) and row[hc]:
                                try:
                                    h_pts = int(row[hc])
                                    if h_pts >= 9: heat_wins += 1
                                except: pass
                        
                        # Store Driver
                        drv_id = find_or_create_driver(cursor, driver_name, team, None, nr, current_class_id)
                        
                        # Ensure participation record exists
                        cursor.execute("""
                            INSERT OR IGNORE INTO driver_participations (driver_id, class_id)
                            VALUES (?, ?)
                        """, (drv_id, current_class_id))
                        
                        # Store Result (Result ID unique per driver per event PER CLASS)
                        res_id = f"res_{event_id}_{drv_id}_{current_class_id}"
                        
                        # Upsert Result including heat wins (NOW adding heat_wins to race_results schema!)
                        # We must update init_db.py schema for race_results to include heat_wins (done in previous step)
                        
                        cursor.execute("""
                            INSERT OR REPLACE INTO race_results (id, event_id, driver_id, class_id, rank, points, laps, total_time, heat_wins, start_number, license_type)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (res_id, event_id, drv_id, current_class_id, rank, points, laps, total_time, heat_wins, nr, license_type))
                
                except Exception as e:
                    # print(f"    Error parsing row: {e}")
                    pass
                    
    conn.commit()
    conn.close()
    print(f"Finished {os.path.basename(pdf_path)}")

def main():
    import sys
    # Use command line argument or default to pdf/2025
    pdf_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join('pdf', '2025')
    
    if os.path.exists(pdf_dir):
        print(f"Scanning {pdf_dir}...")
        for f in os.listdir(pdf_dir):
            if f.endswith('.pdf'):
                process_pdf(os.path.join(pdf_dir, f))
    else:
        print(f"Directory {pdf_dir} not found.")

if __name__ == '__main__':
    main()

