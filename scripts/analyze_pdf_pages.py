import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def analyze_pages():
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"Total pages: {len(pdf.pages)}\n")
        
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue
            
            # Get first few lines to identify class
            lines = text.split('\n')[:5]
            
            print(f"=== Page {i+1} ===")
            for line in lines:
                # Clean and show
                clean = line.strip()[:80]
                if clean:
                    print(f"  {clean}")
            print()

if __name__ == "__main__":
    analyze_pages()
