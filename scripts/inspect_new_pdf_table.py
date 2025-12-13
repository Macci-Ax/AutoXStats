import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def inspect_table():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()
        
        if not tables:
            print("No tables found.")
            return

        print(f"Found {len(tables)} tables on page 1.")
        table = tables[0]
        
        # Print first few rows to deduce columns
        for i, row in enumerate(table[:10]):
            print(f"\nRow {i}:")
            for idx, col in enumerate(row):
                val = col.replace('\n', ' ') if col else "[None]"
                # Truncate for readability
                if len(val) > 20: val = val[:17] + "..."
                print(f"  Col {idx}: {val}")

if __name__ == "__main__":
    inspect_table()
