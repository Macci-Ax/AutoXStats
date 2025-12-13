import pdfplumber

PDF_PATH = 'pdf/Meisterschaft2025final.pdf'

def inspect_text():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        text = first_page.extract_text()
        lines = text.split('\n')
        for i, line in enumerate(lines[:20]):
            print(f"{i}: {line}")

if __name__ == "__main__":
    inspect_text()
