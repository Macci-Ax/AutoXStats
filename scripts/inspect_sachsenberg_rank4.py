"""Inspect Sachsenberg 2024 Langstrecke table for Rank 4"""
import pdfplumber
import re

PDF_PATH = 'pdf/2024/Sachsenberg2024.pdf'

with pdfplumber.open(PDF_PATH) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if 'Langstrecke' in text and 'Sachsenberg' in text:
            print(f"=== Page {i+1} ===")
            lines = text.split('\n')
            for line in lines:
                if re.match(r'^\s*4\s+', line) or 'Engels' in line:
                    print(line)
