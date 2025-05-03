import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TopCandidate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

const TopPicksSection: React.FC = () => {
  const { toast } = useToast();
  const { data: topCandidates, isLoading, isError } = useQuery<TopCandidate[]>({
    queryKey: ['/api/candidates/top-picks'],
  });

  const handleDownloadResume = async (id: number) => {
    try {
      const response = await fetch(`/api/candidates/${id}/resume`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download resume');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download this resume.",
        variant: "destructive"
      });
    }
  };

  const handleInterviewNow = async (id: number) => {
    try {
      await apiRequest('PATCH', `/api/candidates/${id}/status`, { status: 'For Interview' });
      
      toast({
        title: "Candidate marked for interview",
        description: "The candidate has been marked for interview.",
        variant: "default"
      });
      
      // Refetch candidates data
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    } catch (error) {
      toast({
        title: "Operation failed",
        description: "Failed to mark candidate for interview.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Top Picks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="h-6 w-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                    <div className="flex flex-wrap gap-1">
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !topCandidates) {
    return (
      <div className="mb-8">
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Top Picks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-500 py-4">
              Error loading top candidates. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (topCandidates.length === 0) {
    return (
      <div className="mb-8">
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Top Picks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-4">
              No top candidates available yet. Upload more resumes to see top picks.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <div className="mb-8">
      <Card className="bg-white rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Top Picks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCandidates.map((candidate) => (
              <div key={candidate.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden text-center flex items-center justify-center mr-3">
                      <span className="text-gray-600 font-medium">{getInitials(candidate.name)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                      <div className="text-sm text-gray-500">{candidate.experience} years experience</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-bold text-primary">{candidate.score}%</div>
                    <div className="text-xs text-gray-500">match</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Key Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 mb-3">
                  <div className="font-medium mb-1">Highlights</div>
                  <ul className="list-disc list-inside text-gray-600">
                    {candidate.highlights.map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-blue-800 text-sm font-medium flex items-center"
                    onClick={() => handleDownloadResume(candidate.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-primary hover:bg-blue-600 text-white font-medium transition-colors"
                    onClick={() => handleInterviewNow(candidate.id)}
                  >
                    Interview Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopPicksSection;
