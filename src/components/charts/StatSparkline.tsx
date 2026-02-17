import React from 'react';
import { Line } from 'react-chartjs-2';

interface StatSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const StatSparkline: React.FC<StatSparklineProps> = ({ data, color = '#7c5cff', height = 40 }) => {
  const chartData = {
    labels: data.map((_, i) => String(i + 1)),
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: color + '22',
      pointRadius: 0,
      tension: 0.4,
      fill: true,
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    animation: false as const,
  };

  return (
    <div style={{ height, width: '80px', display: 'inline-block' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
