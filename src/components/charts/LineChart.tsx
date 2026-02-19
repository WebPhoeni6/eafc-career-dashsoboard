import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartSeries } from '../../services/analytics/charts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface LineChartProps {
  series: ChartSeries;
  title?: string;
  height?: number;
  yMin?: number;
  yMax?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ series, title, height = 200, yMin, yMax }) => {
  const data = {
    labels: series.labels,
    datasets: series.datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color ?? '#7c5cff',
      backgroundColor: (ds.color ?? '#7c5cff') + '22',
      pointBackgroundColor: ds.color ?? '#7c5cff',
      pointRadius: series.labels.length > 20 ? 1.5 : 3,
      tension: 0.35,
      fill: series.datasets.length === 1,
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
      x: { ticks: { color: '#9aa7bd', font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: 'rgba(34,48,74,0.4)' } },
      y: {
        ticks: { color: '#9aa7bd', font: { size: 10 } },
        grid: { color: 'rgba(34,48,74,0.4)' },
        ...(yMin !== undefined ? { min: yMin } : {}),
        ...(yMax !== undefined ? { max: yMax } : {}),
      },
    },
  };

  return (
    <div style={{ height, position: 'relative' }}>
      <Line data={data} options={options} />
    </div>
  );
};
