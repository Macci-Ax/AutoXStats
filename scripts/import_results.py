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
    cursor.execute("SELECT id, title FROM physical_events WHERE start_date = ?", (date_str,))
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
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Detect Event (Page 0)
            if not pdf.pages:
                print("  [ERROR] PDF has no pages")
                return

            first_page_text = pdf.pages[0].extract_text()
            if not first_page_text:
                print("  [ERROR] Could not extract text from first page")
                return

            lines = first_page_text.split('\n')
            header_line = lines[0]
            match = re.search(r'(\d{2}\.\d{2}\.\d{4})', header_line)
            
            event_id = None
            champ_id = 'DRCV' 
            
            loc = "Unknown"
            date_str = "Unknown"
            event_date = None
            
            if match:
                date_str = match.group(1)
                event_date = parse_date(date_str)
                loc = header_line.split('-')[0].strip()
                print(f"  [DEBUG] Header: '{header_line}' -> Date: {date_str} -> Parsed: {event_date} -> Loc: {loc}")
                event_id = find_event(cursor, event_date, loc)
                if event_id:
                     print(f"  [INFO] Found existing event: {event_id}")
            else:
                print(f"  [WARNING] No date match in header: '{header_line}'")
            
            if not event_id:
                if not event_date:
                    print("  [ERROR] No valid date for event. Skipping creation.")
                    return

                print(f"  [INFO] Creating new event for {loc} on {date_str}")
                event_id = f"evt_{uuid.uuid4().hex[:8]}"
                cursor.execute("INSERT INTO physical_events (id, title, start_date, location, status) VALUES (?, ?, ?, ?, ?)", 
                            (event_id, f"{loc} {date_str}", event_date, loc, 'finished'))
                print(f"  [INFO] Created event {event_id}")
            
            # Ensure Championship Event exists
            cursor.execute("SELECT id FROM championship_events WHERE physical_event_id = ? AND championship_id = ?", (event_id, champ_id))
            ce_row = cursor.fetchone()
            if ce_row:
                ce_id = ce_row[0]
            else:
                ce_id = f"ce_{event_id}_{champ_id}"
                cursor.execute("INSERT INTO championship_events (id, physical_event_id, championship_id, has_results) VALUES (?, ?, ?, 1)", (ce_id, event_id, champ_id))

            print(f"  Event: {event_id} ({loc}) / ChampEvent: {ce_id}")

            for i, page in enumerate(pdf.pages):
                current_class_id = None # Reset per page to enforce strict matching
                
                text = page.extract_text()
                if not text: continue
                lines = text.split('\n')
                
                # Class Detection (Line 1 usually)
                candidate = lines[1].strip() if len(lines) > 1 else ""
                
                if "klasse" in candidate.lower() or "langstrecke" in candidate.lower() or "jugend" in candidate.lower() or "super" in candidate.lower() or "endlauf" in candidate.lower():
                    current_class_id = find_or_create_class(cursor, candidate, champ_id)
                
                if not current_class_id:
                    continue

                # Extract Table
                tables = page.extract_tables()
                for table in tables:
                    header = table[0]
                    
                    # Identify Columns
                    try:
                        col_map = {}
                        heat_cols = {}
                        for idx, col in enumerate(header):
                            if not col: continue
                            c = col.replace('.', '').strip().lower()
                            if c == 'pl': col_map['rank'] = idx
                            elif 'startnr' in c: col_map['nr'] = idx
                            elif 'fahrer' in c: col_map['driver'] = idx
                            elif 'team' in c: col_map['team'] = idx
                            elif 'fahrzeug' in c or 'marke' in c: col_map['car'] = idx
                            elif 'gp' in c or 'gesamt' in c: col_map['points'] = idx
                            elif 'runden' in c: col_map['laps'] = idx
                            elif c in ['1', '2', '3', '4']: 
                                try:
                                    heat_cols[int(c)] = idx
                                except: pass
                        
                        col_map['license_type'] = 2
                        
                        if 'rank' not in col_map or 'driver' not in col_map: 
                            continue

                        for row in table[1:]:
                            if not row or not row[col_map['rank']]: continue
                            
                            rank_str = row[col_map['rank']].replace('.', '')
                            if not rank_str.isdigit(): continue
                            rank = int(rank_str)
                            
                            driver_raw = row[col_map['driver']]
                            driver_name = driver_raw.split('\n')[0].strip()
                            
                            team = ""
                            if 'team' in col_map and row[col_map['team']]:
                                team = row[col_map['team']].replace('\n', ' ')

                            car_model = None
                            if 'car' in col_map and row[col_map['car']]:
                                car_model = row[col_map['car']].replace('\n', ' ').strip()
                            
                            nr = 0
                            if 'nr' in col_map and row[col_map['nr']]:
                               try:
                                   nr = int(row[col_map['nr']].split('\n')[0])
                               except: pass
                            
                            license_type = 'DRCV'
                            if 'license_type' in col_map and col_map['license_type'] < len(row):
                                lic_raw = row[col_map['license_type']]
                                if lic_raw:
                                    lic_raw = lic_raw.strip().upper()
                                    if lic_raw == 'TL':
                                        license_type = 'TL'
                                    elif lic_raw == 'DRCV':
                                        license_type = 'DRCV'
                            
                            points = 0
                            is_langstrecke = 'lang' in current_class_id.lower()
                            
                            if is_langstrecke:
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
                                    points = 26 - rank
                                else:
                                    points = 0
                            else:
                                points_map = {1: 9, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1}
                                points = points_map.get(rank, 0)

                            if 'points' in col_map and row[col_map['points']]:
                                val = row[col_map['points']]
                                parts = val.split('\n')
                                for p in parts:
                                    if ',' in p: total_time = p
                            
                            laps = 0
                            if 'laps' in col_map and row[col_map['laps']]:
                                 try: laps = int(row[col_map['laps']])
                                 except: pass

                            # Calc Heat Wins and Points
                            heat_wins = 0
                            run_values = {}
                            calculated_event_points = 0
                            
                            for run_num in range(1, 5):
                                if run_num in heat_cols and heat_cols[run_num] < len(row):
                                    raw_val = row[heat_cols[run_num]]
                                    if raw_val:
                                        try:
                                            h_pts = int(raw_val.split('\n')[0])
                                            run_values[run_num] = h_pts
                                            calculated_event_points += h_pts
                                            if h_pts >= 9: heat_wins += 1
                                        except: pass
                            
                            event_points = calculated_event_points
                            if 'points' in col_map and col_map['points'] < len(row) and row[col_map['points']]:
                                try:
                                    val_str = row[col_map['points']].split('\n')[0].replace(',', '.')
                                    if val_str.replace('.', '').isdigit():
                                         event_points = int(float(val_str))
                                except: pass
                            
                            drv_id = find_or_create_driver(cursor, driver_name, team, car_model, nr, current_class_id)
                            
                            cursor.execute("""
                                INSERT OR IGNORE INTO driver_participations (driver_id, class_id)
                                VALUES (?, ?)
                            """, (drv_id, current_class_id))
                            
                            res_id = f"res_{event_id}_{drv_id}_{current_class_id}"
                            
                            cursor.execute("""
                                INSERT OR REPLACE INTO race_results (
                                    id, event_id, championship_event_id, driver_id, class_id, rank, points, championship_points, laps, total_time, heat_wins, start_number, license_type, car,
                                    run_1, run_2, run_3, run_4, event_points
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                res_id, event_id, ce_id, drv_id, current_class_id, rank, points, points, laps, total_time, heat_wins, nr, license_type, car_model,
                                run_values.get(1), run_values.get(2), run_values.get(3), run_values.get(4), event_points
                            ))
                    
                    except Exception as e:
                        print(f"    Error parsing row: {e}")
                        pass
        
        conn.commit()
    except Exception as e:
        print(f"  [ERROR] Processing file {pdf_path}: {e}")
    finally:
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

