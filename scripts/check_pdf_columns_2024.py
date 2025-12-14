"""Check columns in 2024 PDFs"""
import pdfplumber
import os

PDF_DIR = 'pdf/2024'

def check_pdf(path):
    print(f"Checking {os.path.basename(path)}...")
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages[:2]: # Check first 2 pages
            tables = page.extract_tables()
            for table in tables:
                header = table[0]
                # Print header slightly readable
                clean_header = [c.replace('\n', ' ').strip() for c in header if c]
                print(f"  Header: {clean_header}")
                return # Just one table is enough to see columns

if os.path.exists(PDF_DIR):
    for f in os.listdir(PDF_DIR):
        if f.endswith('.pdf'):
            check_pdf(os.path.join(PDF_DIR, f))
else:
    print(f"{PDF_DIR} not found.")
