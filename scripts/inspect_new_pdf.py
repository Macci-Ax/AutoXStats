import pdfplumber

PDF_PATH = 'pdf/Meisterschaftswertung.pdf'

def inspect_text():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        text = first_page.extract_text()
        print("--- Text Extract ---")
        print(text[:2000]) # First 2000 chars

        if "Sachsenberg" in text:
             print("\nFOUND: 'Sachsenberg'")
        elif "grebneshcaS" in text:
             print("\nFOUND: 'grebneshcaS' (Reversed)")
        else:
             print("\nNOT FOUND: 'Sachsenberg'")

if __name__ == "__main__":
    inspect_text()
