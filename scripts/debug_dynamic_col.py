import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def find_sachsenberg_column(page):
    """Find which column contains Sachsenberg by looking at header words."""
    words = page.extract_words()
    
    # Look for 'Sachsenberg' or 'achsen' in header area (y < 150)
    for w in words:
        if w['bottom'] < 150:
            text = w['text'].lower()
            if 'sachsen' in text or 'achsen' in text:
                x_pos = w['x0']
                print(f"  Found 'Sachsenberg' at x={x_pos:.0f}")
                return x_pos
    return None

def debug_page_with_dynamic_col(page_num):
    with pdfplumber.open(PDF_PATH) as pdf:
        page = pdf.pages[page_num - 1]
        
        print(f"=== Page {page_num} ===")
        
        # Find Sachsenberg X position
        sach_x = find_sachsenberg_column(page)
        if sach_x is None:
            print("  Could not find Sachsenberg header")
            return
        
        # Extract table
        tables = page.extract_tables()
        if not tables:
            return
        
        table = tables[0]
        
        # For each row, find value at Sachsenberg X position
        # We need to use word extraction with position matching
        all_words = page.extract_words()
        
        # Get row Y positions from table
        for row_idx, row in enumerate(table[1:4]):  # First 3 data rows
            # Get startnr from col 1
            startnr = row[1].split('\n')[0].strip() if row[1] else ''
            
            # Find row's Y position by matching startnr
            row_y = None
            for w in all_words:
                if w['text'] == startnr:
                    row_y = (w['top'] + w['bottom']) / 2
                    break
            
            if row_y:
                # Find value at Sachsenberg column (within X range)
                for w in all_words:
                    word_y = (w['top'] + w['bottom']) / 2
                    if abs(word_y - row_y) < 5 and abs(w['x0'] - sach_x) < 20:
                        print(f"  StarNr {startnr}: Sachsenberg = {w['text']}")
                        break

if __name__ == "__main__":
    for p in [1, 10, 20, 30, 42]:
        debug_page_with_dynamic_col(p)
        print()
