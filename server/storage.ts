import { db } from "@db";
import { 
  candidates, 
  resumeUploads, 
  skillsAnalytics,
  type Candidate,
  type ResumeUpload
} from "@shared/schema";
import { eq, like, and, or, desc, asc, count, sql } from "drizzle-orm";
import { getExperienceLevel } from "@/lib/utils";
import path from "path";
import fs from "fs";

export const storage = {
  // Resume Upload Functions
  async createResumeUpload(totalFiles: number): Promise<number> {
    const [upload] = await db.insert(resumeUploads).values({
      totalFiles,
      processedFiles: 0,
      failedFiles: 0,
      status: 'pending'
    }).returning({ id: resumeUploads.id });
    
    return upload.id;
  },
  
  async updateUploadStatus(
    uploadId: number, 
    processedFiles: number, 
    failedFiles: number, 
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    await db.update(resumeUploads)
      .set({ 
        processedFiles, 
        failedFiles, 
        status,
        updatedAt: new Date()
      })
      .where(eq(resumeUploads.id, uploadId));
  },
  
  async getLatestUploadStatus(): Promise<{
    status: string;
    total: number;
    processed: number;
    failed: number;
  }> {
    // Get the most recent upload
    const [latestUpload] = await db.select()
      .from(resumeUploads)
      .orderBy(desc(resumeUploads.createdAt))
      .limit(1);
    
    if (!latestUpload) {
      return { status: 'none', total: 0, processed: 0, failed: 0 };
    }
    
    return {
      status: latestUpload.status,
      total: latestUpload.totalFiles,
      processed: latestUpload.processedFiles,
      failed: latestUpload.failedFiles
    };
  },
  
  // This function would normally call an external API to analyze resumes
  // For this implementation, we'll simulate the process with random data
  async processResumes(files: Express.Multer.File[], uploadId: number): Promise<void> {
    // Update status to processing
    await this.updateUploadStatus(uploadId, 0, 0, 'processing');
    
    // Sample skills to randomly assign
    const skills = [
      'React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Node.js', 
      'UI/UX', 'Redux', 'Next.js', 'Vue.js', 'Angular', 'GraphQL', 
      'REST API', 'TailwindCSS', 'MongoDB', 'PostgreSQL', 'Python', 
      'Django', 'Flask', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 
      'Git', 'Jest', 'Testing'
    ];
    
    // Process each file (simulated)
    let processed = 0;
    let failed = 0;
    
    for (const file of files) {
      try {
        // Simulate processing delay (1-2 seconds per file)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // Generate random candidate data
        const nameParts = path.basename(file.originalname, path.extname(file.originalname)).split(/[_\s-]+/);
        const firstName = nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1).toLowerCase() || 'John';
        const lastName = nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1).toLowerCase() || 'Doe';
        const name = `${firstName} ${lastName}`;
        
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
        const score = Math.floor(40 + Math.random() * 60); // Score between 40-100
        
        // Random skills (3-6)
        const skillCount = 3 + Math.floor(Math.random() * 4);
        const candidateSkills = [...skills]
          .sort(() => 0.5 - Math.random())
          .slice(0, skillCount);
          
        // Random experience (1-15 years)
        const experience = 1 + Math.floor(Math.random() * 15);
        
        // Random highlights based on experience level
        const experienceLevel = getExperienceLevel(experience);
        let highlights: string[] = [];
        
        if (experienceLevel === 'junior') {
          highlights = [
            'Recent graduate with strong academic performance',
            'Contributed to open-source projects',
            'Excellent problem-solving skills',
          ];
        } else if (experienceLevel === 'mid') {
          highlights = [
            'Experienced in team projects',
            'Developed multiple production applications',
            'Good communication and teamwork abilities',
          ];
        } else if (experienceLevel === 'senior') {
          highlights = [
            'Led development teams successfully',
            'Extensive experience with architecture design',
            'Strong technical leadership skills',
          ];
        } else {
          highlights = [
            'Industry thought leader',
            'Managed large-scale projects',
            'Expert in multiple technical domains',
          ];
        }
        
        // Insert candidate
        await db.insert(candidates).values({
          name,
          email,
          score,
          skills: candidateSkills,
          experience,
          status: 'New',
          resumeUrl: file.path,
          highlights: highlights.sort(() => 0.5 - Math.random()).slice(0, 3),
        });
        
        // Update skills analytics
        for (const skill of candidateSkills) {
          const existingSkill = await db.query.skillsAnalytics.findFirst({
            where: eq(skillsAnalytics.skillName, skill)
          });
          
          if (existingSkill) {
            await db.update(skillsAnalytics)
              .set({ count: existingSkill.count + 1, updatedAt: new Date() })
              .where(eq(skillsAnalytics.id, existingSkill.id));
          } else {
            await db.insert(skillsAnalytics).values({
              skillName: skill,
              count: 1
            });
          }
        }
        
        processed++;
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        failed++;
      }
      
      // Update status periodically
      await this.updateUploadStatus(
        uploadId, 
        processed, 
        failed, 
        processed + failed === files.length ? 'completed' : 'processing'
      );
    }
    
    // Final status update
    await this.updateUploadStatus(
      uploadId,
      processed,
      failed,
      'completed'
    );
  },
  
  // Candidate Functions
  async getCandidates({ 
    page = 1, 
    pageSize = 10, 
    searchTerm = '', 
    statusFilter = 'all_statuses', 
    sortOption = 'scoreDesc' 
  }: {
    page: number;
    pageSize: number;
    searchTerm: string;
    statusFilter: string;
    sortOption: string;
  }): Promise<{ candidates: Candidate[]; total: number }> {
    // Build query conditions
    let conditions = sql`1=1`;
    
    if (searchTerm) {
      conditions = and(
        conditions,
        or(
          like(candidates.name, `%${searchTerm}%`),
          like(candidates.email, `%${searchTerm}%`)
        )
      );
    }
    
    if (statusFilter && statusFilter !== 'all_statuses') {
      conditions = and(conditions, eq(candidates.status, statusFilter));
    }
    
    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(candidates)
      .where(conditions);
      
    const total = countResult?.count || 0;
    
    // Determine sort order
    let orderBy;
    switch (sortOption) {
      case 'scoreDesc':
        orderBy = [desc(candidates.score)];
        break;
      case 'scoreAsc':
        orderBy = [asc(candidates.score)];
        break;
      case 'nameAsc':
        orderBy = [asc(candidates.name)];
        break;
      case 'nameDesc':
        orderBy = [desc(candidates.name)];
        break;
      default:
        orderBy = [desc(candidates.score)];
    }
    
    // Get paginated results
    const candidateResults = await db
      .select()
      .from(candidates)
      .where(conditions)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
      
    return { candidates: candidateResults, total };
  },
  
  async updateCandidateStatus(id: number, status: string): Promise<void> {
    await db.update(candidates)
      .set({ 
        status: status as 'New' | 'For Interview' | 'Rejected' | 'On Hold',
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id));
  },
  
  async rejectCandidate(id: number, reason: string, notes?: string): Promise<void> {
    await db.update(candidates)
      .set({ 
        status: 'Rejected',
        rejectionReason: reason,
        rejectionNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id));
  },
  
  async getTopCandidates(limit = 3): Promise<Candidate[]> {
    return db
      .select()
      .from(candidates)
      .where(
        and(
          sql`${candidates.score} >= 80`,
          or(
            eq(candidates.status, 'New'),
            eq(candidates.status, 'For Interview')
          )
        )
      )
      .orderBy(desc(candidates.score))
      .limit(limit);
  },
  
  // Analytics Functions
  async getAnalyticsData(): Promise<{
    totalCandidates: number;
    skillsDistribution: { name: string; count: number }[];
    scoreDistribution: { range: string; count: number }[];
    experienceLevels: { level: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
  }> {
    // Get total candidates
    const [countResult] = await db
      .select({ count: count() })
      .from(candidates);
      
    const totalCandidates = countResult?.count || 0;
    
    // Get skills distribution
    const skillsData = await db
      .select()
      .from(skillsAnalytics)
      .orderBy(desc(skillsAnalytics.count))
      .limit(10);
    
    // Get score distribution
    const [scoreDistribution] = await db
      .select({
        excellent: sql<number>`SUM(CASE WHEN ${candidates.score} >= 90 THEN 1 ELSE 0 END)`,
        good: sql<number>`SUM(CASE WHEN ${candidates.score} >= 70 AND ${candidates.score} < 90 THEN 1 ELSE 0 END)`,
        average: sql<number>`SUM(CASE WHEN ${candidates.score} >= 50 AND ${candidates.score} < 70 THEN 1 ELSE 0 END)`,
        poor: sql<number>`SUM(CASE WHEN ${candidates.score} < 50 THEN 1 ELSE 0 END)`
      })
      .from(candidates);
    
    // Get experience levels
    const [experienceLevels] = await db
      .select({
        junior: sql<number>`SUM(CASE WHEN ${candidates.experience} < 3 THEN 1 ELSE 0 END)`,
        mid: sql<number>`SUM(CASE WHEN ${candidates.experience} >= 3 AND ${candidates.experience} < 6 THEN 1 ELSE 0 END)`,
        senior: sql<number>`SUM(CASE WHEN ${candidates.experience} >= 6 AND ${candidates.experience} < 10 THEN 1 ELSE 0 END)`,
        expert: sql<number>`SUM(CASE WHEN ${candidates.experience} >= 10 THEN 1 ELSE 0 END)`
      })
      .from(candidates);
    
    // Get status distribution
    const [statusDistribution] = await db
      .select({
        new: sql<number>`SUM(CASE WHEN ${candidates.status} = 'New' THEN 1 ELSE 0 END)`,
        interview: sql<number>`SUM(CASE WHEN ${candidates.status} = 'For Interview' THEN 1 ELSE 0 END)`,
        hold: sql<number>`SUM(CASE WHEN ${candidates.status} = 'On Hold' THEN 1 ELSE 0 END)`,
        rejected: sql<number>`SUM(CASE WHEN ${candidates.status} = 'Rejected' THEN 1 ELSE 0 END)`
      })
      .from(candidates);
    
    return {
      totalCandidates,
      skillsDistribution: skillsData.map(skill => ({
        name: skill.skillName,
        count: skill.count
      })),
      scoreDistribution: [
        { range: 'excellent', count: scoreDistribution?.excellent || 0 },
        { range: 'good', count: scoreDistribution?.good || 0 },
        { range: 'average', count: scoreDistribution?.average || 0 },
        { range: 'poor', count: scoreDistribution?.poor || 0 }
      ],
      experienceLevels: [
        { level: 'junior', count: experienceLevels?.junior || 0 },
        { level: 'mid', count: experienceLevels?.mid || 0 },
        { level: 'senior', count: experienceLevels?.senior || 0 },
        { level: 'expert', count: experienceLevels?.expert || 0 }
      ],
      statusDistribution: [
        { status: 'New', count: statusDistribution?.new || 0 },
        { status: 'For Interview', count: statusDistribution?.interview || 0 },
        { status: 'On Hold', count: statusDistribution?.hold || 0 },
        { status: 'Rejected', count: statusDistribution?.rejected || 0 }
      ]
    };
  }
};
