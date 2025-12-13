import pdfplumber

PDF_PATH = 'pdf/Meisterschaft2025final.pdf'

def inspect_rows():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()
        if not tables:
            print("No tables found")
            return

        print(f"Table 1 has {len(tables[0])} rows.")
        for i in range(min(5, len(tables[0]))):
            row = tables[0][i]
            print(f"Row {i}:")
            for idx, col in enumerate(row):
                val = col.replace('\n', ' ').strip() if col else "EMPTY"
                print(f"  {idx}: {val}")

if __name__ == "__main__":
    inspect_rows()
