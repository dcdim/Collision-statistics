import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

// Импорт компонентов
import DbSelector from './components/DbSelector';
import BarChartARKR from './components/BarChartARKR';
import BarChartARAR from './components/BarChartARAR';
import BarChartARTH from './components/BarChartARTH';
import BarChartKRKR from './components/BarChartKRKR';
import BarChartKRTH from './components/BarChartKRTH';
import BarChartTHTH from './components/BarChartTHTH';
import BarChartAREN from './components/BarChartAREN';
import BarChartKREN from './components/BarChartKREN';
import BarChartTHEN from './components/BarChartTHEN';
import BarChartARDUBLE from './components/BarChartARDUBLE';
import BarChartKRDUBLE from './components/BarChartKRDUBLE';
import BarChartENDUBLE from './components/BarChartENDUBLE';
import BarChartENEN from './components/BarChartENEN';

// Страницы деталей
import DetailsPageARAR from './components/DetailsPageARAR';
import DetailsPageARKR from './components/DetailsPageARKR';
import DetailsPageARTH from './components/DetailsPageARTH';
import DetailsPageKRKR from './components/DetailsPageKRKR';
import DetailsPageKRTH from './components/DetailsPageKRTH';
import DetailsPageTHTH from './components/DetailsPageTHTH';
import DetailsPageAREN from './components/DetailsPageAREN';
import DetailsPageKREN from './components/DetailsPageKREN';
import DetailsPageTHEN from './components/DetailsPageTHEN';
import DetailsPageENEN from './components/DetailsPageENEN';
import DetailsPageENDUBLE from './components/DetailsPageENDUBLE';

