"""List all 2024 events and Tobias Hönicke's points to file"""
import sqlite3

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

results = []
results.append("=== 2024 EVENTS AND TOBIAS HÖNICKE POINTS ===")
cursor.execute("""
    SELECT e.name, e.date, rr.rank, rr.championship_points
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id AND rr.driver_id IN (
        SELECT id FROM drivers WHERE name LIKE '%Tobias%Hönicke%'
    ) AND rr.class_id = 'd_lang'
    WHERE strftime('%Y', e.date) = '2024'
    ORDER BY e.date
""")

events = cursor.fetchall()
total = 0
for row in events:
    pts = row[3] if row[3] else 0
    total += pts
    results.append(f"Date: {row[1]} | Event: {row[0]:<30} | Rank: {row[2]} | Points: {pts}")

results.append(f"----------------------------------------------------------------")
results.append(f"TOTAL POINTS: {total}")

conn.close()

with open('status_2024.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(results))
