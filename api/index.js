// Serverless entry point for Vercel
const express = require('express');
const app = express();

// Add CORS middleware for Vercel environment
app.use((req, res, next) => {
  // Allow requests from any origin in development
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow common HTTP methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  // Allow common headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Allow credentials
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Health check without /api prefix for root route checking
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Simple session creation with in-memory storage
const sessions = new Map();
const users = new Map();
const votes = new Map();
let userId = 1;
let voteId = 1;

// Create session
app.post('/api/sessions', (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Generate session ID
    const sessionId = generateSessionId();
    
    // Create user
    const user = {
      id: userId++,
      username,
      sessionId
    };
    users.set(user.id, user);
    
    // Create session
    const session = {
      id: sessionId,
      votingActive: false,
      showResults: false,
      active: true,
      hostId: user.id
    };
    sessions.set(sessionId, session);
    
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
app.post('/api/sessions/:id/join', (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Check if session exists
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!session.active) {
      return res.status(400).json({ error: 'Session has ended' });
    }
    
    // Create user
    const user = {
      id: userId++,
      username,
      sessionId: id
    };
    users.set(user.id, user);
    
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

// Get session details
app.get('/api/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if session exists
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get participants
    const sessionUsers = Array.from(users.values()).filter(u => u.sessionId === id);
    const sessionVotes = Array.from(votes.values()).filter(v => v.sessionId === id);
    
    // Create response
    const participants = sessionUsers.map(user => {
      const vote = sessionVotes.find(v => v.userId === user.id);
      return {
        id: user.id,
        username: user.username,
        hasVoted: !!vote,
        voteValue: vote ? vote.value : undefined
      };
    });
    
    // Calculate metrics if results are shown
    let average = undefined;
    let consensus = undefined;
    let range = undefined;
    
    if (session.showResults && sessionVotes.length > 0) {
      // Filter out non-numeric votes
      const numericVotes = sessionVotes
        .map(v => v.value)
        .filter(v => !isNaN(Number(v)));
      
      if (numericVotes.length > 0) {
        // Calculate average
        const sum = numericVotes.reduce((acc, val) => acc + Number(val), 0);
        average = (sum / numericVotes.length).toFixed(1);
        
        // Find most common vote
        const voteCounts = {};
        sessionVotes.forEach(v => {
          voteCounts[v.value] = (voteCounts[v.value] || 0) + 1;
        });
        
        let maxCount = 0;
        Object.entries(voteCounts).forEach(([value, count]) => {
          if (count > maxCount) {
            maxCount = count;
            consensus = value;
          }
        });
        
        // Calculate range
        const sortedVotes = [...numericVotes].sort((a, b) => Number(a) - Number(b));
        range = `${sortedVotes[0]}-${sortedVotes[sortedVotes.length - 1]}`;
      }
    }
    
    res.status(200).json({
      id: session.id,
      votingActive: session.votingActive,
      showResults: session.showResults,
      active: session.active,
      participants,
      average,
      consensus,
      range
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Submit vote
app.post('/api/sessions/:id/vote', (req, res) => {
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
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!session.active) {
      return res.status(400).json({ error: 'Session has ended' });
    }
    
    if (!session.votingActive) {
      return res.status(400).json({ error: 'Voting is not active' });
    }
    
    // Check if user has already voted
    const existingVote = Array.from(votes.values()).find(
      v => v.userId === Number(userId) && v.sessionId === id
    );
    
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted' });
    }
    
    // Create vote
    const vote = {
      id: voteId++,
      userId: Number(userId),
      sessionId: id,
      value
    };
    votes.set(vote.id, vote);
    
    res.status(200).json({ message: 'Vote recorded' });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Update session (start/stop voting, show/hide results, end session)
app.patch('/api/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { votingActive, showResults, active } = req.body;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if session exists
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if user is the host
    if (session.hostId !== Number(userId)) {
      return res.status(403).json({ error: 'Only the host can update the session' });
    }
    
    // Update session
    if (votingActive !== undefined) session.votingActive = votingActive;
    if (showResults !== undefined) session.showResults = showResults;
    if (active !== undefined) session.active = active;
    
    // Reset votes if starting a new voting round
    if (votingActive === true && !session.votingActive) {
      // Delete votes for this session
      for (const [voteId, vote] of votes.entries()) {
        if (vote.sessionId === id) {
          votes.delete(voteId);
        }
      }
      session.showResults = false;
    }
    
    res.status(200).json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Generate session ID
function generateSessionId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export for Vercel
module.exports = app;