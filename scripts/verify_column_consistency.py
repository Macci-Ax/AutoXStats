import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def check_consistency():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()
        if not tables: return

        table = tables[0] # First table (likely the main one)
        lengths = {}
        for i, row in enumerate(table):
            l = len(row)
            lengths[l] = lengths.get(l, 0) + 1
            if l not in [18, 19]: # Interest check
                pass 
        
        print("Row Length Distribution:")
        for l, count in lengths.items():
            print(f"Length {l}: {count} rows")

        # Dump last 6 cols of first 5 data rows (skip header row 0)
        print("\nTail Dump (Last 6 cols):")
        for i, row in enumerate(table[1:6]):
            print(f"Row {i+1}: {row[-6:]}")

if __name__ == "__main__":
    check_consistency()
