import pdfplumber
import sqlite3

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'
DB_PATH = 'autox.db'

def debug():
    # Get DB start numbers
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT start_number FROM drivers WHERE start_number IS NOT NULL LIMIT 10")
    db_nums = [row[0] for row in cursor.fetchall()]
    print(f"Sample DB start numbers: {db_nums}")
    conn.close()
    
    # Get PDF start numbers from column 1
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()
        
        if not tables:
            print("No tables")
            return
        
        table = tables[0]
        print(f"\nSample PDF start numbers (column 1):")
        for i, row in enumerate(table[1:6]):  # First 5 data rows
            startnr = row[1] if len(row) > 1 else '[N/A]'
            sachsenberg = row[13] if len(row) > 13 else '[N/A]'
            print(f"Row {i+1}: startnr='{startnr}', sachsenberg='{sachsenberg}'")

if __name__ == "__main__":
    debug()
