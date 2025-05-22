import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { GeminiService } from '../gemini/gemini.service';

interface WeatherRequestPayload {
  latitude: string;
  longitude: string;
}

interface ChatRequestPayload {
  message: string;
  history?: any[]; // Optional: if client manages history and sends it
}

// You can specify a port and namespace, or let it use the default HTTP server port
// @WebSocketGateway(3001, { namespace: 'mcp', cors: { origin: '*' } })
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for now, you might want to restrict this in production
  },
  // path: '/mcp-ws', // Example: if you want your WebSocket on ws://localhost:3001/mcp-ws
})
export class McpGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('McpGateway');

  // Store chat sessions per client ID. This is a simple in-memory store.
  // For production, you'd want a more robust solution (e.g., Redis).
  private clientChatSessions: Map<string, any> = new Map();

  constructor(
    private readonly weatherService: WeatherService,
    private readonly geminiService: GeminiService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Initialize a chat session for the new client
    // this.geminiService.startChat().then(session => {
    //   this.clientChatSessions.set(client.id, session);
    //   this.logger.log(`Chat session started for client ${client.id}`);
    //   client.emit('chat_session_started', { message: 'Chat session ready.' });
    // }).catch(err => {
    //   this.logger.error(`Failed to start chat session for ${client.id}`, err);
    //   client.emit('chat_error', { error: 'Could not start chat session.' });
    // });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up chat session for the disconnected client
    this.clientChatSessions.delete(client.id);
    this.logger.log(`Chat session ended for client ${client.id}`);
  }

  // This is where you'll handle messages from the client
  @SubscribeMessage('get_weather_forecast') // Client will send a message with event name 'get_weather_forecast'
  async handleGetWeatherForecast(
    @MessageBody() data: WeatherRequestPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<any> { // Can also return void and use client.emit() or server.to(client.id).emit()
    this.logger.log(
      `Received 'get_weather_forecast' from client ${client.id} with payload: ${JSON.stringify(data)}`,
    );

    try {
      if (!data || !data.latitude || !data.longitude) {
        this.logger.error('Invalid payload for get_weather_forecast:', data);
        client.emit('weather_error', { error: 'Latitude and longitude are required.' });
        return; // Or return an error object that the client expects
      }
      const forecast = await this.weatherService.getForecast(data.latitude, data.longitude);
      this.logger.log(`Sending forecast to client ${client.id}`);
      // client.emit('weather_forecast', forecast); // Send back to the specific client
      return { event: 'weather_forecast', data: forecast }; // Or use WsResponse if client expects acknowledgement
    } catch (error) {
      this.logger.error(`Error in handleGetWeatherForecast: ${error.message}`, { payload: data, error });
      client.emit('weather_error', {
        error: 'Failed to retrieve weather forecast.',
        details: error.message,
      });
      // return { event: 'weather_error', data: { ... } };
    }
  }

  @SubscribeMessage('send_chat_message')
  async handleSendChatMessage(
    @MessageBody() data: ChatRequestPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> { // Using void as we'll emit directly
    this.logger.log(
      `Received 'send_chat_message' from client ${client.id} with message: "${data.message}"`,
    );

    if (!data || !data.message || data.message.trim() === '') {
      this.logger.warn(`Empty chat message received from client ${client.id}`);
      client.emit('chat_error', { error: 'Cannot send an empty message.'});
      return;
    }

    try {
      // Get or create a chat session for the client
      // For simplicity, we are starting a new chat for each message if session doesn't exist.
      // A more robust implementation would manage sessions across multiple messages.
      let chatSession = this.clientChatSessions.get(client.id);
      if (!chatSession) {
        this.logger.log(`No existing chat session for ${client.id}, starting a new one.`);
        // Pass client-provided history if available and your GeminiService supports it
        chatSession = await this.geminiService.startChat(data.history);
        this.clientChatSessions.set(client.id, chatSession);
        this.logger.log(`New chat session started and stored for client ${client.id}`);
      } else {
        this.logger.log(`Using existing chat session for client ${client.id}`);
      }
      
      const geminiResponseText = await this.geminiService.sendMessageInChat(chatSession, data.message);
      this.logger.log(`Gemini response for client ${client.id}: "${geminiResponseText}"`);

      client.emit('chat_response', {
        sender: 'bot',
        message: geminiResponseText,
        // You might want to send back updated history or other metadata
      });
    } catch (error) {
      this.logger.error(`Error processing chat message for client ${client.id}: ${error.message}`, { message: data.message, error });
      client.emit('chat_error', {
        error: 'Failed to get a response from the chatbot.',
        details: error.message,
      });
    }
  }

  // Example: A simple test message handler
  @SubscribeMessage('test_message')
  handleTestMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    this.logger.log(`Received 'test_message' from client ${client.id} with data: ${JSON.stringify(data)}`);
    client.emit('test_response', { original_message: data, reply: 'Test message received successfully!' });
  }
} 