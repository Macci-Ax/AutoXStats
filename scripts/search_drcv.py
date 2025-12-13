"""Check PDF to find DRCV/TL values - looking for text containing 'DRCV' or 'TL'"""
import pdfplumber
import os

pdf_path = os.path.join('pdf', '2025', 'Dauborn.pdf')

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]  # Langstrecke page
    
    tables = page.extract_tables()
    if tables:
        table = tables[0]
        
        # Print header
        print("=== HEADER ===")
        print(table[0])
        
        print("\n=== SEARCHING FOR 'DRCV' or 'TL' IN ALL CELLS ===")
        for row_idx, row in enumerate(table[:10]):
            for col_idx, val in enumerate(row):
                if val and ('DRCV' in str(val).upper() or 'TL' in str(val).upper()):
                    print(f"  Row {row_idx}, Col {col_idx}: {val!r}")
