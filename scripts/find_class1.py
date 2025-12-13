
import pdfplumber
import os

pdf_path = os.path.join('pdf', 'Meisterschaft2025final.pdf')

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            # Simple check
            if "Klasse 1" in text or "Klasse  1" in text or "Klasse I" in text:
                print(f"--- Page {i+1} matches 'Klasse 1' ---")
                print(text[:300])
                
            # Print first line of every page to see headers
            first_line = text.split('\n')[0]
            print(f"Page {i+1}: {first_line}")
