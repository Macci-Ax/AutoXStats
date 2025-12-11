import pdfplumber

pdf_path = 'pdf/Dauborn.pdf'

found = False
with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if "Klasse 15" in text or "Spezialtourenwagen" in text:
            print(f"\n--- Page {i+1} (Potential Class 15) ---")
            lines = text.split('\n')
            for j, line in enumerate(lines[:15]):
                print(f"L{j}: {line}")
            
            tables = page.extract_tables()
            if tables:
                print("Table Header:", tables[0][0])
                if len(tables[0]) > 4:
                     # Find row with Hönicke
                     for row in tables[0]:
                         if row and len(row) > 4 and 'Hönicke' in str(row):
                             print("Row Hönicke:", row)
            found = True
            # Don't break immediately, might span pages or have multiple classes with similar text
