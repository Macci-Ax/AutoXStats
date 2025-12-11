import pdfplumber

pdf_path = 'pdf/Dauborn.pdf'

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        lines = text.split('\n') if text else []
        header = lines[1].strip() if len(lines) > 1 else "NO_HEADER"
        
        has_dominik = "Dominik Hönicke" in text or "Dominik Hnicke" in text
        
        print(f"Page {i+1}: Header='{header}' {'[DOMINIK FOUND]' if has_dominik else ''}")
