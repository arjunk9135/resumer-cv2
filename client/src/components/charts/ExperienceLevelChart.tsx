import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ExperienceLevel } from '@/lib/types';

interface ExperienceLevelChartProps {
  experienceData: ExperienceLevel[];
}

// Use vibrant colors that stand out
const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B'];

const ExperienceLevelChart: React.FC<ExperienceLevelChartProps> = ({ experienceData }) => {
  const formattedData = [
    { name: 'Junior (0-2y)', value: experienceData.find(item => item.level === 'junior')?.count || 0 },
    { name: 'Mid (3-5y)', value: experienceData.find(item => item.level === 'mid')?.count || 0 },
    { name: 'Senior (6-9y)', value: experienceData.find(item => item.level === 'senior')?.count || 0 },
    { name: 'Expert (10y+)', value: experienceData.find(item => item.level === 'expert')?.count || 0 },
  ];

  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">Experience Level</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} candidates`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceLevelChart;
