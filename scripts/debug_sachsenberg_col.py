import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def find_target_col():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()
        if not tables: return

        table = tables[0]
        
        # Look for Rene Bouma (Startnr 210) -> Sachsenberg = 30
        # Look for Tobias Hönicke (Startnr 1) -> Sachsenberg = 40
        
        for row in table:
            # Join all cols to search text
            row_str = " ".join([str(c) for c in row])
            
            if "210" in row_str and "Bouma" in row_str:
                print("\nFound Rene Bouma Row:")
                for i, col in enumerate(row):
                    val = str(col).replace('\n', ' ').strip()
                    if val == '30' or val == '30.0':
                        print(f"  POTENTIAL MATCH: Col {i} = {val} (Expected 30)")
                    else:
                        print(f"  Col {i}: {val}")

            if "0001" in row_str and "Hönicke" in row_str:
                 print("\nFound Tobias Hönicke Row:")
                 for i, col in enumerate(row):
                    val = str(col).replace('\n', ' ').strip()
                    if val == '40' or val == '40.0':
                        print(f"  POTENTIAL MATCH: Col {i} = {val} (Expected 40)")

if __name__ == "__main__":
    find_target_col()
