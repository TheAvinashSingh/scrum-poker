import { 
  User, InsertUser, Session, InsertSession, Vote, InsertVote,
  ParticipantResponse, SessionResponse
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUsersBySessionId(sessionId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session operations
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  
  // Vote operations
  getVotesBySessionId(sessionId: string): Promise<Vote[]>;
  getVoteByUserId(userId: number, sessionId: string): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  deleteVotesBySessionId(sessionId: string): Promise<void>;
  
  // Complex operations
  getSessionWithDetails(sessionId: string): Promise<SessionResponse | undefined>;
}

export class MemStorage implements IStorage {
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
    return Array.from(this.users.values())
      .filter(user => user.sessionId === sessionId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser = { 
      sessionId: user.sessionId,
      username: user.username,
      id,
      isHost: user.isHost ?? false
    } as User;
    this.users.set(id, newUser);
    return newUser;
  }

  // Session operations
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const newSession: Session = {
      id: session.id,
      hostId: session.hostId ?? null,
      active: session.active ?? true,
      votingActive: session.votingActive ?? false,
      showResults: session.showResults ?? false,
      createdAt: new Date(),
    };
    this.sessions.set(session.id, newSession);
    return newSession;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) {
      return undefined;
    }
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Vote operations
  async getVotesBySessionId(sessionId: string): Promise<Vote[]> {
    return Array.from(this.votes.values())
      .filter(vote => vote.sessionId === sessionId);
  }

  async getVoteByUserId(userId: number, sessionId: string): Promise<Vote | undefined> {
    return Array.from(this.votes.values())
      .find(vote => vote.userId === userId && vote.sessionId === sessionId);
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    // Remove any existing vote by this user in this session
    const existingVotes = Array.from(this.votes.values())
      .filter(v => v.userId === vote.userId && v.sessionId === vote.sessionId);
    
    for (const existingVote of existingVotes) {
      this.votes.delete(existingVote.id);
    }
    
    const id = this.voteId++;
    const newVote: Vote = {
      ...vote,
      id,
      createdAt: new Date(),
    };
    this.votes.set(id, newVote);
    return newVote;
  }

  async deleteVotesBySessionId(sessionId: string): Promise<void> {
    const votesToDelete = Array.from(this.votes.values())
      .filter(vote => vote.sessionId === sessionId);
    
    for (const vote of votesToDelete) {
      this.votes.delete(vote.id);
    }
  }

  // Complex operations
  async getSessionWithDetails(sessionId: string): Promise<SessionResponse | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return undefined;
    }

    const users = await this.getUsersBySessionId(sessionId);
    const votes = await this.getVotesBySessionId(sessionId);

    const participants: ParticipantResponse[] = users.map(user => {
      const userVote = votes.find(vote => vote.userId === user.id);
      return {
        id: user.id,
        username: user.username,
        hasVoted: !!userVote,
        voteValue: session.showResults ? userVote?.value : undefined
      };
    });

    // Calculate statistics if showing results
    let average: number | undefined;
    let consensus: string | undefined;
    let range: string | undefined;

    if (session.showResults && votes.length > 0) {
      // Filter out non-numeric votes (like '?')
      const numericVotes = votes
        .map(vote => vote.value)
        .filter(value => !isNaN(Number(value)))
        .map(Number);

      if (numericVotes.length > 0) {
        // Calculate average
        average = numericVotes.reduce((sum, value) => sum + value, 0) / numericVotes.length;
        average = Math.round(average * 10) / 10; // Round to 1 decimal place

        // Find consensus (most common value)
        const valueCounts = new Map<number, number>();
        numericVotes.forEach(value => {
          valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
        });
        
        let maxCount = 0;
        let maxValue: number | undefined;
        
        valueCounts.forEach((count, value) => {
          if (count > maxCount) {
            maxCount = count;
            maxValue = value;
          }
        });
        
        consensus = maxValue?.toString();

        // Calculate range
        const sortedVotes = numericVotes.sort((a, b) => a - b);
        range = `${sortedVotes[0]}-${sortedVotes[sortedVotes.length - 1]}`;
      }
    }

    return {
      id: session.id,
      votingActive: session.votingActive,
      showResults: session.showResults,
      participants,
      average,
      consensus,
      range
    };
  }
}

export const storage = new MemStorage();
