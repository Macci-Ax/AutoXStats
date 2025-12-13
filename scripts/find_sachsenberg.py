import pdfplumber

PDF_PATH = 'pdf/Meisterschaft2025final.pdf'

def find_text():
    with pdfplumber.open(PDF_PATH) as pdf:
        first_page = pdf.pages[0]
        text = first_page.extract_text()
        if "Sachsenberg" in text:
            print("Found 'Sachsenberg' in text.")
            index = text.find("Sachsenberg")
            print(f"Context: {text[index-50:index+50]}")
        else:
            print("'Sachsenberg' not found in text.")

if __name__ == "__main__":
    find_text()
