import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ScoreDistribution } from '@/lib/types';

interface ScoreDistributionChartProps {
  scoreData: ScoreDistribution[];
  totalCandidates: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ scoreData, totalCandidates }) => {
  const formattedData = [
    { name: 'Excellent (90%+)', value: scoreData.find(item => item.range === 'excellent')?.count || 0 },
    { name: 'Good (70-89%)', value: scoreData.find(item => item.range === 'good')?.count || 0 },
    { name: 'Average (50-69%)', value: scoreData.find(item => item.range === 'average')?.count || 0 },
    { name: 'Poor (<50%)', value: scoreData.find(item => item.range === 'poor')?.count || 0 },
  ];

  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} candidates`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <div className="text-3xl font-bold text-gray-700">{totalCandidates}</div>
            <div className="text-sm text-gray-500">Candidates</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreDistributionChart;
