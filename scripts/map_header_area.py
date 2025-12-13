import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def map_header_area():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        words = first_page.extract_words()
        
        # Filter for header area (Top 0-200 roughly)
        header_words = [w for w in words if w['bottom'] < 200]
        
        print("Header Area Words:")
        targets = ['Sachsenberg', 'Eppe', 'Löhne', 'Loehne', 'Herbern', 'Vellern', 'Osnabrück']
        
        found = []
        for w in header_words:
            text = w['text']
            # print(f"  {text} (x={w['x0']:.2f}, y={w['top']:.2f})")
            
            for t in targets:
                if t in text:
                    found.append(w)
                    print(f"MATCH: '{text}' at x={w['x0']:.2f}, y={w['top']:.2f}, width={w['width']:.2f}")

        if not found:
             print("No targets found in header area.")

if __name__ == "__main__":
    map_header_area()
