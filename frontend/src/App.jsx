import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import Dropdown from './components/Dropdown';
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
import BarChartENEN from './components/BarChartENEN';
import DetailsPageARAR from './components/DetailsPageARAR';
import DetailsPageARKR from './components/DetailsPageARKR';
import Button from '@mui/material/Button';

function App() {
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Состояния для данных графиков
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
  const [chartDataENEN, setChartDataENEN] = useState([]);

  const handleDbChange = async (dbName) => {
    await fetch('/api/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dbName }),
    });
    reloadAllData();
  };

  const reloadAllData = () => {
    fetch('/api/entries')
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        if (data.length > 0) setSelectedEntry(data[0].ID);
      });

    const endpoints = [
      ['', setChartDataARKR],
      ['arar', setChartDataARAR],
      ['arth', setChartDataARTH],
      ['krkr', setChartDataKRKR],
      ['krth', setChartDataKRTH],
      ['thth', setChartDataTHTH],
      ['aren', setChartDataAREN],
      ['kren', setChartDataKREN],
      ['then', setChartDataTHEN],
      ['arduble', setChartDataARDUBLE],
      ['krduble', setChartDataKRDUBLE],
      ['enen', setChartDataENEN]
    ];

    endpoints.forEach(([path, setter]) => {
      fetch(`/api/comparison${path ? '/' + path : ''}`)
        .then(res => res.json())
        .then(data => setter(data));
    });
  };

  useEffect(() => {
    reloadAllData();
  }, []);

  return (
    <div className="app-container">
      <Routes>
        {/* ГЛАВНАЯ СТРАНИЦА С ГРАФИКАМИ */}
        <Route path="/" element={
          <>
            <h1 className="app-title">Графики коллизий</h1>
            <DbSelector onSelect={handleDbChange} />
            
            <table className="charts-table">
              <tbody>
                <tr>
                  {/* Левая колонка */}
                  <td className="charts-column">
                    <div className="chart-card">
                      <h2>АР-АР</h2>
                      <div className="chart-wrapper">
                        {chartDataARAR.length > 0 && <BarChartARAR data={chartDataARAR} />}
                      </div>
                      <Button 
                        component={Link} 
                        to="/details/arar" 
                        variant="outlined" 
                        size="small"
                        sx={{ mt: 2 }}
                      >
                        Подробнее
                      </Button>
                    </div>
                    
                    <div className="chart-card">
                      <h2>АР-ТХ</h2>
                      <div className="chart-wrapper">
                        {chartDataARTH.length > 0 && <BarChartARTH data={chartDataARTH} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h2>КР-КР</h2>
                      <div className="chart-wrapper">
                        {chartDataKRKR.length > 0 && <BarChartKRKR data={chartDataKRKR} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h2>КР-ИС</h2>
                      <div className="chart-wrapper">
                        {chartDataKREN.length > 0 && <BarChartKREN data={chartDataKREN} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h2>ИС-ТХ</h2>
                      <div className="chart-wrapper">
                        {chartDataTHEN.length > 0 && <BarChartTHEN data={chartDataTHEN} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h2>Дубляж АР</h2>
                      <div className="chart-wrapper">
                        {chartDataARDUBLE.length > 0 && <BarChartARDUBLE data={chartDataARDUBLE} />}
                      </div>
                    </div>
                  </td>

                  {/* Правая колонка */}
                  <td className="charts-column">
                    <div className="chart-card">
                      <h2>АР-КР</h2>
                      <div className="chart-wrapper">
                        {chartDataARKR.length > 0 && <BarChartARKR data={chartDataARKR} />}
                      </div>
                      <Button 
                        component={Link} 
                        to="/details/arkr" 
                        variant="outlined" 
                        size="small"
                        sx={{ mt: 2 }}
                      >
                        Подробнее
                      </Button>
                    </div>

                    <div className="chart-card">
                      <h2>АР-ИС</h2>
                      <div className="chart-wrapper">
                        {chartDataAREN.length > 0 && <BarChartAREN data={chartDataAREN} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h2>КР-ТХ</h2>
                      <div className="chart-wrapper">
                        {chartDataKRTH.length > 0 && <BarChartKRTH data={chartDataKRTH} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h2>ИС-ИС</h2>
                      <div className="chart-wrapper">
                        {chartDataENEN.length > 0 && <BarChartENEN data={chartDataENEN} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h2>ТХ-ТХ</h2>
                      <div className="chart-wrapper">
                        {chartDataTHTH.length > 0 && <BarChartTHTH data={chartDataTHTH} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h2>Дубляж КР</h2>
                      <div className="chart-wrapper">
                        {chartDataKRDUBLE.length > 0 && <BarChartKRDUBLE data={chartDataKRDUBLE} />}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        } />

        {/* СТРАНИЦА ПОДРОБНОСТЕЙ */}
        <Route path="/details/arar" element={<DetailsPageARAR />} />
        <Route path="/details/arkr" element={<DetailsPageARKR />} />
      </Routes>
    </div>
  );
}

export default App;