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
import {
  GeminiFunctionCall,
  GeminiToolName,
  GeminiToolResponse,
} from '../gemini/gemini.types';
import { GeocodingService } from '../geocoding/geocoding.service';
import { JikanService } from '../jikan/jikan.service';
import { SessionService } from '../session/session.service';
import { WeatherService } from '../weather/weather.service';
import { ChatRequestPayload } from './websocket.types';

// ----------------------------------------------------------------------

// You can specify a port and namespace, or let it use the default HTTP server port
// @WebSocketGateway(3001, { namespace: 'mcp', cors: { origin: '*' } })
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for now, you might want to restrict this in production
  },
  // path: '/mcp-ws', // Example: if you want your WebSocket on ws://localhost:3001/mcp-ws
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebsocketGateway');

  constructor(
    private readonly weatherService: WeatherService,
    private readonly geminiService: GeminiService,
    private readonly geocodingService: GeocodingService,
    private readonly sessionService: SessionService,
    private readonly jikanService: JikanService,
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

  async handleGetWeather(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    // Get location
    const location = functionCall.args.location;
    this.logger.log(
      `WebsocketGateway: handleSendChatMessage: tool call get_current_weather for location: ${location}`,
    );

    // Get coordinates
    const coords = await this.geocodingService.getCoordinates(location);
    if (!coords) {
      this.logger.log(
        `WebsocketGateway: handleGetWeather: no coordinates found for location: ${location}`,
      );
      return {
        error: `Could not find coordinates for ${location}.`,
      };
    }

    // Get weather
    const weathers = await this.weatherService.getForecast(
      coords.latitude,
      coords.longitude,
    );

    const weather = weathers[0];
    if (!weather) {
      this.logger.log(
        `WebsocketGateway: handleGetWeather: no weather found for location: ${location}`,
      );
      return {
        error: `Could not find weather for ${location}.`,
      };
    }

    // Create weather summary
    // Gemini might get overwhelmed by the full forecast array.
    // TODO: Return more detailed weather information
    const weatherSummary = `Current conditions for ${coords.displayName}: ${weather.shortForecast}, Temperature: ${weather.temperature}${weather.temperatureUnit}`;

    return { weather: weatherSummary };
  }

  async handleGetUserLocation(): Promise<Record<string, any>> {
    this.logger.log(
      'WebsocketGateway: handleGetUserLocation: returning hardcoded coordinates',
    );

    // Hardcoded coordinates for testing
    return {
      city: 'New York',
      country: 'USA',
      latitude: 40.799603422290936,
      longitude: -73.96199064785066,
      state: 'New York',
    };
  }

  @SubscribeMessage('send_chat_message')
  async handleSendChatMessage(
    @MessageBody() data: ChatRequestPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.logger.log(
      `WebsocketGateway: handleSendChatMessage: clientId ${client.id} message ${data.message}`,
    );

    // Basic validation
    if (!data || !data.message || data.message.trim() === '') {
      client.emit('chat_error', { error: 'Cannot send an empty message.' });
      return;
    }

    try {
      // Get chat session
      let chatSession = this.sessionService.getSession(client.id);

      if (!chatSession) {
        chatSession = await this.geminiService.startChat(data.history || []);
        this.sessionService.createSession(client.id, chatSession);
      }

      // Send message to Gemini
      let geminiResponse = await this.geminiService.sendMessageInChat(
        chatSession,
        data.message,
      );

      // Loop to handle potential multiple function calls (though typically one at a time)
      while (geminiResponse.functionCall) {
        const functionCall = geminiResponse.functionCall;
        let toolResponseData: any;

        // Get weather
        if (functionCall.name === GeminiToolName.GET_CURRENT_WEATHER) {
          toolResponseData = await this.handleGetWeather(functionCall);
        }
        // Get mock user coordinates
        else if (functionCall.name === GeminiToolName.GET_USER_LOCATION) {
          toolResponseData = await this.handleGetUserLocation();
        }
        // Jikan: Get Anime By ID
        else if (functionCall.name === GeminiToolName.GET_ANIME_BY_ID) {
          this.logger.log(
            `WebsocketGateway: handleSendChatMessage: tool call get_anime_by_id for ID: ${functionCall.args.id}`,
          );
          toolResponseData = await this.jikanService.getAnimeById(
            functionCall.args.id,
          );
        }
        // Jikan: Get Anime Search
        else if (functionCall.name === GeminiToolName.GET_ANIME_SEARCH) {
          this.logger.log(
            `WebsocketGateway: handleSendChatMessage: tool call get_anime_search for query: ${functionCall.args.query}`,
          );
          toolResponseData = await this.jikanService.getAnimeSearch(
            functionCall.args.query,
          );
        }
        // Jikan: Get Anime Pictures
        else if (functionCall.name === GeminiToolName.GET_ANIME_PICTURES) {
          this.logger.log(
            `WebsocketGateway: handleSendChatMessage: tool call get_anime_pictures for ID: ${functionCall.args.id}`,
          );
          toolResponseData = await this.jikanService.getAnimePictures(
            functionCall.args.id,
          );
        }
        // Jikan: Get Top Anime
        else if (functionCall.name === GeminiToolName.GET_TOP_ANIME) {
          this.logger.log(
            `WebsocketGateway: handleSendChatMessage: tool call get_top_anime`,
          );
          toolResponseData = await this.jikanService.getTopAnime();
        }
        // Unsupported tools
        else {
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
          `WebsocketGateway: handleSendChatMessage: final Gemini response for client ${client.id}: "${geminiResponse.text}"`,
        );
        client.emit('chat_response', {
          sender: 'bot',
          message: geminiResponse.text,
        });
      } else {
        this.logger.warn(
          `WebsocketGateway: handleSendChatMessage: no text response from Gemini after potential tool calls for client ${client.id}`,
        );
        client.emit('chat_response', {
          sender: 'bot',
          message: "I couldn't process that request fully, but I'm here!",
        });
      }
    } catch (error) {
      this.logger.error(
        `WebsocketGateway: handleSendChatMessage: error processing chat message for client ${client.id}: ${error.message}`,
        { message: data.message, error },
      );
      client.emit('chat_error', {
        error: 'Failed to get a response from the chatbot.',
        details: error.message,
      });
    }
  }
}
