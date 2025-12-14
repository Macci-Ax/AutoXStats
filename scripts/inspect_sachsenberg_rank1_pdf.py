"""Inspect Sachsenberg 2024 PDF for Rank 1"""
import pdfplumber
import re

PDF_PATH = 'pdf/temp_sachsenberg/Sachsenberg2024.pdf'

with pdfplumber.open(PDF_PATH) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if 'Langstrecke' in text and 'Sachsenberg' in text:
            print(f"=== Page {i+1} ===")
            lines = text.split('\n')
            for line in lines:
                if re.match(r'^\s*1\s+', line) or 'Hönicke' in line or 'Anderseck' in line:
                    print(line)
