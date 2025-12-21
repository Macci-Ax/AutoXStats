import sqlite3
import pandas as pd

conn = sqlite3.connect('autox.db')
cursor = conn.cursor()

print("=== CHECKING EVENTS: Herbern, Sachsenberg, Vellern ===")
query = "SELECT id, name, date FROM events WHERE name LIKE '%Herbern%' OR name LIKE '%Sachsenberg%' OR name LIKE '%Vellern%' OR name LIKE '%Löhne%'"
df = pd.read_sql_query(query, conn)
print(df)

conn.close()
