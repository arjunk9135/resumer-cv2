import { db } from "./index";
import * as schema from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function seed() {
  try {
    console.log("Seeding database...");
    
    // Always create sample candidates for demonstration purposes
    console.log("Creating sample candidates...");
    
    const sampleCandidates = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        score: 87,
        skills: ["React", "JavaScript", "UI"],
        experience: 5,
        status: "For Interview",
        resumeUrl: "sample_resume_1.pdf",
        highlights: [
          "Strong portfolio of React projects",
          "Prior experience in similar industry",
          "Excellent problem-solving skills"
        ]
      },
      {
        name: "Amanda Smith",
        email: "amanda.smith@example.com",
        score: 93,
        skills: ["React", "JavaScript", "UX"],
        experience: 7,
        status: "New",
        resumeUrl: "sample_resume_2.pdf",
        highlights: [
          "Led frontend team at previous company",
          "Advanced knowledge of modern JS",
          "Experience with complex state management"
        ]
      },
      {
        name: "Robert Johnson",
        email: "robert.j@example.com",
        score: 62,
        skills: ["JavaScript", "UI"],
        experience: 3,
        status: "On Hold",
        resumeUrl: "sample_resume_3.pdf",
        highlights: [
          "Contributed to open-source projects",
          "Good communication skills",
          "Experience with React applications"
        ]
      },
      {
        name: "Maria Lopez",
        email: "maria.lopez@example.com",
        score: 45,
        skills: ["UI"],
        experience: 1,
        status: "Rejected",
        resumeUrl: "sample_resume_4.pdf",
        rejectionReason: "skills_mismatch",
        highlights: [
          "Recent graduate",
          "Enthusiasm for learning",
          "Basic knowledge of web development"
        ]
      }
    ];
    
    // Insert sample candidates
    for (const candidate of sampleCandidates) {
      await db.insert(schema.candidates).values({
        ...candidate,
        status: candidate.status as "New" | "For Interview" | "Rejected" | "On Hold",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Seed skills analytics
    const skills = ["React", "JavaScript", "UI", "UX", "TypeScript", "Node.js"];
    const skillCounts = {
      "React": 2,
      "JavaScript": 3,
      "UI": 3,
      "UX": 1,
      "TypeScript": 1,
      "Node.js": 1
    };
    
    for (const skill of skills) {
      await db.insert(schema.skillsAnalytics).values({
        skillName: skill,
        count: skillCounts[skill as keyof typeof skillCounts] || 1,
        updatedAt: new Date()
      });
    }
    
    // Create a sample resume upload
    await db.insert(schema.resumeUploads).values({
      totalFiles: 4,
      processedFiles: 4,
      failedFiles: 0,
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log("Sample data created successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
