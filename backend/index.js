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
    const entriesUpdates = await db.getEntriesUpdatesArKr();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/arar', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesArAr();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/arth', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesArTh();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/krkr', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesKrKr();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/krth', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesKrTh();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/thth', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesThTh();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/aren', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesArEn();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/kren', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesKrEn();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/then', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesThEn();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/arduble', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesArDuble();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/krduble', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesKrDuble();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comparison/enen', async (req, res) => {
  try {
    const entriesUpdates = await db.getEntriesUpdatesEnEn();
    res.json(entriesUpdates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/details/arar', async (req, res) => {
  try {
    const details = await db.getArArDetails();
    res.json(details);
  } catch (err) {
    console.error('Ошибка при получении деталей АР-АР:', err);
    res.status(500).json({ error: 'Ошибка сервера при обработке статистики' });
  }

});
app.get('/api/details/arkr', async (req, res) => {
  try {
    const details = await db.getArKrDetails();
    res.json(details);
  } catch (err) {
    console.error('Ошибка при получении деталей АР-КР:', err);
    res.status(500).json({ error: 'Ошибка сервера при обработке статистики' });
  }
});


app.get('/api/details/arth', async (req, res) => {
  try {
    const details = await db.getArThDetails();
    res.json(details);
  } catch (err) {
    console.error('Ошибка при получении деталей АР-ТХ:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/details/krkr', async (req, res) => {
  try {
    const details = await db.getKrKrDetails();
    res.json(details);
  } catch (err) {
    console.error('Ошибка при получении деталей КР-КР:', err);
    res.status(500).json({ error: 'Ошибка сервера при загрузке данных КР-КР' });
  }
});

app.get('/api/details/krth', async (req, res) => {
  try {
    const details = await db.getKrThDetails();
    res.json(details);
  } catch (err) {
    console.error('Ошибка при получении деталей КР-ТХ:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/details/thth', async (req, res) => {
  try {
    const details = await db.getThThDetails();
    res.json(details);
  } catch (err) {
    console.error('Ошибка при получении деталей ТХ-ТХ:', err);
    res.status(500).json({ error: 'Ошибка сервера при обработке статистики ТХ-ТХ' });
  }
});

// app.get('/api/details/aren', async (req, res) => {
//   try {
//     const details = await db.getArEnDetails();
//     res.json(details);
//   } catch (err) {
//     console.error('Ошибка АР-ИС:', err);
//     res.status(500).json({ error: 'Ошибка сервера' });
//   }
// });

app.get('/api/details/aren', async (req, res) => {
  try {
    const details = await db.getArEnDetails();
    // Убедитесь, что db.getArEnDetails всегда возвращает массив (rows)
    res.json(details || []); 
  } catch (err) {
    console.error(err);
    // Если ошибка, отправляем статус 500 и объект ошибки
    // Фронтенд теперь это обработает через .catch
    res.status(500).json({ error: 'Ошибка базы данных', message: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});














// Добавление роли пользователя

app.post('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  await db.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [id, 'role_changed']);
  res.status(200).json({ message: 'Role updated' });
});


const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};