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

  const API_BASE = "/api";

  const loadTotalStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/total-stats`);
      const data = await res.json();
      setTotalData(data);
    } catch (err) {
      console.error("Ошибка загрузки общей статистики:", err);
    }
  };

  const handleDbChange = async (dbName) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/switch-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName }),
      });

      if (!response.ok) throw new Error('Ошибка при переключении базы данных');

      setSelectedDb(dbName);
      await loadTotalStats();
    } catch (err) {
      console.error("Ошибка смены БД:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/databases/${projectId}`);
        const dbs = await res.json();
        setDbList(dbs);

        try {
          const statsRes = await fetch(`${API_BASE}/project-total-collisions/${projectId}`);
          const statsData = await statsRes.json();
          
          setProjectStats({
            total: statsData.total || 0,
            delta: statsData.delta || 0
          });
        } catch (statsErr) {
          console.error("Ошибка при получении общей статистики объекта:", statsErr);
        }
        
        if (dbs.length > 0) {
          await handleDbChange(dbs[0]);
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
        <Button component={Link} to="/" variant="contained" color="inherit">
          ← К выбору объектов
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Объект {projectId}
        </Typography>
      </Box>

      <div className="header-panel">
        <div className="db-stats-box">
          <Typography variant="subtitle1" color="primary">Коллизий по объекту:</Typography>
          <Typography variant="h4" className="db-stats-value">
            {projectStats.total} 
            <span className={`db-stats-delta ${projectStats.delta > 0 ? 'delta-plus' : 'delta-minus'}`}>
              ({projectStats.delta > 0 ? `+${projectStats.delta}` : projectStats.delta})
            </span>
          </Typography>
        </div>
        
        <div className="db-stats-box" style={{ marginRight: 'auto' }}>
          <Typography variant="subtitle1" color="primary">Коллизий для БД:</Typography>
          <Typography variant="h4" className="db-stats-value">
            {totalData.total}
            <span className={`db-stats-delta ${totalData.delta > 0 ? 'delta-plus' : 'delta-minus'}`}>
              ({totalData.delta > 0 ? `+${totalData.delta}` : totalData.delta})
            </span>
          </Typography>
        </div>
        
        <DbSelector dbList={dbList} onSelect={handleDbChange} />
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
                <Button component={Link} to={`/project/${projectId}/details/arar`} variant="outlined" size="small">Подробнее</Button>
              </div>
              
              <div className="chart-card">
                <h2>АР-ТХ</h2>
                <div className="chart-wrapper">
                  <BarChartARTH projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/arth`} variant="outlined" size="small">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>КР-КР</h2>
                <div className="chart-wrapper">
                  <BarChartKRKR projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/krkr`} variant="outlined" size="small">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>КР-ИС</h2>
                <div className="chart-wrapper">
                  <BarChartKREN projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/kren`} variant="outlined" size="small">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>ТХ-ИС</h2>
                <div className="chart-wrapper">
                  <BarChartTHEN projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/then`} variant="outlined" size="small">Подробнее</Button>
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
                <Button component={Link} to={`/project/${projectId}/details/enduble`} variant="outlined" size="small">Подробнее</Button>
              </div>
            </td>

            <td className="charts-column">
              <div className="chart-card">
                <h2>АР-КР</h2>
                <div className="chart-wrapper">
                  <BarChartARKR projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/arkr`} variant="outlined" size="small">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>АР-ИС</h2>
                <div className="chart-wrapper">
                  <BarChartAREN projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/aren`} variant="outlined" size="small">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>КР-ТХ</h2>
                <div className="chart-wrapper">
                  <BarChartKRTH projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/krth`} variant="outlined" size="small">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>ИС-ИС</h2>
                <div className="chart-wrapper">
                  <BarChartENEN projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/enen`} variant="outlined" size="small">Подробнее</Button>
              </div>

              <div className="chart-card">
                <h2>ТХ-ТХ</h2>
                <div className="chart-wrapper">
                  <BarChartTHTH projectId={projectId} currentDb={selectedDb} />
                </div>
                <Button component={Link} to={`/project/${projectId}/details/thth`} variant="outlined" size="small">Подробнее</Button>
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