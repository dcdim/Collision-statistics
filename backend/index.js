// backend/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/api/', (req, res) => {
  res.json({ message: 'API is working' });
});

app.get('/api/db-list', (req, res) => {
  res.json(Object.keys(db.DB_CONFIGS));
});

app.post('/api/switch-db', (req, res) => {
  const { dbName } = req.body;
  if (!dbName || !db.DB_CONFIGS[dbName]) {
    return res.status(400).json({ error: 'Invalid DB name' });
  }
  db.setDb(dbName);
  res.json({ ok: true, dbName });
});

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await db.getEntries();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdates();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/arar', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesARAR();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/arth', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesARTH();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/krkr', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesKRKR();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/krth', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesKRTH();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/thth', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesTHTH();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/aren', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesAREN();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/kren', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesKREN();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/then', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesTHEN();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/arduble', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesARDUBLE();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/krduble', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesKRDUBLE();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/enen', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesENEN();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
