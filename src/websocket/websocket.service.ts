import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FirebaseUserType } from '../common/decorators/firebase-user.decorator';
import { GeminiFunctionCall } from '../gemini/gemini.types';
import { GeocodingService } from '../geocoding/geocoding.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { JikanService } from '../jikan/jikan.service';
import { RealtorService } from '../realtor/realtor.service';
import { WeatherService } from '../weather/weather.service';

// ----------------------------------------------------------------------

@Injectable()
export class WebsocketService {
  private logger: Logger = new Logger('WebsocketService');

  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly googleMapsService: GoogleMapsService,
    private readonly jikanService: JikanService,
    private readonly realtorService: RealtorService,
    private readonly weatherService: WeatherService,
  ) {}

  async handleGetAnimeById(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    this.logger.log(`Handling get_anime_by_id for ID: ${functionCall.args.id}`);

    try {
      return await this.jikanService.getAnimeById(functionCall.args.id);
    } catch (error) {
      this.logger.error(
        `Error fetching anime by ID ${functionCall.args.id}: ${error.message}`,
      );
      return { error: `Could not fetch anime by ID: ${error.message}` };
    }
  }

  async handleGetAnimePictures(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    this.logger.log(
      `Handling get_anime_pictures for ID: ${functionCall.args.id}`,
    );

    try {
      return await this.jikanService.getAnimePictures(functionCall.args.id);
    } catch (error) {
      this.logger.error(
        `Error fetching anime pictures for ID ${functionCall.args.id}: ${error.message}`,
      );
      return { error: `Could not fetch anime pictures: ${error.message}` };
    }
  }

  async handleGetAnimeSearch(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    this.logger.log(
      `Handling get_anime_search for query: ${functionCall.args.query}, status: ${functionCall.args.status}`,
    );
    try {
      return await this.jikanService.getAnimeSearch(
        functionCall.args.query,
        functionCall.args.status,
      );
    } catch (error) {
      this.logger.error(
        `Error searching anime with query "${functionCall.args.query}": ${error.message}`,
      );
      return { error: `Could not search anime: ${error.message}` };
    }
  }

  async handleGetGoogleDistance(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    const { origins, destinations, mode } = functionCall.args;
    this.logger.log(
      `Handling get_google_distance: from "${origins}" to "${destinations}" via ${mode || 'driving'}`,
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
        `Error calculating distance for get_google_distance: ${error.message}`,
      );
      return { error: `Could not calculate distance: ${error.message}` };
    }
  }

  async handleGetGoogleMap(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    const { query, location, radius } = functionCall.args;
    this.logger.log(
      `Handling get_google_map: searching for "${query}" near "${location}" with radius ${radius}`,
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
        `Error searching places for get_google_map: ${error.message}`,
      );
      return { error: `Could not search for places: ${error.message}` };
    }
  }

  async handleGetMyRealtorProfile(
    firebaseUser: FirebaseUserType,
  ): Promise<Record<string, any>> {
    this.logger.log('Handling get_my_realtor_profile');

    try {
      const realtor = await this.realtorService.findByFirebaseUid(
        firebaseUser.uid,
      );

      if (!realtor) {
        this.logger.warn(
          `Realtor profile not found for ${firebaseUser.uid} via service call, though an exception was expected.`,
        );
        return { info: 'No realtor profile found for your account.' };
      }

      const response = {
        email: realtor.email,
        name: realtor.name,
      };

      this.logger.log(
        `Realtor profile found for ${firebaseUser.uid}: ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error fetching realtor profile for ${firebaseUser.email}: ${error.message}`,
      );
      if (error instanceof HttpException && error.getStatus() === 404) {
        return {
          info: 'No realtor profile found for your account. A new profile will be created if you use features that require one.',
        };
      }
      return {
        error: 'Could not retrieve your realtor profile at this time.',
      };
    }
  }

  async handleGetTopAnime(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    this.logger.log(
      `Handling get_top_anime with filter: ${functionCall.args.filter}`,
    );
    try {
      return await this.jikanService.getTopAnime(functionCall.args.filter);
    } catch (error) {
      this.logger.error(
        `Error fetching top anime with filter "${functionCall.args.filter}": ${error.message}`,
      );
      return { error: `Could not fetch top anime: ${error.message}` };
    }
  }

  async handleGetUserLocation(): Promise<Record<string, any>> {
    this.logger.log(
      'Handling get_user_location: returning hardcoded coordinates',
    );
    return {
      city: 'New York',
      country: 'USA',
      latitude: 40.799603422290936,
      longitude: -73.96199064785066,
      state: 'New York',
    };
  }

  async handleGetWeather(
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    const location = functionCall.args.location;
    this.logger.log(`Handling get_current_weather for location: ${location}`);

    const coords = await this.geocodingService.getCoordinates(location);
    if (!coords) {
      this.logger.log(`No coordinates found for location: ${location}`);
      return { error: `Could not find coordinates for ${location}.` };
    }

    const weathers = await this.weatherService.getForecast(
      coords.latitude,
      coords.longitude,
    );
    const weather = weathers[0];
    if (!weather) {
      this.logger.log(`No weather found for location: ${location}`);
      return { error: `Could not find weather for ${location}.` };
    }

    const weatherSummary = `Current conditions for ${coords.displayName}: ${weather.shortForecast}, Temperature: ${weather.temperature}${weather.temperatureUnit}`;
    return { weather: weatherSummary };
  }

  async handleUpdateRealtorName(
    firebaseUser: FirebaseUserType,
    functionCall: GeminiFunctionCall,
  ): Promise<Record<string, any>> {
    this.logger.log('Handling update_realtor_name');

    try {
      // Get realtor
      const realtor = await this.realtorService.findByFirebaseUid(
        firebaseUser.uid,
      );

      if (!realtor) {
        this.logger.warn(
          `Realtor profile not found for ${firebaseUser.uid} via service call, though an exception was expected.`,
        );
        return { info: 'No realtor profile found for your account.' };
      }

      // Update realtor name
      const updatedRealtor = await this.realtorService.updateRealtorName(
        realtor.id,
        functionCall.args.name,
      );

      const response = {
        email: updatedRealtor.email,
        name: updatedRealtor.name,
      };

      this.logger.log(
        `Realtor name updated for ${firebaseUser.uid}: ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error fetching realtor profile for ${firebaseUser.email}: ${error.message}`,
      );
      return {
        error: 'Could not update your realtor name at this time.',
      };
    }
  }
}
