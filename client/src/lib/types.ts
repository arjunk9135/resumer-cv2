// Candidate types
export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  score: number;
  skills: string[];
  experience: number;
  status: 'New' | 'For Interview' | 'Rejected' | 'On Hold';
  rejectionReason?: string;
  rejectionNotes?: string;
  resumeUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopCandidate {
  id: number;
  name: string;
  email: string;
  experience: number;
  score: number;
  skills: string[];
  highlights: string[];
  resumeUrl: string;
}

// Analytics types
export interface SkillDistribution {
  name: string;
  count: number;
}

export interface ScoreDistribution {
  range: 'excellent' | 'good' | 'average' | 'poor';
  count: number;
}

export interface ExperienceLevel {
  level: 'junior' | 'mid' | 'senior' | 'expert';
  count: number;
}

export interface StatusDistribution {
  status: 'New' | 'For Interview' | 'Rejected' | 'On Hold';
  count: number;
}

export interface AnalyticsData {
  totalCandidates: number;
  skillsDistribution: SkillDistribution[];
  scoreDistribution: ScoreDistribution[];
  experienceLevels: ExperienceLevel[];
  statusDistribution: StatusDistribution[];
}

// Upload types
export interface UploadStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total: number;
  processed: number;
  failed: number;
}
