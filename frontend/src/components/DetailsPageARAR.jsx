import React, { useEffect, useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TableFooter, Paper, Typography, Button, Box, Collapse, IconButton 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useNavigate } from 'react-router-dom';

/**
 * Вспомогательный компонент для раскрывающейся строки
 */
function Row({ row }) {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow className="collapsible-row" onClick={() => setOpen(!open)}>
        <TableCell width="50">
          <IconButton size="small">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {row.PrimaryElement}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="textSecondary">
            {open ? 'Список развернут' : row.SubElementsCount}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {row.GroupTotal}
          </Typography>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell sx={{ py: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box className="details-expanded-box">
              <div className="details-subtitle">Состав коллизий группы</div>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Тип проверки</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Кол-во</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.Details.map((detail, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{detail.full_name}</TableCell>
                      <TableCell align="right">{detail.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

/**
 * Основной компонент страницы
 */
const DetailsPageARAR = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/details/arar')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const grandTotal = data.reduce((sum, row) => sum + Number(row.GroupTotal), 0);

  if (loading) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">Загрузка детальной статистики...</Typography>
      </Box>
    );
  }

  return (
    <div className="details-page-container">
      <Button 
        onClick={() => navigate(-1)} 
        variant="outlined" 
        className="back-button"
      >
        ← Назад к дашборду
      </Button>

      <Typography variant="h4" className="details-title">
        Детализация коллизий: АР-АР
      </Typography>
      
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px' }}>
        <Table aria-label="AR-AR details table">
          <TableHead className="table-header-dark">
            <TableRow>
              <TableCell />
              <TableCell>Основной элемент</TableCell>
              <TableCell>Категория элементов</TableCell>
              <TableCell align="right">Коллизии (ед.)</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {data.length > 0 ? (
              data.map((row) => (
                <Row key={row.PrimaryElement} row={row} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                  Данные по фильтру АР-АР не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter className="table-footer-summary">
            <TableRow>
              <TableCell />
              <TableCell colSpan={2} align="right">
                <Typography className="total-label" variant="h6">ИТОГО ПО РАЗДЕЛУ:</Typography>
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
    </div>
  );
};

export default DetailsPageARAR;