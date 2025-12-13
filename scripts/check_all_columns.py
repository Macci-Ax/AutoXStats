"""Check all columns in the PDF to find DRCV/TL column"""
import pdfplumber
import os

pdf_path = os.path.join('pdf', '2025', 'Dauborn.pdf')

print(f"Checking {pdf_path}...")

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]  # Langstrecke page
    
    text = page.extract_text() or ""
    print("=== First 10 lines ===")
    for line in text.split('\n')[:10]:
        print(f"  {line}")
    
    tables = page.extract_tables()
    if tables:
        table = tables[0]
        header = table[0]
        
        print(f"\n=== HEADER ({len(header)} columns) ===")
        for idx, col in enumerate(header):
            print(f"  [{idx}] {col!r}")
        
        print("\n=== FIRST 5 DATA ROWS (ALL COLUMNS) ===")
        for row in table[1:6]:
            print("\n  Row:")
            for idx, val in enumerate(row):
                print(f"    [{idx}] {val!r}")
