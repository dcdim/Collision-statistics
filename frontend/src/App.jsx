import React, { useEffect, useState, useRef } from 'react';
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

function App() {
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
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

  const fileInputRef = useRef(null);

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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

    fetch('/api/comparison')
      .then(res => res.json())
      .then(data => setChartDataARKR(data));

    fetch('/api/comparison/arar')
      .then(res => res.json())
      .then(data => setChartDataARAR(data));

    fetch('/api/comparison/arth')
      .then(res => res.json())
      .then(data => setChartDataARTH(data));

    fetch('/api/comparison/krkr')
      .then(res => res.json())
      .then(data => setChartDataKRKR(data));

    fetch('/api/comparison/krth')
      .then(res => res.json())
      .then(data => setChartDataKRTH(data));

    fetch('/api/comparison/thth')
      .then(res => res.json())
      .then(data => setChartDataTHTH(data));

    fetch('/api/comparison/aren')
      .then(res => res.json())
      .then(data => setChartDataAREN(data));

    fetch('/api/comparison/kren')
      .then(res => res.json())
      .then(data => setChartDataKREN(data));

    fetch('/api/comparison/then')
      .then(res => res.json())
      .then(data => setChartDataTHEN(data));

    fetch('/api/comparison/arduble')
      .then(res => res.json())
      .then(data => setChartDataARDUBLE(data));

    fetch('/api/comparison/krduble')
      .then(res => res.json())
      .then(data => setChartDataKRDUBLE(data));

    fetch('/api/comparison/enen')
      .then(res => res.json())
      .then(data => setChartDataENEN(data));
  };

  useEffect(() => {
    reloadAllData();
  }, []);


  return (
    <div style={{ width: 1800, margin: '0 auto', padding: 20 }}>
      <h1>Графики коллизий</h1>
      <DbSelector onSelect={handleDbChange} />
      <table style={{ 
        width: '100%', 
        borderSpacing: '20px', 
        borderCollapse: 'separate',
        tableLayout: 'fixed'
      }}>
        <tbody>
          <tr>
            {/* ЯЧЕЙКА 1: Левый столбец */}
            <td style={{ 
              width: '800px', 
              height: '400px', 
              verticalAlign: 'top',
              padding: '15px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9'
            }}>
              {/* Секция 1 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  АР-АР
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataARAR.length > 0 && <BarChartARAR data={chartDataARAR} />}
                </div>
              </div>
              
              {/* Секция 2 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  АР-ТХ
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataARTH.length > 0 && <BarChartARTH data={chartDataARTH} />}
                </div>
              </div>
              
              {/* Секция 3 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  КР-КР
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataKRKR.length > 0 && <BarChartKRKR data={chartDataKRKR} />}
                </div>
              </div>
              
              {/* Секция 4 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  КР-ИС
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataKREN.length > 0 && <BarChartKREN data={chartDataKREN} />}
                </div>
              </div>
              
              {/* Секция 5 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  ИС-ТХ
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataTHEN.length > 0 && <BarChartTHEN data={chartDataTHEN} />}
                </div>
              </div>
              
              {/* Секция 6 */}
              <div style={{ 
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  Дубляж АР
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataARDUBLE.length > 0 && <BarChartARDUBLE data={chartDataARDUBLE} />}
                </div>
              </div>
            </td>
            
            {/* ЯЧЕЙКА 2: Правый столбец */}
            <td style={{ 
              width: '800px', 
              height: '400px', 
              verticalAlign: 'top',
              padding: '15px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9'
            }}>
              {/* Секция 7 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  АР-КР
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataARKR.length > 0 && <BarChartARKR data={chartDataARKR} />}
                </div>
              </div>
              
              {/* Секция 8 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  АР-ИС
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataAREN.length > 0 && <BarChartAREN data={chartDataAREN} />}
                </div>
              </div>
              
              {/* Секция 9 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  КР-ТХ
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataKRTH.length > 0 && <BarChartKRTH data={chartDataKRTH} />}
                </div>
              </div>
              
              {/* Секция 10 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  ИС-ИС
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataENEN.length > 0 && <BarChartENEN data={chartDataENEN} />}
                </div>
              </div>
              
              {/* Секция 11 */}
              <div style={{ 
                marginBottom: '25px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  ТХ-ТХ
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataTHTH.length > 0 && <BarChartTHTH data={chartDataTHTH} />}
                </div>
              </div>
              
              {/* Секция 12 */}
              <div style={{ 
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  Дубляж КР
                </h2>
                <div style={{ minHeight: '150px' }}>
                  {chartDataKRDUBLE.length > 0 && <BarChartKRDUBLE data={chartDataKRDUBLE} />}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default App;
