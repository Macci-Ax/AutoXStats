import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def debug_row():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        words = first_page.extract_words()
        
        # Find Ref 210
        target = '210'
        anchor = next((w for w in words if w['text'] == target or w['text'] == f"0{target}"), None)
        
        if anchor:
            print(f"Anchor found: '{anchor['text']}' at x={anchor['x0']:.2f}, y={anchor['top']:.2f}")
            row_y = (anchor['top'] + anchor['bottom']) / 2
            
            # Dump row words
            print("Row Words:")
            row_words = [w for w in words if abs((w['top'] + w['bottom'])/2 - row_y) < 5]
            for w in row_words:
                print(f"  '{w['text']}' at x={w['x0']:.2f}")
        else:
            print("Anchor 210 not found")
            
        print("-" * 20)
        
        # Find Ref 1
        target = '1'
        anchor = next((w for w in words if w['text'] == target or w['text'] == f"000{target}"), None)
         # Note: '1' might match Rank 1.
        if anchor:
            print(f"Anchor found: '{anchor['text']}' at x={anchor['x0']:.2f} (Might be Rank!)")
            row_y = (anchor['top'] + anchor['bottom']) / 2
             # Dump row words
            print("Row Words:")
            row_words = [w for w in words if abs((w['top'] + w['bottom'])/2 - row_y) < 5]
            for w in row_words:
                 print(f"  '{w['text']}' at x={w['x0']:.2f}")

if __name__ == "__main__":
    debug_row()
