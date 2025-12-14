"""Debug: Check what classes are in Eppe2024.pdf"""
import pdfplumber

PDF_PATH = 'pdf/Eppe2024.pdf'

with pdfplumber.open(PDF_PATH) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    
    for page_num, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        lines = text.split('\n')[:10]
        
        print(f"\n=== Page {page_num+1} ===")
        for line in lines:
            print(f"  {line[:80]}")
