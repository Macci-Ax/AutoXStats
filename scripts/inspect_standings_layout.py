import pdfplumber

PDF_PATH = 'pdf/Meisterschaft2025final.pdf'

def inspect_layout():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        # x_tolerance helps grouping letters into words, y_tolerance for lines
        text = first_page.extract_text(x_tolerance=2, y_tolerance=3) 
        print(text[:2000])

if __name__ == "__main__":
    inspect_layout()
