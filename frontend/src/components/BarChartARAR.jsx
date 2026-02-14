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

// Принимаем projectId и currentDb (выбранная база в селекторе)
function BarChartARAR({ projectId, currentDb }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentDb) return;
      
      setLoading(true);
      try {
        // 1. Сначала убеждаемся, что сервер переключен на нужную БД
        await fetch('/api/switch-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dbName: currentDb }),
        });

        // 2. Загружаем данные истории коллизий
        const response = await fetch('/api/updates/arar');
        const data = await response.json();

        if (Array.isArray(data)) {
          const labels = data.map(row => new Date(row.UpdateDate).toLocaleDateString());
          const collisionsData = data.map(row => row.CollisionsAmount);

          setChartData({
            labels,
            datasets: [
              {
                label: 'Сумма коллизий АР-АР',
                data: collisionsData,
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderRadius: 4,
              },
            ],
          });
        }
      } catch (err) {
        console.error("Ошибка загрузки графика ARAR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDb, projectId]); // Перезагружаем при смене БД или проекта

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (!chartData || chartData.labels.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350, border: '1px dashed #ccc' }}>
        <Typography color="textSecondary">Нет данных для графика АР-АР</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 380 }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
}

export default BarChartARAR;