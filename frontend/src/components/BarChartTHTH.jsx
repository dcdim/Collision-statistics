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

// Принимаем контекст из ProjectDashboard
function BarChartTHTH({ projectId, currentDb }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Пока база данных не инициализирована в родителе, ничего не запрашиваем
      if (!currentDb) return;
      
      setLoading(true);
      try {
        // Запрос истории коллизий ТХ-ТХ
        const response = await fetch('/api/updates/thth');
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const labels = data.map(row => new Date(row.UpdateDate).toLocaleDateString());
          const collisionsData = data.map(row => row.CollisionsAmount);

          setChartData({
            labels,
            datasets: [
              {
                label: 'Сумма коллизий ТХ-ТХ',
                data: collisionsData,
                backgroundColor: 'rgba(255, 159, 64, 0.7)',
                borderRadius: 4,
              },
            ],
          });
        } else {
          setChartData(null);
        }
      } catch (err) {
        console.error("Ошибка загрузки графика THTH:", err);
        setChartData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDb, projectId]); // Перезагрузка при смене базы или проекта

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
        <CircularProgress size={24} sx={{ color: 'rgba(255, 159, 64, 1)' }} />
      </Box>
    );
  }

  if (!chartData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 200, 
        bgcolor: '#fffbf0', 
        borderRadius: 2,
        border: '1px dashed #ffe0b2'
      }}>
        <Typography variant="caption" color="textSecondary">Нет данных ТХ-ТХ</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 380 }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
}

export default BarChartTHTH;