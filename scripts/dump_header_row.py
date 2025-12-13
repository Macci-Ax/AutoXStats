import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def dump_header():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()
        
        if not tables:
            print("No tables found.")
            return
            
        table = tables[0]
        header = table[0]
        
        print("Full Header Row (all cells):\n")
        for i, cell in enumerate(header):
            if cell:
                # Clean up multiline
                val = cell.replace('\n', ' | ')
            else:
                val = '[NONE]'
            print(f"Column {i}: \"{val}\"")

if __name__ == "__main__":
    dump_header()
