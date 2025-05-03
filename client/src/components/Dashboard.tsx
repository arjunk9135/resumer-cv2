import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SkillDistributionChart from './charts/SkillDistributionChart';
import ScoreDistributionChart from './charts/ScoreDistributionChart';
import ExperienceLevelChart from './charts/ExperienceLevelChart';
import StatusDistributionChart from './charts/StatusDistributionChart';
import { AnalyticsData } from '@/lib/types';

const Dashboard: React.FC = () => {
  const { data: analyticsData, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <CardHeader>
              <CardTitle className="h-6 bg-gray-200 animate-pulse rounded w-1/3"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !analyticsData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">There was an error loading the analytics data. Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <SkillDistributionChart skillsData={analyticsData.skillsDistribution} />
      <ScoreDistributionChart scoreData={analyticsData.scoreDistribution} totalCandidates={analyticsData.totalCandidates} />
      <ExperienceLevelChart experienceData={analyticsData.experienceLevels} />
      <StatusDistributionChart statusData={analyticsData.statusDistribution} />
    </div>
  );
};

export default Dashboard;
