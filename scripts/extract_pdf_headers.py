import pdfplumber
import os
import json

# Extract headers from all PDFs to see structure
pdf_dir = os.path.join('pdf', '2025')

all_headers = []

for pdf_file in os.listdir(pdf_dir):
    if not pdf_file.endswith('.pdf'):
        continue
        
    pdf_path = os.path.join(pdf_dir, pdf_file)
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages[:2]):
            tables = page.extract_tables()
            if tables:
                for ti, table in enumerate(tables):
                    if table and table[0]:
                        all_headers.append({
                            'file': pdf_file,
                            'page': i+1,
                            'header': table[0]
                        })

# Write headers
with open('scripts/pdf_headers.json', 'w', encoding='utf-8') as f:
    json.dump(all_headers, f, indent=2, ensure_ascii=False)

print(f"Found {len(all_headers)} tables, headers written to scripts/pdf_headers.json")

# Print unique column names
unique_cols = set()
for h in all_headers:
    for col in h['header']:
        if col:
            unique_cols.add(col.replace('\n', ' ').strip())

print("\nUnique columns found:")
for c in sorted(unique_cols):
    print(f"  - {c}")
