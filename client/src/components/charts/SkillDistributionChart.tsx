import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SkillDistribution } from '@/lib/types';

interface SkillDistributionChartProps {
  skillsData: SkillDistribution[];
}

const SkillDistributionChart: React.FC<SkillDistributionChartProps> = ({ skillsData }) => {
  // Sort skills by count in descending order
  const sortedSkills = [...skillsData].sort((a, b) => b.count - a.count).slice(0, 10);
  
  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">Skill Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sortedSkills}
              margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip
                formatter={(value) => [`${value} candidates`, 'Count']}
                labelFormatter={(label) => `Skill: ${label}`}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {sortedSkills.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="hsl(var(--chart-1))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillDistributionChart;
