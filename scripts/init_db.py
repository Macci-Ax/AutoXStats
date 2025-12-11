import sqlite3
import os

DB_PATH = 'autox.db'

def init_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing database: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    schema = """
    CREATE TABLE championships (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        year INTEGER NOT NULL
    );

    CREATE TABLE classes (
        id TEXT PRIMARY KEY,
        championship_id TEXT,
        name TEXT NOT NULL,
        FOREIGN KEY (championship_id) REFERENCES championships(id)
    );

    CREATE TABLE drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        team TEXT,
        car TEXT,
        start_number INTEGER,
        current_class_id TEXT,
        bio TEXT,
        points INTEGER DEFAULT 0,
        season_rank INTEGER,
        wins INTEGER DEFAULT 0,
        heat_wins INTEGER DEFAULT 0,
        podiums INTEGER DEFAULT 0,
        FOREIGN KEY (current_class_id) REFERENCES classes(id)
    );

    CREATE TABLE events (
        id TEXT PRIMARY KEY,
        championship_id TEXT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT,
        status TEXT,
        winner_driver_id TEXT,
        FOREIGN KEY (championship_id) REFERENCES championships(id)
    );

    CREATE TABLE race_results (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        driver_id TEXT,
        class_id TEXT,
        rank INTEGER,
        points INTEGER,
        laps INTEGER,
        total_time TEXT,
        heat_wins INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (driver_id) REFERENCES drivers(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE driver_participations (
        driver_id TEXT,
        class_id TEXT,
        points INTEGER DEFAULT 0,
        rank INTEGER,
        wins INTEGER DEFAULT 0,
        podiums INTEGER DEFAULT 0,
        PRIMARY KEY (driver_id, class_id),
        FOREIGN KEY (driver_id) REFERENCES drivers(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
    );
    """
    
    cursor.executescript(schema)
    print("Schema created.")

    # Seed Data
    championships = [
        ('DRCV', 'Deutscher Rallye Cross Verband', 2025),
        ('WACV', 'Westdeutscher Auto Cross Verband', 2025)
    ]
    cursor.executemany("INSERT INTO championships VALUES (?, ?, ?)", championships)

    # Classes and Drivers are now fully dynamic from import_results.py
    # No dummy data seeded.

    events = [
        ('e1', 'DRCV', 'Dauborn', '2025-05-18', 'Dauborn', 'COMPLETED', None),
        ('e2', 'DRCV', 'Gleidorf', '2025-06-22', 'Gleidorf', 'COMPLETED', None),
        ('e3', 'WACV', 'WACV Lauf 1 - Waldorf', '2025-05-04', 'Waldorf', 'COMPLETED', None),
        ('e4', 'DRCV', 'Herbern', '2025-08-17', 'Herbern', 'COMPLETED', None),
        ('e5', 'DRCV', 'Osnabrück', '2025-09-07', 'Osnabrück', 'COMPLETED', None),
        ('e6', 'DRCV', 'Saisonfinale Itterbeck', '2025-09-28', 'Itterbeck', 'UPCOMING', None), # This was the finale
        ('e7', 'DRCV', 'Itterbeck Lauf 1', '2025-04-27', 'Itterbeck', 'COMPLETED', None) # The one from the PDF
    ]
    cursor.executemany("INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?)", events)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    init_db()
