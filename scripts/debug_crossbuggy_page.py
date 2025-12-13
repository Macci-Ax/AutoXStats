import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def find_crossbuggy_page():
    with pdfplumber.open(PDF_PATH) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            if 'Crossbuggy' in text and '690' in text:
                print(f"=== Found Crossbuggy on Page {i+1} ===\n")
                
                # Show header
                lines = text.split('\n')[:5]
                for line in lines:
                    print(line[:80])
                
                # Extract words with positions
                words = page.extract_words()
                
                # Find Rüelmann
                for w in words:
                    if 'ülmann' in w['text'] or '1503' in w['text']:
                        print(f"\nFound: '{w['text']}' at x={w['x0']:.0f}")
                
                # Find row for 1503
                anchor = None
                for w in words:
                    if w['text'] == '1503' or w['text'] == '01503':
                        anchor = w
                        break
                
                if anchor:
                    row_y = (anchor['top'] + anchor['bottom']) / 2
                    print(f"\nRow for #1503 (y={row_y:.0f}):")
                    row_words = sorted(
                        [w for w in words if abs((w['top']+w['bottom'])/2 - row_y) < 5],
                        key=lambda w: w['x0']
                    )
                    for w in row_words:
                        if w['x0'] > 400:  # Right side
                            print(f"  x={w['x0']:.0f}: '{w['text']}'")
                return

if __name__ == "__main__":
    find_crossbuggy_page()
