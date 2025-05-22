import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WeatherService } from './weather.service';

interface WeatherRequestPayload {
  latitude: string;
  longitude: string;
}

@Controller()
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(private readonly weatherService: WeatherService) {}

  @MessagePattern({ cmd: 'get_weather_forecast' })
  async getWeatherForecast(
    @Payload() data: WeatherRequestPayload,
  ): Promise<any> {
    this.logger.log(
      `Received get_weather_forecast for lat: ${data.latitude}, lon: ${data.longitude}`,
    );
    try {
      // Basic validation
      if (!data || !data.latitude || !data.longitude) {
        this.logger.error('Invalid payload for get_weather_forecast:', data);
        // In a real app, you might throw a RpcException here
        return { error: 'Latitude and longitude are required.' };
      }
      return await this.weatherService.getForecast(
        data.latitude,
        data.longitude,
      );
    } catch (error) {
      this.logger.error(
        `Error in getWeatherForecast controller: ${error.message}`,
        { payload: data, error },
      );
      // Return a structured error to the client
      return {
        error: 'Failed to retrieve weather forecast.',
        details: error.message,
      };
    }
  }
}
