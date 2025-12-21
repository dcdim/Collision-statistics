import React, { useState, useEffect } from 'react';

function DbSelector({ onSelect }) {
  const [dbs, setDbs] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    fetch('/api/db-list')
      .then(res => res.json())
      .then(data => {
        setDbs(data);
        if (data.length > 0) setSelected(data[0]);
      });
  }, []);

  const handleChange = async (e) => {
    const dbName = e.target.value;
    setSelected(dbName);
    onSelect(dbName);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label>Выберите базу данных: </label>
      <select value={selected} onChange={handleChange}>
        {dbs.map(db => (
          <option key={db} value={db}>{db}</option>
        ))}
      </select>
    </div>
  );
}

export default DbSelector;
