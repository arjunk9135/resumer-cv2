import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Candidate } from '@/lib/types';
import RejectDialog from './RejectDialog';
import { Download, MoreVertical, CheckCircle, PauseCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CandidateTableProps {
  onReject: (id: number, reason: string, notes?: string) => void;
}

const CandidateTable: React.FC<CandidateTableProps> = ({ onReject }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all_statuses');
  const [sortOption, setSortOption] = useState('scoreDesc');
  const [page, setPage] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  const pageSize = 10;

  const { data: candidatesData, isLoading, isError } = useQuery<{
    candidates: Candidate[],
    total: number
  }>({
    queryKey: ['/api/candidates', page, searchTerm, statusFilter, sortOption],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSort = (option: string) => {
    setSortOption(option);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

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

  const handleStatusUpdate = async (candidateId: number, newStatus: string) => {
    try {
      await apiRequest('PATCH', `/api/candidates/${candidateId}/status`, { status: newStatus });
      
      toast({
        title: "Status updated",
        description: `Candidate status changed to ${newStatus}`,
        variant: "default"
      });
      
      // Refetch candidates data
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update candidate status.",
        variant: "destructive"
      });
    }
  };

  const openRejectDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = (reason: string, notes?: string) => {
    if (selectedCandidate) {
      onReject(selectedCandidate.id, reason, notes);
    }
    setIsRejectDialogOpen(false);
    setSelectedCandidate(null);
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'For Interview':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const totalPages = candidatesData ? Math.ceil(candidatesData.total / pageSize) : 0;

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Candidate Results</h2>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Candidate Results</h2>
          <div className="text-center text-red-500 py-8">
            Error loading candidate data. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8" id="candidates-table">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Candidate Results</h2>
            <div className="mt-3 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search candidates..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_statuses">All Statuses</SelectItem>
                  <SelectItem value="For Interview">For Interview</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortOption} onValueChange={handleSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scoreDesc">Highest Score</SelectItem>
                  <SelectItem value="scoreAsc">Lowest Score</SelectItem>
                  <SelectItem value="nameAsc">Name A-Z</SelectItem>
                  <SelectItem value="nameDesc">Name Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Skills Match</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidatesData?.candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No candidates found. Upload resumes to see results here.
                  </TableCell>
                </TableRow>
              ) : (
                candidatesData?.candidates.map((candidate) => (
                  <TableRow key={candidate.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden text-center flex items-center justify-center">
                          <span className="text-gray-600 font-medium">{getInitials(candidate.name)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 font-medium">{candidate.score}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${
                            candidate.score >= 80 ? 'bg-primary' : 
                            candidate.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${candidate.score}%` }}
                        ></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {candidate.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {candidate.experience} years
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeStyles(candidate.status)}>
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownloadResume(candidate.id)}
                          title="Download Resume"
                        >
                          <Download className="h-4 w-4 text-primary" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(candidate.id, 'For Interview')}
                              className="cursor-pointer"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Mark for Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(candidate.id, 'On Hold')}
                              className="cursor-pointer"
                            >
                              <PauseCircle className="h-4 w-4 text-yellow-500 mr-2" />
                              Put On Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openRejectDialog(candidate)}
                              className="cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((page - 1) * pageSize) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * pageSize, candidatesData?.total || 0)}
                    </span>{' '}
                    of <span className="font-medium">{candidatesData?.total}</span> results
                  </p>
                </div>
                <Pagination>
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                      </PaginationItem>
                    )}
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber: number;
                      
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (page <= 3) {
                        pageNumber = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = page - 2 + i;
                      }
                      
                      if (pageNumber < 1 || pageNumber > totalPages) return null;
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            isActive={pageNumber === page}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(page + 1)} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <RejectDialog 
        isOpen={isRejectDialogOpen} 
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
};

export default CandidateTable;
