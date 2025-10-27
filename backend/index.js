const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
const PORT = 3000;

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await db.getEntries();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получение данных обновлённого API - только EntriesUpdates
app.get('/api/comparison/:entryId', async (req, res) => {
  const entryId = parseInt(req.params.entryId);
  if (isNaN(entryId)) {
    return res.status(400).json({ error: 'Invalid EntryId' });
  }
  try {
    const entriesUpdates = await db.getEntriesUpdates(entryId);
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
