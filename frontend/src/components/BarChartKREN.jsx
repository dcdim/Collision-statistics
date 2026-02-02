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

function BarChartKREN({ data }) {
  const labels = data.map(row => new Date(row.UpdateDate).toLocaleDateString());
  const collisionsData = data.map(row => row.CollisionsAmount);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Сумма коллизий КР-ИС',
        data: collisionsData,
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
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
      y: { title: { display: true, text: 'Коллизии (шт.)' }, beginAtZero: true },
    },
  };

  return <Bar data={chartData} options={options} />;
}

export default BarChartKREN;
