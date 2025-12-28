import sqlite3
import sys

db_path = 'autox.db'

def get_discipline(class_name):
    lower_name = class_name.lower()
    if lower_name.startswith('klasse'):
        return 'klasse'
    elif lower_name.startswith('endlauf'):
        return 'endlauf'
    elif lower_name.startswith('langstrecke'):
        return 'langstrecke'
    elif lower_name.startswith('super cup') or lower_name.startswith('supercup'):
        return 'supercup'
    else:
        # Fallback or error?
        # Based on inspected classes: 'Klasse 01', 'Langstrecke', 'Endlauf Div 1', 'Super Cup Div 1'
        # All seem to be covered.
        return None

def init_class_events():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Creating table class_events...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS class_events (
      class_id   TEXT NOT NULL,
      event_id   TEXT NOT NULL,
      discipline TEXT NOT NULL CHECK (discipline IN (
        'klasse',
        'endlauf',
        'langstrecke',
        'supercup'
      )),
      is_counting BOOLEAN NOT NULL DEFAULT TRUE,
      PRIMARY KEY (class_id, event_id, discipline),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );
    """)

    # Clear existing data to rebuild as source of truth
    cursor.execute("DELETE FROM class_events;")
    
    print("Populating class_events from race_results...")
    
    # Get distinct class_id, event_id, championship_event_id, and class_name from race_results joined with classes
    cursor.execute("""
        SELECT DISTINCT rr.class_id, rr.event_id, rr.championship_event_id, c.name
        FROM race_results rr
        JOIN classes c ON rr.class_id = c.id
    """)
    
    rows = cursor.fetchall()
    
    inserted_count = 0
    skipped_count = 0
    
    for row in rows:
        class_id, event_id, champ_event_id, class_name = row
        discipline = get_discipline(class_name)
        
        if discipline:
            try:
                cursor.execute("""
                    INSERT INTO class_events (class_id, event_id, discipline, championship_event_id)
                    VALUES (?, ?, ?, ?)
                """, (class_id, event_id, discipline, champ_event_id))
                inserted_count += 1
            except sqlite3.IntegrityError as e:
                # Try update if exists but null? Or just skip strictly.
                # Since we cleared table, it should be fine.
                print(f"Skipping duplicate/error: {class_id}, {event_id}, {discipline} - {e}")
        else:
            print(f"Warning: Could not determine discipline for class '{class_name}' ({class_id})")
            skipped_count += 1
            
    conn.commit()
    print(f"Finished. Inserted: {inserted_count}, Skipped: {skipped_count}")

    # Validation Queries
    print("\nValidation 6.1: Class Event Coverage")
    cursor.execute("""
        SELECT class_id, discipline, COUNT(*) AS events
        FROM class_events
        GROUP BY class_id, discipline;
    """)
    coverage = cursor.fetchall()
    for row in coverage:
        print(row)

    print("\nValidation 6.2: Missing Results Check")
    cursor.execute("""
        SELECT ce.class_id, ce.event_id, ce.discipline
        FROM class_events ce
        LEFT JOIN race_results rr
          ON rr.event_id = ce.event_id
         AND rr.class_id = ce.class_id
        WHERE rr.id IS NULL;
    """)
    missing = cursor.fetchall()
    if missing:
        print("Found missing results (Expected for non-starters, but verify):")
        for row in missing:
            print(row)
    else:
        print("No missing results found.")

    conn.close()

if __name__ == "__main__":
    init_class_events()
