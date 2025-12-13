
import pdfplumber
import os
import re

def parse_row_debug(row):
    print(f"DEBUG ROW: {row}")
    # Expected: [0] Rank, [1] Nr, [2] Team, [3] Driver, [4] Club, [5] Total
    if not row or len(row) < 6: return None
    
    try:
        raw_points = str(row[5])
        match = re.search(r'\d+', raw_points)
        pts = int(match.group(0)) if match else 0
        return {'driver': row[3], 'nr': row[1], 'points': pts}
    except:
        return None

pdf_path = os.path.join('pdf', 'Meisterschaft2025final.pdf')
with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if "Langstrecke" in text and "Jugend" not in text:
            print(f"--- Page {i+1} ---")
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    res = parse_row_debug(row)
                    if res:
                        print(f"  PARSED: {res}")
