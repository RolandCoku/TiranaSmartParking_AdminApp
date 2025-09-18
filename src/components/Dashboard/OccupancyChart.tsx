import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { OccupancyData } from '../../types';

interface OccupancyChartProps {
  data: OccupancyData[];
  className?: string;
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({ data, className }) => {
  const chartData = data.map(item => ({
    name: item.lotName,
    occupancy: item.occupancyRate,
    occupied: item.occupiedSpaces,
    available: item.availableSpaces,
    total: item.totalSpaces,
  }));

  const getBarColor = (occupancy: number) => {
    if (occupancy >= 90) return '#ef4444'; // red
    if (occupancy >= 70) return '#f59e0b'; // yellow
    if (occupancy >= 50) return '#3b82f6'; // blue
    return '#10b981'; // green
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Occupancy: <span className="font-medium">{data.occupancy}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Occupied: <span className="font-medium">{data.occupied}</span> / {data.total}
          </p>
          <p className="text-sm text-gray-600">
            Available: <span className="font-medium">{data.available}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Parking Occupancy by Lot</h3>
        <p className="text-sm text-gray-600">Current occupancy rates across all parking lots</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancy)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-gray-600">Low (&lt;50%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="text-gray-600">Medium (50-70%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
          <span className="text-gray-600">High (70-90%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-gray-600">Critical (&gt;90%)</span>
        </div>
      </div>
    </div>
  );
};

export default OccupancyChart;
