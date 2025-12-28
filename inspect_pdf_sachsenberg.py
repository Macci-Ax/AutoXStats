import pdfplumber
import os

pdf_path = os.path.join('pdf', 'Sachsenberg2025', '7.1_Wertung Klasse 01.pdf')
if not os.path.exists(pdf_path):
    # Try finding any pdf in that dir
    d = os.path.join('pdf', 'Sachsenberg2025')
    if os.path.exists(d):
        files = [f for f in os.listdir(d) if f.endswith('.pdf')]
        if files:
            pdf_path = os.path.join(d, files[0])

print(f"Inspecting {pdf_path}")

with pdfplumber.open(pdf_path) as pdf:
    if len(pdf.pages) > 0:
        text = pdf.pages[0].extract_text()
        print("--- EXTRACTED TEXT ---")
        print(text[:500]) # First 500 chars
        print("----------------------")
    else:
        print("No pages found.")
