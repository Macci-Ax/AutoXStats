"""Check raw content of Sachsenberg2024.pdf for Manuel Friedewald"""
import pdfplumber

PDF_PATH = 'pdf/2024/Sachsenberg2024.pdf'

with pdfplumber.open(PDF_PATH) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    for page in pdf.pages:
        text = page.extract_text()
        if 'Langstrecke' in text and 'Friedewald' in text:
            print("Found usage in Langstrecke:")
            for line in text.split('\n'):
                if 'Friedewald' in line:
                    print(f"  {line}")
