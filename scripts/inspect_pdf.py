import pdfplumber

pdf_path = 'pdf/Dauborn.pdf'

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    for i, page in enumerate(pdf.pages[:2]): # Check first 2 pages
        print(f"--- Page {i+1} ---")
        text = page.extract_text()
        print("Text Preview:")
        print(text[:500]) # First 500 chars
        
        print("\nTable Preview:")
        tables = page.extract_tables()
        for table in tables:
            for row in table[:3]: # First 3 rows of each table
                print(row)
