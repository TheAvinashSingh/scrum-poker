import express from 'express';
import { MemStorage } from '../server/storage.js';

// Create a router
const routes = express.Router();

// Create an in-memory storage for serverless
const storage = new MemStorage();

// Session routes
routes.post('/sessions', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Generate a random 6-character session ID
    const sessionId = generateSessionId();
    
    // Create a user
    const user = await storage.createUser({
      username,
      sessionId
    });
    
    // Create a session
    const session = await storage.createSession({
      id: sessionId,
      votingActive: false,
      showResults: false,
      active: true,
      hostId: user.id
    });
    
    // Return session and user info
    res.status(201).json({
      sessionId: session.id,
      userId: user.id,
      isHost: true
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Join session
routes.post('/sessions/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Check if session exists
    const session = await storage.getSession(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!session.active) {
      return res.status(400).json({ error: 'Session has ended' });
    }
    
    // Create a user for this session
    const user = await storage.createUser({
      username,
      sessionId: id
    });
    
    // Return user info
    res.status(200).json({
      sessionId: id,
      userId: user.id,
      isHost: user.id === session.hostId
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// Get session info
routes.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get session with details
    const session = await storage.getSessionWithDetails(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.status(200).json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session information' });
  }
});

// Vote
routes.post('/sessions/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const { value } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!value) {
      return res.status(400).json({ error: 'Vote value is required' });
    }
    
    // Check if session exists
    const session = await storage.getSession(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!session.active) {
      return res.status(400).json({ error: 'Session has ended' });
    }
    
    if (!session.votingActive) {
      return res.status(400).json({ error: 'Voting is not active' });
    }
    
    // Create or update vote
    const existingVote = await storage.getVoteByUserId(Number(userId), id);
    
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted' });
    }
    
    // Create vote
    await storage.createVote({
      userId: Number(userId),
      sessionId: id,
      value
    });
    
    res.status(200).json({ message: 'Vote recorded' });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Update session state (start/stop voting, show/hide results)
routes.patch('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { votingActive, showResults, active } = req.body;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if session exists
    const session = await storage.getSession(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if user is the host
    if (session.hostId !== Number(userId)) {
      return res.status(403).json({ error: 'Only the host can update the session' });
    }
    
    // Create updates object with only defined fields
    const updates = {};
    if (votingActive !== undefined) updates.votingActive = votingActive;
    if (showResults !== undefined) updates.showResults = showResults;
    if (active !== undefined) updates.active = active;
    
    // Reset votes if starting a new voting round
    if (votingActive === true && !session.votingActive) {
      await storage.deleteVotesBySessionId(id);
      updates.showResults = false;
    }
    
    // Update session
    const updatedSession = await storage.updateSession(id, updates);
    
    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.status(200).json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Generate a random session ID (6 characters, uppercase)
function generateSessionId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters like 0/O, 1/I
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export { routes };