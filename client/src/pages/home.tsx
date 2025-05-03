import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import FileUploader from '@/components/FileUploader';
import CandidateTable from '@/components/CandidateTable';
import Dashboard from '@/components/Dashboard';
import TopPicksSection from '@/components/TopPicksSection';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

const Home: React.FC = () => {
  const { toast } = useToast();
  const [dataUpdated, setDataUpdated] = useState(false);

  const handleUploadComplete = () => {
    setDataUpdated(true);
    toast({
      title: "Analysis complete",
      description: "Resume analysis has been completed successfully.",
      variant: "default"
    });
  };

  const handleRejectCandidate = async (id: number, reason: string, notes?: string) => {
    try {
      await apiRequest('PATCH', `/api/candidates/${id}/reject`, { reason, notes });
      
      toast({
        title: "Candidate rejected",
        description: "The candidate has been marked as rejected.",
        variant: "default"
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    } catch (error) {
      toast({
        title: "Rejection failed",
        description: "Failed to reject the candidate. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FileUploader onUploadComplete={handleUploadComplete} />
        <CandidateTable onReject={handleRejectCandidate} />
        <Dashboard />
        <TopPicksSection />
      </main>
    </div>
  );
};

export default Home;
