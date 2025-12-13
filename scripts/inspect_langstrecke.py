
import pdfplumber
import os

pdf_path = os.path.join('pdf', 'Meisterschaft2025final.pdf')

with pdfplumber.open(pdf_path) as pdf:
    # Find a page with "Langstrecke"
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        if "Langstrecke" in text and "Jugend" not in text:
            print(f"--- Page {i+1} (Langstrecke) ---")
            tables = page.extract_tables()
            if tables:
                for row_idx, row in enumerate(tables[0][:5]):
                    print(f"Row {row_idx}:")
                    for col_idx, item in enumerate(row):
                        print(f"  [{col_idx}] {item}")
            break
