import { Logger, UseGuards } from '@nestjs/common';
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
import { FirebaseUserType } from '../common/decorators/firebase-user.decorator';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import { GeminiService } from '../gemini/gemini.service';
import { GeminiToolName, GeminiToolResponse } from '../gemini/gemini.types';
import { SessionService } from '../session/session.service';
import { WebsocketService } from './websocket.service';
import { ChatRequestPayload } from './websocket.types';

// Define an interface for Sockets that have a user property
interface AuthenticatedSocket extends Socket {
  user?: FirebaseUserType;
}

// ----------------------------------------------------------------------

@UseGuards(FirebaseAuthGuard)
@WebSocketGateway({})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebsocketGateway');

  constructor(
    private readonly geminiService: GeminiService,
    private readonly sessionService: SessionService,
    private readonly websocketService: WebsocketService,
  ) {}

  afterInit() {
    this.logger.log('Initialized');
  }

  // Websocket events
  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.sessionService.deleteSession(client.id);
  }

  @SubscribeMessage('send_chat_message')
  async handleSendChatMessage(
    @MessageBody() data: ChatRequestPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    this.logger.log(`send_chat_message: ${data.message}`);

    // TODO: Do this validation in a DTO
    if (!data || !data.message || data.message.trim() === '') {
      client.emit('chat_error', { error: 'Cannot send an empty message.' });
      return;
    }

    // Get the firebase user from the client
    const firebaseUser = client.user;

    if (!firebaseUser || !firebaseUser.uid) {
      throw new Error('Firebase user not found');
    }

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

        switch (functionCall.name) {
          case GeminiToolName.GET_ANIME_BY_ID:
            toolResponseData =
              await this.websocketService.handleGetAnimeById(functionCall);
            break;
          case GeminiToolName.GET_ANIME_PICTURES:
            toolResponseData =
              await this.websocketService.handleGetAnimePictures(functionCall);
            break;
          case GeminiToolName.GET_ANIME_SEARCH:
            toolResponseData =
              await this.websocketService.handleGetAnimeSearch(functionCall);
            break;
          case GeminiToolName.GET_CURRENT_WEATHER:
            toolResponseData =
              await this.websocketService.handleGetWeather(functionCall);
            break;
          case GeminiToolName.GET_GOOGLE_DISTANCE:
            toolResponseData =
              await this.websocketService.handleGetGoogleDistance(functionCall);
            break;
          case GeminiToolName.GET_GOOGLE_MAP:
            toolResponseData =
              await this.websocketService.handleGetGoogleMap(functionCall);
            break;
          case GeminiToolName.GET_MY_REALTOR_PROFILE:
            toolResponseData =
              await this.websocketService.handleGetMyRealtorProfile(
                firebaseUser,
              );
            break;
          case GeminiToolName.GET_TOP_ANIME:
            toolResponseData =
              await this.websocketService.handleGetTopAnime(functionCall);
            break;
          case GeminiToolName.GET_USER_LOCATION:
            toolResponseData =
              await this.websocketService.handleGetUserLocation();
            break;
          case GeminiToolName.UPDATE_REALTOR_NAME:
            toolResponseData =
              await this.websocketService.handleUpdateRealtorName(
                firebaseUser,
                functionCall,
              );
            break;
          default:
            this.logger.warn(
              `Unknown function call requested: ${functionCall.name}`,
            );
            toolResponseData = { error: `Unknown tool: ${functionCall.name}` };
            break;
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
