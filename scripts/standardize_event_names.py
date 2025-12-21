import sqlite3
from datetime import datetime

def format_date(date_str):
    try:
        # Parse YYYY-MM-DD
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        # Format DD.MM.YYYY
        return dt.strftime('%d.%m.%Y')
    except ValueError:
        return None

def standardize_events():
    conn = sqlite3.connect('autox.db')
    cursor = conn.cursor()

    print("=== STANDARDIZING EVENT NAMES ===")
    
    cursor.execute("SELECT id, title, start_date FROM physical_events")
    events = cursor.fetchall()
    
    updated_count = 0
    
    for event_id, title, start_date in events:
        if not start_date:
            continue
            
        formatted_date = format_date(start_date)
        if not formatted_date:
            continue
            
        new_title = title
        
        # 1. Remove "(Reconstructed)" (case insensitive)
        if "(Reconstructed)" in new_title:
             new_title = new_title.replace("(Reconstructed)", "").strip()
        
        # 2. Check if date is already in title
        if formatted_date not in new_title:
            new_title = f"{new_title} {formatted_date}"
            
        # 3. Update if changed
        if new_title != title:
            print(f"Updating: '{title}' -> '{new_title}'")
            cursor.execute("UPDATE physical_events SET title = ? WHERE id = ?", (new_title, event_id))
            updated_count += 1
            
    conn.commit()
    print(f"\nTotal events updated: {updated_count}")
    conn.close()

if __name__ == "__main__":
    standardize_events()
