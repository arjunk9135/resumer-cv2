import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatusDistribution } from '@/lib/types';

interface StatusDistributionChartProps {
  statusData: StatusDistribution[];
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ statusData }) => {
  // Map status to colors
  const getBarColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'hsl(220, 14%, 51%)'; // Gray
      case 'For Interview':
        return 'hsl(142, 71%, 45%)'; // Green
      case 'On Hold':
        return 'hsl(45, 100%, 51%)'; // Yellow
      case 'Rejected':
        return 'hsl(0, 84%, 60%)'; // Red
      default:
        return 'hsl(220, 14%, 51%)';
    }
  };

  const sortedStatusData = [...statusData].sort((a, b) => b.count - a.count);

  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sortedStatusData}
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis 
                dataKey="status" 
                type="category" 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [`${value} candidates`, 'Count']}
                labelFormatter={(label) => `Status: ${label}`}
              />
              <Bar 
                dataKey="count" 
                radius={[0, 4, 4, 0]}
              >
                {sortedStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;
