import pdfplumber
import os

pdf_dir = 'pdf'
target_name = "Wellmeyer"

print(f"--- Searching for {target_name} ---")

for f in os.listdir(pdf_dir):
    if not f.endswith('.pdf'): continue
    path = os.path.join(pdf_dir, f)
    
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text or target_name not in text: continue
            
            lines = text.split('\n')
            header = lines[1] if len(lines) > 1 else ""
            
            print(f"\nFile: {f} | Page {i+1} | Header: {header}")
            
            tables = page.extract_tables()
            if tables:
                header_row = tables[0][0]
                print(f"  Cols: {header_row}")
                for row in tables[0]:
                    if row and any(target_name in str(cell) for cell in row if cell):
                        print(f"  Row: {row}")
