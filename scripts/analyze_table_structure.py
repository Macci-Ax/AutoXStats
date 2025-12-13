import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def analyze():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        
        # Extract tables with explicit settings
        tables = first_page.extract_tables()
        
        if not tables:
            print("No tables found.")
            return
            
        table = tables[0]
        print(f"Table has {len(table)} rows, {len(table[0])} columns")
        
        # Print header row (row 0)
        print("\n--- HEADER ROW ---")
        for i, cell in enumerate(table[0]):
            val = cell.replace('\n', ' ').strip() if cell else '[EMPTY]'
            print(f"Col {i}: {val[:30]}...")
        
        # Print first data row (row 1) to match with header
        print("\n--- FIRST DATA ROW (should be Bouma #210) ---")
        for i, cell in enumerate(table[1]):
            val = cell.replace('\n', ' ').strip() if cell else '[EMPTY]'
            print(f"Col {i}: {val[:30]}...")
            
        # Print second data row (row 2) 
        print("\n--- SECOND DATA ROW (should be Hönicke #1) ---")
        for i, cell in enumerate(table[2]):
            val = cell.replace('\n', ' ').strip() if cell else '[EMPTY]'
            print(f"Col {i}: {val[:30]}...")

if __name__ == "__main__":
    analyze()
