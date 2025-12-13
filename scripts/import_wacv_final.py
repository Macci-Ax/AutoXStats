
import sqlite3
import pdfplumber
import os
import re
import uuid

DB_PATH = 'autox.db'

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def find_or_create_class(cursor, class_name, champ_id='WACV'):
    clean_name = class_name.strip()
    class_id = None
    
    # ID Generation Logic
    lower_name = clean_name.lower()
    
    if 'jugend' in lower_name and 'langstrecke' in lower_name:
        class_id = f"{champ_id.lower()[0]}_jugend_lang"
    elif 'langstrecke' in lower_name:
         class_id = f"{champ_id.lower()[0]}_lang"
    elif 'jugend' in lower_name:
         # Jugend Klasse?
         match = re.search(r'klasse\s*0*(\d+)', lower_name)
         if match:
             class_id = f"{champ_id.lower()[0]}_jugend_k{match.group(1)}"
         else:
             class_id = f"{champ_id.lower()[0]}_jugend"
    elif 'klasse' in lower_name:
        match = re.search(r'klasse\s*0*(\d+)', lower_name)
        if match:
            num = match.group(1)
            class_id = f"{champ_id.lower()[0]}_k{num}" # w_k1
        else:
            class_id = f"{champ_id.lower()[0]}_{lower_name.replace(' ', '_')}"
    else:
         class_id = f"{champ_id.lower()[0]}_{lower_name.replace(' ', '_')}"
         
    # Check if exists
    cursor.execute("SELECT id FROM classes WHERE id = ?", (class_id,))
    if not cursor.fetchone():
        print(f"  Creating new class: {clean_name} -> {class_id}")
        cursor.execute("INSERT INTO classes (id, championship_id, name) VALUES (?, ?, ?)", 
                       (class_id, champ_id, clean_name))
                       
    return class_id

