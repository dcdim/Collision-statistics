import React, { useEffect, useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TableFooter, Paper, Typography, Button, Box, Collapse, IconButton, Chip, CircularProgress 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { useNavigate } from 'react-router-dom';
import DbSelector from './DbSelector';

// Цветовая палитра для систем
const systemPalette = {
  'ОВ': '#2196f3', 'ОТ': '#f44336', 'ТС': '#ff9800', 'ХС': '#00bcd4',
  'ИТП': '#673ab7', 'ВК': '#4caf50', 'В': '#8bc34a', 'К': '#795548',
  'ПТ': '#e91e63', 'ЭМ': '#fbc02d', 'СС': '#9c27b0', 'СПЗ': '#ff5722',
  'АК': '#607d8b', 'ГПТ': '#3f51b5'
};

// Хелпер для склонения слова "система"
const getPluralSystems = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'систем';
  if (lastDigit === 1) return 'система';
  if (lastDigit >= 2 && lastDigit <= 4) return 'системы';
  return 'систем';
};

// Хелпер для склонения слова "категория"
const getPluralCategory = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'категорий';
  if (lastDigit === 1) return 'категория';
  if (lastDigit >= 2 && lastDigit <= 4) return 'категории';
  return 'категорий';
};

function Row({ row, isOpen, onToggle }) {
  // 1. Сортировка деталей по системам (по алфавиту)
  const sortedDetails = React.useMemo(() => {
    return row.Details ? [...row.Details].sort((a, b) => 
      a.system_type.localeCompare(b.system_type)
    ) : [];
  }, [row.Details]);

  // 2. Расчет уникальных систем и общего кол-ва категорий
  const uniqueSystemsCount = new Set(sortedDetails.map(d => d.system_type)).size;
  const totalCategoriesCount = sortedDetails.length;
  const isSingle = totalCategoriesCount === 1;

  return (
    <React.Fragment>
      <TableRow 
        className={isSingle ? 'static-row' : `collapsible-row ${isOpen ? 'row-active' : ''}`}
        onClick={!isSingle ? onToggle : undefined}
        sx={{ cursor: isSingle ? 'default' : 'pointer' }}
      >
        <TableCell width="50px">
          {!isSingle && (
            <IconButton size="small" color={isOpen ? "primary" : "default"}>
              {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        
        {/* Столбец КР */}
        <TableCell width="35%" className="font-weight-600">
          {row.PrimaryElement}
        </TableCell>
        
        {/* Столбец Системы и элементы ИС (свернутое состояние) */}
        <TableCell width="45%">
          {isSingle ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={sortedDetails[0].system_type} 
                size="small" 
                sx={{ 
                  bgcolor: systemPalette[sortedDetails[0].system_type], 
                  color: 'white', 
                  fontWeight: 'bold', 
                  fontSize: '0.7rem', 
                  height: '20px' 
                }} 
              />
              {sortedDetails[0].category_part}
            </Box>
          ) : (
            !isOpen ? (
              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                {`${uniqueSystemsCount} ${getPluralSystems(uniqueSystemsCount)} `}
                <span style={{ color: '#9e9e9e', fontWeight: 400 }}>
                  {`(${totalCategoriesCount} ${getPluralCategory(totalCategoriesCount)})`}
                </span>
              </Typography>
            ) : null
          )}
        </TableCell>
        
        {/* Сумма коллизий */}
        <TableCell width="15%" align="right" className="font-weight-700">
          {row.GroupTotal}
        </TableCell>
      </TableRow>

      {/* Вложенная таблица (Развернутое состояние) */}
      {!isSingle && (
        <TableRow>
          <TableCell colSpan={4} sx={{ py: 0, px: 0 }}>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box className="details-expanded-box-active" sx={{ bgcolor: '#f8f9fa' }}>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableBody>
                    {sortedDetails.map((detail, idx) => (
                      <TableRow key={idx} className="inner-detail-row">
                        <TableCell width="50px" sx={{ border: 'none' }} />
                        <TableCell width="35%" sx={{ border: 'none', color: 'text.secondary', fontSize: '0.85rem' }}>
                          {detail.primary_part}
                        </TableCell>
                        <TableCell width="45%" sx={{ border: 'none' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={detail.system_type} 
                              size="small" 
                              sx={{ 
                                bgcolor: systemPalette[detail.system_type] || '#9e9e9e', 
                                color: 'white', 
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                height: '20px',
                                minWidth: '40px'
                              }} 
                            />
                            <Typography variant="body2">{detail.category_part}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell width="15%" align="right" sx={{ border: 'none', pr: 4, fontWeight: 600 }}>
                          {detail.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

const DetailsPageKREN = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRows, setOpenRows] = useState({});
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    fetch('/api/details/kren')
      .then(res => res.json())
      .then(json => {
        setData(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка загрузки АR-EN:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDbChange = async (dbName) => {
    try {
      await fetch('/api/switch-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName }),
      });
      setOpenRows({});
      loadData();
    } catch (err) {
      console.error("Ошибка при смене БД:", err);
    }
  };

  const grandTotal = data.reduce((sum, row) => sum + Number(row.GroupTotal), 0);

  return (
    <div className="details-page-container">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={() => navigate(-1)} variant="outlined" className="back-button">
            ← Назад
          </Button>
          {Object.values(openRows).some(v => v) && (
            <Button 
              onClick={() => setOpenRows({})} 
              variant="outlined" 
              className="back-button" 
              startIcon={<UnfoldLessIcon />}
            >
              Свернуть всё
            </Button>
          )}
        </Box>
        <DbSelector onSelect={handleDbChange} />
      </Box>

      <Typography variant="h4" className="details-title">
        Детализация коллизий: КР — Инженерные системы
      </Typography>

      {loading ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" color="textSecondary">Загрузка данных...</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead className="table-header-dark" sx={{ bgcolor: '#34495e' }}>
              <TableRow>
                <TableCell width="50px" />
                <TableCell width="35%" sx={{ color: 'white' }}>Основной элемент</TableCell>
                <TableCell width="45%" sx={{ color: 'white' }}>Проверка с категорией ИС</TableCell>
                <TableCell width="15%" align="right" sx={{ color: 'white' }}>Сумма коллизий</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <Row 
                  key={row.PrimaryElement} 
                  row={row} 
                  isOpen={!!openRows[row.PrimaryElement]}
                  onToggle={() => setOpenRows(prev => ({ 
                    ...prev, 
                    [row.PrimaryElement]: !prev[row.PrimaryElement] 
                  }))}
                />
              ))}
            </TableBody>
            <TableFooter className="table-footer-summary">
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell width="50px" />
                <TableCell colSpan={2} align="right" sx={{ pr: 2 }}>
                  <Typography className="total-label" variant="h6">ИТОГО:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography className="total-value" variant="h6">{grandTotal}</Typography>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default DetailsPageKREN;