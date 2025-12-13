"""Check raw Lizenz values from PDF to see what's being extracted"""
import pdfplumber
import os

# Check one PDF to see Lizenz column values
pdf_path = os.path.join('pdf', '2025', 'Dauborn.pdf')

print(f"Checking {pdf_path}...")

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages[:3]):
        text = page.extract_text() or ""
        lines = text.split('\n')
        
        # Find class name
        class_name = ""
        for line in lines[:5]:
            if 'Langstrecke' in line or 'Klasse' in line:
                class_name = line.strip()
                break
        
        if not class_name:
            continue
            
        print(f"\nPage {i+1}: {class_name}")
        
        tables = page.extract_tables()
        if not tables:
            continue
            
        table = tables[0]
        header = table[0]
        
        # Find Lizenz column
        lizenz_idx = None
        for idx, col in enumerate(header):
            if col and 'lizenz' in col.lower():
                lizenz_idx = idx
                break
        
        if lizenz_idx is None:
            print("  No Lizenz column found")
            print(f"  Header: {header}")
            continue
        
        print(f"  Lizenz column index: {lizenz_idx}")
        print(f"  Header: {header}")
        print("  First 10 rows Lizenz values:")
        
        for row in table[1:11]:
            if lizenz_idx < len(row):
                lizenz_val = row[lizenz_idx]
                fahrer = row[3] if len(row) > 3 else "?"
                print(f"    {fahrer[:20]:20} -> Lizenz: '{lizenz_val}'")
