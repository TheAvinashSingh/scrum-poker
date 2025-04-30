// Client-side API implementation
import { z } from 'zod';
import { 
  createSessionSchema, 
  joinSessionSchema, 
  voteSchema, 
  type SessionResponse,
  type User,
  type Session,
  type Vote
} from '@shared/schema';

// In-memory storage for client-side API
class ClientMemStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private votes: Map<number, Vote>;
  private userId: number;
  private voteId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.votes = new Map();
    this.userId = 1;
    this.voteId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsersBySessionId(sessionId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.sessionId === sessionId
    );
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const id = this.userId++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Session operations
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const id = generateSessionId();
    const newSession: Session = { ...session, id };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Vote operations
  async getVotesBySessionId(sessionId: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.sessionId === sessionId
    );
  }

  async getVoteByUserId(userId: number, sessionId: string): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      (vote) => vote.userId === userId && vote.sessionId === sessionId
    );
  }

  async createVote(vote: Omit<Vote, 'id'>): Promise<Vote> {
    const id = this.voteId++;
    const newVote: Vote = { ...vote, id };
    this.votes.set(id, newVote);
    return newVote;
  }

  async deleteVotesBySessionId(sessionId: string): Promise<void> {
    for (const [id, vote] of this.votes.entries()) {
      if (vote.sessionId === sessionId) {
        this.votes.delete(id);
      }
    }
  }

  // Complex operations
  async getSessionWithDetails(sessionId: string): Promise<SessionResponse | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const users = await this.getUsersBySessionId(sessionId);
    const votes = await this.getVotesBySessionId(sessionId);

    const participants = users.map((user) => {
      const vote = votes.find((v) => v.userId === user.id);
      return {
        id: user.id,
        username: user.username,
        hasVoted: !!vote,
        voteValue: session.showResults ? vote?.value : undefined,
      };
    });

    let average: number | undefined;
    let consensus: string | undefined;
    let range: string | undefined;

    if (session.showResults && votes.length > 0) {
      // Filter out non-numeric votes for calculations
      const numericVotes = votes
        .map((v) => v.value)
        .filter((value) => !isNaN(Number(value)))
        .map((value) => Number(value));

      if (numericVotes.length > 0) {
        // Calculate average
        const sum = numericVotes.reduce((acc, val) => acc + val, 0);
        average = parseFloat((sum / numericVotes.length).toFixed(1));

        // Find most common vote (consensus)
        const voteCounts: Record<string, number> = {};
        votes.forEach((v) => {
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
        if (numericVotes.length > 1) {
          const sortedVotes = [...numericVotes].sort((a, b) => a - b);
          range = `${sortedVotes[0]}-${sortedVotes[sortedVotes.length - 1]}`;
        } else {
          range = `${numericVotes[0]}`;
        }
      }
    }

    return {
      id: session.id,
      votingActive: session.votingActive,
      showResults: session.showResults,
      active: session.active,
      participants,
      average,
      consensus,
      range,
    };
  }
}

// Generate a session ID
function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Initialize our client-side storage instance
const clientStorage = new ClientMemStorage();

// API methods
export async function createSession(data: z.infer<typeof createSessionSchema>) {
  try {
    // Validate input
    const parsedData = createSessionSchema.parse(data);
    
    // Create user
    const user = await clientStorage.createUser({
      username: parsedData.username,
      sessionId: 'temporary' // Will be updated below
    });
    
    // Create session
    const session = await clientStorage.createSession({
      votingActive: false,
      showResults: false,
      active: true,
      hostId: user.id
    });
    
    // Update user with correct session ID
    await clientStorage.updateSession(session.id, { hostId: user.id });
    
    // Update user with session ID
    const updatedUser = { ...user, sessionId: session.id };
    clientStorage.users.set(user.id, updatedUser);
    
    return {
      sessionId: session.id,
      userId: user.id,
      isHost: true
    };
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

export async function joinSession(sessionId: string, data: z.infer<typeof joinSessionSchema>) {
  try {
    // Validate input
    const parsedData = joinSessionSchema.parse(data);
    
    // Check if session exists
    const session = await clientStorage.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!session.active) {
      throw new Error('Session has ended');
    }
    
    // Create user
    const user = await clientStorage.createUser({
      username: parsedData.username,
      sessionId
    });
    
    return {
      sessionId,
      userId: user.id,
      isHost: user.id === session.hostId
    };
  } catch (error) {
    console.error('Error joining session:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to join session');
  }
}

export async function getSessionDetails(sessionId: string): Promise<SessionResponse> {
  try {
    const sessionDetails = await clientStorage.getSessionWithDetails(sessionId);
    if (!sessionDetails) {
      throw new Error('Session not found');
    }
    return sessionDetails;
  } catch (error) {
    console.error('Error getting session details:', error);
    throw new Error('Failed to get session details');
  }
}

export async function submitVote(sessionId: string, userId: number, data: z.infer<typeof voteSchema>) {
  try {
    // Validate input
    const parsedData = voteSchema.parse(data);
    
    // Check if session exists
    const session = await clientStorage.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!session.active) {
      throw new Error('Session has ended');
    }
    
    if (!session.votingActive) {
      throw new Error('Voting is not active');
    }
    
    // Check if user has already voted
    const existingVote = await clientStorage.getVoteByUserId(userId, sessionId);
    if (existingVote) {
      throw new Error('You have already voted');
    }
    
    // Create vote
    await clientStorage.createVote({
      userId,
      sessionId,
      value: parsedData.value
    });
    
    return { message: 'Vote recorded' };
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to submit vote');
  }
}

export async function updateSession(
  sessionId: string, 
  userId: number, 
  updates: { votingActive?: boolean; showResults?: boolean; active?: boolean }
) {
  try {
    // Check if session exists
    const session = await clientStorage.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if user is the host
    if (session.hostId !== userId) {
      throw new Error('Only the host can update the session');
    }
    
    // Reset votes if starting a new voting round
    if (updates.votingActive === true && !session.votingActive) {
      await clientStorage.deleteVotesBySessionId(sessionId);
      updates.showResults = false;
    }
    
    // Update session
    const updatedSession = await clientStorage.updateSession(sessionId, updates);
    if (!updatedSession) {
      throw new Error('Failed to update session');
    }
    
    return updatedSession;
  } catch (error) {
    console.error('Error updating session:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update session');
  }
}