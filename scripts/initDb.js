
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
  DROP TABLE IF EXISTS race_results;
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS drivers;
  DROP TABLE IF EXISTS classes;
  DROP TABLE IF EXISTS championships;

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

const eventsData = [
  { id: 'e1', champ: 'DRCV', name: 'Dauborn', date: '2025-05-18', loc: 'Dauborn', status: 'COMPLETED' },
  { id: 'e2', champ: 'DRCV', name: 'Gleidorf', date: '2025-06-22', loc: 'Gleidorf', status: 'COMPLETED' },
  { id: 'e3', champ: 'WACV', name: 'WACV Lauf 1 - Waldorf', date: '2025-05-04', loc: 'Waldorf', status: 'COMPLETED' },
  { id: 'e4', champ: 'DRCV', name: 'Herbern', date: '2025-08-17', loc: 'Herbern', status: 'COMPLETED' },
  { id: 'e5', champ: 'DRCV', name: 'Osnabrück', date: '2025-09-07', loc: 'Osnabrück', status: 'COMPLETED' },
  { id: 'e6', champ: 'DRCV', name: 'Saisonfinale Itterbeck', date: '2025-09-28', loc: 'Itterbeck', status: 'UPCOMING' }
];

// 4. Einfügen der Daten

const insertChamp = db.prepare('INSERT OR REPLACE INTO championships (id, name, year) VALUES (?, ?, ?)');
const insertClass = db.prepare('INSERT OR REPLACE INTO classes (id, championship_id, name) VALUES (?, ?, ?)');
const insertDriver = db.prepare('INSERT OR REPLACE INTO drivers (id, name, team, car, start_number, current_class_id, points, season_rank, wins, second_places, third_places, heat_wins, podiums) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertParticipation = db.prepare('INSERT OR REPLACE INTO driver_participations (driver_id, class_id, points) VALUES (?, ?, ?)');
const insertEvent = db.prepare('INSERT OR REPLACE INTO events (id, championship_id, name, date, location, status) VALUES (?, ?, ?, ?, ?, ?)');

const transaction = db.transaction(() => {
  for (const champ of championships) insertChamp.run(champ.id, champ.name, champ.year);
  for (const cls of classesData) insertClass.run(cls.id, cls.champ, cls.name);
  for (const drv of driversData) insertDriver.run(drv.id, drv.name, drv.team, drv.car, drv.number, drv.classId, drv.points, drv.rank, drv.wins, drv.sec, drv.thi, drv.heat, drv.pod);
  for (const evt of eventsData) insertEvent.run(evt.id, evt.champ, evt.name, evt.date, evt.loc, evt.status);
});

transaction();
console.log('Datenbank erfolgreich befüllt!');
db.close();
