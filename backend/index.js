const express = require('express');
const cors = require('cors');
const db = require('./db');
const { DB_CONFIGS } = require('./database/config');

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ТЕСТОВЫЙ МАРШРУТ
app.get('/api/', (req, res) => {
  res.json({ message: 'API is working' });
});

// ГЛОБАЛЬНАЯ СТАТИСТИКА ПО ОБЪЕКТУ (СУММА + ДЕЛЬТА)
app.get('/api/project-total-collisions/:projectId', async (req, res) => {
  const { projectId } = req.params;
  console.log("!!! ЗАПРОС СТАТИСТИКИ ОБЪЕКТА:", projectId);
  
  try {
    const projectDbs = Object.keys(DB_CONFIGS).filter(key => key.startsWith(`${projectId}_`));
    
    if (projectDbs.length === 0) {
      return res.json({ total: 0, delta: 0 });
    }

    // Вызываем вашу новую функцию из db.js
    const stats = await db.getProjectTotalWithDelta(projectDbs);
    res.json(stats);
  } catch (err) {
    console.error("!!! ОШИБКА ОБЪЕКТА:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// СПИСОК ПРОЕКТОВ
app.get('/api/projects', (req, res) => {
  const keys = Object.keys(DB_CONFIGS);
  const projects = [...new Set(keys.map(key => key.split('_')[0]))];
  res.json(projects);
});

// СПИСОК БД ДЛЯ ПРОЕКТА
app.get('/api/databases/:projectId', (req, res) => {
  const { projectId } = req.params;
  const filteredDbs = Object.keys(DB_CONFIGS).filter(key => key.startsWith(`${projectId}_`));
  res.json(filteredDbs);
});

// ПЕРЕКЛЮЧЕНИЕ БД
app.post('/api/switch-db', async (req, res) => {
  const { dbName } = req.body;
  try {
    if (!dbName) throw new Error('dbName is required');
    await db.setDb(dbName);
    console.log(`Server: Switched to ${dbName}`);
    res.json({ success: true, currentDb: dbName });
  } catch (err) {
    console.error('Switch DB Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ДАННЫЕ ДЛЯ ГРАФИКОВ
app.get('/api/updates/:type', async (req, res) => {
  const { type } = req.params;
  try {
    let data;
    switch (type) {
      case 'arkr': data = await db.getEntriesUpdatesArKr(); break;
      case 'arar': data = await db.getEntriesUpdatesArAr(); break;
      case 'arth': data = await db.getEntriesUpdatesArTh(); break;
      case 'krkr': data = await db.getEntriesUpdatesKrKr(); break;
      case 'krth': data = await db.getEntriesUpdatesKrTh(); break;
      case 'thth': data = await db.getEntriesUpdatesThTh(); break;
      case 'aren': data = await db.getEntriesUpdatesArEn(); break;
      case 'kren': data = await db.getEntriesUpdatesKrEn(); break;
      case 'then': data = await db.getEntriesUpdatesThEn(); break;
      case 'enen': data = await db.getEntriesUpdatesEnEn(); break;
      case 'arduble': data = await db.getEntriesUpdatesArDuble(); break;
      case 'krduble': data = await db.getEntriesUpdatesKrDuble(); break;
      case 'enduble': data = await db.getEntriesUpdatesEnDuble(); break;
      default: return res.status(404).json({ error: 'Unknown chart type' });
    }
    res.json(data || []);
  } catch (err) {
    console.error(`Error in /api/updates/${type}:`, err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// ЛОКАЛЬНАЯ СТАТИСТИКА ВЫБРАННОЙ БД
app.get('/api/total-stats', async (req, res) => {
  try {
    const stats = await db.getTotalStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ДЕТАЛИЗАЦИЯ
app.get('/api/details/:type', async (req, res) => {
  const { type } = req.params;
  try {
    let details;
    switch (type) {
      case 'arar': details = await db.getArArDetails(); break;
      case 'arkr': details = await db.getArKrDetails(); break;
      case 'arth': details = await db.getArThDetails(); break;
      case 'krkr': details = await db.getKrKrDetails(); break;
      case 'krth': details = await db.getKrThDetails(); break;
      case 'thth': details = await db.getThThDetails(); break;
      case 'aren': details = await db.getArEnDetails(); break;
      case 'kren': details = await db.getKrEnDetails(); break;
      case 'then': details = await db.getThEnDetails(); break;
      case 'enen': details = await db.getEnEnDetails(); break;
      case 'enduble': details = await db.getEnDubleDetails(); break;
      default: return res.status(404).json({ error: 'Unknown details type' });
    }
    res.json(details || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});