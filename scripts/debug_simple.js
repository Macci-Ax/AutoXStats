import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('../autox.db'); // Checking path ../autox.db assuming run from scripts/ ??
// Wait, CWD was c:/Users/macci/Documents/AutoXStats
// So ./autox.db is correct.

const db2 = new sqlite3.Database('./autox.db');

db2.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    console.log("All Tables:", rows);
});
