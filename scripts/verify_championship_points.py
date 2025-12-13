"""Verification script for championship points computation."""
import sqlite3
import os

DB_PATH = 'autox.db'

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

output = []

# 1. Total counts and distribution
output.append("=== CHAMPIONSHIP POINTS SUMMARY ===\n")

cursor.execute("SELECT COUNT(*) FROM race_results")
output.append(f"Total race_results: {cursor.fetchone()[0]}")

cursor.execute("""
    SELECT license_type, 
           COUNT(*) as cnt, 
           SUM(championship_points) as total_pts
    FROM race_results
    GROUP BY license_type
""")
output.append("\nBy license type:")
for row in cursor.fetchall():
    output.append(f"  {row[0] or 'NULL'}: {row[1]} results, {row[2]} total championship points")

# 2. Verify TL drivers have 0 points
cursor.execute("SELECT COUNT(*) FROM race_results WHERE license_type = 'TL' AND championship_points > 0")
tl_with_pts = cursor.fetchone()[0]
output.append(f"\nTL drivers with championship_points > 0: {tl_with_pts}")
if tl_with_pts == 0:
    output.append("  ✓ PASS: All TL drivers have 0 championship points")
else:
    output.append("  ✗ FAIL: Some TL drivers have championship points")

# 3. Events summary
output.append("\n=== EVENTS ===")
cursor.execute("""
    SELECT e.name, e.date, 
           COUNT(rr.id) as results,
           SUM(CASE WHEN rr.license_type = 'TL' THEN 1 ELSE 0 END) as tl_count
    FROM events e
    LEFT JOIN race_results rr ON e.id = rr.event_id
    GROUP BY e.id
    ORDER BY e.date
""")
for row in cursor.fetchall():
    output.append(f"  {row[0]} ({row[1]}): {row[2]} results, {row[3]} TL drivers")

# 4. Sample verification for DRCV driver point shift
output.append("\n=== SAMPLE: Championship Point Shift Verification ===")
cursor.execute("""
    SELECT e.name, rr.class_id, rr.rank, rr.license_type, rr.championship_points, d.name as driver_name
    FROM race_results rr
    JOIN events e ON rr.event_id = e.id
    JOIN drivers d ON rr.driver_id = d.id
    WHERE rr.class_id = 'd_k1'
    ORDER BY e.name, rr.rank
    LIMIT 15
""")
results = cursor.fetchall()
current_event = None
for row in results:
    event_name, class_id, rank, license_type, champ_pts, driver_name = row
    if event_name != current_event:
        current_event = event_name
        output.append(f"\n{event_name} - {class_id}:")
    output.append(f"  Rank {rank}: {driver_name} [{license_type}] -> {champ_pts} pts")

conn.close()

# Write output
result = '\n'.join(output)
print(result)

with open('scripts/verification_output.txt', 'w', encoding='utf-8') as f:
    f.write(result)

print("\n\nOutput also written to scripts/verification_output.txt")