def find_or_create_driver(cursor, name, team, number, class_id):
    # WACV drivers might duplicate DRCV drivers. 
    # Use name + number + duplicate check.
    
    cursor.execute("SELECT id FROM drivers WHERE name = ? COLLATE NOCASE", (name,))
    row = cursor.fetchone()
    if row:
        return row[0]
        
    new_id = f"w_{number}_{uuid.uuid4().hex[:4]}"
    cursor.execute("""
        INSERT INTO drivers (id, name, team, car, start_number, current_class_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (new_id, name, team, '', number, class_id)) # Car is unknown
    return new_id

def parse_row(row):
    # Expected: 
    # [0] Rank
    # [1] Number
    # [2] Team
    # [3] Driver
    # [4] Club
    # [5] Total Points
    
    if not row or len(row) < 6: return None
    
    data = {'rank': None, 'number': None, 'driver': None, 'team': '', 'points': 0}
    
    # 1. Rank
    try:
        val = str(row[0]).replace('.', '').strip()
        if not val or not val.isdigit(): return None
        data['rank'] = int(val)
    except: return None
        
    # 2. Number
    try:
        val = str(row[1]).split('\n')[0].strip() # Handle multiline
        data['number'] = int(val)
    except: return None

    # 3. Driver & Team
    # Driver is col 3. Team is col 2.
    # Sometimes they might be empty?
    data['driver'] = row[3]
    if row[2]:
        data['team'] = row[2].replace('\n', ' ')
        
    if not data['driver']: return None
    data['driver'] = data['driver'].split('\n')[0].strip() # Take first line
    
    # 4. Points (Col 5)
    # Value implies "Punkte\nMeisterschaft\n571" sometimes if headers merge?
    # Or just "571"
    # Or "571\n..."
    try:
        raw_points = str(row[5])
        # Extract first number found
        match = re.search(r'\d+', raw_points)
        if match:
            data['points'] = int(match.group(0))
        else:
            data['points'] = 0
    except:
        data['points'] = 0
        
    return data

def parse_race_points_map(row):
    # Event columns mapping (indices based on 0-indexed row from PDF)
    # 0: Rank, 1: Num, 2: Team, 3: Driver, 4: Club, 5: Total
    # 6: Waldorf ... 14: Hesborn
    event_map = {
        6: 'w_ev_1', 7: 'w_ev_2', 8: 'w_ev_3', 9: 'w_ev_4',
        10: 'w_ev_5', 11: 'w_ev_6', 12: 'w_ev_7', 13: 'w_ev_8', 14: 'w_ev_9'
    }
    
    points_map = {}
    for idx, event_id in event_map.items():
        if idx < len(row):
            try:
                val = str(row[idx]).strip()
                # Handle possible multiline or ' '
                val = val.split('\n')[0].strip()
                if val and val.isdigit():
                     points_map[event_id] = int(val)
            except:
                continue
    return points_map

def process_wacv_pdf():
    pdf_path = os.path.join('pdf', 'Meisterschaft2025final.pdf')
    print(f"Processing {pdf_path}...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # CLEANUP OLD WACV DATA to prevent duplicates
    print("Cleaning old WACV data...")
    cursor.execute("DELETE FROM driver_participations WHERE class_id LIKE 'w_%'")
    cursor.execute("DELETE FROM race_results WHERE class_id LIKE 'w_%'")
    cursor.execute("DELETE FROM drivers WHERE id LIKE 'w_%'") # Cascade/Orphaned?
    cursor.execute("DELETE FROM classes WHERE id LIKE 'w_%'")
    # Re-insert Championship if needed
    cursor.execute("INSERT OR IGNORE INTO championships (id, name, year) VALUES ('WACV', 'Westdeutscher Auto Cross Verband', 2025)")
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text: continue
            
            # Detect Class
            lines = text.split('\n')
            class_name = None
            
            # Helper to normalize "K l a s s e"
            def normalize_line(l):
                return l.replace(' ', '').lower()
            
            for line in lines[:20]: # Check first 20 lines
                norm = normalize_line(line)
                lower_line = line.lower()
                
                # Look for "Klasse" or "Langstrecke"
                if "klasse" in lower_line or "langstrecke" in lower_line or "jugend" in lower_line or "super" in lower_line or "endlauf" in lower_line:
                     # Clean up
                     clean = line.replace('Endstand', '').replace('Meisterschaft', '').replace('WACV', '').strip()
                     
                     # Extract "Klasse \d"
                     match = re.search(r'(klasse\s*\d+|langstrecke\s*\d*|jugend\s*klasse\s*\d*|super\s*cup|endlauf)', clean.lower())
                     if match:
                         class_name = match.group(0).title()
                     else:
                         class_name = clean
                     break
                elif "klasse" in norm: # heavy spacing case
                     match = re.search(r'klasse(\d+)', norm)
                     if match:
                         class_name = f"Klasse {match.group(1)}"
                         break
            if not class_name and i == 0:
                class_name = "Klasse 1"
                print("  [INFO] Format fallback: Assuming Page 1 is 'Klasse 1'")

            if class_name:
                print(f"  [PAGE {i+1}] Found Class: {class_name}")
                current_class_id = find_or_create_class(cursor, class_name)
                print(f"Result Page {i+1}: Found Class '{class_name}' -> {current_class_id}")
                
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        parsed = parse_row(row)
                        if parsed:
                            # Insert Driver
                            drv_id = find_or_create_driver(cursor, parsed['driver'], parsed['team'], parsed['number'], current_class_id)
                            
                            # Insert Participation
                            # Check if exists to update?
                            cursor.execute("""
                                INSERT OR REPLACE INTO driver_participations (driver_id, class_id, points, rank, wins, podiums)
                                VALUES (?, ?, ?, ?, 0, 0)
                            """, (drv_id, current_class_id, parsed['points'], parsed['rank']))
                            
                            print(f"   #{parsed['rank']} {parsed['driver']} (Pts: {parsed['points']})")
                            
                            # Insert Race Results
                            race_points = parse_race_points_map(row)
                            for ev_id, pts in race_points.items():
                                if pts > 0:
                                    res_id = f"w_res_{drv_id}_{ev_id}"
                                    cursor.execute("""
                                        INSERT OR REPLACE INTO race_results (id, event_id, driver_id, class_id, points)
                                        VALUES (?, ?, ?, ?, ?)
                                    """, (res_id, ev_id, drv_id, current_class_id, pts))
                            
            else:
                 print(f"Skipping Page {i+1}: No class found.")

    conn.commit()
    conn.close()
    print("WACV Import Completed.")

if __name__ == '__main__':
    process_wacv_pdf()
