import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

# Check a specific page that should have data but shows 0 results
# Page 42 (Super Cup Div 5) shows 0 but Felix Rüelmann should be there

def debug_page(page_num):
    with pdfplumber.open(PDF_PATH) as pdf:
        page = pdf.pages[page_num - 1]  # 0-indexed
        
        print(f"=== Page {page_num} Debug ===\n")
        
        # Header text
        text = page.extract_text()
        print("First 500 chars:")
        print(text[:500])
        
        # Table
        tables = page.extract_tables()
        if not tables:
            print("\nNo tables found!")
            return
        
        table = tables[0]
        print(f"\nTable has {len(table)} rows, {len(table[0]) if table else 0} cols")
        
        # Show first 3 data rows
        print("\nFirst 3 data rows:")
        for i, row in enumerate(table[1:4]):
            print(f"Row {i+1}:")
            for j, cell in enumerate(row):
                val = cell[:20].replace('\n', '|') if cell else '[EMPTY]'
                print(f"  Col {j}: {val}")

if __name__ == "__main__":
    # Check page 42 (Super Cup Div 5 per earlier output)
    debug_page(42)
