import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  updateCandidateStatusSchema, 
  rejectCandidateSchema, 
  insertCandidateSchema
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { candidates } from "@shared/schema";
import { db } from "@db";

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOCX, DOC
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and DOC are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB file size limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  
  // Upload resumes endpoint
  app.post('/api/resumes/upload', upload.array('resumes', 300), async (req, res) => {
    try {
      // Extract uploaded files
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      // Create a resume upload entry
      const uploadId = await storage.createResumeUpload(files.length);
      
      // Process files (in real app, this would be async)
      await storage.processResumes(files, uploadId);
      
      return res.status(200).json({ 
        message: 'Upload successful, processing started',
        uploadId,
        totalFiles: files.length
      });
    } catch (error) {
      console.error('Error uploading resumes:', error);
      return res.status(500).json({ error: 'Failed to upload resumes' });
    }
  });
  
  // Check upload status
  app.get('/api/resumes/status', async (req, res) => {
    try {
      const status = await storage.getLatestUploadStatus();
      return res.status(200).json(status);
    } catch (error) {
      console.error('Error getting upload status:', error);
      return res.status(500).json({ error: 'Failed to get upload status' });
    }
  });
  
  // Get all candidates with pagination, filtering, and sorting
  app.get('/api/candidates', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const searchTerm = req.query.search as string || '';
      const statusFilter = req.query.status as string || 'all_statuses';
      const sortOption = req.query.sort as string || 'scoreDesc';
      
      const { candidates: candidateList, total } = await storage.getCandidates({
        page,
        pageSize,
        searchTerm,
        statusFilter,
        sortOption
      });
      
      return res.status(200).json({ 
        candidates: candidateList,
        total
      });
    } catch (error) {
      console.error('Error getting candidates:', error);
      return res.status(500).json({ error: 'Failed to get candidates' });
    }
  });
  
  // Get analytics data
  app.get('/api/analytics', async (req, res) => {
    try {
      const analyticsData = await storage.getAnalyticsData();
      return res.status(200).json(analyticsData);
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return res.status(500).json({ error: 'Failed to get analytics data' });
    }
  });
  
  // Get top candidates
  app.get('/api/candidates/top-picks', async (req, res) => {
    try {
      const topCandidates = await storage.getTopCandidates();
      return res.status(200).json(topCandidates);
    } catch (error) {
      console.error('Error getting top candidates:', error);
      return res.status(500).json({ error: 'Failed to get top candidates' });
    }
  });
  
  // Download resume
  app.get('/api/candidates/:id/resume', async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      
      if (isNaN(candidateId)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
      
      const candidate = await db.query.candidates.findFirst({
        where: eq(candidates.id, candidateId)
      });
      
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      
      const resumePath = path.join(process.cwd(), 'uploads', path.basename(candidate.resumeUrl));
      
      if (!fs.existsSync(resumePath)) {
        return res.status(404).json({ error: 'Resume file not found' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=resume_${candidateId}.pdf`);
      
      const fileStream = fs.createReadStream(resumePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading resume:', error);
      return res.status(500).json({ error: 'Failed to download resume' });
    }
  });
  
  // Update candidate status
  app.patch('/api/candidates/:id/status', async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      
      if (isNaN(candidateId)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
      
      const parsedBody = updateCandidateStatusSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return res.status(400).json({ error: 'Invalid status', details: parsedBody.error });
      }
      
      const { status } = parsedBody.data;
      
      await storage.updateCandidateStatus(candidateId, status);
      
      return res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating candidate status:', error);
      return res.status(500).json({ error: 'Failed to update candidate status' });
    }
  });
  
  // Reject candidate
  app.patch('/api/candidates/:id/reject', async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      
      if (isNaN(candidateId)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
      
      const parsedBody = rejectCandidateSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return res.status(400).json({ error: 'Invalid rejection data', details: parsedBody.error });
      }
      
      const { reason, notes } = parsedBody.data;
      
      await storage.rejectCandidate(candidateId, reason, notes);
      
      return res.status(200).json({ message: 'Candidate rejected successfully' });
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      return res.status(500).json({ error: 'Failed to reject candidate' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
