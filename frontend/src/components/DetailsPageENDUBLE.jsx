import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TableFooter, Paper, Typography, Button, Box, CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DbSelector from './DbSelector';

const DetailsPageENDUBLE = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Загрузка данных
  const loadData = () => {
    setLoading(true);
    fetch('/api/details/enduble')
      .then(res => res.json())
      .then(json => {
        // Фильтруем нулевые дубли и подготавливаем данные
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

  useEffect(() => {
    loadData();
  }, []);

  // Смена БД
  const handleDbChange = async (dbName) => {
    setLoading(true);
    try {
      await fetch('/api/switch-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName }),
      });
      loadData();
    } catch (err) {
      console.error("Ошибка при смене БД:", err);
      setLoading(false);
    }
  };

  // Расчет итоговой суммы
  const grandTotal = useMemo(() => {
    return data.reduce((sum, item) => sum + Number(item.CollisionsAmount), 0);
  }, [data]);

  return (
    <div className="details-page-container">
      {/* Верхняя панель управления */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          onClick={() => navigate(-1)} 
          variant="outlined" 
          className="back-button"
        >
          ← Назад
        </Button>
        <DbSelector onSelect={handleDbChange} />
      </Box>

      <Typography variant="h4" className="details-title">
        Детализация: Дубляж ИС
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
            {/* Шапка в темном стиле */}
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
                    {/* Убираем технический префикс */}
                    {item.Name.replace('000_Дубл_', '')}
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 4 }} className="font-weight-700">
                    {item.CollisionsAmount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            {/* Подвал с итогами */}
            <TableFooter className="table-footer-summary">
              <TableRow>
                <TableCell align="right" sx={{ pr: 1 }}>
                  <Typography className="total-label" variant="h6">
                    ИТОГО:
                  </Typography>
                </TableCell>
                <TableCell align="right">
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