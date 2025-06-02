import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

// Types for Google Maps API responses
export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface DistanceMatrixElement {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  status: string;
}

export interface DistanceMatrixResult {
  origin_addresses: string[];
  destination_addresses: string[];
  rows: Array<{
    elements: DistanceMatrixElement[];
  }>;
  status: string;
}

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly googleMapsApiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      this.logger.error('GOOGLE_MAPS_API_KEY not found in environment variables.');
      throw new Error('GOOGLE_MAPS_API_KEY is not configured.');
    }
    this.googleMapsApiKey = apiKey;
    this.logger.log('GoogleMapsService initialized successfully.');
  }

  /**
   * Search for places using Google Places API
   * @param query - Search query (e.g., "restaurants near me", "coffee shops")
   * @param location - Location to search around (address, city, or lat,lng format)
   * @param radius - Search radius in meters (default: 5000)
   * @param type - Place type filter (optional)
   */
  async searchPlaces(
    query: string,
    location?: string,
    radius: number = 5000,
    type?: string,
  ): Promise<PlaceSearchResult[]> {
    this.logger.debug(`Searching places: query="${query}", location="${location}", radius=${radius}`);

    try {
      const params: any = {
        query,
        key: this.googleMapsApiKey,
        region: 'us', // Bias results towards United States
      };

      // If location is provided, try to determine if it's coordinates or an address
      if (location) {
        // Check if location looks like coordinates (lat,lng)
        const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
        if (coordPattern.test(location.trim())) {
          // It's coordinates, use location and radius
          params.location = location;
          params.radius = radius;
        } else {
          // It's an address/city name, append it to the query for better results
          params.query = `${query} in ${location}`;
        }
      } else {
        // No specific location provided, bias towards North America in the query
        if (!query.toLowerCase().includes('in ') && !query.toLowerCase().includes('near ')) {
          params.query = `${query} in North America`;
        }
      }

      if (type) {
        params.type = type;
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/place/textsearch/json`, { params }),
      );

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message}`);
      }

      this.logger.debug(`Found ${response.data.results.length} places for query: ${params.query}`);
      return response.data.results || [];
    } catch (error) {
      this.handleApiError('searchPlaces', error);
      throw error;
    }
  }

  /**
   * Get nearby places using Google Places Nearby Search API
   * @param location - Location to search around (lat,lng format or address)
   * @param radius - Search radius in meters
   * @param type - Place type (e.g., 'restaurant', 'gas_station', 'hospital')
   * @param keyword - Additional keyword filter
   */
  async getNearbyPlaces(
    location: string,
    radius: number = 5000,
    type?: string,
    keyword?: string,
  ): Promise<PlaceSearchResult[]> {
    this.logger.debug(`Getting nearby places: location="${location}", type="${type}", radius=${radius}`);

    try {
      const params: any = {
        location,
        radius,
        key: this.googleMapsApiKey,
        region: 'us', // Bias results towards United States
      };

      if (type) {
        params.type = type;
      }

      if (keyword) {
        params.keyword = keyword;
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/place/nearbysearch/json`, { params }),
      );

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message}`);
      }

      this.logger.debug(`Found ${response.data.results.length} nearby places`);
      return response.data.results || [];
    } catch (error) {
      this.handleApiError('getNearbyPlaces', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific place
   * @param placeId - Google Place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    this.logger.debug(`Getting place details for: ${placeId}`);

    try {
      const params = {
        place_id: placeId,
        fields: 'place_id,name,formatted_address,formatted_phone_number,website,rating,price_level,opening_hours,reviews,geometry',
        key: this.googleMapsApiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/place/details/json`, { params }),
      );

      if (response.data.status !== 'OK') {
        this.logger.warn(`Place details not found for ${placeId}: ${response.data.status}`);
        return null;
      }

      this.logger.debug(`Retrieved place details for: ${response.data.result.name}`);
      return response.data.result;
    } catch (error) {
      this.handleApiError('getPlaceDetails', error);
      return null;
    }
  }

  /**
   * Calculate distance and travel time between locations using Distance Matrix API
   * @param origins - Starting location(s) (address, place name, or coordinates)
   * @param destinations - Destination location(s) (address, place name, or coordinates)
   * @param mode - Travel mode ('driving', 'walking', 'bicycling', 'transit')
   * @param units - Unit system ('metric' or 'imperial')
   */
  async getDistanceMatrix(
    origins: string,
    destinations: string,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving',
    units: 'metric' | 'imperial' = 'metric',
  ): Promise<DistanceMatrixResult> {
    this.logger.debug(`Getting distance matrix: "${origins}" to "${destinations}" via ${mode}`);

    try {
      const params = {
        origins,
        destinations,
        mode,
        units,
        region: 'us', // Bias results towards United States
        key: this.googleMapsApiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/distancematrix/json`, { params }),
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Distance Matrix API error: ${response.data.status} - ${response.data.error_message}`);
      }

      this.logger.debug('Distance matrix calculated successfully');
      return response.data;
    } catch (error) {
      this.handleApiError('getDistanceMatrix', error);
      throw error;
    }
  }

  /**
   * Analyze a location and return comprehensive information about nearby amenities
   * @param location - Location to analyze (address or coordinates)
   * @param radius - Search radius in meters
   */
  async analyzeLocation(location: string, radius: number = 2000): Promise<any> {
    this.logger.debug(`Analyzing location: ${location} with radius ${radius}m`);

    try {
      // Define important amenity types
      const amenityTypes = [
        { name: 'restaurants', type: 'restaurant' },
        { name: 'schools', type: 'school' },
        { name: 'hospitals', type: 'hospital' },
        { name: 'grocery_stores', type: 'grocery_or_supermarket' },
        { name: 'gas_stations', type: 'gas_station' },
        { name: 'banks', type: 'bank' },
        { name: 'pharmacies', type: 'pharmacy' },
        { name: 'parks', type: 'park' },
        { name: 'transit_stations', type: 'transit_station' },
      ];

      const analysis: any = {
        location,
        amenities: {},
        summary: {
          total_places: 0,
          categories_found: 0,
        },
      };

      // Search for each amenity type
      for (const amenity of amenityTypes) {
        try {
          const places = await this.getNearbyPlaces(location, radius, amenity.type);
          if (places.length > 0) {
            analysis.amenities[amenity.name] = places.slice(0, 5).map(place => ({
              name: place.name,
              address: place.formatted_address,
              rating: place.rating,
              place_id: place.place_id,
              types: place.types,
              open_now: place.opening_hours?.open_now,
            }));
            analysis.summary.total_places += places.length;
            analysis.summary.categories_found++;
          }
        } catch (error) {
          this.logger.warn(`Failed to get ${amenity.name} for ${location}: ${error.message}`);
        }
      }

      this.logger.debug(`Location analysis complete: found ${analysis.summary.total_places} places in ${analysis.summary.categories_found} categories`);
      return analysis;
    } catch (error) {
      this.handleApiError('analyzeLocation', error);
      throw error;
    }
  }

  private handleApiError(method: string, error: any): void {
    const axiosError = error as AxiosError;
    if (axiosError.isAxiosError) {
      this.logger.error(
        `Axios error in ${method}: ${axiosError.message}`,
        {
          url: axiosError.config?.url,
          status: axiosError.response?.status,
          data: axiosError.response?.data,
        },
      );
    } else {
      this.logger.error(`Error in ${method}: ${error.message}`, error.stack);
    }
  }
} 