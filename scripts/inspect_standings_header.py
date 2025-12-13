import pdfplumber
import re

PDF_PATH = 'pdf/Meisterschaft2025final.pdf'

def inspect_headers():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()
        if not tables:
            print("No tables found on page 1")
            return

        header = tables[0][0]
        print("Header columns:")
        for idx, col in enumerate(header):
            clean_col = col.replace('\n', ' ').strip() if col else "EMPTY"
            print(f"{idx}: {clean_col}")

if __name__ == "__main__":
    inspect_headers()
