import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Typography, Box, CircularProgress } from '@mui/material';

import DbSelector from './DbSelector';

// Импорт компонентов графиков
import BarChartARKR from './BarChartARKR';
import BarChartARAR from './BarChartARAR';
import BarChartARTH from './BarChartARTH';
import BarChartKRKR from './BarChartKRKR';
import BarChartKRTH from './BarChartKRTH';
import BarChartTHTH from './BarChartTHTH';
import BarChartAREN from './BarChartAREN';
import BarChartKREN from './BarChartKREN';
import BarChartTHEN from './BarChartTHEN';
import BarChartARDUBLE from './BarChartARDUBLE';
import BarChartKRDUBLE from './BarChartKRDUBLE';
import BarChartENDUBLE from './BarChartENDUBLE';
import BarChartENEN from './BarChartENEN';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const [dbList, setDbList] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalData, setTotalData] = useState({ total: 0, delta: 0 });
  const [projectStats, setProjectStats] = useState({ total: 0, delta: 0 });

  // Базовый путь API (проксируется через Nginx)
  const API_BASE = "/api";

  // Уникальный ключ для сохранения выбора конкретного проекта
  const STORAGE_KEY = `selectedDb_${projectId}`;

  // Функция загрузки статистики по выбранной БД
  const loadTotalStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/total-stats`);
      const data = await res.json();
      setTotalData(data);
    } catch (err) {
      console.error("Ошибка загрузки статистики БД:", err);
    }
  };

  // Функция переключения БД (с сохранением в браузер)
  const handleDbChange = async (dbName) => {
    // Не ставим глобальный setLoading(true), чтобы графики обновлялись плавно внутри
    try {
      const response = await fetch(`${API_BASE}/switch-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName }),
      });

      if (!response.ok) throw new Error('Ошибка при переключении базы данных');

      // Сохраняем выбор в localStorage
      localStorage.setItem(STORAGE_KEY, dbName);
      setSelectedDb(dbName);
      
      // После успешного переключения обновляем локальную статистику
      await loadTotalStats();
    } catch (err) {
      console.error("Ошибка смены БД:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. Получаем список всех БД для этого проекта
        const res = await fetch(`${API_BASE}/databases/${projectId}`);
        const dbs = await res.json();
        setDbList(dbs);

        // 2. Получаем общую статистику по всему проекту (сумма всех его БД)
        try {
          const statsRes = await fetch(`${API_BASE}/project-total-collisions/${projectId}`);
          const statsData = await statsRes.json();
          setProjectStats({
            total: statsData.total || 0,
            delta: statsData.delta || 0
          });
        } catch (statsErr) {
          console.error("Ошибка при получении статистики объекта:", statsErr);
        }
        
        // 3. Определяем, какую БД активировать при загрузке
        if (dbs.length > 0) {
          const savedDb = localStorage.getItem(STORAGE_KEY);
          // Если сохраненная БД есть в списке этого проекта — берем её, иначе первую из списка
          const dbToActivate = (savedDb && dbs.includes(savedDb)) ? savedDb : dbs[0];
          
          await handleDbChange(dbToActivate);
        } else {
          setTotalData({ total: 0, delta: 0 });
        }
      } catch (err) {
        console.error("Ошибка инициализации проекта:", err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      init();
    }
  }, [projectId]);

  if (loading && dbList.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Загрузка объекта {projectId}...</Typography>
      </Box>
    );
  }

  return (
    <div className="app-container">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, mt: 2 }}>
        <Button component={Link} to="/"className="back-button">
          ← К выбору объектов
        </Button>
        <Typography variant="h4" className="details-title">
          Объект {projectId}
        </Typography>
      </Box>

      <div className="header-panel">
        <div className="db-stats-box">
          <Typography variant="subtitle1" >Коллизий по объекту:</Typography>
          <Typography variant="h4" className="db-stats-value">
            {projectStats.total} 
            <span className={`db-stats-delta ${projectStats.delta > 0 ? 'delta-plus' : 'delta-minus'}`}>
              ({projectStats.delta > 0 ? `+${projectStats.delta}` : projectStats.delta})
            </span>
          </Typography>
        </div>
        
        <div className="db-stats-box" style={{ marginRight: 'auto' }}>
          <Typography variant="subtitle1">Коллизий для БД:</Typography>
          <Typography variant="h4" className="db-stats-value">
            {totalData.total}
            <span className={`db-stats-delta ${totalData.delta > 0 ? 'delta-plus' : 'delta-minus'}`}>
              ({totalData.delta > 0 ? `+${totalData.delta}` : totalData.delta})
            </span>
          </Typography>
        </div>
        
        <DbSelector dbList={dbList} selectedDb={selectedDb} onSelect={handleDbChange} />
      </div>

      <table className="charts-table">
        <tbody>
          <tr>
            <td className="charts-column">
              <div className="chart-card">
                <h2>АР-АР</h2>
                <div className="chart-wrapper">
                  <BarChartARAR projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/arar`} className="details-button">Подробнее</Button>
              </div>
              
              <div className="chart-card">
                <h2>АР-ТХ</h2>
                <div className="chart-wrapper">
                  <BarChartARTH projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/arth`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>КР-КР</h2>
                <div className="chart-wrapper">
                  <BarChartKRKR projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/krkr`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>КР-ИС</h2>
                <div className="chart-wrapper">
                  <BarChartKREN projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/kren`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>ТХ-ИС</h2>
                <div className="chart-wrapper">
                  <BarChartTHEN projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/then`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>Дубляж АР</h2>
                <div className="chart-wrapper">
                  <BarChartARDUBLE projectId={projectId} currentDb={selectedDb} />
                </div>
              </div>

              <div className="chart-card">
                <h2>Дубляж ИС</h2>
                <div className="chart-wrapper">
                  <BarChartENDUBLE projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/enduble`} className="details-button">Подробнее</Button>
              </div>
            </td>

            <td className="charts-column">
              <div className="chart-card">
                <h2>АР-КР</h2>
                <div className="chart-wrapper">
                  <BarChartARKR projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/arkr`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>АР-ИС</h2>
                <div className="chart-wrapper">
                  <BarChartAREN projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/aren`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>КР-ТХ</h2>
                <div className="chart-wrapper">
                  <BarChartKRTH projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/krth`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>ИС-ИС</h2>
                <div className="chart-wrapper">
                  <BarChartENEN projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/enen`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>ТХ-ТХ</h2>
                <div className="chart-wrapper">
                  <BarChartTHTH projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/thth`} className="details-button">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>Дубляж КР</h2>
                <div className="chart-wrapper">
                  <BarChartKRDUBLE projectId={projectId} currentDb={selectedDb} />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ProjectDashboard;