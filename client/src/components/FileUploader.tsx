import React, { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface FileUploaderProps {
  onUploadComplete: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filesProcessed, setFilesProcessed] = useState({ current: 0, total: 0 });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    if (files.length > 300) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 300 files at once.",
        variant: "destructive"
      });
      return;
    }
    
    handleFiles(files);
  }, [toast]);

  const browseFiles = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    if (files.length > 300) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 300 files at once.",
        variant: "destructive"
      });
      return;
    }
    
    handleFiles(files);
  }, [toast]);

  const handleFiles = async (files: File[]) => {
    const validFileTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/msword'
    ];
    
    const validFiles = files.filter(file => validFileTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file format",
        description: `${files.length - validFiles.length} files were rejected. Only PDF, DOCX, and DOC formats are supported.`,
        variant: "destructive"
      });
      
      if (validFiles.length === 0) return;
    }
    
    // Reset states
    setIsUploading(true);
    setUploadProgress(0);
    setFilesProcessed({ current: 0, total: validFiles.length });
    setUploadSuccess(false);
    
    // Create FormData
    const formData = new FormData();
    validFiles.forEach(file => {
      formData.append('resumes', file);
    });
    
    try {
      const uploadResponse = await apiRequest('POST', '/api/resumes/upload', formData);
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      // After upload is complete, check the analysis status
      let processed = 0;
      const checkStatus = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/resumes/status');
          const statusData = await statusResponse.json();
          
          processed = statusData.processed;
          const percent = Math.round((processed / validFiles.length) * 100);
          
          setUploadProgress(percent);
          setFilesProcessed({ current: processed, total: validFiles.length });
          
          if (processed >= validFiles.length || statusData.status === 'completed') {
            clearInterval(checkStatus);
            
            setUploadSuccess(true);
            setSuccessCount(processed);
            setTimeout(() => {
              setIsUploading(false);
              queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
              queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
              onUploadComplete();
            }, 3000);
          }
        } catch (error) {
          clearInterval(checkStatus);
          toast({
            title: "Error checking status",
            description: "Failed to check processing status.",
            variant: "destructive"
          });
        }
      }, 1000);
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cancelUpload = useCallback(() => {
    // In a real implementation, this would send a cancel request to the backend
    setIsUploading(false);
    
    toast({
      title: "Upload cancelled",
      description: "Resume upload has been cancelled.",
      variant: "default"
    });
  }, [toast]);

  if (isUploading) {
    return (
      <div className="mb-8" id="upload-section">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Resumes</h2>
          
          {!uploadSuccess ? (
            <div id="upload-progress">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading and analyzing resumes...</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="mt-3 flex justify-between text-sm text-gray-500">
                <span>{filesProcessed.current}/{filesProcessed.total} files processed</span>
                <button 
                  className="text-red-500 hover:text-red-700"
                  onClick={cancelUpload}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div id="upload-success">
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      {successCount} resumes successfully uploaded and analyzed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8" id="upload-section">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Resumes</h2>
        
        <div 
          id="upload-zone" 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            isDragging ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
          } transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={browseFiles}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 mb-2">Drag and drop resume files here or click to browse</p>
          <p className="text-gray-500 text-sm">Supported formats: PDF, DOCX, DOC (100-300 files)</p>
          <input 
            type="file" 
            id="resume-upload" 
            className="hidden" 
            multiple 
            accept=".pdf,.docx,.doc" 
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <button className="mt-4 bg-primary hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Select Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
