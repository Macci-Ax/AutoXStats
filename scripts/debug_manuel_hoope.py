"""Dump Manuel's points and check Hoope PDF"""
import sqlite3
import pdfplumber

print("=== MANUEL POINTS DB ===")
conn = sqlite3.connect('autox.db')
cursor = conn.cursor()
cursor.execute("""
    SELECT e.name, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Friedewald%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total = 0
for row in cursor.fetchall():
    pts = row[1] if row[1] else 0
    total += pts
    print(f"  {row[0]}: {pts}")
print(f"  TOTAL: {total}")
conn.close()

print("\n=== HELLINGST PDF SEARCH ===")
with pdfplumber.open('pdf/2024/Hellingst2024.pdf') as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if 'Friedewald' in text:
            print("Found Friedewald in PDF:")
            for line in text.split('\n'):
                if 'Friedewald' in line:
                    print(f"  {line}")
