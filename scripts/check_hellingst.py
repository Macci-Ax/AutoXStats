"""Check Hellingst2024.pdf content"""
import pdfplumber

with pdfplumber.open('pdf/2024/Hellingst2024.pdf') as pdf:
    print(pdf.pages[0].extract_text()[:300])
