import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly weatherGovApiBase = 'https://api.weather.gov';
  private readonly userAgent = 'MyWeatherChatbot/1.0 (myemail@example.com)'; // IMPORTANT: Replace with actual contact

  constructor(private readonly httpService: HttpService) {}

  async getForecast(latitude: string, longitude: string): Promise<any> {
    this.logger.log(
      `WEATHERSERVICE WEATHERSERVICE WEATHERSERVICE WEATHERSERVICE WEATHERSERVICE WEATHERSERVICE WEATHERSERVICE `,
    );

    const pointsUrl = `${this.weatherGovApiBase}/points/${latitude},${longitude}`;
    this.logger.debug(`Fetching grid points from: ${pointsUrl}`);

    try {
      const pointsResponse = await firstValueFrom(
        this.httpService.get(pointsUrl, {
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      const forecastUrl = pointsResponse.data?.properties?.forecast;
      if (!forecastUrl) {
        this.logger.error(
          'Could not retrieve forecast URL from points response',
          pointsResponse.data,
        );
        throw new Error('Could not retrieve forecast URL.');
      }

      this.logger.debug(`Fetching forecast from: ${forecastUrl}`);
      const forecastResponse = await firstValueFrom(
        this.httpService.get(forecastUrl, {
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      // For now, return the periods. We can refine this later.
      return forecastResponse.data?.properties?.periods || [];
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.isAxiosError) {
        this.logger.error(
          `Axios error fetching weather data: ${axiosError.message}`,
          {
            url: axiosError.config?.url,
            status: axiosError.response?.status,
            data: axiosError.response?.data,
          },
        );
      } else {
        this.logger.error(
          `Error fetching weather data: ${error.message}`,
          error.stack,
        );
      }
      // Rethrow or return a custom error object
      throw new Error(
        `Failed to fetch weather forecast: ${axiosError.message || error.message}`,
      );
    }
  }
}
