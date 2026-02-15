import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TableFooter, Paper, Typography, Button, Box, Collapse, IconButton, CircularProgress 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { useNavigate, useParams } from 'react-router-dom';
import DbSelector from './DbSelector';

const getPluralCategory = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'категорий';
  if (lastDigit === 1) return 'категория';
  if (lastDigit >= 2 && lastDigit <= 4) return 'категории';
  return 'категорий';
};

function Row({ row, isOpen, onToggle }) {
  const validDetails = useMemo(() => 
    (row.Details || []).filter(d => d.amount > 0), 
    [row.Details]
  );
  
  const detailsCount = validDetails.length;
  if (detailsCount === 0) return null;

  const isSingle = detailsCount === 1;
  const singleDetail = isSingle ? validDetails[0] : null;

  return (
    <React.Fragment>
      <TableRow 
        className={isSingle ? 'static-row' : `collapsible-row ${isOpen ? 'row-active' : ''}`} 
        onClick={!isSingle ? onToggle : undefined}
      >
        <TableCell width="50px">
          {!isSingle && (
            <IconButton size="small" color={isOpen ? "primary" : "default"}>
              {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell width="35%" className="font-weight-600">{row.PrimaryElement}</TableCell>
        <TableCell width="45%">
          {isSingle ? (
            singleDetail.category_part
          ) : (
            !isOpen ? `${detailsCount} ${getPluralCategory(detailsCount)}` : ""
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
                    {validDetails.map((detail, idx) => (
                      <TableRow key={idx} className="inner-detail-row">
                        <TableCell width="50px" sx={{ border: 'none' }} />
                        <TableCell width="35%" sx={{ border: 'none' }}>{detail.primary_part}</TableCell>
                        <TableCell width="45%" sx={{ border: 'none' }}>{detail.category_part}</TableCell>
                        <TableCell width="15%" align="right" sx={{ border: 'none', pr: 4 }}>{detail.amount}</TableCell>
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

const DetailsPageARAR = () => {
  const { projectId } = useParams();
  const [data, setData] = useState([]);
  const [dbList, setDbList] = useState([]);
  const [selectedDb, setSelectedDb] = useState(''); // Для синхронизации селектора
  const [loading, setLoading] = useState(true);
  const [openRows, setOpenRows] = useState({}); 
  const navigate = useNavigate();

  const STORAGE_KEY = `selectedDb_${projectId}`;

  const loadData = () => {
    setLoading(true);
    fetch('/api/details/arar')
      .then(res => res.json())
      .then(json => {
        const filtered = Array.isArray(json) ? json.filter(r => Number(r.GroupTotal) > 0) : [];
        setData(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка загрузки ARAR:", err);
        setData([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/databases/${projectId}`);
        const dbs = await res.json();
        setDbList(dbs);

        if (dbs.length > 0) {
          // Восстанавливаем сохраненную БД из localStorage
          const savedDb = localStorage.getItem(STORAGE_KEY);
          const dbToActivate = (savedDb && dbs.includes(savedDb)) ? savedDb : dbs[0];
          
          setSelectedDb(dbToActivate);

          // Переключаем на бэкенде
          await fetch('/api/switch-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dbName: dbToActivate }),
          });
          
          loadData();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Ошибка инициализации деталей:", err);
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
      
      // Сохраняем выбор в localStorage
      localStorage.setItem(STORAGE_KEY, dbName);
      setSelectedDb(dbName);
      
      setOpenRows({});
      loadData();
    } catch (err) {
      console.error("Ошибка при смене БД:", err);
      setLoading(false);
    }
  };

  const grandTotal = useMemo(() => {
    return data.reduce((sum, row) => sum + Number(row.GroupTotal), 0);
  }, [data]);

  return (
    <div className="details-page-container">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={() => navigate(-1)} variant="outlined" className="back-button">← Назад</Button>
          {Object.values(openRows).some(v => v) && (
            <Button onClick={() => setOpenRows({})} variant="outlined" className="back-button" startIcon={<UnfoldLessIcon />}>
              Свернуть всё
            </Button>
          )}
        </Box>
        {/* Добавлен проп selectedDb для корректного отображения в селекторе */}
        <DbSelector dbList={dbList} selectedDb={selectedDb} onSelect={handleDbChange} />
      </Box>

      <Typography variant="h4" className="details-title">
        Объект {projectId}: Детализация АР-АР
      </Typography>
      
      {loading ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" color="textSecondary">Загрузка данных...</Typography>
        </Box>
      ) : data.length === 0 ? (
        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: '12px' }}>
          <Typography variant="h5" color="textSecondary" sx={{ fontWeight: 500 }}>
            Коллизий не обнаружено
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead className="table-header-dark">
              <TableRow>
                <TableCell width="50px" />
                <TableCell width="35%">Основной элемент</TableCell>
                <TableCell width="45%">Пересечения с категорией</TableCell>
                <TableCell width="15%" align="right">Сумма коллизий</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <Row 
                  key={row.PrimaryElement} 
                  row={row} 
                  isOpen={!!openRows[row.PrimaryElement]}
                  onToggle={() => setOpenRows(prev => ({ ...prev, [row.PrimaryElement]: !prev[row.PrimaryElement] }))}
                />
              ))}
            </TableBody>
            <TableFooter className="table-footer-summary">
              <TableRow>
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

export default DetailsPageARAR;