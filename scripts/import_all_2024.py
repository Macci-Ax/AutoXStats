"""Import all 2024 PDFs at once"""
import subprocess
import glob
import os

# Find all 2024 PDFs
pdfs = glob.glob('pdf/*2024*.pdf')
print(f"Found {len(pdfs)} PDF files for 2024:")
for pdf in pdfs:
    print(f"  {pdf}")

print("\nStarting import...")

# Run import_results.py for each PDF
for pdf in pdfs:
    print(f"\n=== Importing {pdf} ===")
    result = subprocess.run(['python', 'scripts/import_results.py', pdf], 
                          capture_output=True, text=True, cwd='.')
    print(result.stdout)
    if result.stderr:
        print(f"ERRORS: {result.stderr}")

print("\n=== Import Complete ===")

# Recompute championship points
print("Recomputing championship points...")
result = subprocess.run(['python', 'scripts/compute_championship_points.py'], 
                      capture_output=True, text=True, cwd='.')
print(result.stdout)

# Verify years
import sqlite3
conn = sqlite3.connect('autox.db')
cursor = conn.cursor()
cursor.execute("""
    SELECT strftime('%Y', e.date) as year, COUNT(DISTINCT e.id) as events, COUNT(rr.id) as results
    FROM events e
    JOIN race_results rr ON e.id = rr.event_id
    GROUP BY year
    ORDER BY year
""")
print("\n=== Results by Year ===")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} events, {row[2]} results")
conn.close()
