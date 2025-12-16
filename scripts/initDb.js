
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Verbindung zur Datenbank herstellen (erstellt die Datei, falls nicht vorhanden)
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath, { verbose: console.log });

console.log(`Datenbank erstellt unter: ${dbPath}`);

// 2. Schema definieren (Tabellen erstellen)
const schema = `
  PRAGMA foreign_keys = OFF;
  DROP TABLE IF EXISTS driver_participations;
  DROP TABLE IF EXISTS class_events;
  DROP TABLE IF EXISTS race_results;
  DROP TABLE IF EXISTS championship_events;
  DROP TABLE IF EXISTS physical_events;
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS drivers;
  DROP TABLE IF EXISTS classes;
  DROP TABLE IF EXISTS championships;
  DROP TABLE IF EXISTS photos;
  DROP TABLE IF EXISTS photo_tags;
  PRAGMA foreign_keys = ON;

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
      second_places INTEGER DEFAULT 0,
      third_places INTEGER DEFAULT 0,
      heat_wins INTEGER DEFAULT 0,
      podiums INTEGER DEFAULT 0,
      FOREIGN KEY (current_class_id) REFERENCES classes(id)
  );

  -- NEW: Physical Events (represents real-world race weekends)
  CREATE TABLE physical_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      location TEXT,
      description TEXT,
      status TEXT DEFAULT 'upcoming'
  );

  -- NEW: Championship Events (links championships to physical events)
  CREATE TABLE championship_events (
      id TEXT PRIMARY KEY,
      physical_event_id TEXT NOT NULL,
      championship_id TEXT NOT NULL,
      has_results INTEGER DEFAULT 0,
      FOREIGN KEY (physical_event_id) REFERENCES physical_events(id),
      FOREIGN KEY (championship_id) REFERENCES championships(id),
      UNIQUE(physical_event_id, championship_id)
  );

  CREATE TABLE race_results (
      id TEXT PRIMARY KEY,
      championship_event_id TEXT,
      driver_id TEXT,
      class_id TEXT,
      rank INTEGER,
      points INTEGER,
      laps INTEGER,
      total_time TEXT,
      heat_wins INTEGER DEFAULT 0,
      start_number INTEGER,
      car TEXT,
      reconstructed INTEGER DEFAULT 0,
      license_type TEXT DEFAULT 'DRCV',
      championship_points INTEGER DEFAULT 0,
      FOREIGN KEY (championship_event_id) REFERENCES championship_events(id),
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

  CREATE TABLE class_events (
      class_id TEXT,
      championship_event_id TEXT,
      discipline TEXT DEFAULT 'klasse',
      PRIMARY KEY (class_id, championship_event_id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (championship_event_id) REFERENCES championship_events(id)
  );

  CREATE TABLE photos (
      id TEXT PRIMARY KEY,
      physical_event_id TEXT,
      storage_path TEXT NOT NULL,
      photographer TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (physical_event_id) REFERENCES physical_events(id)
  );

  CREATE TABLE photo_tags (
      id TEXT PRIMARY KEY,
      photo_id TEXT,
      driver_id TEXT,
      FOREIGN KEY (photo_id) REFERENCES photos(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
  );
`;

db.exec(schema);
console.log('Tabellenstruktur erstellt.');

// 3. Daten vorbereiten (Die echten Daten aus der App)

const championships = [
  { id: 'DRCV', name: 'Deutscher Rallye Cross Verband', year: 2025 },
  { id: 'WACV', name: 'Westdeutscher Auto Cross Verband', year: 2025 }
];

