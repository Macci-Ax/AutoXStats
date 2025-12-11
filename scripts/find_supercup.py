import pdfplumber
import os

pdf_dir = 'pdf'

for f in os.listdir(pdf_dir):
    if not f.endswith('.pdf'): continue
    path = os.path.join(pdf_dir, f)
    
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text: continue
            
            # loose check
            if "supercup" in text.lower() or "super cup" in text.lower():
                print(f"FOUND in {f} Page {i+1}")
                lines = text.split('\n')
                print(f"  Header: {lines[1] if len(lines)>1 else ''}")
                print(f"  Context: {text[:200].replace(chr(10), ' ')}")
                print("-" * 20)
