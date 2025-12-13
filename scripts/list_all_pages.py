import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def list_all_pages():
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"Total pages: {len(pdf.pages)}\n")
        
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            # Get class from first lines
            lines = text.split('\n')[:3]
            header = ' '.join(lines)[:60]
            print(f"Page {i+1}: {header}")

if __name__ == "__main__":
    list_all_pages()
