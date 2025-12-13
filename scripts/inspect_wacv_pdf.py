
import pdfplumber
import os

pdf_path = os.path.join('pdf', 'Meisterschaft2025final.pdf')

if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
    exit()

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    for i in range(min(5, len(pdf.pages))): # Check first 5 pages
        print(f"--- Page {i+1} ---")
        text = pdf.pages[i].extract_text()
        if text:
            print("  Text Snippet:")
            lines = text.split('\n')
            for line in lines[:10]:
                print(f"    {line}")
        
        tables = pdf.pages[i].extract_tables()
        if tables:
            for t_idx, table in enumerate(tables):
                print(f"  Table {t_idx} (Cols: {len(table[0])})")
                # Print Header and first 2 rows
                for r_idx, row in enumerate(table[:3]): 
                    print(f"    R{r_idx}: {row}")
