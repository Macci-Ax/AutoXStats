import pdfplumber
import os

pdf_dir = 'pdf'

for f in os.listdir(pdf_dir):
    if not f.endswith('.pdf'): continue
    
    path = os.path.join(pdf_dir, f)
    print(f"--- Scanning {f} ---")
    
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text: continue
            
            lines = text.split('\n')
            header = lines[1] if len(lines) > 1 else ""
            
            if "Supercup" in text or "Endlauf" in text or "Supercup" in header or "Endlauf" in header:
                print(f"  Page {i+1}: Header='{header}' (Potential match)")
                # Print first few lines
                for j, l in enumerate(lines[:8]):
                    print(f"    L{j}: {l}")
                
                # Check table columns
                tables = page.extract_tables()
                if tables:
                    print(f"    Table Cols: {tables[0][0]}")
                print("")
