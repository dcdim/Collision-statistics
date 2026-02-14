const express = require('express');
const db = require('./db');
const { DB_CONFIGS } = require('./database/config');

const app = express();
app.use(express.json());

app.get('/api/project-total-collisions/:projectId', async (req, res) => {
  const pid = req.params.projectId;
  console.log("!!! СЕРВЕР ПОЛУЧИЛ ЗАПРОС ДЛЯ ПРОЕКТА:", pid);
  
  try {
    const projectDbs = Object.keys(DB_CONFIGS).filter(key => key.startsWith(`${pid}_`));
    console.log("!!! НАЙДЕНЫ БД:", projectDbs);
    
    const stats = await db.getProjectTotalWithDelta(projectDbs);
    res.json(stats);
  } catch (err) {
    console.error("!!! ОШИБКА:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.get('/api/', (req, res) => {
  res.json({ message: 'API is working' });
});

// 1. Список проектов
app.get('/api/projects', (req, res) => {
  const keys = Object.keys(DB_CONFIGS);
  const projects = [...new Set(keys.map(key => key.split('_')[0]))];
  res.json(projects);
});

// 2. Список БД для проекта
app.get('/api/databases/:projectId', (req, res) => {
  const { projectId } = req.params;
  const filteredDbs = Object.keys(DB_CONFIGS).filter(key => key.startsWith(`${projectId}_`));
  res.json(filteredDbs);
});

// 3. Переключение БД (обязательно с await, чтобы пул успел создаться)
app.post('/api/switch-db', async (req, res) => {
  const { dbName } = req.body;
  try {
    if (!dbName) throw new Error('dbName is required');
    await db.setDb(dbName); // Ждем создания пула
    console.log(`Server: Successfully switched to ${dbName}`);
    res.json({ success: true, currentDb: dbName });
  } catch (err) {
    console.error('Switch DB Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// --- МАРШРУТЫ ДЛЯ ГРАФИКОВ ---

app.get('/api/updates/:type', async (req, res) => {
  const { type } = req.params;
  
  try {
    // ПРОВЕРКА: Если пул еще не создан (currentPool === null)
    // Это основная причина ошибки 500
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
    
    // Если данных нет, возвращаем пустой массив, чтобы фронтенд не падал
    res.json(data || []);
    
  } catch (err) {
    // Выводим реальную причину ошибки в консоль сервера
    console.error(`Error in /api/updates/${type}:`, err.message);
    res.status(500).json({ error: 'Database connection not ready' });
  }
});

// Статистика
app.get('/api/total-stats', async (req, res) => {
  try {
    const stats = await db.getTotalStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/project-total-collisions/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    // 1. Находим все БД, принадлежащие этому проекту
    const projectDbs = Object.keys(DB_CONFIGS).filter(key => key.startsWith(`${projectId}_`));
    
    if (projectDbs.length === 0) {
      return res.json({ total: 0 });
    }

    // 2. Вызываем суммирующую функцию
    const total = await db.getTotalCollisionsByProject(projectDbs);
    
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Детали
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
    console.error(`Details error ${type}:`, err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});