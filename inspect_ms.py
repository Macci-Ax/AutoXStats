
import pdfplumber

try:
    with pdfplumber.open('pdf/2025/Meisterschaftswertung.pdf') as pdf:
        print(pdf.pages[0].extract_text().split('\n')[:5])
except Exception as e:
    print(e)
