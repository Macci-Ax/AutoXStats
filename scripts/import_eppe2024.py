"""
Import Eppe2024.pdf specifically.
The date in the PDF should be 2024, which will separate it from 2025 data.
"""
import pdfplumber
import sqlite3
import re
import hashlib
from pathlib import Path

PDF_PATH = 'pdf/Eppe2024.pdf'  # Single file import
DB_PATH = 'autox.db'

CLASS_MAP = {
    'Klasse 01': 'd_k1', 'Klasse 02': 'd_k2', 'Klasse 03': 'd_k3',
    'Klasse 04': 'd_k4', 'Klasse 05': 'd_k5', 'Klasse 06': 'd_k6',
    'Klasse 07': 'd_k7', 'Klasse 08': 'd_k8', 'Klasse 09': 'd_k9',
    'Klasse 10': 'd_k10', 'Klasse 11': 'd_k11', 'Klasse 12': 'd_k12',
    'Klasse 13': 'd_k13', 'Klasse 14': 'd_k14',
    'Langstrecke': 'd_lang',
    'Super Cup Div 1': 'd_sc_div1', 'Super Cup Div 2': 'd_sc_div2',
    'Super Cup Div 3': 'd_sc_div3', 'Super Cup Div 4': 'd_sc_div4',
    'Super Cup Div 5': 'd_sc_div5',
    'Endlauf Div 1': 'd_el_div1', 'Endlauf Div 2': 'd_el_div2',
    'Endlauf Div 3': 'd_el_div3', 'Endlauf Div 4': 'd_el_div4',
    'Crossbuggy bis 690ccm': 'd_cb_690', 'Crossbuggy bis 690cm': 'd_cb_690',
    'Crossbuggy über 690ccm': 'd_cb_over690', 'Crossbuggy über 690cm': 'd_cb_over690',
}

# Standard class points (by championship position)
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

def extract_class_name(page_text):
    for line in page_text.split('\n')[:10]:
        for pdf_name in CLASS_MAP.keys():
            if pdf_name.lower() in line.lower():
                return pdf_name
        match = re.search(r'(Klasse \d+)', line)
        if match: return match.group(1)
        match = re.search(r'(Super Cup Div \d+)', line, re.I)
        if match: return match.group(1)
        match = re.search(r'(Endlauf Div \d+)', line, re.I)
        if match: return match.group(1)
        if 'Langstrecke' in line and 'Jugend' not in line:
            return 'Langstrecke'
        if 'Crossbuggy' in line:
            if '690' in line:
                if 'über' in line or 'over' in line.lower():
                    return 'Crossbuggy über 690ccm'
                else:
                    return 'Crossbuggy bis 690ccm'
    return None

def extract_date(page_text):
    """Extract event date from PDF header (usually like 'Stand: DD.MM.YYYY')"""
    match = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', page_text)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month}-{day}"
    return None

def import_eppe2024():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print(f"Importing {PDF_PATH}...")
    
    with pdfplumber.open(PDF_PATH) as pdf:
        event_date = None
        event_id = None
        
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            
            # Try to extract date from first page
            if page_num == 0 and not event_date:
                event_date = extract_date(text)
                if event_date:
                    print(f"  Event date: {event_date}")
                    # Create event
                    event_id = f"evt_eppe_{event_date.replace('-', '')}"
                    cursor.execute("DELETE FROM race_results WHERE event_id = ?", (event_id,))
                    cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
                    cursor.execute("""
                        INSERT INTO events (id, championship_id, name, date, location, status)
                        VALUES (?, 'DRCV', 'Eppe 2024', ?, 'Eppe', 'completed')
                    """, (event_id, event_date))
            
            if not event_id:
                continue
            
            class_name = extract_class_name(text)
            if not class_name:
                continue
            
            class_id = CLASS_MAP.get(class_name)
            if not class_id:
                continue
            
            cursor.execute("SELECT id FROM classes WHERE id = ?", (class_id,))
            if not cursor.fetchone():
                continue
            
            tables = page.extract_tables()
            if not tables:
                continue
            
            table = tables[0]
            header = table[0]
            
            col_map = {}
            for idx, col in enumerate(header):
                if not col: continue
                c = col.replace('.', '').strip().lower()
                if c == 'pl': col_map['rank'] = idx
                elif 'startnr' in c: col_map['nr'] = idx
                elif 'fahrer' in c: col_map['driver'] = idx
                elif 'team' in c: col_map['team'] = idx
                elif 'gp' in c: col_map['points'] = idx
                elif 'runden' in c: col_map['laps'] = idx
            
            # License type column is column 2 (unnamed)
            col_map['license_type'] = 2
            
            if 'rank' not in col_map or 'driver' not in col_map:
                continue
            
            is_langstrecke = 'lang' in class_id.lower()
            results = []
            
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
                
                # Find or create driver
                drv_id = f"drv_{hashlib.md5(driver_name.encode()).hexdigest()[:8]}"
                cursor.execute("SELECT id FROM drivers WHERE id = ?", (drv_id,))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO drivers (id, name, team, start_number)
                        VALUES (?, ?, ?, ?)
                    """, (drv_id, driver_name, team, nr if nr else None))
                
                # Create driver participation
                cursor.execute("""
                    INSERT OR IGNORE INTO driver_participations (driver_id, class_id, points)
                    VALUES (?, ?, 0)
                """, (drv_id, class_id))
                
                results.append({
                    'driver_id': drv_id,
                    'rank': rank,
                    'license_type': license_type
                })
            
            # Calculate championship points for DRCV drivers
            champ_pos = 1
            for r in results:
                if r['license_type'] == 'DRCV':
                    champ_pts = get_points_for_champ_position(champ_pos, is_langstrecke)
                    champ_pos += 1
                else:
                    champ_pts = 0
                
                res_id = f"res_{event_id}_{r['driver_id']}_{class_id}"
                cursor.execute("""
                    INSERT OR REPLACE INTO race_results 
                    (id, event_id, driver_id, class_id, rank, points, championship_points, license_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (res_id, event_id, r['driver_id'], class_id, r['rank'], champ_pts, champ_pts, r['license_type']))
            
            if results:
                print(f"  Page {page_num+1}: {class_name} -> {len(results)} results")
    
    conn.commit()
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM race_results WHERE event_id LIKE '%eppe%2024%'")
    count = cursor.fetchone()[0]
    print(f"\nImported {count} race results for Eppe 2024")
    
    cursor.execute("SELECT strftime('%Y', date) as year FROM events WHERE id LIKE '%eppe%2024%'")
    year = cursor.fetchone()
    print(f"Event year: {year[0] if year else 'N/A'}")
    
    conn.close()

if __name__ == "__main__":
    import_eppe2024()
