import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath, { verbose: console.log });

const classesData = [
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
];

const insertClass = db.prepare('INSERT OR IGNORE INTO classes (id, championship_id, name) VALUES (?, ?, ?)');

const transaction = db.transaction(() => {
    for (const cls of classesData) {
        insertClass.run(cls.id, cls.champ, cls.name);
    }
});

try {
    transaction();
    console.log('Fixed missing DRCV classes.');
} catch (e) {
    console.error('Fix failed:', e);
} finally {
    db.close();
}
