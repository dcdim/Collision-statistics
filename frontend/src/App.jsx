import React, { useEffect, useState } from 'react';
import Dropdown from './components/Dropdown';
import BarChart from './components/BarChart';

function App() {
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/entries')
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        if (data.length > 0) setSelectedEntry(data[0].ID);
      });
  }, []);

  useEffect(() => {
    if (!selectedEntry) return;
    fetch(`http://localhost:3000/api/comparison/${selectedEntry}`)
      .then(res => res.json())
      .then(data => setChartData(data));
  }, [selectedEntry]);

  return (
    <div style={{ width: 800, margin: '0 auto', padding: 20 }}>
      <h1>График коллизий</h1>
      <Dropdown entries={entries} selected={selectedEntry} onChange={setSelectedEntry} />
      {chartData.length > 0 && <BarChart data={chartData} />}
    </div>
  );
}

export default App;
