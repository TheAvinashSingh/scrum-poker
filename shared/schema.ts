import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema used for both hosts and participants
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  sessionId: text("session_id").notNull(),
  isHost: boolean("is_host").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  sessionId: true,
  isHost: true,
});

// Session schema
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // This will be the 4-digit session code
  hostId: integer("host_id"), // Can be null initially
  active: boolean("active").notNull().default(true),
  votingActive: boolean("voting_active").notNull().default(false),
  showResults: boolean("show_results").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  id: true,
  hostId: true,
  active: true,
  votingActive: true,
  showResults: true,
});

// Votes schema
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").notNull(),
  value: text("value").notNull(), // Can be "0", "1", "2", "3", "5", "8", "13", "21", "?"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  sessionId: true,
  userId: true,
  value: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

// Zod schemas for API validations
export const createSessionSchema = z.object({
  sessionId: z.string().length(4).optional(),
  username: z.string().min(1, "Name is required"),
});

export const joinSessionSchema = z.object({
  sessionId: z.string().length(4, "Session ID must be exactly 4 characters"),
  username: z.string().min(1, "Name is required"),
});

export const voteSchema = z.object({
  value: z.string(),
});

// Response types
export type ParticipantResponse = {
  id: number;
  username: string;
  hasVoted: boolean;
  voteValue?: string;
};

export type SessionResponse = {
  id: string;
  votingActive: boolean;
  showResults: boolean;
  active: boolean;
  participants: ParticipantResponse[];
  average?: number;
  consensus?: string;
  range?: string;
};
