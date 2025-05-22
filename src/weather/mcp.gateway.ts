import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WeatherService } from './weather.service'; // Assuming WeatherService is in the same directory

interface WeatherRequestPayload {
  latitude: string;
  longitude: string;
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

  constructor(private readonly weatherService: WeatherService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // You can emit a message to the client upon connection if needed
    // client.emit('connection_ack', { message: 'Successfully connected to MCP WebSocket' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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

  // Example: A simple test message handler
  @SubscribeMessage('test_message')
  handleTestMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    this.logger.log(`Received 'test_message' from client ${client.id} with data: ${JSON.stringify(data)}`);
    client.emit('test_response', { original_message: data, reply: 'Test message received successfully!' });
  }
} 