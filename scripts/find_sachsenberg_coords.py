import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def find_coords():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        words = first_page.extract_words()
        
        targets = ['Sachsenberg', 'Eppe', 'Loehne', 'Löhne', 'Herbern']
        found_map = {}
        
        print("Searching for targets...")
        for word in words:
            text = word['text']
            for t in targets:
                if t in text:
                    print(f"Match: '{text}' at x={word['x0']:.2f} (detected as {t})")
                    found_map[t] = word['x0']
            
            # Additional check for 'Sachsenberg' specific
            if 'Sachsenberg' in text:
                 print(f"Direct Match: '{text}' at x={word['x0']:.2f}")

        if not found_map:
             print("No targets found.")

if __name__ == "__main__":
    find_coords()
