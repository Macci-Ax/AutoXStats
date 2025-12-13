import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def dump_top():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        words = first_page.extract_words()
        
        # Filter strictly for top area
        top_words = [w for w in words if w['bottom'] < 150]
        
        # Sort by X
        top_words.sort(key=lambda w: w['x0'])
        
        print(f"Found {len(top_words)} words in top 150pt:")
        for w in top_words:
            print(f"'{w['text']}' : x={w['x0']:.2f}, y={w['top']:.2f}-{w['bottom']:.2f}")

if __name__ == "__main__":
    dump_top()
