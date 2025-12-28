import sqlite3
import pdfplumber
import os
import re
import uuid
import datetime

DB_PATH = 'autox.db'

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def find_or_create_driver(cursor, name, team, car, start_number, class_id):
    # Try to find by Name
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

def get_class_id_from_filename(filename, champ_id='DRCV'):
    # Filename format: "7.1_Wertung Klasse 01.pdf"
    clean_name = filename.lower()
    
    if 'langstrecke' in clean_name:
        return f"{champ_id.lower()[0]}_lang", "Langstrecke"
    
    match = re.search(r'klasse\s*0*(\d+)', clean_name)
    if match:
        num = match.group(1)
        return f"{champ_id.lower()[0]}_k{num}", f"Klasse {num}"
        
    return None, None

def ensure_class_exists(cursor, class_id, class_name, champ_id='DRCV'):
    cursor.execute("SELECT id FROM classes WHERE id = ?", (class_id,))
    if not cursor.fetchone():
        print(f"  Creating new class: {class_name} -> {class_id}")
        cursor.execute("INSERT INTO classes (id, championship_id, name) VALUES (?, ?, ?)", 
                       (class_id, champ_id, class_name))

def process_sachsenberg_folder():
    pdf_dir = os.path.join('pdf', 'Sachsenberg2025')
    if not os.path.exists(pdf_dir):
        print(f"Directory {pdf_dir} not found.")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Create/Ensure Event
    event_date_str = '2025-07-20' # Hardcoded based on inspection
    location = 'Sachsenberg'
    
    # Check if exists
    cursor.execute("SELECT id FROM physical_events WHERE title = ? OR (location = ? AND start_date = ?)", 
                   (f"{location} {event_date_str.split('-')[2]}.{event_date_str.split('-')[1]}.{event_date_str.split('-')[0]}", location, event_date_str))
    # Actually checking by date is safer
    cursor.execute("SELECT id FROM physical_events WHERE start_date = ? AND location = ?", (event_date_str, location))
    row = cursor.fetchone()
    
    if row:
        event_id = row[0]
        print(f"Found existing event: {event_id}")
    else:
        event_id = f"evt_sachsenberg_2025_final" 
        print(f"Creating new event: {event_id}")
        cursor.execute("INSERT INTO physical_events (id, title, start_date, location, status) VALUES (?, ?, ?, ?, ?)", 
                       (event_id, "Sachsenberg 20.07.2025", event_date_str, location, 'finished'))

    # Ensure Championship Event
    champ_id = 'DRCV'
    cursor.execute("SELECT id FROM championship_events WHERE physical_event_id = ? AND championship_id = ?", (event_id, champ_id))
    ce_row = cursor.fetchone()
    if ce_row:
        ce_id = ce_row[0]
    else:
        ce_id = f"ce_{event_id}_{champ_id}"
        cursor.execute("INSERT INTO championship_events (id, physical_event_id, championship_id, has_results) VALUES (?, ?, ?, 1)", (ce_id, event_id, champ_id))

    # 2. Iterate Files
    files = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
    print(f"Found {len(files)} PDF files to process.")

    for filename in files:
        class_id, class_name = get_class_id_from_filename(filename)
        if not class_id:
            print(f"Skipping {filename}: Could not determine class.")
            continue
            
        print(f"Processing {filename} -> Class: {class_name} ({class_id})")
        
        ensure_class_exists(cursor, class_id, class_name, champ_id)
        
        pdf_path = os.path.join(pdf_dir, filename)
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        header = table[0]
                        # Column Mapping
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
                            elif c in ['1', '2', '3', '4']: 
                                try: heat_cols[int(c)] = idx
                                except: pass
                        
                        # Add License col index if valid (sometimes it's unnamed or assumes position)
                        # Let's assume standard layout: Rank, Driver, License, Team...
                        # If 'Fahrer' is at 1, 'Lizenz' is often at 2.
                        if 'driver' in col_map:
                             # Heuristic: Check column after driver for license like numbers or TL
                             pass 

                        if 'rank' not in col_map or 'driver' not in col_map:
                            continue

                        for row in table[1:]:
                            if not row or not row[col_map['rank']]: continue
                            
                            # Rank
                            try:
                                rank_str = row[col_map['rank']].replace('.', '')
                                if not rank_str.isdigit(): continue
                                rank = int(rank_str)
                            except: continue

                            # Driver
                            driver_raw = row[col_map['driver']]
                            if not driver_raw: continue
                            driver_name = driver_raw.split('\n')[0].strip()
                            
                            # Team
                            team = ""
                            if 'team' in col_map and row[col_map['team']]:
                                team = row[col_map['team']].replace('\n', ' ')
                            
                            # Car
                            car_model = ""
                            if 'car' in col_map and row[col_map['car']]:
                                car_model = row[col_map['car']].replace('\n', ' ').strip()
                                
                            # StartNr
                            nr = 0
                            if 'nr' in col_map and row[col_map['nr']]:
                                try: nr = int(row[col_map['nr']].split('\n')[0])
                                except: pass
                            
                            # License Type
                            license_type = 'DRCV'
                            # Try to find implicit license column or "TL" text in driver name or similar?
                            # Standard PDFs usually hav separate column. 
                            # If we look at previous script: col_map['license_type'] = 2 hardcoded heuristic?
                            # Let's try to look for 'TL' in the row
                            found_tl = False
                            for cell in row:
                                if cell and cell.strip() == 'TL':
                                    license_type = 'TL'
                                    found_tl = True
                                    break
                            
                            # Points (Event) - Recalculate from heats + raw
                            # Actually, we should trust 'Gesamt' if present
                            event_points = 0
                            if 'points' in col_map and row[col_map['points']]:
                                try:
                                    val_str = row[col_map['points']].split('\n')[0].replace(',', '.')
                                    event_points = int(float(val_str))
                                except: pass
                            
                            # Champ Points (Calculate based on Rank & License)
                            champ_points = 0
                            if license_type != 'TL' and license_type != 'DQ':
                                is_langstrecke = 'lang' in class_id.lower()
                                if is_langstrecke:
                                    lang_top = {1:40, 2:35, 3:30, 4:27, 5:25, 6:23, 7:21, 8:19, 9:17}
                                    if rank in lang_top: champ_points = lang_top[rank]
                                    elif 10 <= rank <= 25: champ_points = 26 - rank
                                else:
                                    sprint_map = {1:9, 2:7, 3:6, 4:5, 5:4, 6:3, 7:2, 8:1}
                                    champ_points = sprint_map.get(rank, 0)
                            
                            # Heat Wins
                            heat_wins = 0
                            run_values = {}
                            for h in range(1, 5):
                                if h in heat_cols and heat_cols[h] < len(row):
                                    val = row[heat_cols[h]]
                                    if val:
                                        try:
                                            pts = int(val.split('\n')[0])
                                            run_values[h] = pts
                                            if pts >= 9: heat_wins += 1
                                        except: pass

                            # Insert DB
                            drv_id = find_or_create_driver(cursor, driver_name, team, car_model, nr, class_id)
                            res_id = f"res_{event_id}_{drv_id}_{class_id}"
                            
                            cursor.execute("""
                                INSERT OR REPLACE INTO race_results (
                                    id, event_id, championship_event_id, driver_id, class_id, rank, points, championship_points, heat_wins, start_number, license_type, car,
                                    run_1, run_2, run_3, run_4
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                res_id, event_id, ce_id, drv_id, class_id, rank, event_points, champ_points, heat_wins, nr, license_type, car_model,
                                run_values.get(1), run_values.get(2), run_values.get(3), run_values.get(4)
                            ))
                            
                            # Also add to driver_participations
                            cursor.execute("INSERT OR IGNORE INTO driver_participations (driver_id, class_id) VALUES (?, ?)", (drv_id, class_id))

        except Exception as e:
            print(f"Error processing {filename}: {e}")

    conn.commit()
    conn.close()
    print("Import complete.")

if __name__ == '__main__':
    process_sachsenberg_folder()
