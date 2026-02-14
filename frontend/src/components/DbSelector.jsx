// import React, { useState, useEffect } from 'react';

// function DbSelector({ onSelect }) {
//   const [dbs, setDbs] = useState([]);
//   const [selected, setSelected] = useState('');

//   useEffect(() => {
//     fetch('/api/db-list')
//       .then(res => res.json())
//       .then(data => {
//         setDbs(data);
//         if (data.length > 0) setSelected(data[0]);
//       });
//   }, []);

//   const handleChange = async (e) => {
//     const dbName = e.target.value;
//     setSelected(dbName);
//     onSelect(dbName);
//   };

//   return (
//     <div style={{ marginBottom: 20 }}>
//       <label>Выберите базу данных: </label>
//       <select value={selected} onChange={handleChange}>
//         {dbs.map(db => (
//           <option key={db} value={db}>{db}</option>
//         ))}
//       </select>
//     </div>
//   );
// }

// export default DbSelector;

import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

/**
 * Компонент выбора базы данных (раздела) внутри проекта.
 * @param {Array} dbList - Список названий БД, полученный от родителя.
 * @param {Function} onSelect - Функция обратного вызова при смене БД.
 */
const DbSelector = ({ dbList, onSelect }) => {
  const [selectedDb, setSelectedDb] = useState('');

  // Синхронизируем внутреннее состояние, если список баз изменился (например, при смене проекта)
  useEffect(() => {
    if (dbList && dbList.length > 0) {
      setSelectedDb(dbList[0]); // По умолчанию выбираем первую базу
    } else {
      setSelectedDb('');
    }
  }, [dbList]);

  const handleChange = (event) => {
    const value = event.target.value;
    setSelectedDb(value);
    onSelect(value); // Передаем наверх в ProjectDashboard для загрузки данных
  };

  return (
    <Box sx={{ minWidth: 250 }}>
      <FormControl fullWidth variant="outlined" size="small">
        <InputLabel id="db-selector-label">База Данных</InputLabel>
        <Select
          labelId="db-selector-label"
          id="db-selector"
          value={selectedDb}
          label="База Данных"
          onChange={handleChange}
          sx={{ 
            borderRadius: 2,
            bgcolor: 'white',
            '& .MuiSelect-select': { fontWeight: 500 }
          }}
        >
          {dbList.length > 0 ? (
            dbList.map((dbName) => (
              <MenuItem key={dbName} value={dbName}>
                {/* Убираем префикс проекта для красоты, оставляем только имя раздела */}
                {dbName.includes('_DB_') ? dbName.split('_DB_')[1] : dbName}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled value="">
              Нет доступных баз
            </MenuItem>
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export default DbSelector;