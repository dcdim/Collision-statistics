import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// ВАЖНО: Принимаем projectId и currentDb вместо data
function BarChartARTH({ projectId, currentDb }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Если база еще не выбрана, ничего не делаем
      if (!currentDb) return;
      
      setLoading(true);
      try {
        // Загружаем исторические данные именно для АР-ТХ
        const response = await fetch('/api/updates/arth');
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const labels = data.map(row => new Date(row.UpdateDate).toLocaleDateString());
          const collisionsData = data.map(row => row.CollisionsAmount);

          setChartData({
            labels,
            datasets: [
              {
                label: 'Сумма коллизий АР-ТХ',
                data: collisionsData,
                backgroundColor: 'rgba(75, 192, 192, 0.7)', // Другой цвет для отличия
                borderRadius: 4,
              },
            ],
          });
        } else {
          setChartData(null);
        }
      } catch (err) {
        console.error("Ошибка загрузки графика ARTH:", err);
        setChartData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDb, projectId]); 

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Дата обновления' } },
      y: { title: { display: true, text: 'Коллизии (шт.)' }, beginAtZero: true },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!chartData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, bgcolor: '#f9f9f9', borderRadius: 2 }}>
        <Typography variant="caption" color="textSecondary">Нет данных АР-ТХ</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 380 }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
}

export default BarChartARTH;