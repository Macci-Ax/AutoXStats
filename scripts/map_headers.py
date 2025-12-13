import pdfplumber
import re

PDF_PATH = 'pdf/Meisterschaft2025final.pdf'

EVENTS = {
    'Sachsenberg': 'grebneshcaS',
    'Waldorf': 'frodlaW',
    'Extertal': 'latretxE',
    'Eppe': 'eppE',
    'Dauborn': 'nrobuad', # guess
    'Hellingst': 'tsgnilleH', # guess
    'Herbern': 'nrebreH', # guess
    'Löhne': 'enhüL', # guess, umlaut might be issue
    'Osnabrück': 'kcürbansO' # guess
}

def find_headers():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        words = first_page.extract_words()
        
        found_events = []
        for word in words:
            text = word['text']
            # Check against our reversed map
            for name, rev in EVENTS.items():
                if rev in text:
                    found_events.append({
                        'name': name,
                        'x0': word['x0'],
                        'text': text
                    })
        
        # Sort by X position (left to right)
        found_events.sort(key=lambda x: x['x0'])
        
        print("Found headers (sorted by position):")
        for evt in found_events:
            print(f"{evt['name']}: x={evt['x0']:.2f}")

if __name__ == "__main__":
    find_headers()
