import pdfplumber

pdf_path = 'pdf/Dauborn.pdf'

with pdfplumber.open(pdf_path) as pdf:
    # Iterate first few pages to see class transitions
    for i in range(5): 
        if i >= len(pdf.pages): break
        print(f"\n--- Page {i+1} ---")
        text = pdf.pages[i].extract_text()
        lines = text.split('\n')
        # Print first 10 lines to see headers
        for j, line in enumerate(lines[:10]):
            print(f"L{j}: {line}")

        # Extract table to check columns for Heat Wins
        tables = pdf.pages[i].extract_tables()
        if tables:
            print("Table Header:", tables[0][0])
            print("Table Row 1:", tables[0][1])
