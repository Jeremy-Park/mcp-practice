import { ChatSession, Content } from '@google/generative-ai';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GeminiService } from '../gemini/gemini.service';
import { GeminiToolResponse } from '../gemini/gemini.types';
import { GeocodingService } from '../geocoding/geocoding.service';
import { SessionService } from '../session/session.service';
import { WeatherService } from './weather.service';

// ----------------------------------------------------------------------

interface ChatRequestPayload {
  message: string;
  history?: Content[];
}

// You can specify a port and namespace, or let it use the default HTTP server port
// @WebSocketGateway(3001, { namespace: 'mcp', cors: { origin: '*' } })
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for now, you might want to restrict this in production
  },
  // path: '/mcp-ws', // Example: if you want your WebSocket on ws://localhost:3001/mcp-ws
})
export class McpGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('McpGateway');

  constructor(
    private readonly weatherService: WeatherService,
    private readonly geminiService: GeminiService,
    private readonly geocodingService: GeocodingService,
    private readonly sessionService: SessionService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.sessionService.deleteSession(client.id);
  }

  @SubscribeMessage('send_chat_message')
  async handleSendChatMessage(
    @MessageBody() data: ChatRequestPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.logger.log(
      `Received 'send_chat_message' from client ${client.id} with message: "${data.message}"`,
    );

    // Basic validation
    if (!data || !data.message || data.message.trim() === '') {
      client.emit('chat_error', { error: 'Cannot send an empty message.' });
      return;
    }

    try {
      let chatSession = this.sessionService.getSession(client.id);
      if (!chatSession) {
        this.logger.log(`Starting new chat session for ${client.id}`);
        chatSession = await this.geminiService.startChat(data.history || []);
        this.sessionService.createSession(client.id, chatSession);
      }

      let geminiResponse = await this.geminiService.sendMessageInChat(
        chatSession,
        data.message,
      );

      // Loop to handle potential multiple function calls (though typically one at a time)
      while (geminiResponse.functionCall) {
        const functionCall = geminiResponse.functionCall;
        let toolResponseData: any;

        if (functionCall.name === 'get_current_weather') {
          const location = functionCall.args.location;
          this.logger.log(
            `Tool call: get_current_weather for location: ${location}`,
          );
          const coords = await this.geocodingService.getCoordinates(location);
          if (coords) {
            const weather = await this.weatherService.getForecast(
              coords.latitude,
              coords.longitude,
            );
            // We might want to summarize or select specific parts of the weather for Gemini
            // For now, sending a summary. Gemini might get overwhelmed by the full forecast array.
            const weatherSummary =
              weather && weather.length > 0
                ? `Current conditions for ${coords.displayName}: ${weather[0].shortForecast}, Temperature: ${weather[0].temperature}${weather[0].temperatureUnit}`
                : 'Could not retrieve detailed weather.';
            toolResponseData = { weather: weatherSummary };
          } else {
            toolResponseData = {
              error: `Could not find coordinates for ${location}.`,
            };
          }
        } else {
          this.logger.warn(
            `Unknown function call requested: ${functionCall.name}`,
          );
          toolResponseData = { error: `Unknown tool: ${functionCall.name}` };
        }

        const toolResponses: GeminiToolResponse[] = [
          {
            name: functionCall.name,
            response: toolResponseData,
          },
        ];

        geminiResponse = await this.geminiService.sendToolResponseToChat(
          chatSession,
          toolResponses,
        );
      }

      if (geminiResponse.text) {
        this.logger.log(
          `Final Gemini response for client ${client.id}: "${geminiResponse.text}"`,
        );
        client.emit('chat_response', {
          sender: 'bot',
          message: geminiResponse.text,
        });
      } else {
        this.logger.warn(
          `No text response from Gemini after potential tool calls for client ${client.id}`,
        );
        client.emit('chat_response', {
          sender: 'bot',
          message: "I couldn't process that request fully, but I'm here!",
        });
      }
    } catch (error) {
      this.logger.error(
        `Error processing chat message for client ${client.id}: ${error.message}`,
        { message: data.message, error },
      );
      client.emit('chat_error', {
        error: 'Failed to get a response from the chatbot.',
        details: error.message,
      });
    }
  }
}