// Klassen-Mapping (vereinfacht für das Seed-Skript)
const classesData = [
  // DRCV Classes
  { id: 'd_lang', champ: 'DRCV', name: 'Langstrecke' },
  { id: 'd_k1', champ: 'DRCV', name: 'Klasse 01' },
  { id: 'd_k2', champ: 'DRCV', name: 'Klasse 02' },
  { id: 'd_k3', champ: 'DRCV', name: 'Klasse 03' },
  { id: 'd_k4', champ: 'DRCV', name: 'Klasse 04' },
  { id: 'd_k5', champ: 'DRCV', name: 'Klasse 05' },
  { id: 'd_k6', champ: 'DRCV', name: 'Klasse 06' },
  { id: 'd_k7', champ: 'DRCV', name: 'Klasse 07' },
  { id: 'd_k8', champ: 'DRCV', name: 'Klasse 08' },
  { id: 'd_k9', champ: 'DRCV', name: 'Klasse 09' },
  { id: 'd_k10', champ: 'DRCV', name: 'Klasse 10' },
  { id: 'd_k11', champ: 'DRCV', name: 'Klasse 11' },
  { id: 'd_k12', champ: 'DRCV', name: 'Klasse 12' },
  { id: 'd_k13', champ: 'DRCV', name: 'Klasse 13' },
  { id: 'd_k14', champ: 'DRCV', name: 'Klasse 14' },
  { id: 'd_k15', champ: 'DRCV', name: 'Klasse 15' },
  // WACV Classes
  { id: 'w_lang', champ: 'WACV', name: 'Langstrecke (WACV)' },
  { id: 'w_k1', champ: 'WACV', name: 'Klasse 01' },
  { id: 'w_k2', champ: 'WACV', name: 'Klasse 02' },
  { id: 'w_k3', champ: 'WACV', name: 'Klasse 03' },
  { id: 'w_k4', champ: 'WACV', name: 'Klasse 04' },
  { id: 'w_k5', champ: 'WACV', name: 'Klasse 05' },
  { id: 'w_k6', champ: 'WACV', name: 'Klasse 06' },
  { id: 'w_k7', champ: 'WACV', name: 'Klasse 07' },
  { id: 'w_k8', champ: 'WACV', name: 'Klasse 08' },
  { id: 'w_k9', champ: 'WACV', name: 'Klasse 09' },
  { id: 'w_k10', champ: 'WACV', name: 'Klasse 10' },
  { id: 'w_k11', champ: 'WACV', name: 'Klasse 11' },
  { id: 'w_k12', champ: 'WACV', name: 'Klasse 12' },
  { id: 'w_k13', champ: 'WACV', name: 'Klasse 13' },
  { id: 'w_k14', champ: 'WACV', name: 'Klasse 14' },
  { id: 'w_k15', champ: 'WACV', name: 'Klasse 15' },
];

const driversData = [];

// Updated: Physical Events and Championship Events data
const physicalEventsData = [
  { id: 'pe_e1', title: 'Dauborn', date: '2025-05-18', loc: 'Dauborn', status: 'finished' },
  { id: 'pe_e2', title: 'Gleidorf', date: '2025-06-22', loc: 'Gleidorf', status: 'finished' },
  { id: 'pe_e3', title: 'WACV Lauf 1 - Waldorf', date: '2025-05-04', loc: 'Waldorf', status: 'finished' },
  { id: 'pe_e4', title: 'Herbern', date: '2025-08-17', loc: 'Herbern', status: 'finished' },
  { id: 'pe_e5', title: 'Osnabrück', date: '2025-09-07', loc: 'Osnabrück', status: 'finished' },
  { id: 'pe_e6', title: 'Saisonfinale Itterbeck', date: '2025-09-28', loc: 'Itterbeck', status: 'upcoming' }
];

const championshipEventsData = [
  { id: 'ce_e1', physical_event_id: 'pe_e1', champ: 'DRCV', has_results: 1 },
  { id: 'ce_e2', physical_event_id: 'pe_e2', champ: 'DRCV', has_results: 1 },
  { id: 'ce_e3', physical_event_id: 'pe_e3', champ: 'WACV', has_results: 1 },
  { id: 'ce_e4', physical_event_id: 'pe_e4', champ: 'DRCV', has_results: 1 },
  { id: 'ce_e5', physical_event_id: 'pe_e5', champ: 'DRCV', has_results: 1 },
  { id: 'ce_e6', physical_event_id: 'pe_e6', champ: 'DRCV', has_results: 0 }
];

// 4. Einfügen der Daten

const insertChamp = db.prepare('INSERT OR REPLACE INTO championships (id, name, year) VALUES (?, ?, ?)');
const insertClass = db.prepare('INSERT OR REPLACE INTO classes (id, championship_id, name) VALUES (?, ?, ?)');
const insertDriver = db.prepare('INSERT OR REPLACE INTO drivers (id, name, team, car, start_number, current_class_id, points, season_rank, wins, second_places, third_places, heat_wins, podiums) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertParticipation = db.prepare('INSERT OR REPLACE INTO driver_participations (driver_id, class_id, points) VALUES (?, ?, ?)');
const insertPhysicalEvent = db.prepare('INSERT OR REPLACE INTO physical_events (id, title, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?)');
const insertChampionshipEvent = db.prepare('INSERT OR REPLACE INTO championship_events (id, physical_event_id, championship_id, has_results) VALUES (?, ?, ?, ?)');

const transaction = db.transaction(() => {
  for (const champ of championships) insertChamp.run(champ.id, champ.name, champ.year);
  for (const cls of classesData) insertClass.run(cls.id, cls.champ, cls.name);
  for (const drv of driversData) insertDriver.run(drv.id, drv.name, drv.team, drv.car, drv.number, drv.classId, drv.points, drv.rank, drv.wins, drv.sec, drv.thi, drv.heat, drv.pod);
  for (const evt of physicalEventsData) insertPhysicalEvent.run(evt.id, evt.title, evt.date, evt.date, evt.loc, evt.status);
  for (const ce of championshipEventsData) insertChampionshipEvent.run(ce.id, ce.physical_event_id, ce.champ, ce.has_results);
});

transaction();
console.log('Datenbank erfolgreich befüllt!');
db.close();

