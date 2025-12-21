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

function BarChartAREN({ data }) {
  const labels = data.map(row => new Date(row.UpdateDate).toLocaleDateString());
  const collisionsData = data.map(row => row.CollisionsAmount);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Сумма коллизий АР-ИС',
        data: collisionsData,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
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
          // label: context => `${context.dataset.label}: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Дата обновления' } },
      y: { title: { display: true, text: 'Коллизии' }, beginAtZero: true },
    },
  };

  return <Bar data={chartData} options={options} />;
}

export default BarChartAREN;
