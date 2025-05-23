import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { GeminiService, GeminiFunctionCall, GeminiToolResponse } from '../gemini/gemini.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import { Part } from '@google/generative-ai';

interface WeatherRequestPayload {
  latitude: string;
  longitude: string;
}

interface ChatRequestPayload {
  message: string;
  history?: Part[];
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
    private readonly geocodingService: GeocodingService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Chat session will be started on first message to handle history correctly
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
  ): Promise<void> {
    this.logger.log(
      `Received 'send_chat_message' from client ${client.id} with message: "${data.message}"`,
    );
    if (!data || !data.message || data.message.trim() === '') {
      client.emit('chat_error', { error: 'Cannot send an empty message.' });
      return;
    }

    try {
      let chatSession = this.clientChatSessions.get(client.id);
      if (!chatSession) {
        this.logger.log(`Starting new chat session for ${client.id}`);
        chatSession = await this.geminiService.startChat(data.history || []);
        this.clientChatSessions.set(client.id, chatSession);
      }

      let geminiResponse = await this.geminiService.sendMessageInChat(chatSession, data.message);

      // Loop to handle potential multiple function calls (though typically one at a time)
      while (geminiResponse.functionCall) {
        const functionCall = geminiResponse.functionCall;
        let toolResponseData: any;

        if (functionCall.name === 'get_current_weather') {
          const location = functionCall.args.location;
          this.logger.log(`Tool call: get_current_weather for location: ${location}`);
          const coords = await this.geocodingService.getCoordinates(location);
          if (coords) {
            const weather = await this.weatherService.getForecast(coords.latitude, coords.longitude);
            // We might want to summarize or select specific parts of the weather for Gemini
            // For now, sending a summary. Gemini might get overwhelmed by the full forecast array.
            const weatherSummary = weather && weather.length > 0 
              ? `Current conditions for ${coords.displayName}: ${weather[0].shortForecast}, Temperature: ${weather[0].temperature}${weather[0].temperatureUnit}`
              : 'Could not retrieve detailed weather.';
            toolResponseData = { weather: weatherSummary }; 
          } else {
            toolResponseData = { error: `Could not find coordinates for ${location}.` };
          }
        } else {
          this.logger.warn(`Unknown function call requested: ${functionCall.name}`);
          toolResponseData = { error: `Unknown tool: ${functionCall.name}` };
        }

        const toolResponses: GeminiToolResponse[] = [{
          name: functionCall.name,
          response: toolResponseData,
        }];

        geminiResponse = await this.geminiService.sendToolResponseToChat(chatSession, toolResponses);
      }

      if (geminiResponse.text) {
        this.logger.log(`Final Gemini response for client ${client.id}: "${geminiResponse.text}"`);
        client.emit('chat_response', {
          sender: 'bot',
          message: geminiResponse.text,
        });
      } else {
        this.logger.warn(`No text response from Gemini after potential tool calls for client ${client.id}`);
        client.emit('chat_response', {
          sender: 'bot',
          message: "I couldn't process that request fully, but I'm here!"
        });
      }

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