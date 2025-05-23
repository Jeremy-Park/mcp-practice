import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  // IMPORTANT: Set a descriptive User-Agent. Nominatim requires this.
  // It should be specific to your application, e.g., 'MyWeatherChatbot/1.0 (myemail@example.com)'.
  // Using the same one from WeatherService for now, but ideally, it should be distinct or configured.
  private userAgent: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Consider making the User-Agent configurable via .env for different services
    this.userAgent = this.configService.get<string>('APP_USER_AGENT', 'MyWeatherChatbot/1.0 (contact@example.com)');
    if (this.userAgent === 'MyWeatherChatbot/1.0 (contact@example.com)') {
      this.logger.warn('Using default User-Agent for GeocodingService. Please configure APP_USER_AGENT in .env for Nominatim.');
    }
  }

  async getCoordinates(locationName: string): Promise<{ latitude: string; longitude: string; displayName: string } | null> {
    this.logger.debug(`Geocoding location: ${locationName}`);
    try {
      const response = await firstValueFrom(
        this.httpService.get<NominatimResult[]>(this.nominatimUrl, {
          params: {
            q: locationName,
            format: 'json',
            limit: 1,
          },
          headers: {
            'User-Agent': this.userAgent,
          },
        }),
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        this.logger.debug(`Geocoded "${locationName}" to: ${result.display_name} (${result.lat}, ${result.lon})`);
        return {
          latitude: result.lat,
          longitude: result.lon,
          displayName: result.display_name,
        };
      }
      this.logger.warn(`No geocoding results found for: ${locationName}`);
      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.isAxiosError) {
        this.logger.error(
          `Axios error during geocoding for "${locationName}": ${axiosError.message}`,
          {
            url: axiosError.config?.url,
            status: axiosError.response?.status,
            data: axiosError.response?.data,
          }
        );
      } else {
        this.logger.error(`Error geocoding "${locationName}": ${error.message}`, error.stack);
      }
      return null; // Or throw a custom error
    }
  }
} 