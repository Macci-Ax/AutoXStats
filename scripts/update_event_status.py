import sqlite3
from datetime import datetime

def update_event_status():
    conn = sqlite3.connect('autox.db')
    cursor = conn.cursor()

    today = '2025-12-21'
    
    print(f"=== UPDATING PAST EVENTS (Before {today}) ===")
    
    # Select events to be updated for reporting
    cursor.execute("SELECT id, title, start_date, status FROM physical_events WHERE status != 'finished' AND start_date < ?", (today,))
    events = cursor.fetchall()
    
    if not events:
        print("No past events found that need status update.")
    else:
        for event in events:
            print(f"Updating '{event[1]}' ({event[2]}) status from '{event[3]}' to 'finished'")
            
        # Execute Update
        cursor.execute("UPDATE physical_events SET status = 'finished' WHERE status != 'finished' AND start_date < ?", (today,))
        print(f"\nUpdated {cursor.rowcount} events.")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_event_status()
