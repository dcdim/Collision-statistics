const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
const { DB_PATH } = require('./database/config.js');

// const DB_PATH = path.resolve(__dirname, 'database', '278_DB_B04-L04.sqlite');

function connect() {
  return new sqlite3.Database(DB_PATH);
}

function getEntries() {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.all(`SELECT ID, Name FROM Entries ORDER BY ID`, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Получить данные только из таблицы EntriesUpdates для заданного EntryId
function getEntriesUpdates(entryId) {
  return new Promise((resolve, reject) => {
    const db = connect();
    const sql = `
      SELECT UpdateDate, CollisionsAmount 
      FROM EntriesUpdates 
      WHERE EntryId = ? 
      ORDER BY UpdateDate
    `;
    db.all(sql, [entryId], (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  getEntries,
  getEntriesUpdates,
};
