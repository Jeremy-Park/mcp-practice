import { ChatSession } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';

// ----------------------------------------------------------------------

// This is a simple in-memory store for chat sessions.
// TODO: Replace with a more robust solution (e.g., Redis)
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private clientChatSessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.logger.log('SessionService: constructor');
  }

  // Create a new session for a client
  createSession(clientId: string, session: ChatSession): void {
    this.logger.log(`createSession: ${clientId}`);
    this.clientChatSessions.set(clientId, session);
  }

  // Delete a session for a client
  deleteSession(clientId: string): void {
    this.logger.log(`deleteSession: ${clientId}`);
    this.clientChatSessions.delete(clientId);
  }

  // Get a session for a client
  getSession(clientId: string): ChatSession | undefined {
    this.logger.debug(`getSession: ${clientId}`);
    return this.clientChatSessions.get(clientId);
  }

  // Possible future methods
  // clearAllSessions(): void {
  //   this.logger.log('clearAllSessions');
  //   this.clientChatSessions.clear();
  // }

  // getAllSessions(): Map<string, ChatSession> {
  //   this.logger.log('getAllSessions');
  //   return this.clientChatSessions;
  // }

  // hasSession(clientId: string): boolean {
  //   this.logger.log('hasSession');
  //   return this.clientChatSessions.has(clientId);
  // }
}
