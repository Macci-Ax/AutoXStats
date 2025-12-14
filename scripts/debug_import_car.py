"""Debug Import PDF Columns for Car"""
import pdfplumber
import os

def check_pdf_headers(path):
    print(f"Checking {os.path.basename(path)} headers...")
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages[:3]:
            tables = page.extract_tables()
            for table in tables:
                header = table[0]
                clean = [str(c).replace('\n', ' ').strip() for c in header if c]
                print(f"  Header: {clean}")
                
                # Simulate column mapping logic
                col_map = {}
                for idx, col in enumerate(header):
                    if not col: continue
                    c = col.replace('.', '').strip().lower()
                    if 'fahrzeug' in c or 'marke' in c: col_map['car'] = idx
                
                if 'car' in col_map:
                    print(f"    FOUND CAR COLUMN at index {col_map['car']}")
                else:
                    print("    NO CAR COLUMN FOUND")

check_pdf_headers('pdf/2024/Bohnhorst2024.pdf')
