"""List ALL Tobias Hönicke 2024 Langstrecke events with full details"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== TOBIAS HÖNICKE 2024 LANGSTRECKE ===")
cursor.execute("""
    SELECT e.id, e.name, e.date, rr.rank, rr.championship_points
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    JOIN events e ON rr.event_id = e.id
    WHERE d.name LIKE '%Tobias%Hönicke%' AND rr.class_id = 'd_lang' AND strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")
total = 0
for row in cursor.fetchall():
    total += row[4] if row[4] else 0
    print(f"  {row[0]}: {row[1][:25]:25} ({row[2]}) rank={row[3]:2} pts={row[4]:3}")

print(f"\n  TOTAL: {total}")
print(f"  EXPECTED: 305")
print(f"  DIFFERENCE: {total - 305}")

# Official PDF columns: Bohnhorst, Extertal, Hoope, Gleidorf, Eppe, Sachsenberg, Herbern, Vellern, Löhne, Dauborn
# Tobias in PDF: 40, 40, blank, 35, 30, 40, 40, 40, blank, 40 = 305
print("\n=== OFFICIAL PDF VALUES FOR TOBIAS ===")
print("  Bohnhorst: 40")
print("  Extertal: 40") 
print("  Hoope: -")
print("  Gleidorf: 35")
print("  Eppe: 30")
print("  Sachsenberg: 40")
print("  Herbern: 40")
print("  Vellern: 40")
print("  Löhne: -")
print("  Dauborn: 40")
print("  TOTAL: 305")

conn.close()