function App() {
  const [totalData, setTotalData] = useState({ total: 0, delta: 0 });
  const [chartDataARKR, setChartDataARKR] = useState([]);
  const [chartDataARAR, setChartDataARAR] = useState([]);
  const [chartDataARTH, setChartDataARTH] = useState([]);
  const [chartDataKRKR, setChartDataKRKR] = useState([]);
  const [chartDataKRTH, setChartDataKRTH] = useState([]);
  const [chartDataTHTH, setChartDataTHTH] = useState([]);
  const [chartDataAREN, setChartDataAREN] = useState([]);
  const [chartDataKREN, setChartDataKREN] = useState([]);
  const [chartDataTHEN, setChartDataTHEN] = useState([]);
  const [chartDataARDUBLE, setChartDataARDUBLE] = useState([]);
  const [chartDataKRDUBLE, setChartDataKRDUBLE] = useState([]);
  const [chartDataENDUBLE, setChartDataENDUBLE] = useState([]);
  const [chartDataENEN, setChartDataENEN] = useState([]);

  const reloadAllData = () => {
    // Загрузка статистики
    fetch('/api/total-stats')
      .then(res => res.json())
      .then(data => setTotalData(data));

    // Загрузка графиков
    const endpoints = [
      ['', setChartDataARKR], ['arar', setChartDataARAR], ['arth', setChartDataARTH],
      ['krkr', setChartDataKRKR], ['krth', setChartDataKRTH], ['thth', setChartDataTHTH],
      ['aren', setChartDataAREN], ['kren', setChartDataKREN], ['then', setChartDataTHEN],
      ['arduble', setChartDataARDUBLE], ['krduble', setChartDataKRDUBLE],
      ['enduble', setChartDataENDUBLE], ['enen', setChartDataENEN]
    ];

    endpoints.forEach(([path, setter]) => {
      fetch(`/api/comparison${path ? '/' + path : ''}`)
        .then(res => res.json())
        .then(data => setter(data));
    });
  };

  useEffect(() => { reloadAllData(); }, []);

  const handleDbChange = async (dbName) => {
    await fetch('/api/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dbName }),
    });
    reloadAllData();
  };

  const renderDelta = (delta) => {
    if (delta === 0) return null;
    const isPositive = delta > 0;
    const deltaClass = isPositive ? 'delta-badge delta-plus' : 'delta-badge delta-minus';
    const sign = isPositive ? '+' : '';
    return <span className={deltaClass}>({sign}{delta})</span>;
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={
          <>
            <h1 className="app-title-main">Мониторинг коллизий</h1>
            
            <div className="header-panel">
              <Typography variant="h6" className="stats-container">
                <span className="stats-label">Всего коллизий по последней проверке:</span>
                <span className="stats-count">{totalData.total}</span>
                {renderDelta(totalData.delta)}
              </Typography>
              <DbSelector onSelect={handleDbChange} />
            </div>

            <table className="charts-table">
              <tbody>
                <tr>
                  <td className="charts-column">
                    <div className="chart-card">
                      <h2>АР-АР</h2>
                      <div className="chart-wrapper">
                        {chartDataARAR.length > 0 && <BarChartARAR data={chartDataARAR} />}
                      </div>
                      <Button component={Link} to="/details/arar" variant="outlined" size="small">Подробнее</Button>
                    </div>
                    
                    <div className="chart-card">
                      <h2>АР-ТХ</h2>
                      <div className="chart-wrapper">
                        {chartDataARTH.length > 0 && <BarChartARTH data={chartDataARTH} />}
                      </div>
                      <Button component={Link} to="/details/arth" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>КР-КР</h2>
                      <div className="chart-wrapper">
                        {chartDataKRKR.length > 0 && <BarChartKRKR data={chartDataKRKR} />}
                      </div>
                      <Button component={Link} to="/details/krkr" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>КР-ИС</h2>
                      <div className="chart-wrapper">
                        {chartDataKREN.length > 0 && <BarChartKREN data={chartDataKREN} />}
                      </div>
                      <Button component={Link} to="/details/kren" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>ТХ-ИС</h2>
                      <div className="chart-wrapper">
                        {chartDataTHEN.length > 0 && <BarChartTHEN data={chartDataTHEN} />}
                      </div>
                      <Button component={Link} to="/details/then" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>Дубляж АР</h2>
                      <div className="chart-wrapper">
                        {chartDataARDUBLE.length > 0 && <BarChartARDUBLE data={chartDataARDUBLE} />}
                      </div>
                      <div className="button-spacer"></div>
                    </div>

                    <div className="chart-card">
                      <h2>Дубляж ИС</h2>
                      <div className="chart-wrapper">
                        {chartDataENDUBLE.length > 0 && <BarChartENDUBLE data={chartDataENDUBLE} />}
                      </div>
                      <Button component={Link} to="/details/enduble" variant="outlined" size="small">Подробнее</Button>
                    </div>
                  </td>

                  <td className="charts-column">
                    <div className="chart-card">
                      <h2>АР-КР</h2>
                      <div className="chart-wrapper">
                        {chartDataARKR.length > 0 && <BarChartARKR data={chartDataARKR} />}
                      </div>
                      <Button component={Link} to="/details/arkr" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>АР-ИС</h2>
                      <div className="chart-wrapper">
                        {chartDataAREN.length > 0 && <BarChartAREN data={chartDataAREN} />}
                      </div>
                      <Button component={Link} to="/details/aren" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>КР-ТХ</h2>
                      <div className="chart-wrapper">
                        {chartDataKRTH.length > 0 && <BarChartKRTH data={chartDataKRTH} />}
                      </div>
                      <Button component={Link} to="/details/krth" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>ИС-ИС</h2>
                      <div className="chart-wrapper">
                        {chartDataENEN.length > 0 && <BarChartENEN data={chartDataENEN} />}
                      </div>
                      <Button component={Link} to="/details/enen" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>ТХ-ТХ</h2>
                      <div className="chart-wrapper">
                        {chartDataTHTH.length > 0 && <BarChartTHTH data={chartDataTHTH} />}
                      </div>
                      <Button component={Link} to="/details/thth" variant="outlined" size="small">Подробнее</Button>
                    </div>

                    <div className="chart-card">
                      <h2>Дубляж КР</h2>
                      <div className="chart-wrapper">
                        {chartDataKRDUBLE.length > 0 && <BarChartKRDUBLE data={chartDataKRDUBLE} />}
                      </div>
                      <div className="button-spacer"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        } />

        <Route path="/details/arar" element={<DetailsPageARAR />} />
        <Route path="/details/arkr" element={<DetailsPageARKR />} />
        <Route path="/details/arth" element={<DetailsPageARTH />} />
        <Route path="/details/krkr" element={<DetailsPageKRKR />} />
        <Route path="/details/krth" element={<DetailsPageKRTH />} />
        <Route path="/details/thth" element={<DetailsPageTHTH />} />
        <Route path="/details/aren" element={<DetailsPageAREN />} />
        <Route path="/details/kren" element={<DetailsPageKREN />} />
        <Route path="/details/then" element={<DetailsPageTHEN />} />
        <Route path="/details/enen" element={<DetailsPageENEN />} />
        <Route path="/details/enduble" element={<DetailsPageENDUBLE />} />
      </Routes>
    </div>
  );
}

export default App;