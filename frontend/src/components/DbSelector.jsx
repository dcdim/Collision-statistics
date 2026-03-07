import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

/**
 * Компонент выбора базы данных (раздела) внутри проекта.
 * @param {Array} dbList - Список названий БД от родителя.
 * @param {String} selectedDb - Текущая активная БД (из родительского стейта/localStorage).
 * @param {Function} onSelect - Функция при смене БД.
 */
const DbSelector = ({ dbList, selectedDb, onSelect }) => {

  const handleChange = (event) => {
    const value = event.target.value;
    // Мы не меняем локальный стейт, а сразу отправляем значение родителю
    onSelect(value); 
  };

  return (
    <Box sx={{ minWidth: 250 }}>
      <FormControl fullWidth variant="outlined" size="small">
        <InputLabel id="db-selector-label">База Данных</InputLabel>
        <Select
          labelId="db-selector-label"
          id="db-selector"
          // Берем значение из пропсов. Если оно пустое — ставим пустую строку
          value={selectedDb || ''} 
          label="База Данных"
          onChange={handleChange}
          sx={{ 
            borderRadius: 2,
            bgcolor: 'white',
            '& .MuiSelect-select': { fontWeight: 500 }
          }}
        >
          {dbList && dbList.length > 0 ? (
            dbList.map((dbName) => (
              <MenuItem key={dbName} value={dbName}>
                {/* Убираем префикс проекта для красоты */}
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