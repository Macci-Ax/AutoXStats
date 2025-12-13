import pdfplumber
import os

# Extract first table from first PDF to understand structure
pdf_path = os.path.join('pdf', '2025', 'Dauborn.pdf')

with open('scripts/pdf_sample_output.txt', 'w', encoding='utf-8') as f:
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages[:3]):  # First 3 pages
            f.write(f"\n=== PAGE {i+1} ===\n")
            text = page.extract_text()
            if text:
                lines = text.split('\n')[:10]  # First 10 lines
                for l in lines:
                    f.write(l + '\n')
            
            tables = page.extract_tables()
            if tables:
                for ti, table in enumerate(tables):
                    f.write(f"\n--- Table {ti+1} Header ---\n")
                    f.write(str(table[0]) + '\n')
                    f.write(f"--- First 3 data rows ---\n")
                    for row in table[1:4]:
                        f.write(str(row) + '\n')

print("Output written to scripts/pdf_sample_output.txt")
