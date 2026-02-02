import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function BarChartENDUBLE({ data }) {
  const labels = data.map(row => new Date(row.UpdateDate).toLocaleDateString());
  const collisionsData = data.map(row => row.CollisionsAmount);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Сумма дублей АР',
        data: collisionsData,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };

  const options = {
    responsive: true,
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

  return <Bar data={chartData} options={options} />;
}

export default BarChartENDUBLE;
