import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

EVENTS = [
    'Waldorf', 'Extertal', 'Eppe', 'Dauborn', 
    'Hellingst', 'Herbern', 'Sachsenberg', 
    'Löhne', 'Osnabrück', 'Itterbeck'
]

def map_headers():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        words = first_page.extract_words()
        
        found = []
        for word in words:
            text = word['text']
            # Partial match checks
            for evt in EVENTS:
                if evt in text:
                    found.append({'name': evt, 'x0': word['x0'], 'text': text})

        # Sort left to right
        found.sort(key=lambda x: x['x0'])
        
        print("Detected Event Headers:")
        for f in found:
            print(f"{f['name']}: {f['x0']:.2f} (match: {f['text']})")

if __name__ == "__main__":
    map_headers()
