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

// Принимаем контекст проекта и БД вместо массива данных
function BarChartAREN({ projectId, currentDb }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Не делаем запрос, пока не определена база данных
      if (!currentDb) return;
      
      setLoading(true);
      try {
        // Запрос истории коллизий АР-ИС
        const response = await fetch('/api/updates/aren');
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const labels = data.map(row => new Date(row.UpdateDate).toLocaleDateString());
          const collisionsData = data.map(row => row.CollisionsAmount);

          setChartData({
            labels,
            datasets: [
              {
                label: 'Сумма коллизий АР-ИС',
                data: collisionsData,
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderRadius: 4,
              },
            ],
          });
        } else {
          setChartData(null);
        }
      } catch (err) {
        console.error("Ошибка загрузки графика AREN:", err);
        setChartData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDb, projectId]); // Следим за сменой базы и проекта

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
        <CircularProgress size={24} sx={{ color: 'rgba(255, 99, 132, 1)' }} />
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
        bgcolor: '#fff5f5', 
        borderRadius: 2,
        border: '1px dashed #ffcdd2'
      }}>
        <Typography variant="caption" color="textSecondary">Нет данных АР-ИС</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 380 }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
}

export default BarChartAREN;