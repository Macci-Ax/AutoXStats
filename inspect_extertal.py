
import pdfplumber

with pdfplumber.open('pdf/2025/Extertal.pdf') as pdf:
    print(pdf.pages[0].extract_text().split('\n')[:5])
