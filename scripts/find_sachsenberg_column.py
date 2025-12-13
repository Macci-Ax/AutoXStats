import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

# From screenshot:
# Bouma #210: Sachsenberg=30, Total=218  
# Hönicke #1: Sachsenberg=40, Total=200

def find_sachsenberg_column():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()
        
        if not tables:
            print("No tables found.")
            return
            
        table = tables[0]
        
        # Find Bouma row (should contain "210" and "218")
        bouma_row = None
        honicke_row = None
        
        for row in table[1:]:  # Skip header
            row_str = ' '.join([str(c) for c in row if c])
            if '0210' in row_str or '210' in row_str:
                if '218' in row_str:  # Total points
                    bouma_row = row
                    print("Found Bouma row")
            if '0001' in row_str or '15434846' in row_str:  # Hönicke's license
                if '200' in row_str:
                    honicke_row = row
                    print("Found Hönicke row")
        
        if not bouma_row or not honicke_row:
            print("Could not find reference rows!")
            return None
            
        print("\nSearching for column where Bouma=30 AND Hönicke=40...")
        
        for i in range(len(bouma_row)):
            b_val = bouma_row[i].strip() if bouma_row[i] else ''
            h_val = honicke_row[i].strip() if honicke_row[i] else ''
            
            if b_val == '30' and h_val == '40':
                print(f"MATCH: Column {i} has Bouma=30, Hönicke=40")
                return i
            
            # Also print for debugging
            if b_val == '30' or h_val == '40':
                print(f"Partial match at Col {i}: Bouma={b_val}, Hönicke={h_val}")
        
        print("No exact match found. Need manual inspection.")
        return None

if __name__ == "__main__":
    col = find_sachsenberg_column()
    if col:
        print(f"\nSachsenberg is Column Index: {col}")
