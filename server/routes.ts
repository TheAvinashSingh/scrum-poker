import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  createSessionSchema, joinSessionSchema, voteSchema,
  insertUserSchema, insertSessionSchema, insertVoteSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate a random 4-digit session ID
  function generateSessionId(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Create a new session
  app.post("/api/sessions", async (req, res) => {
    try {
      const { sessionId, username } = createSessionSchema.parse(req.body);
      
      // Generate session ID if not provided
      const finalSessionId = sessionId || generateSessionId();
      
      // Check if session ID already exists
      const existingSession = await storage.getSession(finalSessionId);
      if (existingSession) {
        return res.status(400).json({ message: "Session ID already exists" });
      }
      
      // Create session
      const newSession = await storage.createSession({
        id: finalSessionId,
        hostId: null, // Will be updated after user creation
        active: true,
        votingActive: false,
        showResults: false
      });
      
      // Create host user
      const newUser = await storage.createUser({
        username,
        sessionId: finalSessionId,
        isHost: true
      });
      
      // Update session with host ID
      await storage.updateSession(finalSessionId, { hostId: newUser.id });
      
      // Return session with user
      const session = await storage.getSessionWithDetails(finalSessionId);
      res.status(201).json({ 
        session,
        userId: newUser.id,
        isHost: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Join a session
  app.post("/api/sessions/:sessionId/join", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { username } = joinSessionSchema.parse({ 
        ...req.body, 
        sessionId 
      });
      
      // Check if session exists
      const existingSession = await storage.getSession(sessionId);
      if (!existingSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (!existingSession.active) {
        return res.status(400).json({ message: "Session is no longer active" });
      }
      
      // Create participant user
      const newUser = await storage.createUser({
        username,
        sessionId,
        isHost: false
      });
      
      // Return session with participants
      const session = await storage.getSessionWithDetails(sessionId);
      res.status(200).json({ 
        session,
        userId: newUser.id,
        isHost: false
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get session details
  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSessionWithDetails(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Vote in a session
  app.post("/api/sessions/:sessionId/vote", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { userId } = req.query;
      const { value } = voteSchema.parse(req.body);
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Check if session exists and voting is active
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (!session.votingActive) {
        return res.status(400).json({ message: "Voting is not active" });
      }
      
      // Check if user exists in session
      const user = await storage.getUser(parseInt(userId));
      if (!user || user.sessionId !== sessionId) {
        return res.status(404).json({ message: "User not found in this session" });
      }
      
      // Record vote
      await storage.createVote({
        sessionId,
        userId: parseInt(userId),
        value
      });
      
      // Return updated session with votes
      const updatedSession = await storage.getSessionWithDetails(sessionId);
      res.status(200).json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update session state (host only)
  app.patch("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { userId } = req.query;
      const { votingActive, showResults } = req.body;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Check if session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if user is the host
      const user = await storage.getUser(parseInt(userId));
      if (!user || user.sessionId !== sessionId || !user.isHost) {
        return res.status(403).json({ message: "Only the host can update the session" });
      }
      
      // Update session
      const updates: Partial<typeof session> = {};
      
      if (typeof votingActive === 'boolean') {
        updates.votingActive = votingActive;
      }
      
      if (typeof showResults === 'boolean') {
        updates.showResults = showResults;
      }
      
      // Reset votes if starting a new round
      if (votingActive === true && showResults === false) {
        await storage.deleteVotesBySessionId(sessionId);
      }
      
      await storage.updateSession(sessionId, updates);
      
      // Return updated session
      const updatedSession = await storage.getSessionWithDetails(sessionId);
      res.status(200).json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
