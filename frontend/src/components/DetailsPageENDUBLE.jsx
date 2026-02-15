import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TableFooter, Paper, Typography, Button, Box, CircularProgress 
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import DbSelector from './DbSelector';

const DetailsPageENDUBLE = () => {
  const { projectId } = useParams();
  const [data, setData] = useState([]);
  const [dbList, setDbList] = useState([]);
  const [selectedDb, setSelectedDb] = useState(''); // Новое состояние для синхронизации
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Ключ для хранения выбора в рамках конкретного проекта
  const STORAGE_KEY = `selectedDb_${projectId}`;

  // Загрузка данных (текущее состояние из сессии сервера)
  const loadData = () => {
    setLoading(true);
    fetch('/api/details/enduble')
      .then(res => res.json())
      .then(json => {
        const filtered = Array.isArray(json) 
          ? json.filter(item => Number(item.CollisionsAmount) > 0) 
          : [];
        setData(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка загрузки данных Дубляж ИС:", err);
        setData([]);
        setLoading(false);
      });
  };

  // Инициализация страницы: загрузка списка БД и установка корректной базы
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        // 1. Получаем список БД именно для этого проекта
        const res = await fetch(`/api/databases/${projectId}`);
        const dbs = await res.json();
        setDbList(dbs);

        if (dbs.length > 0) {
          // 2. Пытаемся восстановить базу из localStorage, иначе берем первую
          const savedDb = localStorage.getItem(STORAGE_KEY);
          const dbToActivate = (savedDb && dbs.includes(savedDb)) ? savedDb : dbs[0];
          
          setSelectedDb(dbToActivate);

          // 3. Устанавливаем в сессию сервера выбранную БД
          await fetch('/api/switch-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dbName: dbToActivate }),
          });
          
          // 4. Загружаем данные из выбранной базы
          loadData();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Ошибка инициализации Дубляж ИС:", err);
        setLoading(false);
      }
    };

    if (projectId) initPage();
  }, [projectId]);

  // Смена БД вручную через селектор
  const handleDbChange = async (dbName) => {
    setLoading(true);
    try {
      await fetch('/api/switch-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName }),
      });
      
      // Сохраняем выбор пользователя в localStorage и обновляем состояние
      localStorage.setItem(STORAGE_KEY, dbName);
      setSelectedDb(dbName);
      
      loadData();
    } catch (err) {
      console.error("Ошибка при смене БД:", err);
      setLoading(false);
    }
  };

  const grandTotal = useMemo(() => {
    return data.reduce((sum, item) => sum + Number(item.CollisionsAmount), 0);
  }, [data]);

  return (
    <div className="details-page-container">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          onClick={() => navigate(-1)} 
          variant="outlined" 
          className="back-button"
        >
          ← Назад
        </Button>
        {/* Теперь передаем selectedDb, чтобы селектор отображал верное имя */}
        <DbSelector dbList={dbList} selectedDb={selectedDb} onSelect={handleDbChange} />
      </Box>

      <Typography variant="h4" className="details-title">
        Объект {projectId}: Детализация Дубляж ИС
      </Typography>

      {loading ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" color="textSecondary">Обновление данных...</Typography>
        </Box>
      ) : data.length === 0 ? (
        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: '12px' }}>
          <Typography variant="h5" color="textSecondary" sx={{ fontWeight: 500 }}>
            Дублей не обнаружено
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead className="table-header-dark">
              <TableRow>
                <TableCell width="70%" sx={{ pl: 4 }}>Наименование модели</TableCell>
                <TableCell width="30%" align="right" sx={{ pr: 4 }}>Кол-во дублей</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index} className="static-row">
                  <TableCell sx={{ pl: 4 }} className="font-weight-600">
                    {item.Name.replace('000_Дубл_', '')}
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 4 }} className="font-weight-700">
                    {item.CollisionsAmount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter className="table-footer-summary">
              <TableRow>
                <TableCell align="right" sx={{ pr: 1 }}>
                  <Typography className="total-label" variant="h6">
                    ИТОГО:
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ pr: 4 }}>
                  <Typography className="total-value" variant="h6">
                    {grandTotal}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default DetailsPageENDUBLE;