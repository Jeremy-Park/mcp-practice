import { Logger, UseGuards, HttpException } from '@nestjs/common';
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
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import { FirebaseUserType } from '../common/decorators/firebase-user.decorator';
import { GeminiService } from '../gemini/gemini.service';
import {
  GeminiFunctionCall,
  GeminiToolName,
  GeminiToolResponse,
} from '../gemini/gemini.types';
import { GeocodingService } from '../geocoding/geocoding.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { JikanService } from '../jikan/jikan.service';
import { SessionService } from '../session/session.service';
import { WeatherService } from '../weather/weather.service';
import { RealtorService } from '../realtor/realtor.service';
import { ChatRequestPayload } from './websocket.types';

// Define an interface for Sockets that have a user property
interface AuthenticatedSocket extends Socket {
  user?: FirebaseUserType; // user property will be populated by FirebaseAuthGuard
}

// ----------------------------------------------------------------------

// You can specify a port and namespace, or let it use the default HTTP server port
// @WebSocketGateway(3001, { namespace: 'mcp', cors: { origin: '*' } })
@UseGuards(FirebaseAuthGuard)
@WebSocketGateway({
  // cors: {
  //   origin: '*', // Allow all origins for now, you might want to restrict this in production
  // },
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
    private readonly googleMapsService: GoogleMapsService,
    private readonly realtorService: RealtorService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
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

  async handleGetGoogleMap(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    const { query, location, radius } = functionCall.args;
    this.logger.log(
      `WebsocketGateway: handleGetGoogleMap: searching for "${query}" near "${location}" with radius ${radius}`,
    );

    try {
      const results = await this.googleMapsService.searchPlaces(
        query,
        location,
        radius,
      );
      return { places: results };
    } catch (error) {
      this.logger.error(
        `WebsocketGateway: handleGetGoogleMap: error searching places: ${error.message}`,
      );
      return {
        error: `Could not search for places: ${error.message}`,
      };
    }
  }

  async handleGetGoogleDistance(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    const { origins, destinations, mode } = functionCall.args;
    this.logger.log(
      `WebsocketGateway: handleGetGoogleDistance: calculating distance from "${origins}" to "${destinations}" via ${mode || 'driving'}`,
    );

    try {
      const results = await this.googleMapsService.getDistanceMatrix(
        origins,
        destinations,
        mode || 'driving',
      );
      return { distance_matrix: results };
    } catch (error) {
      this.logger.error(
        `WebsocketGateway: handleGetGoogleDistance: error calculating distance: ${error.message}`,
      );
      return {
        error: `Could not calculate distance: ${error.message}`,
      };
    }
  }

  @SubscribeMessage('send_chat_message')
  async handleSendChatMessage(
    @MessageBody() data: ChatRequestPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    this.logger.log(
      `WebsocketGateway: handleSendChatMessage: clientId ${client.id} message ${data.message}`,
    );

    if (!data || !data.message || data.message.trim() === '') {
      client.emit('chat_error', { error: 'Cannot send an empty message.' });
      return;
    }

    // Ensure user is authenticated for tool use that requires user context
    const firebaseUser = client.user;

    try {
      let chatSession = this.sessionService.getSession(client.id);
      if (!chatSession) {
        chatSession = await this.geminiService.startChat(data.history || []);
        this.sessionService.createSession(client.id, chatSession);
      }

      let geminiResponse = await this.geminiService.sendMessageInChat(
        chatSession,
        data.message,
      );

      while (geminiResponse.functionCall) {
        const functionCall = geminiResponse.functionCall;
        let toolResponseData: any;

        if (functionCall.name === GeminiToolName.GET_CURRENT_WEATHER) {
          toolResponseData = await this.handleGetWeather(functionCall);
        } else if (functionCall.name === GeminiToolName.GET_USER_LOCATION) {
          toolResponseData = await this.handleGetUserLocation();
        } else if (functionCall.name === GeminiToolName.GET_ANIME_BY_ID) {
          this.logger.log(
            `Tool call get_anime_by_id for ID: ${functionCall.args.id}`,
          );
          toolResponseData = await this.jikanService.getAnimeById(
            functionCall.args.id,
          );
        } else if (functionCall.name === GeminiToolName.GET_ANIME_SEARCH) {
          this.logger.log(
            `Tool call get_anime_search for query: ${functionCall.args.query}, status: ${functionCall.args.status}`,
          );
          toolResponseData = await this.jikanService.getAnimeSearch(
            functionCall.args.query,
            functionCall.args.status,
          );
        } else if (functionCall.name === GeminiToolName.GET_ANIME_PICTURES) {
          this.logger.log(
            `Tool call get_anime_pictures for ID: ${functionCall.args.id}`,
          );
          toolResponseData = await this.jikanService.getAnimePictures(
            functionCall.args.id,
          );
        } else if (functionCall.name === GeminiToolName.GET_TOP_ANIME) {
          this.logger.log(
            `Tool call get_top_anime with filter: ${functionCall.args.filter}`,
          );
          toolResponseData = await this.jikanService.getTopAnime(
            functionCall.args.filter,
          );
        } else if (functionCall.name === GeminiToolName.GET_GOOGLE_MAP) {
          toolResponseData = await this.handleGetGoogleMap(functionCall);
        } else if (functionCall.name === GeminiToolName.GET_GOOGLE_DISTANCE) {
          toolResponseData = await this.handleGetGoogleDistance(functionCall);
        } else if (functionCall.name === GeminiToolName.GET_MY_REALTOR_PROFILE) {
          this.logger.log('Tool call get_my_realtor_profile');
          if (!firebaseUser || !firebaseUser.email) {
            this.logger.warn(
              'GET_MY_REALTOR_PROFILE tool called but no authenticated user email found.',
            );
            toolResponseData = {
              error:
                'User authentication (email) not found. Cannot fetch realtor profile.',
            };
          } else {
            try {
              const realtorProfile = await this.realtorService.getRealtorByEmail(
                firebaseUser.email,
              );

              if (!realtorProfile) {
                // This case should ideally not be hit if getRealtorByEmail throws NotFoundException as intended.
                this.logger.warn(
                  `Realtor profile not found for ${firebaseUser.email} via service call, though an exception was expected.`
                );
                toolResponseData = {
                  info: 'No realtor profile found for your account.',
                };
              } else {
                toolResponseData = {
                  id: realtorProfile.id,
                  email: realtorProfile.email,
                  name: realtorProfile.name,
                };
                this.logger.log(`Realtor profile found for ${firebaseUser.email}: ${JSON.stringify(toolResponseData)}`);
              }
            } catch (error) {
              this.logger.error(
                `Error fetching realtor profile for ${firebaseUser.email}: ${error.message}`,
              );
              if (error instanceof HttpException && error.getStatus() === 404) {
                 toolResponseData = {
                    info: 'No realtor profile found for your account. A new profile will be created if you use features that require one.',
                 };
              } else {
                toolResponseData = {
                    error: 'Could not retrieve your realtor profile at this time.',
                };
              }
            }
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
        client.emit('chat_response', {
          sender: 'bot',
          message: geminiResponse.text,
        });
      } else {
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
