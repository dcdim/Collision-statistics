import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TableFooter, Paper, Typography, Button, Box, Collapse, IconButton, Chip, CircularProgress 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { useNavigate, useParams } from 'react-router-dom';
import DbSelector from './DbSelector';

// Цветовая схема для чипов систем
const systemPalette = {
  'ОВ': '#2196f3', 'ОТ': '#f44336', 'ТС': '#ff9800', 'ХС': '#00bcd4',
  'ИТП': '#673ab7', 'ВК': '#4caf50', 'В': '#8bc34a', 'К': '#795548',
  'ПТ': '#e91e63', 'ЭМ': '#fbc02d', 'СС': '#9c27b0', 'СПЗ': '#ff5722',
  'АК': '#607d8b', 'ГПТ': '#3f51b5'
};

// Словарь для перевода кодов
const systemFullNames = {
  'ОВ': 'Вентиляция',
  'ОТ': 'Отопление',
  'ТС': 'Теплоснабжение',
  'ХС': 'Холодоснабжение',
  'ИТП': 'ИТП',
  'ВК': 'Водоснабжение и Канализация',
  'В': 'Водоснабжение',
  'К': 'Канализация',
  'ПТ': 'Пожаротушение',
  'ЭМ': 'Электроснабжение',
  'СС': 'Слаботочные сети',
  'СПЗ': 'Противопожарная защита',
  'АК': 'Автоматизация',
  'ГПТ': 'Газовое пожаротушение'
};

const getPluralSystems = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'систем';
  if (lastDigit === 1) return 'система';
  if (lastDigit >= 2 && lastDigit <= 4) return 'системы';
  return 'систем';
};

const getPluralCategory = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'категорий';
  if (lastDigit === 1) return 'категория';
  if (lastDigit >= 2 && lastDigit <= 4) return 'категории';
  return 'категорий';
};

function Row({ row, isOpen, onToggle }) {
  const sortedDetails = row.Details || [];
  const uniqueSystemsCount = new Set(sortedDetails.map(d => d.system_type)).size;
  const totalCategoriesCount = sortedDetails.length;
  const isSingle = totalCategoriesCount === 1;

  return (
    <React.Fragment>
      <TableRow 
        className={isSingle ? 'static-row' : `collapsible-row ${isOpen ? 'row-active' : ''}`}
        onClick={!isSingle ? onToggle : undefined}
      >
        <TableCell width="60px">
          {!isSingle && (
            <IconButton size="small" color={isOpen ? "primary" : "default"}>
              {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell width="35%" className="font-weight-600">
          {systemFullNames[row.PrimaryElement] || row.PrimaryElement}
        </TableCell>
        <TableCell width="45%">
          {isSingle ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={sortedDetails[0].system_type} 
                size="small" 
                sx={{ bgcolor: systemPalette[sortedDetails[0].system_type] || '#9e9e9e', color: 'white', fontWeight: 'bold' }} 
              />
              <Typography variant="body2">{sortedDetails[0].category_part}</Typography>
            </Box>
          ) : (
            !isOpen && (
              <Typography variant="body2">
                {`${uniqueSystemsCount} ${getPluralSystems(uniqueSystemsCount)} `}
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>
                  {`(${totalCategoriesCount} ${getPluralCategory(totalCategoriesCount)})`}
                </span>
              </Typography>
            )
          )}
        </TableCell>
        <TableCell width="15%" align="right" className="font-weight-700">{row.GroupTotal}</TableCell>
      </TableRow>

      {!isSingle && (
        <TableRow>
          <TableCell colSpan={4} sx={{ py: 0, px: 0 }}>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box className="details-expanded-box-active">
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableBody>
                    {sortedDetails.map((detail, idx) => (
                      <TableRow key={idx} className="inner-detail-row">
                        <TableCell width="60px" sx={{ border: 'none' }} />
                        <TableCell width="35%" sx={{ border: 'none' }}>
                          {systemFullNames[detail.primary_part] || detail.primary_part}
                        </TableCell>
                        <TableCell width="45%" sx={{ border: 'none' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={detail.system_type} 
                              size="small" 
                              sx={{ 
                                bgcolor: systemPalette[detail.system_type] || '#9e9e9e', 
                                color: 'white', fontWeight: 'bold', fontSize: '0.65rem',
                                height: '20px', minWidth: '40px'
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

const DetailsPageENEN = () => {
  const { projectId } = useParams();
  const [data, setData] = useState([]);
  const [dbList, setDbList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRows, setOpenRows] = useState({});
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    fetch('/api/details/enen')
      .then(res => res.json())
      .then(json => {
        setData(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки данных ИС-ИС:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        // 1. Получаем список БД именно для этого проекта
        const res = await fetch(`/api/databases/${projectId}`);
        const dbs = await res.json();
        setDbList(dbs);

        if (dbs.length > 0) {
          // 2. Инициализируем сессию сервера первой БД
          await fetch('/api/switch-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dbName: dbs[0] }),
          });
          // 3. Загружаем данные
          loadData();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Ошибка инициализации:", err);
        setLoading(false);
      }
    };

    if (projectId) initPage();
  }, [projectId]);

  const handleDbChange = async (dbName) => {
    setLoading(true);
    try {
      await fetch('/api/switch-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName }),
      });
      setOpenRows({});
      loadData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const nameA = systemFullNames[a.PrimaryElement] || a.PrimaryElement;
      const nameB = systemFullNames[b.PrimaryElement] || b.PrimaryElement;
      return nameA.localeCompare(nameB, 'ru');
    });
  }, [data]);

  const grandTotal = useMemo(() => {
    return data.reduce((sum, row) => sum + Number(row.GroupTotal), 0);
  }, [data]);

  return (
    <div className="details-page-container">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={() => navigate(-1)} variant="outlined" className="back-button">← Назад</Button>
          {Object.values(openRows).some(v => v) && (
            <Button 
              onClick={() => setOpenRows({})} 
              variant="outlined" 
              startIcon={<UnfoldLessIcon />}
              className="back-button"
            >
              Свернуть всё
            </Button>
          )}
        </Box>
        <DbSelector dbList={dbList} onSelect={handleDbChange} />
      </Box>

      <Typography variant="h4" className="details-title">
        Объект {projectId}: Детализация ИС-ИС
      </Typography>

      {loading ? (
        <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress size={45} /></Box>
      ) : data.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '12px' }}>
          <Typography variant="h6" color="text.secondary">
            Коллизии между инженерными системами не обнаружены
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead className="table-header-dark">
              <TableRow>
                <TableCell width="60px" />
                <TableCell width="35%">Ведущая система</TableCell>
                <TableCell width="45%">Пересечения (Системы и категории)</TableCell>
                <TableCell width="15%" align="right">Коллизии</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row) => (
                <Row 
                  key={row.PrimaryElement} 
                  row={row} 
                  isOpen={!!openRows[row.PrimaryElement]}
                  onToggle={() => setOpenRows(prev => ({ 
                    ...prev, [row.PrimaryElement]: !prev[row.PrimaryElement] 
                  }))}
                />
              ))}
            </TableBody>
            <TableFooter className="table-footer-summary">
              <TableRow>
                <TableCell width="60px" />
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

export default DetailsPageENEN;