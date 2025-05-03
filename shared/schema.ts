import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Users table (already defined)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  score: integer("score").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull(),
  experience: integer("experience").notNull(),
  status: text("status").notNull().$type<'New' | 'For Interview' | 'Rejected' | 'On Hold'>().default('New'),
  rejectionReason: text("rejection_reason"),
  rejectionNotes: text("rejection_notes"),
  resumeUrl: text("resume_url").notNull(),
  highlights: jsonb("highlights").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Resume uploads table to track upload batches
export const resumeUploads = pgTable("resume_uploads", {
  id: serial("id").primaryKey(),
  totalFiles: integer("total_files").notNull(),
  processedFiles: integer("processed_files").notNull().default(0),
  failedFiles: integer("failed_files").notNull().default(0),
  status: text("status").notNull().$type<'pending' | 'processing' | 'completed' | 'failed'>().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Analytics tables for skills distribution
export const skillsAnalytics = pgTable("skills_analytics", {
  id: serial("id").primaryKey(),
  skillName: text("skill_name").notNull().unique(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const candidateRelations = relations(candidates, ({ many }) => ({
  skills: many(skillsAnalytics),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCandidateSchema = createInsertSchema(candidates, {
  name: (schema) => schema.min(1, "Name is required"),
  email: (schema) => schema.email("Must provide a valid email"),
  score: (schema) => schema.min(0).max(100, "Score must be between 0 and 100"),
  experience: (schema) => schema.min(0, "Experience cannot be negative"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertResumeUploadSchema = createInsertSchema(resumeUploads).omit({
  id: true, createdAt: true, updatedAt: true
});

export const insertSkillAnalyticsSchema = createInsertSchema(skillsAnalytics).omit({
  id: true, updatedAt: true
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertResumeUpload = z.infer<typeof insertResumeUploadSchema>;
export type ResumeUpload = typeof resumeUploads.$inferSelect;

export type InsertSkillAnalytics = z.infer<typeof insertSkillAnalyticsSchema>;
export type SkillAnalytics = typeof skillsAnalytics.$inferSelect;

// Additional validation schemas for API requests
export const updateCandidateStatusSchema = z.object({
  status: z.enum(['New', 'For Interview', 'Rejected', 'On Hold']),
});

export const rejectCandidateSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
  notes: z.string().optional(),
});

export type UpdateCandidateStatus = z.infer<typeof updateCandidateStatusSchema>;
export type RejectCandidate = z.infer<typeof rejectCandidateSchema>;
