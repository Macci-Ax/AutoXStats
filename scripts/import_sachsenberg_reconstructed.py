import pdfplumber
import sqlite3
import re

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'
DB_PATH = 'autox.db'

# Use spatial approach: extract words and match by X coordinate
# From earlier debug: Column 13 X-range is approximately 680-700

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

def get_db():
    return sqlite3.connect(DB_PATH)

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

def find_sachsenberg_x(page, ref_startnr, ref_points):
    """Find X position of Sachsenberg column using reference data."""
    words = page.extract_words()
    
    # Find reference driver row
    anchor = None
    for w in words:
        if w['text'] == ref_startnr or w['text'] == f"0{ref_startnr}":
            if w['x0'] < 100:  # Start number column
                anchor = w
                break
    
    if not anchor:
        return None
    
    row_y = (anchor['top'] + anchor['bottom']) / 2
    
    # Find reference points value in same row
    for w in words:
        if w['text'] == str(ref_points):
            word_y = (w['top'] + w['bottom']) / 2
            if abs(word_y - row_y) < 5 and w['x0'] > 400:  # Right side of table
                return w['x0']
    return None

def import_sachsenberg():
    conn = get_db()
    cursor = conn.cursor()
    
    event_id = 'evt_sachsenberg_2025_rec'
    
    cursor.execute("DELETE FROM race_results WHERE event_id = ?", (event_id,))
    cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
    cursor.execute("""
        INSERT INTO events (id, championship_id, name, date, location, status) 
        VALUES (?, 'DRCV', 'Sachsenberg (Reconstructed)', '2025-04-27', 'Sachsenberg', 'reconstructed')
    """, (event_id,))
    
    cursor.execute("SELECT id, start_number FROM drivers WHERE start_number IS NOT NULL")
    driver_lookup = {int(row[1]): row[0] for row in cursor.fetchall()}
    
    results = []
    
    with pdfplumber.open(PDF_PATH) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            class_name = extract_class_name(text)
            
            if not class_name:
                continue
            
            class_id = CLASS_MAP.get(class_name)
            if not class_id:
                continue
            
            cursor.execute("SELECT id FROM classes WHERE id = ?", (class_id,))
            if not cursor.fetchone():
                continue
            
            words = page.extract_words()
            tables = page.extract_tables()
            if not tables:
                continue
            
            table = tables[0]
            
            # Try to calibrate Sachsenberg X using first data row
            # Assume first row's last numeric column (before total) is Sachsenberg
            # Or use fixed X range based on earlier calibration: ~680-700
            
            sach_x_range = (675, 705)  # Approximate X range for Sachsenberg
            
            page_results = 0
            
            for row in table[1:]:
                if len(row) < 10:
                    continue
                
                # Get start number
                startnr_cell = row[1] if len(row) > 1 else None
                if not startnr_cell:
                    continue
                startnr_str = startnr_cell.split('\n')[0].strip().lstrip('0') or '0'
                try:
                    startnr = int(startnr_str)
                except ValueError:
                    continue
                
                if startnr not in driver_lookup:
                    continue
                
                # Find this driver's row in words
                anchor = None
                for w in words:
                    txt = w['text'].lstrip('0') or '0'
                    if txt == str(startnr) and 50 < w['x0'] < 100:
                        anchor = w
                        break
                
                if not anchor:
                    continue
                
                row_y = (anchor['top'] + anchor['bottom']) / 2
                
                # Find value in Sachsenberg X range
                for w in words:
                    word_y = (w['top'] + w['bottom']) / 2
                    if abs(word_y - row_y) < 5:
                        if sach_x_range[0] <= w['x0'] <= sach_x_range[1]:
                            try:
                                points = int(w['text'])
                                results.append({
                                    'driver_id': driver_lookup[startnr],
                                    'class_id': class_id,
                                    'points': points,
                                })
                                page_results += 1
                            except ValueError:
                                pass
                            break
            
            if page_results > 0:
                print(f"Page {page_num+1}: {class_name} -> {class_id} - {page_results} results")
    
    print(f"\nTotal: {len(results)} results")
    
    # Rank and insert
    by_class = {}
    for r in results:
        cls = r['class_id']
        if cls not in by_class:
            by_class[cls] = []
        by_class[cls].append(r)
    
    inserted = 0
    for cls, entries in by_class.items():
        entries.sort(key=lambda x: x['points'], reverse=True)
        rank = 1
        for i, entry in enumerate(entries):
            if i > 0 and entry['points'] < entries[i-1]['points']:
                rank = i + 1
            res_id = f"res_{event_id}_{entry['driver_id']}_{cls}"
            cursor.execute("""
                INSERT OR REPLACE INTO race_results 
                (id, event_id, driver_id, class_id, rank, points, reconstructed, license_type)
                VALUES (?, ?, ?, ?, ?, ?, 1, 'DRCV')
            """, (res_id, event_id, entry['driver_id'], cls, rank, entry['points']))
            inserted += 1
    
    conn.commit()
    conn.close()
    print(f"Imported {inserted} results")

if __name__ == "__main__":
    import_sachsenberg()
