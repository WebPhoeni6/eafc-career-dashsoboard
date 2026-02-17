import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ChartSeries } from '../../services/analytics/charts';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  series: ChartSeries;
  title?: string;
  height?: number;
  stacked?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({ series, title, height = 200, stacked }) => {
  const colors = ['#22c55e', '#7c5cff', '#f59e0b', '#ef4444', '#06b6d4'];
  const data = {
    labels: series.labels,
    datasets: series.datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: (ds.color ?? colors[i % colors.length]) + 'cc',
      borderColor: ds.color ?? colors[i % colors.length],
      borderWidth: 1,
      borderRadius: 4,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: series.datasets.length > 1, labels: { color: '#9aa7bd', font: { size: 11 } } },
      title: title ? { display: true, text: title, color: '#9aa7bd', font: { size: 12 } } : { display: false },
      tooltip: { backgroundColor: 'rgba(12,18,32,0.95)', titleColor: '#e7eefc', bodyColor: '#9aa7bd' },
    },
    scales: {
      x: {
        stacked,
        ticks: { color: '#9aa7bd', font: { size: 10 }, maxTicksLimit: 10 },
        grid: { color: 'rgba(34,48,74,0.4)' },
      },
      y: {
        stacked,
        ticks: { color: '#9aa7bd', font: { size: 10 } },
        grid: { color: 'rgba(34,48,74,0.4)' },
      },
    },
  };

  return (
    <div style={{ height, position: 'relative' }}>
      <Bar data={data} options={options} />
    </div>
  );
};
